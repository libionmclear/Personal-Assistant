import test from "node:test";
import assert from "node:assert/strict";

import {
  applyAction,
  canResearch,
  computeCombatPreview,
  createInitialGameState,
  getVictoryStatus,
  keyOf,
  movementCost,
  replayActions
} from "../src/engine/index";

import type { CreateGameConfig, GameAction } from "../src/engine/types";

function buildState() {
  const config: CreateGameConfig = {
    seed: "phase0-seed",
    players: [
      { id: "p1", civ: "Rome", production: 40 },
      { id: "p2", civ: "Carthage", production: 40 }
    ],
    map: {
      width: 5,
      height: 5,
      regions: ["west", "east"],
      rivers: {
        "1,1|2,1": true
      },
      tiles: {
        "0,0": { terrain: "plains", region: "west" },
        "1,0": { terrain: "plains", region: "west" },
        "2,0": { terrain: "plains", region: "west" },
        "0,1": { terrain: "plains", region: "west" },
        "1,1": { terrain: "plains", region: "west" },
        "2,1": { terrain: "forest", region: "east" },
        "3,1": { terrain: "hills", region: "east" },
        "4,1": { terrain: "plains", region: "east" },
        "2,2": { terrain: "desert", region: "east" },
        "3,2": { terrain: "plains", region: "east" },
        "4,2": { terrain: "coast", region: "east" }
      },
      cities: {
        c1: { id: "c1", ownerId: "p1", position: { q: 0, r: 0 }, population: 2 },
        c2: { id: "c2", ownerId: "p2", position: { q: 4, r: 1 }, population: 2 }
      },
      units: {
        u1: { id: "u1", type: "warrior", ownerId: "p1", position: { q: 1, r: 1 } },
        u2: { id: "u2", type: "archer", ownerId: "p1", position: { q: 0, r: 1 } },
        u3: { id: "u3", type: "warrior", ownerId: "p2", position: { q: 2, r: 1 } }
      }
    }
  };

  return createInitialGameState(config);
}

test("weather generation is deterministic by seed and turn", () => {
  const a = buildState();
  const b = buildState();
  assert.deepEqual(a.weather.current, b.weather.current);
  assert.deepEqual(a.weather.forecast, b.weather.forecast);
});

test("movement accounts for river crossing", () => {
  const state = buildState();
  const unit = state.map.units.u1;
  const cost = movementCost(
    state,
    { ownerId: unit.ownerId, domain: "land", mounted: false },
    { q: 1, r: 1 },
    { q: 2, r: 1 }
  );
  assert.equal(cost, 3);
});

test("combat preview remains deterministic with visible modifiers", () => {
  const state = buildState();
  const preview1 = computeCombatPreview(state, "u1", "u3");
  const preview2 = computeCombatPreview(state, "u1", "u3");
  assert.deepEqual(preview1, preview2);
});

test("forked tech branches are mutually exclusive", () => {
  const state = buildState();
  state.playersById.p1.techs.push("bronze-working", "archery", "writing");

  assert.equal(canResearch(state.playersById.p1, "phalanx-doctrine"), true);

  const after = applyAction(state, {
    type: "RESEARCH_TECH",
    playerId: "p1",
    techId: "phalanx-doctrine"
  });

  assert.equal(canResearch(after.playersById.p1, "skirmish-doctrine"), false);
});

test("replay from action log produces same final state", () => {
  const initial = buildState();

  const actions: GameAction[] = [
    { type: "MOVE_UNIT", playerId: "p1", unitId: "u1", destination: { q: 1, r: 0 }, path: [{ q: 1, r: 1 }, { q: 1, r: 0 }] },
    { type: "END_TURN", playerId: "p1" },
    { type: "END_TURN", playerId: "p2" },
    { type: "RESEARCH_TECH", playerId: "p1", techId: "bronze-working" }
  ];

  let direct = initial;
  for (const action of actions) {
    direct = applyAction(direct, action);
  }

  const replayed = replayActions(initial, actions);
  assert.deepEqual(replayed, direct);
  assert.equal(direct.actionLog.length, actions.length);
});

test("scripted headless match flow reaches turn progression", () => {
  let state = buildState();

  state = applyAction(state, { type: "END_TURN", playerId: "p1" });
  state = applyAction(state, { type: "END_TURN", playerId: "p2" });
  state = applyAction(state, { type: "END_TURN", playerId: "p1" });
  state = applyAction(state, { type: "END_TURN", playerId: "p2" });

  assert.equal(state.turn, 3);
  assert.ok(state.weather.current.west);
  assert.ok(state.weather.forecast.east);

  const occupied = keyOf(state.map.cities.c1.position);
  assert.equal(typeof occupied, "string");
});

test("found city consumes settler and creates owned city", () => {
  let state = buildState();

  state = applyAction(state, {
    type: "BUILD_UNIT",
    playerId: "p1",
    cityId: "c1",
    unitType: "settler",
    unitId: "p1_settler_1"
  });

  state = applyAction(state, { type: "END_TURN", playerId: "p1" });
  state = applyAction(state, { type: "END_TURN", playerId: "p2" });

  state = applyAction(state, {
    type: "MOVE_UNIT",
    playerId: "p1",
    unitId: "p1_settler_1",
    destination: { q: 1, r: 0 },
    path: [{ q: 0, r: 0 }, { q: 1, r: 0 }]
  });

  state = applyAction(state, {
    type: "FOUND_CITY",
    playerId: "p1",
    settlerId: "p1_settler_1",
    cityId: "c1b"
  });

  assert.equal(state.map.cities.c1b.ownerId, "p1");
  assert.equal(state.map.cities.c1b.population, 1);
  assert.equal(state.map.units.p1_settler_1, undefined);
  assert.ok(state.playersById.p1.cityIds.includes("c1b"));
});

test("build unit spends production and creates unit in city tile", () => {
  let state = buildState();
  const beforeProduction = state.playersById.p1.production;

  state = applyAction(state, {
    type: "BUILD_UNIT",
    playerId: "p1",
    cityId: "c1",
    unitType: "archer",
    unitId: "p1_archer_new"
  });

  assert.ok(state.playersById.p1.production < beforeProduction);
  assert.equal(state.map.units.p1_archer_new.ownerId, "p1");
  assert.deepEqual(state.map.units.p1_archer_new.position, state.map.cities.c1.position);
  assert.ok(state.playersById.p1.unitIds.includes("p1_archer_new"));
});

test("city can be captured and domination victory is detected", () => {
  let state = buildState();

  state.map.cities.c1.isCapital = true;
  state.map.cities.c2.isCapital = true;
  state.map.cities.c2.position = { q: 2, r: 1 };
  state.map.cities.c2.hp = 6;

  state = applyAction(state, {
    type: "ATTACK_CITY",
    playerId: "p1",
    attackerId: "u1",
    cityId: "c2"
  });

  assert.equal(state.map.cities.c2.ownerId, "p1");

  const victory = getVictoryStatus(state);
  assert.equal(victory.type, "domination");
  assert.equal(victory.winnerId, "p1");
});
