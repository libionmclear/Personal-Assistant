import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../src/engine";
import { chooseAiAction, runAiTurn } from "../src/engine/ai";
import { loadScenario } from "../src/engine/scenarios";

test("ai chooses a valid action for the active player", () => {
  const scenario = loadScenario("italia");
  const state = createInitialGameState(scenario.config);

  const action = chooseAiAction(state, "rome");
  assert.equal(action.playerId, "rome");
});

test("ai turn runner always finishes with END_TURN", () => {
  const scenario = loadScenario("italia");
  const state = createInitialGameState(scenario.config);

  const result = runAiTurn(state, "rome", 6);
  assert.ok(result.actions.length > 0);
  assert.equal(result.actions[result.actions.length - 1].type, "END_TURN");
});
