import { TECHS, TERRAIN, UNITS, UNIT_BUILD_COSTS, WEATHER_STATES } from "./data";
import { distance, edgeKey, keyOf, neighborsOf, parseKey } from "./hex";
import { findPath, movementCost } from "./pathfinding";
import { seededRandom } from "./rng";
import type {
  AttackCityAction,
  ChooseForkAction,
  CombatPreview,
  Coord,
  CreateGameConfig,
  City,
  EndTurnAction,
  GameAction,
  GameMap,
  GameState,
  BuildUnitAction,
  FoundCityAction,
  MoveUnitAction,
  Player,
  ResearchTechAction,
  Tile,
  Unit,
  Veterancy,
  VictoryStatus,
  WeatherType
} from "./types";

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makePlayersById(players: Player[]): Record<string, Player> {
  const result: Record<string, Player> = {};
  for (const player of players) {
    result[player.id] = player;
  }
  return result;
}

function normalizePlayers(configPlayers?: Partial<Player>[]): Player[] {
  const fallback = [{ id: "p1", civ: "Rome" }, { id: "p2", civ: "Carthage" }] as Array<Partial<Player>>;
  return (configPlayers ?? fallback).map((player, idx) => ({
    id: player.id ?? `p${idx + 1}`,
    civ: player.civ ?? "Rome",
    food: player.food ?? 0,
    production: player.production ?? 0,
    gold: player.gold ?? 25,
    techs: player.techs ?? [],
    forkChoices: player.forkChoices ?? {},
    cityIds: player.cityIds ?? [],
    unitIds: player.unitIds ?? []
  }));
}

function normalizeMap(configMap: NonNullable<CreateGameConfig["map"]> | undefined): GameMap {
  const width = configMap?.width ?? 10;
  const height = configMap?.height ?? 10;
  const tiles: Record<string, Tile> = {};

  if (configMap?.tiles) {
    for (const [key, tile] of Object.entries(configMap.tiles)) {
      tiles[key] = {
        terrain: (tile.terrain ?? "plains") as Tile["terrain"],
        region: tile.region ?? "core"
      };
    }
  } else {
    for (let q = 0; q < width; q += 1) {
      for (let r = 0; r < height; r += 1) {
        const region = r < Math.ceil(height / 2) ? "north" : "south";
        tiles[`${q},${r}`] = { terrain: "plains", region };
      }
    }
  }

  const units: Record<string, Unit> = {};
  for (const [id, unit] of Object.entries(configMap?.units ?? {})) {
    const def = UNITS[unit.type];
    units[id] = {
      id,
      type: unit.type,
      ownerId: unit.ownerId,
      position: unit.position,
      maxHp: unit.maxHp ?? def.maxHp,
      hp: unit.hp ?? def.maxHp,
      movementRemaining: unit.movementRemaining ?? def.movement,
      veterancy: unit.veterancy ?? "recruit"
    };
  }

  return {
    width,
    height,
    tiles,
    rivers: configMap?.rivers ?? {},
    regions: configMap?.regions ?? Array.from(new Set(Object.values(tiles).map((t) => t.region))),
    cities: Object.fromEntries(
      Object.entries(configMap?.cities ?? {}).map(([id, city]) => [
        id,
        {
          id: city.id,
          ownerId: city.ownerId,
          position: city.position,
          population: city.population,
          hp: city.hp ?? 40,
          maxHp: city.maxHp ?? 40,
          isCapital: city.isCapital ?? false
        }
      ])
    ),
    units
  };
}

function syncOwnershipIndexes(state: GameState): void {
  for (const player of state.players) {
    player.cityIds = [];
    player.unitIds = [];
  }

  for (const city of Object.values(state.map.cities)) {
    const owner = state.playersById[city.ownerId];
    if (owner) owner.cityIds.push(city.id);
  }

  for (const unit of Object.values(state.map.units)) {
    const owner = state.playersById[unit.ownerId];
    if (owner) owner.unitIds.push(unit.id);
  }
}

function randomWeather(roll: number): WeatherType {
  if (roll < 0.5) return "clear";
  if (roll < 0.7) return "rain";
  if (roll < 0.85) return "fog";
  if (roll < 0.93) return "storm";
  return "heat";
}

