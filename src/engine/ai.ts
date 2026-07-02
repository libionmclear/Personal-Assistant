import { TECHS, UNIT_BUILD_COSTS, UNITS } from "./data";
import { applyAction } from "./index";
import { distance } from "./hex";
import { findPath, movementCost } from "./pathfinding";
import type { Coord, GameAction, GameState, Player, Unit } from "./types";

function firstBuildableTech(player: Player): string | null {
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

function tileIsOccupiedByCity(state: GameState, coord: Coord): boolean {
  return Object.values(state.map.cities).some((city) => city.position.q === coord.q && city.position.r === coord.r);
}

function tileIsOccupiedByAnyUnit(state: GameState, coord: Coord): boolean {
  return Object.values(state.map.units).some((unit) => unit.position.q === coord.q && unit.position.r === coord.r);
}

function findFoundCityAction(state: GameState, player: Player): GameAction | null {
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

function findAttackAction(state: GameState, player: Player): GameAction | null {
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

function findBuildUnitAction(state: GameState, player: Player): GameAction | null {
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

function closestEnemyCity(state: GameState, playerId: string, from: Coord) {
  let best: { cityId: string; distance: number; position: Coord } | null = null;

  for (const city of Object.values(state.map.cities)) {
    if (city.ownerId === playerId) continue;
    const d = distance(from, city.position);
    if (!best || d < best.distance) {
      best = { cityId: city.id, distance: d, position: city.position };
    }
  }

  return best;
}

function findAdvanceAction(state: GameState, player: Player): GameAction | null {
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

export function chooseAiAction(state: GameState, playerId: string): GameAction {
  const player = state.playersById[playerId];
  if (!player) {
    throw new Error(`Unknown player ${playerId}`);
  }

  const actions: Array<() => GameAction | null> = [
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

export function runAiTurn(inputState: GameState, playerId: string, maxActions = 6): { state: GameState; actions: GameAction[] } {
  let state = inputState;
  const actions: GameAction[] = [];

  for (let i = 0; i < maxActions; i += 1) {
    const action = chooseAiAction(state, playerId);
    actions.push(action);
    state = applyAction(state, action);
    if (action.type === "END_TURN") break;
  }

  if (actions.length === maxActions && actions[actions.length - 1].type !== "END_TURN") {
    const forcedEnd: GameAction = { type: "END_TURN", playerId };
    actions.push(forcedEnd);
    state = applyAction(state, forcedEnd);
  }

  return { state, actions };
}
