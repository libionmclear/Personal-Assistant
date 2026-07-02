import { createInitialGameState, getVictoryStatus } from "./engine/index";
import { runAiTurn } from "./engine/ai";
import { loadScenario } from "./engine/scenarios";

function summarize(state: ReturnType<typeof createInitialGameState>): string {
  const current = state.players[state.currentPlayerIndex];
  const players = state.players
    .map((p) => `${p.id}: cities=${p.cityIds.length}, units=${p.unitIds.length}, prod=${p.production}, gold=${p.gold}`)
    .join(" | ");
  return `Turn ${state.turn} | Active ${current.id} | ${players}`;
}

function run(): void {
  const scenario = loadScenario("italia");
  let state = createInitialGameState(scenario.config);

  console.log(`Scenario: ${scenario.name}`);
  console.log(scenario.historicalBrief);
  console.log(summarize(state));

  for (let round = 0; round < 6; round += 1) {
    const active = state.players[state.currentPlayerIndex].id;
    const turn = runAiTurn(state, active, 8);
    state = turn.state;

    for (const action of turn.actions) {
      console.log(`${action.playerId} -> ${action.type}`);
    }
    console.log(summarize(state));

    const victory = getVictoryStatus(state);
    if (victory.winnerId) {
      console.log(`Victory: ${victory.type} by ${victory.winnerId}`);
      break;
    }
  }

  console.log("Simulation complete.");
}

run();