function generateWeatherByRegion(state: GameState, turn: number): Record<string, WeatherType> {
  const result: Record<string, WeatherType> = {};
  const regions = state.map.regions.length > 0 ? state.map.regions : ["core"];
  for (const region of regions) {
    const rand = seededRandom(state.seed, `weather:${turn}:${region}`);
    result[region] = randomWeather(rand());
  }
  return result;
}

function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

function assertPlayerTurn(state: GameState, playerId: string): void {
  const current = getCurrentPlayer(state);
  if (current.id !== playerId) {
    throw new Error(`Not this player's turn. Expected ${current.id}, got ${playerId}`);
  }
}

function tileAt(state: GameState, coord: Coord): Tile {
  const tile = state.map.tiles[keyOf(coord)];
  if (!tile) throw new Error(`Unknown tile ${keyOf(coord)}`);
  return tile;
}

function unitAt(state: GameState, unitId: string): Unit {
  const unit = state.map.units[unitId];
  if (!unit) throw new Error(`Unknown unit ${unitId}`);
  return unit;
}

function cityAt(state: GameState, cityId: string): City {
  const city = state.map.cities[cityId];
  if (!city) throw new Error(`Unknown city ${cityId}`);
  return city;
}

function movementBudgetFor(unit: Unit): number {
  return UNITS[unit.type].movement;
}

function applyMovement(state: GameState, action: MoveUnitAction): void {
  const unit = unitAt(state, action.unitId);
  assertPlayerTurn(state, action.playerId);
  if (unit.ownerId !== action.playerId) throw new Error("Cannot move enemy unit");

  const start = unit.position;
  const destination = action.destination;
  const unitDef = UNITS[unit.type];
  const path =
    action.path ??
    findPath(
      state,
      {
        ownerId: unit.ownerId,
        domain: unitDef.domain,
        mounted: unitDef.mounted
      },
      start,
      destination
    );

  if (!path || path.length < 2) throw new Error("No valid path to destination");

  let totalCost = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const step = movementCost(
      state,
      { ownerId: unit.ownerId, domain: unitDef.domain, mounted: unitDef.mounted },
      path[i],
      path[i + 1]
    );
    if (!Number.isFinite(step)) throw new Error("Path uses impassable terrain");
    totalCost += step;
  }

  if (totalCost > unit.movementRemaining) {
    throw new Error(`Insufficient movement: needs ${totalCost}, has ${unit.movementRemaining}`);
  }

  unit.position = destination;
  unit.movementRemaining -= totalCost;

  const destinationTile = tileAt(state, destination);
  if (destinationTile.terrain === "desert" && !state.playersById[unit.ownerId].techs.includes("caravan-logistics")) {
    const heatPenalty = state.weather.current[destinationTile.region] === "heat" ? 2 : 1;
    unit.hp = Math.max(1, unit.hp - heatPenalty);
  }
}

function veterancyMultiplier(veterancy: Veterancy): number {
  if (veterancy === "veteran") return 1.1;
  if (veterancy === "elite") return 1.2;
  return 1;
}

function defenderTerrainBonus(state: GameState, defender: Unit): number {
  return TERRAIN[tileAt(state, defender.position).terrain].defense || 0;
}

function flankingBonus(state: GameState, attacker: Unit, defender: Unit): number {
  let adjacentAllies = 0;
  for (const n of neighborsOf(defender.position)) {
    for (const maybeAlly of Object.values(state.map.units)) {
      if (maybeAlly.id === attacker.id) continue;
      if (maybeAlly.ownerId !== attacker.ownerId) continue;
      if (maybeAlly.hp <= 0) continue;
      if (maybeAlly.position.q === n.q && maybeAlly.position.r === n.r) {
        adjacentAllies += 1;
      }
    }
  }
  return adjacentAllies * 0.1;
}

function riverAttackPenalty(state: GameState, attacker: Unit, defender: Unit): number {
  const k = edgeKey(attacker.position, defender.position);
  return state.map.rivers[k] ? 0.25 : 0;
}

