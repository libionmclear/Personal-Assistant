"use strict";
var HegemonEngine = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/engine/browser-entry.ts
  var browser_entry_exports = {};
  __export(browser_entry_exports, {
    applyAction: () => applyAction,
    chooseAiAction: () => chooseAiAction,
    createInitialGameState: () => createInitialGameState,
    getVictoryStatus: () => getVictoryStatus,
    keyOf: () => keyOf,
    listScenarios: () => listScenarios,
    loadScenario: () => loadScenario,
    runAiTurn: () => runAiTurn
  });

  // src/engine/data.ts
  var TERRAIN = {
    plains: { moveCost: 1, yields: { food: 2, production: 0, gold: 0 }, defense: 0, vision: 0 },
    valley: { moveCost: 1, yields: { food: 3, production: 0, gold: 0 }, defense: 0, vision: 0 },
    forest: { moveCost: 2, yields: { food: 0, production: 2, gold: 0 }, defense: 0.25, vision: 0 },
    hills: { moveCost: 2, yields: { food: 1, production: 1, gold: 0 }, defense: 0.25, vision: 1 },
    mountains: { moveCost: 3, yields: { food: 0, production: 1, gold: 0 }, defense: 0.5, vision: 0, impassableWithoutTech: "mountain-paths" },
    desert: { moveCost: 2, yields: { food: 0, production: 0, gold: 0 }, defense: 0, vision: 0 },
    coast: { moveCost: 1, yields: { food: 1, production: 0, gold: 1 }, defense: 0, vision: 0, navalOnly: true },
    sea: { moveCost: 1, yields: { food: 0, production: 0, gold: 0 }, defense: 0, vision: 0, navalOnly: true, requiresTech: "open-sea-sailing" }
  };
  var TECHS = {
    "bronze-working": { age: 1, prerequisites: [] },
    sailing: { age: 1, prerequisites: [] },
    writing: { age: 1, prerequisites: [] },
    masonry: { age: 1, prerequisites: [] },
    archery: { age: 1, prerequisites: [] },
    irrigation: { age: 1, prerequisites: [] },
    "phalanx-doctrine": {
      age: 1,
      prerequisites: ["bronze-working"],
      forkGroup: "warfare-doctrine",
      forkBranch: "phalanx"
    },
    "skirmish-doctrine": {
      age: 1,
      prerequisites: ["archery"],
      forkGroup: "warfare-doctrine",
      forkBranch: "skirmish"
    },
    "temple-economy": {
      age: 1,
      prerequisites: ["writing"],
      forkGroup: "economy-doctrine",
      forkBranch: "temple"
    },
    coinage: {
      age: 1,
      prerequisites: ["writing"],
      forkGroup: "economy-doctrine",
      forkBranch: "coinage"
    },
    "iron-working": { age: 2, prerequisites: ["bronze-working"] },
    "open-sea-sailing": { age: 2, prerequisites: ["sailing"] },
    engineering: { age: 2, prerequisites: ["masonry"] },
    "horseback-riding": { age: 2, prerequisites: ["bronze-working"] },
    "mountain-paths": { age: 2, prerequisites: ["engineering"] },
    "caravan-logistics": { age: 2, prerequisites: ["coinage"] },
    republic: {
      age: 2,
      prerequisites: ["writing"],
      forkGroup: "statecraft",
      forkBranch: "republic"
    },
    monarchy: {
      age: 2,
      prerequisites: ["writing"],
      forkGroup: "statecraft",
      forkBranch: "monarchy"
    },
    "ramming-fleets": {
      age: 2,
      prerequisites: ["open-sea-sailing"],
      forkGroup: "naval-doctrine",
      forkBranch: "ramming"
    },
    "merchant-marine": {
      age: 2,
      prerequisites: ["open-sea-sailing"],
      forkGroup: "naval-doctrine",
      forkBranch: "merchant"
    },
    "roads-logistics": { age: 3, prerequisites: ["engineering"] },
    siegecraft: { age: 3, prerequisites: ["iron-working"] },
    medicine: { age: 3, prerequisites: ["writing"] },
    "law-administration": { age: 3, prerequisites: ["writing"] },
    "currency-reform": { age: 3, prerequisites: ["coinage"] },
    cartography: { age: 3, prerequisites: ["open-sea-sailing"] },
    assimilation: {
      age: 3,
      prerequisites: ["law-administration"],
      forkGroup: "imperial-method",
      forkBranch: "assimilation"
    },
    "tribute-empire": {
      age: 3,
      prerequisites: ["law-administration"],
      forkGroup: "imperial-method",
      forkBranch: "tribute"
    }
  };
  var UNITS = {
    warrior: { domain: "land", movement: 2, attack: 20, defense: 18, maxHp: 20, range: 1, upkeep: 1 },
    archer: { domain: "land", movement: 2, attack: 16, defense: 12, maxHp: 18, range: 2, upkeep: 1 },
    horseman: { domain: "land", movement: 3, attack: 22, defense: 14, maxHp: 20, range: 1, upkeep: 2, mounted: true },
    trireme: { domain: "naval", movement: 3, attack: 24, defense: 16, maxHp: 24, range: 1, upkeep: 2 },
    merchant: { domain: "civilian", movement: 2, attack: 0, defense: 4, maxHp: 12, range: 0, upkeep: 1 },
    settler: { domain: "civilian", movement: 2, attack: 0, defense: 6, maxHp: 12, range: 0, upkeep: 1 }
  };
  var UNIT_BUILD_COSTS = {
    warrior: 12,
    archer: 14,
    horseman: 20,
    trireme: 22,
    merchant: 16,
    settler: 18
  };

  // src/engine/hex.ts
  var DIRECTIONS = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1]
  ];
  function keyOf(coord) {
    return `${coord.q},${coord.r}`;
  }
  function parseKey(key) {
    const [q, r] = key.split(",").map(Number);
    return { q, r };
  }
  function neighborsOf(coord) {
    return DIRECTIONS.map(([dq, dr]) => ({ q: coord.q + dq, r: coord.r + dr }));
  }
  function distance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  }
  function edgeKey(a, b) {
    const ak = keyOf(a);
    const bk = keyOf(b);
    return ak < bk ? `${ak}|${bk}` : `${bk}|${ak}`;
  }

  // src/engine/pathfinding.ts
  function movementCost(state, unit, from, to) {
    const toTile = state.map.tiles[keyOf(to)];
    if (!toTile) return Number.POSITIVE_INFINITY;
    const terrain = TERRAIN[toTile.terrain];
    if (!terrain) return Number.POSITIVE_INFINITY;
    if (terrain.navalOnly && unit.domain !== "naval") return Number.POSITIVE_INFINITY;
    if (!terrain.navalOnly && unit.domain === "naval") return Number.POSITIVE_INFINITY;
    if (terrain.requiresTech && !state.playersById[unit.ownerId].techs.includes(terrain.requiresTech)) {
      return Number.POSITIVE_INFINITY;
    }
    if (terrain.impassableWithoutTech && !state.playersById[unit.ownerId].techs.includes(terrain.impassableWithoutTech)) {
      return Number.POSITIVE_INFINITY;
    }
    let cost = terrain.moveCost;
    if (unit.mounted && state.weather.current[toTile.region] === "rain") {
      cost += 1;
    }
    const crossingKey = edgeKey(from, to);
    if (state.map.rivers[crossingKey]) {
      cost += 1;
      if (state.weather.current[toTile.region] === "rain") {
        cost += 1;
      }
    }
    return cost;
  }
  function findPath(state, unit, start, goal) {
    const startKey = keyOf(start);
    const goalKey = keyOf(goal);
    if (startKey === goalKey) return [start];
    const frontier = [{ key: startKey, cost: 0 }];
    const cameFrom = /* @__PURE__ */ new Map([[startKey, null]]);
    const costSoFar = /* @__PURE__ */ new Map([[startKey, 0]]);
    while (frontier.length > 0) {
      frontier.sort((a, b) => a.cost - b.cost);
      const current = frontier.shift();
      if (!current) break;
      const currentKey = current.key;
      if (currentKey === goalKey) break;
      const currentCoord = parseKey(currentKey);
      for (const next of neighborsOf(currentCoord)) {
        const nextKey = keyOf(next);
        const step = movementCost(state, unit, currentCoord, next);
        if (!Number.isFinite(step)) continue;
        const nextCost = (costSoFar.get(currentKey) ?? 0) + step;
        const known = costSoFar.get(nextKey);
        if (known === void 0 || nextCost < known) {
          costSoFar.set(nextKey, nextCost);
          frontier.push({ key: nextKey, cost: nextCost });
          cameFrom.set(nextKey, currentKey);
        }
      }
    }
    if (!cameFrom.has(goalKey)) return null;
    const path = [];
    let cursor = goalKey;
    while (cursor) {
      path.push(parseKey(cursor));
      cursor = cameFrom.get(cursor) ?? null;
    }
    path.reverse();
    return path;
  }

  // src/engine/rng.ts
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i += 1) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = h << 13 | h >>> 19;
    }
    return function hash() {
      h = Math.imul(h ^ h >>> 16, 2246822507);
      h = Math.imul(h ^ h >>> 13, 3266489909);
      h ^= h >>> 16;
      return h >>> 0;
    };
  }
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function rand() {
      t += 1831565813;
      let r = Math.imul(t ^ t >>> 15, 1 | t);
      r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
      return ((r ^ r >>> 14) >>> 0) / 4294967296;
    };
  }
  function seededRandom(seed, salt) {
    const seedFn = xmur3(`${seed}:${salt}`);
    return mulberry32(seedFn());
  }

  // src/engine/index.ts
  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function makePlayersById(players) {
    const result = {};
    for (const player of players) {
      result[player.id] = player;
    }
    return result;
  }
  function normalizePlayers(configPlayers) {
    const fallback = [{ id: "p1", civ: "Rome" }, { id: "p2", civ: "Carthage" }];
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
  function normalizeMap(configMap) {
    const width = configMap?.width ?? 10;
    const height = configMap?.height ?? 10;
    const tiles = {};
    if (configMap?.tiles) {
      for (const [key, tile] of Object.entries(configMap.tiles)) {
        tiles[key] = {
          terrain: tile.terrain ?? "plains",
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
    const units = {};
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
  function syncOwnershipIndexes(state) {
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
  function randomWeather(roll) {
    if (roll < 0.5) return "clear";
    if (roll < 0.7) return "rain";
    if (roll < 0.85) return "fog";
    if (roll < 0.93) return "storm";
    return "heat";
  }
  function generateWeatherByRegion(state, turn) {
    const result = {};
    const regions = state.map.regions.length > 0 ? state.map.regions : ["core"];
    for (const region of regions) {
      const rand = seededRandom(state.seed, `weather:${turn}:${region}`);
      result[region] = randomWeather(rand());
    }
    return result;
  }
  function getCurrentPlayer(state) {
    return state.players[state.currentPlayerIndex];
  }
  function assertPlayerTurn(state, playerId) {
    const current = getCurrentPlayer(state);
    if (current.id !== playerId) {
      throw new Error(`Not this player's turn. Expected ${current.id}, got ${playerId}`);
    }
  }
  function tileAt(state, coord) {
    const tile = state.map.tiles[keyOf(coord)];
    if (!tile) throw new Error(`Unknown tile ${keyOf(coord)}`);
    return tile;
  }
  function unitAt(state, unitId) {
    const unit = state.map.units[unitId];
    if (!unit) throw new Error(`Unknown unit ${unitId}`);
    return unit;
  }
  function cityAt(state, cityId) {
    const city = state.map.cities[cityId];
    if (!city) throw new Error(`Unknown city ${cityId}`);
    return city;
  }
  function movementBudgetFor(unit) {
    return UNITS[unit.type].movement;
  }
  function applyMovement(state, action) {
    const unit = unitAt(state, action.unitId);
    assertPlayerTurn(state, action.playerId);
    if (unit.ownerId !== action.playerId) throw new Error("Cannot move enemy unit");
    const start = unit.position;
    const destination = action.destination;
    const unitDef = UNITS[unit.type];
    const path = action.path ?? findPath(
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
  function veterancyMultiplier(veterancy) {
    if (veterancy === "veteran") return 1.1;
    if (veterancy === "elite") return 1.2;
    return 1;
  }
  function defenderTerrainBonus(state, defender) {
    return TERRAIN[tileAt(state, defender.position).terrain].defense || 0;
  }
  function flankingBonus(state, attacker, defender) {
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
  function riverAttackPenalty(state, attacker, defender) {
    const k = edgeKey(attacker.position, defender.position);
    return state.map.rivers[k] ? 0.25 : 0;
  }
  function computeCombatPreview(state, attackerId, defenderId) {
    const attacker = unitAt(state, attackerId);
    const defender = unitAt(state, defenderId);
    const attackerDef = UNITS[attacker.type];
    const defenderDef = UNITS[defender.type];
    if (distance(attacker.position, defender.position) > attackerDef.range) {
      throw new Error("Defender is out of range");
    }
    const defenderTile = tileAt(state, defender.position);
    const weather = state.weather.current[defenderTile.region] || "clear";
    const attackMult = veterancyMultiplier(attacker.veterancy) + flankingBonus(state, attacker, defender) - riverAttackPenalty(state, attacker, defender);
    const defenseMult = 1 + defenderTerrainBonus(state, defender) + veterancyMultiplier(defender.veterancy) - 1;
    const atkPower = attackerDef.attack * (attacker.hp / attacker.maxHp) * Math.max(0.1, attackMult);
    const defPower = defenderDef.defense * (defender.hp / defender.maxHp) * Math.max(0.1, defenseMult);
    let damageToDefender = Math.max(1, Math.round(20 * atkPower / (atkPower + defPower)));
    let damageToAttacker = Math.max(0, Math.round(14 * defPower / (atkPower + defPower)));
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
  function applyCombat(state, action) {
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
  function computeCityAttackDamage(state, attacker, city) {
    const attackerDef = UNITS[attacker.type];
    const cityTile = tileAt(state, city.position);
    const weather = state.weather.current[cityTile.region] || "clear";
    const weatherMult = weather === "fog" ? 0.95 : 1;
    const attackPower = attackerDef.attack * (attacker.hp / attacker.maxHp) * veterancyMultiplier(attacker.veterancy) * weatherMult;
    const cityDefense = 22 + city.population * 3;
    return Math.max(1, Math.round(18 * attackPower / (attackPower + cityDefense)));
  }
  function applyAttackCity(state, action) {
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
  function canResearch(player, techId) {
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
  function applyResearch(state, action) {
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
  function applyChooseFork(state, action) {
    assertPlayerTurn(state, action.playerId);
    const player = state.playersById[action.playerId];
    if (player.forkChoices[action.forkGroup] && player.forkChoices[action.forkGroup] !== action.branch) {
      throw new Error(`Fork already chosen for ${action.forkGroup}`);
    }
    player.forkChoices[action.forkGroup] = action.branch;
  }
  function computeCityYield(state, cityId) {
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
  function applyEndTurn(state, action) {
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
  function applyFoundCity(state, action) {
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
  function applyBuildUnit(state, action) {
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
  function createInitialGameState(config = {}) {
    const players = normalizePlayers(config.players);
    const map = normalizeMap(config.map);
    const state = {
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
  function getVictoryStatus(state) {
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
  function applyAction(inputState, action) {
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
        const unknownAction = action;
        throw new Error(`Unsupported action ${unknownAction.type}`);
      }
    }
    state.actionLog.push({
      turn: inputState.turn,
      playerId: action.playerId,
      action
    });
    return state;
  }

  // src/engine/ai.ts
  function firstBuildableTech(player) {
    const priority = [
      "bronze-working",
      "archery",
      "coinage",
      "iron-working",
      "open-sea-sailing",
      "engineering",
      "roads-logistics"
    ];
    for (const techId of priority) {
      if (player.techs.includes(techId)) continue;
      const tech = TECHS[techId];
      if (!tech) continue;
      const prereqsOk = tech.prerequisites.every((pre) => player.techs.includes(pre));
      if (!prereqsOk) continue;
      if (tech.forkGroup) {
        const chosen = player.forkChoices[tech.forkGroup];
        if (chosen && chosen !== tech.forkBranch) continue;
      }
      return techId;
    }
    return null;
  }
  function tileIsOccupiedByCity(state, coord) {
    return Object.values(state.map.cities).some((city) => city.position.q === coord.q && city.position.r === coord.r);
  }
  function tileIsOccupiedByAnyUnit(state, coord) {
    return Object.values(state.map.units).some((unit) => unit.position.q === coord.q && unit.position.r === coord.r);
  }
  function findFoundCityAction(state, player) {
    for (const unitId of player.unitIds) {
      const unit = state.map.units[unitId];
      if (!unit || unit.type !== "settler") continue;
      if (!tileIsOccupiedByCity(state, unit.position)) {
        return {
          type: "FOUND_CITY",
          playerId: player.id,
          settlerId: unit.id,
          cityId: `${player.id}_city_${state.turn}_${unit.id}`
        };
      }
    }
    return null;
  }
  function findAttackAction(state, player) {
    for (const unitId of player.unitIds) {
      const attacker = state.map.units[unitId];
      if (!attacker) continue;
      const attackerDef = UNITS[attacker.type];
      if (!attackerDef || attackerDef.attack <= 0) continue;
      if (attacker.movementRemaining <= 0) continue;
      for (const unit of Object.values(state.map.units)) {
        if (unit.ownerId === player.id) continue;
        if (distance(attacker.position, unit.position) <= attackerDef.range) {
          return {
            type: "ATTACK",
            playerId: player.id,
            attackerId: attacker.id,
            defenderId: unit.id
          };
        }
      }
      for (const city of Object.values(state.map.cities)) {
        if (city.ownerId === player.id) continue;
        if (distance(attacker.position, city.position) <= attackerDef.range) {
          return {
            type: "ATTACK_CITY",
            playerId: player.id,
            attackerId: attacker.id,
            cityId: city.id
          };
        }
      }
    }
    return null;
  }
  function findBuildUnitAction(state, player) {
    for (const cityId of player.cityIds) {
      const city = state.map.cities[cityId];
      if (!city) continue;
      const desiredUnit = player.unitIds.length < player.cityIds.length * 2 ? "warrior" : "archer";
      const cost = UNIT_BUILD_COSTS[desiredUnit];
      if (player.production < cost) continue;
      let counter = 1;
      let candidateId = `${player.id}_${desiredUnit}_${state.turn}_${cityId}_${counter}`;
      while (state.map.units[candidateId]) {
        counter += 1;
        candidateId = `${player.id}_${desiredUnit}_${state.turn}_${cityId}_${counter}`;
      }
      return {
        type: "BUILD_UNIT",
        playerId: player.id,
        cityId,
        unitType: desiredUnit,
        unitId: candidateId
      };
    }
    return null;
  }
  function closestEnemyCity(state, playerId, from) {
    let best = null;
    for (const city of Object.values(state.map.cities)) {
      if (city.ownerId === playerId) continue;
      const d = distance(from, city.position);
      if (!best || d < best.distance) {
        best = { cityId: city.id, distance: d, position: city.position };
      }
    }
    return best;
  }
  function findAdvanceAction(state, player) {
    for (const unitId of player.unitIds) {
      const unit = state.map.units[unitId];
      if (!unit) continue;
      const unitDef = UNITS[unit.type];
      if (!unitDef || unitDef.domain !== "land" || unitDef.attack <= 0) continue;
      if (unit.movementRemaining <= 0) continue;
      const target = closestEnemyCity(state, player.id, unit.position);
      if (!target) continue;
      const path = findPath(
        state,
        { ownerId: player.id, domain: unitDef.domain, mounted: unitDef.mounted },
        unit.position,
        target.position
      );
      if (!path || path.length < 2) continue;
      const step = path[1];
      if (tileIsOccupiedByAnyUnit(state, step)) continue;
      const stepCost = movementCost(
        state,
        { ownerId: player.id, domain: unitDef.domain, mounted: unitDef.mounted },
        unit.position,
        step
      );
      if (!Number.isFinite(stepCost) || stepCost > unit.movementRemaining) continue;
      return {
        type: "MOVE_UNIT",
        playerId: player.id,
        unitId: unit.id,
        destination: step,
        path: [unit.position, step]
      };
    }
    return null;
  }
  function chooseAiAction(state, playerId) {
    const player = state.playersById[playerId];
    if (!player) {
      throw new Error(`Unknown player ${playerId}`);
    }
    const actions = [
      () => findFoundCityAction(state, player),
      () => findAttackAction(state, player),
      () => findBuildUnitAction(state, player),
      () => {
        const techId = firstBuildableTech(player);
        if (!techId) return null;
        return { type: "RESEARCH_TECH", playerId: player.id, techId };
      },
      () => findAdvanceAction(state, player)
    ];
    for (const pick of actions) {
      const action = pick();
      if (action) return action;
    }
    return { type: "END_TURN", playerId: player.id };
  }
  function runAiTurn(inputState, playerId, maxActions = 6) {
    let state = inputState;
    const actions = [];
    for (let i = 0; i < maxActions; i += 1) {
      const action = chooseAiAction(state, playerId);
      actions.push(action);
      state = applyAction(state, action);
      if (action.type === "END_TURN") break;
    }
    if (actions.length === maxActions && actions[actions.length - 1].type !== "END_TURN") {
      const forcedEnd = { type: "END_TURN", playerId };
      actions.push(forcedEnd);
      state = applyAction(state, forcedEnd);
    }
    return { state, actions };
  }

  // src/engine/scenarios/italia.ts
  var italiaScenario = {
    seed: "italia-264bc",
    players: [
      { id: "rome", civ: "Rome", food: 8, production: 30, gold: 20 },
      { id: "carthage", civ: "Carthage", food: 8, production: 30, gold: 20 }
    ],
    map: {
      width: 8,
      height: 6,
      regions: ["north-italia", "south-italia", "tyrrhenian"],
      rivers: {
        "2,2|3,2": true,
        "3,2|4,2": true
      },
      tiles: {
        "0,0": { terrain: "hills", region: "north-italia" },
        "1,0": { terrain: "plains", region: "north-italia" },
        "2,0": { terrain: "plains", region: "north-italia" },
        "3,0": { terrain: "forest", region: "north-italia" },
        "4,0": { terrain: "hills", region: "north-italia" },
        "5,0": { terrain: "plains", region: "north-italia" },
        "6,0": { terrain: "coast", region: "tyrrhenian" },
        "7,0": { terrain: "sea", region: "tyrrhenian" },
        "0,1": { terrain: "plains", region: "north-italia" },
        "1,1": { terrain: "valley", region: "north-italia" },
        "2,1": { terrain: "plains", region: "north-italia" },
        "3,1": { terrain: "plains", region: "north-italia" },
        "4,1": { terrain: "hills", region: "north-italia" },
        "5,1": { terrain: "plains", region: "north-italia" },
        "6,1": { terrain: "coast", region: "tyrrhenian" },
        "7,1": { terrain: "sea", region: "tyrrhenian" },
        "0,2": { terrain: "plains", region: "south-italia" },
        "1,2": { terrain: "valley", region: "south-italia" },
        "2,2": { terrain: "plains", region: "south-italia" },
        "3,2": { terrain: "valley", region: "south-italia" },
        "4,2": { terrain: "plains", region: "south-italia" },
        "5,2": { terrain: "hills", region: "south-italia" },
        "6,2": { terrain: "coast", region: "tyrrhenian" },
        "7,2": { terrain: "sea", region: "tyrrhenian" },
        "0,3": { terrain: "forest", region: "south-italia" },
        "1,3": { terrain: "plains", region: "south-italia" },
        "2,3": { terrain: "plains", region: "south-italia" },
        "3,3": { terrain: "hills", region: "south-italia" },
        "4,3": { terrain: "plains", region: "south-italia" },
        "5,3": { terrain: "plains", region: "south-italia" },
        "6,3": { terrain: "coast", region: "tyrrhenian" },
        "7,3": { terrain: "sea", region: "tyrrhenian" },
        "0,4": { terrain: "hills", region: "south-italia" },
        "1,4": { terrain: "plains", region: "south-italia" },
        "2,4": { terrain: "desert", region: "south-italia" },
        "3,4": { terrain: "plains", region: "south-italia" },
        "4,4": { terrain: "plains", region: "south-italia" },
        "5,4": { terrain: "plains", region: "south-italia" },
        "6,4": { terrain: "coast", region: "tyrrhenian" },
        "7,4": { terrain: "sea", region: "tyrrhenian" },
        "0,5": { terrain: "hills", region: "south-italia" },
        "1,5": { terrain: "plains", region: "south-italia" },
        "2,5": { terrain: "plains", region: "south-italia" },
        "3,5": { terrain: "plains", region: "south-italia" },
        "4,5": { terrain: "hills", region: "south-italia" },
        "5,5": { terrain: "plains", region: "south-italia" },
        "6,5": { terrain: "coast", region: "tyrrhenian" },
        "7,5": { terrain: "sea", region: "tyrrhenian" }
      },
      cities: {
        roma: { id: "roma", ownerId: "rome", position: { q: 1, r: 1 }, population: 2, hp: 40, maxHp: 40, isCapital: true },
        karthago: { id: "karthago", ownerId: "carthage", position: { q: 5, r: 4 }, population: 2, hp: 40, maxHp: 40, isCapital: true }
      },
      units: {
        r_warrior: { id: "r_warrior", type: "warrior", ownerId: "rome", position: { q: 2, r: 1 } },
        r_settler: { id: "r_settler", type: "settler", ownerId: "rome", position: { q: 0, r: 2 } },
        c_warrior: { id: "c_warrior", type: "warrior", ownerId: "carthage", position: { q: 4, r: 4 } },
        c_settler: { id: "c_settler", type: "settler", ownerId: "carthage", position: { q: 6, r: 3 } }
      }
    }
  };

  // src/engine/scenarios.ts
  var SCENARIOS = {
    italia: {
      id: "italia",
      name: "Italia: Rome vs Carthage",
      historicalBrief: "Third century BC: Rome and Carthage contest control of Italy and western Mediterranean trade, balancing expansion with logistics.",
      config: italiaScenario
    }
  };
  function listScenarios() {
    return Object.values(SCENARIOS);
  }
  function loadScenario(id) {
    const scenario = SCENARIOS[id];
    if (!scenario) {
      throw new Error(`Unknown scenario ${id}`);
    }
    return JSON.parse(JSON.stringify(scenario));
  }
  return __toCommonJS(browser_entry_exports);
})();