export function computeCombatPreview(state: GameState, attackerId: string, defenderId: string): CombatPreview {
  const attacker = unitAt(state, attackerId);
  const defender = unitAt(state, defenderId);
  const attackerDef = UNITS[attacker.type];
  const defenderDef = UNITS[defender.type];

  if (distance(attacker.position, defender.position) > attackerDef.range) {
    throw new Error("Defender is out of range");
  }

  const defenderTile = tileAt(state, defender.position);
  const weather = state.weather.current[defenderTile.region] || "clear";

  const attackMult =
    veterancyMultiplier(attacker.veterancy) + flankingBonus(state, attacker, defender) - riverAttackPenalty(state, attacker, defender);
  const defenseMult = 1 + defenderTerrainBonus(state, defender) + veterancyMultiplier(defender.veterancy) - 1;

  const atkPower = attackerDef.attack * (attacker.hp / attacker.maxHp) * Math.max(0.1, attackMult);
  const defPower = defenderDef.defense * (defender.hp / defender.maxHp) * Math.max(0.1, defenseMult);

  let damageToDefender = Math.max(1, Math.round((20 * atkPower) / (atkPower + defPower)));
  let damageToAttacker = Math.max(0, Math.round((14 * defPower) / (atkPower + defPower)));

  if (weather === "fog") {
    damageToDefender = Math.max(1, Math.round(damageToDefender * 0.95));
  }

  const rangedNoRetaliation = attackerDef.range > 1 && distance(attacker.position, defender.position) > 1;
  if (rangedNoRetaliation) damageToAttacker = 0;

  return {
    damageToDefender,
    damageToAttacker,
    attackerRemainingHp: Math.max(0, attacker.hp - damageToAttacker),
    defenderRemainingHp: Math.max(0, defender.hp - damageToDefender)
  };
}

function applyCombat(state: GameState, action: Extract<GameAction, { type: "ATTACK" }>): void {
  assertPlayerTurn(state, action.playerId);
  const attacker = unitAt(state, action.attackerId);
  const defender = unitAt(state, action.defenderId);
  if (attacker.ownerId !== action.playerId) throw new Error("Cannot attack with enemy unit");
  if (defender.ownerId === action.playerId) throw new Error("Cannot attack friendly unit");

  const preview = computeCombatPreview(state, attacker.id, defender.id);
  attacker.hp = preview.attackerRemainingHp;
  defender.hp = preview.defenderRemainingHp;
  attacker.movementRemaining = 0;

  if (defender.hp <= 0) {
    delete state.map.units[defender.id];
    const defenderOwner = state.playersById[defender.ownerId];
    defenderOwner.unitIds = defenderOwner.unitIds.filter((id) => id !== defender.id);

    if (attacker.veterancy === "recruit") attacker.veterancy = "veteran";
    else if (attacker.veterancy === "veteran") attacker.veterancy = "elite";
  }

  if (attacker.hp <= 0) {
    delete state.map.units[attacker.id];
    const attackerOwner = state.playersById[attacker.ownerId];
    attackerOwner.unitIds = attackerOwner.unitIds.filter((id) => id !== attacker.id);
  }
}

function computeCityAttackDamage(state: GameState, attacker: Unit, city: City): number {
  const attackerDef = UNITS[attacker.type];
  const cityTile = tileAt(state, city.position);
  const weather = state.weather.current[cityTile.region] || "clear";

  const weatherMult = weather === "fog" ? 0.95 : 1;
  const attackPower = attackerDef.attack * (attacker.hp / attacker.maxHp) * veterancyMultiplier(attacker.veterancy) * weatherMult;
  const cityDefense = 22 + city.population * 3;

  return Math.max(1, Math.round((18 * attackPower) / (attackPower + cityDefense)));
}

function applyAttackCity(state: GameState, action: AttackCityAction): void {
  assertPlayerTurn(state, action.playerId);
  const attacker = unitAt(state, action.attackerId);
  const city = cityAt(state, action.cityId);

  if (attacker.ownerId !== action.playerId) throw new Error("Cannot attack city with enemy unit");
  if (city.ownerId === action.playerId) throw new Error("Cannot attack friendly city");

  const attackerDef = UNITS[attacker.type];
  if (distance(attacker.position, city.position) > attackerDef.range) {
    throw new Error("City is out of range");
  }

  const damage = computeCityAttackDamage(state, attacker, city);
  city.hp = Math.max(0, city.hp - damage);
  attacker.movementRemaining = 0;

  if (city.hp <= 0) {
    city.ownerId = attacker.ownerId;
    city.population = Math.max(1, city.population - 1);
    city.hp = Math.ceil(city.maxHp * 0.6);
    syncOwnershipIndexes(state);
  }
}

export function canResearch(player: Player, techId: string): boolean {
  const tech = TECHS[techId];
  if (!tech) throw new Error(`Unknown tech ${techId}`);
  if (player.techs.includes(techId)) return false;

  for (const prereq of tech.prerequisites) {
    if (!player.techs.includes(prereq)) return false;
  }

  if (tech.forkGroup) {
    const chosenBranch = player.forkChoices[tech.forkGroup];
    if (chosenBranch && chosenBranch !== tech.forkBranch) return false;
  }

  return true;
}

function applyResearch(state: GameState, action: ResearchTechAction): void {
  assertPlayerTurn(state, action.playerId);
  const player = state.playersById[action.playerId];
  if (!canResearch(player, action.techId)) {
    throw new Error(`Cannot research tech ${action.techId}`);
  }

  player.techs.push(action.techId);
  const tech = TECHS[action.techId];
  if (tech.forkGroup && !player.forkChoices[tech.forkGroup]) {
    player.forkChoices[tech.forkGroup] = tech.forkBranch || "";
  }
}

function applyChooseFork(state: GameState, action: ChooseForkAction): void {
  assertPlayerTurn(state, action.playerId);
  const player = state.playersById[action.playerId];
  if (player.forkChoices[action.forkGroup] && player.forkChoices[action.forkGroup] !== action.branch) {
    throw new Error(`Fork already chosen for ${action.forkGroup}`);
  }
  player.forkChoices[action.forkGroup] = action.branch;
}

function computeCityYield(state: GameState, cityId: string): { food: number; production: number; gold: number } {
  const city = state.map.cities[cityId];
  if (!city) throw new Error(`Unknown city ${cityId}`);

  const centerTile = tileAt(state, city.position);
  const terrainYield = TERRAIN[centerTile.terrain].yields;
  return {
    food: terrainYield.food + 1,
    production: terrainYield.production + 1,
    gold: terrainYield.gold + Math.max(1, Math.floor(city.population / 2))
  };
}

function applyEndTurn(state: GameState, action: EndTurnAction): void {
  assertPlayerTurn(state, action.playerId);
  const endingPlayer = getCurrentPlayer(state);

  for (const cityId of endingPlayer.cityIds) {
    const yields = computeCityYield(state, cityId);
    endingPlayer.food += yields.food;
    endingPlayer.production += yields.production;
    endingPlayer.gold += yields.gold;
  }

  const upkeep = endingPlayer.unitIds.reduce((sum, unitId) => {
    const unit = state.map.units[unitId];
    if (!unit) return sum;
    return sum + (UNITS[unit.type].upkeep || 0);
  }, 0);
  endingPlayer.gold -= upkeep;

  state.currentPlayerIndex += 1;
  if (state.currentPlayerIndex >= state.players.length) {
    state.currentPlayerIndex = 0;
    state.turn += 1;
    state.weather.current = generateWeatherByRegion(state, state.turn);
    state.weather.forecast = generateWeatherByRegion(state, state.turn + 1);
  }

  const nextPlayer = getCurrentPlayer(state);
  for (const unitId of nextPlayer.unitIds) {
    const unit = state.map.units[unitId];
    if (!unit) continue;

    unit.movementRemaining = movementBudgetFor(unit);

    const unitTile = tileAt(state, unit.position);
    if (unit.type === "trireme" && unitTile.terrain === "sea" && state.weather.current[unitTile.region] === "storm") {
      unit.hp = Math.max(1, unit.hp - 2);
    }
  }
}

function applyFoundCity(state: GameState, action: FoundCityAction): void {
  assertPlayerTurn(state, action.playerId);
  const settler = unitAt(state, action.settlerId);
  if (settler.ownerId !== action.playerId) throw new Error("Cannot use enemy settler");
  if (settler.type !== "settler") throw new Error("Only settler can found a city");
  if (state.map.cities[action.cityId]) throw new Error(`City id ${action.cityId} already exists`);

  for (const city of Object.values(state.map.cities)) {
    if (city.position.q === settler.position.q && city.position.r === settler.position.r) {
      throw new Error("A city already exists on this tile");
    }
  }

  state.map.cities[action.cityId] = {
    id: action.cityId,
    ownerId: action.playerId,
    position: { ...settler.position },
    population: 1,
    hp: 40,
    maxHp: 40
  };

  delete state.map.units[settler.id];
  syncOwnershipIndexes(state);
}

function applyBuildUnit(state: GameState, action: BuildUnitAction): void {
  assertPlayerTurn(state, action.playerId);
  const city = cityAt(state, action.cityId);
  if (city.ownerId !== action.playerId) throw new Error("Cannot build from enemy city");
  if (state.map.units[action.unitId]) throw new Error(`Unit id ${action.unitId} already exists`);
  if (!UNITS[action.unitType]) throw new Error(`Unknown unit type ${action.unitType}`);

  const player = state.playersById[action.playerId];
  const cost = UNIT_BUILD_COSTS[action.unitType] ?? 9999;
  if (player.production < cost) {
    throw new Error(`Insufficient production: needs ${cost}, has ${player.production}`);
  }

  player.production -= cost;

  const unitDef = UNITS[action.unitType];
  state.map.units[action.unitId] = {
    id: action.unitId,
    type: action.unitType,
    ownerId: action.playerId,
    position: { ...city.position },
    hp: unitDef.maxHp,
    maxHp: unitDef.maxHp,
    movementRemaining: 0,
    veterancy: "recruit"
  };

  syncOwnershipIndexes(state);
}

export function createInitialGameState(config: CreateGameConfig = {}): GameState {
  const players = normalizePlayers(config.players);
  const map = normalizeMap(config.map);

  const state: GameState = {
    version: 1,
    seed: String(config.seed || "hegemon-seed"),
    turn: 1,
    currentPlayerIndex: 0,
    players,
    playersById: makePlayersById(players),
    map,
    weather: { current: {}, forecast: {} },
    actionLog: []
  };

  syncOwnershipIndexes(state);
  state.weather.current = generateWeatherByRegion(state, state.turn);
  state.weather.forecast = generateWeatherByRegion(state, state.turn + 1);

  return state;
}

export function getVictoryStatus(state: GameState): VictoryStatus {
  const capitals = Object.values(state.map.cities).filter((city) => city.isCapital);
  if (capitals.length === 0) {
    return { winnerId: null, type: null, reason: null };
  }

  const owner = capitals[0].ownerId;
  const allOwnedBySamePlayer = capitals.every((city) => city.ownerId === owner);
  if (!allOwnedBySamePlayer) {
    return { winnerId: null, type: null, reason: null };
  }

  return {
    winnerId: owner,
    type: "domination",
    reason: `${owner} controls all capitals`
  };
}

export function applyAction(inputState: GameState, action: GameAction): GameState {
  const state = deepClone(inputState);
  state.playersById = makePlayersById(state.players);

  switch (action.type) {
    case "MOVE_UNIT":
      applyMovement(state, action);
      break;
    case "ATTACK":
      applyCombat(state, action);
      break;
    case "RESEARCH_TECH":
      applyResearch(state, action);
      break;
    case "CHOOSE_FORK":
      applyChooseFork(state, action);
      break;
    case "END_TURN":
      applyEndTurn(state, action);
      break;
    case "FOUND_CITY":
      applyFoundCity(state, action);
      break;
    case "BUILD_UNIT":
      applyBuildUnit(state, action);
      break;
    case "ATTACK_CITY":
      applyAttackCity(state, action);
      break;
    default: {
      const unknownAction: never = action;
      throw new Error(`Unsupported action ${(unknownAction as { type: string }).type}`);
    }
  }

  state.actionLog.push({
    turn: inputState.turn,
    playerId: action.playerId,
    action
  });

  return state;
}

export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

export function deserializeState(serialized: string): GameState {
  return JSON.parse(serialized) as GameState;
}

export function replayActions(initialState: GameState, actions: GameAction[]): GameState {
  return actions.reduce((state, action) => applyAction(state, action), deepClone(initialState));
}

export {
  movementCost,
  findPath,
  keyOf,
  parseKey,
  distance,
  WEATHER_STATES,
  TERRAIN,
  TECHS,
  UNITS
};
