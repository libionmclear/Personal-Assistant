(function () {
  const engine = window.HegemonEngine;
  if (!engine) {
    throw new Error("Engine bundle is not loaded. Run: npm run build:web");
  }

  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status-line");
  const victoryEl = document.getElementById("victory-line");
  const newGameBtn = document.getElementById("new-game-btn");
  const endTurnBtn = document.getElementById("end-turn-btn");

  let state = null;
  let selectedUnitId = null;

  function isHumanTurn() {
    return state.players[state.currentPlayerIndex].id === "rome";
  }

  function getUnitsAt(q, r) {
    return Object.values(state.map.units).filter((u) => u.position.q === q && u.position.r === r);
  }

  function getCityAt(q, r) {
    return Object.values(state.map.cities).find((c) => c.position.q === q && c.position.r === r) || null;
  }

  function apply(action) {
    try {
      state = engine.applyAction(state, action);
      selectedUnitId = null;
      render();
      runAiUntilHuman();
    } catch (err) {
      console.error(err);
    }
  }

  function runAiUntilHuman() {
    while (state.players[state.currentPlayerIndex].id !== "rome") {
      const active = state.players[state.currentPlayerIndex].id;
      const result = engine.runAiTurn(state, active, 8);
      state = result.state;
      const victory = engine.getVictoryStatus(state);
      if (victory.winnerId) break;
    }
    render();
  }

  function onTileClick(q, r) {
    if (!isHumanTurn()) return;

    const clickedUnits = getUnitsAt(q, r);
    const clickedCity = getCityAt(q, r);

    if (!selectedUnitId) {
      const ownUnit = clickedUnits.find((u) => u.ownerId === "rome");
      if (ownUnit) {
        selectedUnitId = ownUnit.id;
        render();
      }
      return;
    }

    const selected = state.map.units[selectedUnitId];
    if (!selected) {
      selectedUnitId = null;
      render();
      return;
    }

    const enemyUnit = clickedUnits.find((u) => u.ownerId !== "rome");
    if (enemyUnit) {
      apply({ type: "ATTACK", playerId: "rome", attackerId: selected.id, defenderId: enemyUnit.id });
      return;
    }

    if (clickedCity && clickedCity.ownerId !== "rome") {
      apply({ type: "ATTACK_CITY", playerId: "rome", attackerId: selected.id, cityId: clickedCity.id });
      return;
    }

    apply({
      type: "MOVE_UNIT",
      playerId: "rome",
      unitId: selected.id,
      destination: { q, r }
    });
  }

  function renderTile(q, r) {
    const key = q + "," + r;
    const tile = state.map.tiles[key];
    const units = getUnitsAt(q, r);
    const city = getCityAt(q, r);

    const btn = document.createElement("button");
    btn.className = "tile terrain-" + tile.terrain;
    btn.dataset.key = key;

    if (selectedUnitId) {
      const selected = state.map.units[selectedUnitId];
      if (selected && selected.position.q === q && selected.position.r === r) {
        btn.classList.add("selected");
      }
    }

    const lines = [];
    lines.push("(" + q + "," + r + ")");
    if (city) {
      lines.push("City: " + city.id + " HP " + city.hp);
      btn.classList.add("owner-" + city.ownerId);
    }
    if (units.length > 0) {
      for (const u of units) {
        lines.push(u.ownerId + " " + u.type + " HP " + u.hp);
      }
      btn.classList.add("owner-" + units[0].ownerId);
    }

    btn.textContent = lines.join(" | ");
    btn.addEventListener("click", function () {
      onTileClick(q, r);
    });

    return btn;
  }

  function render() {
    const current = state.players[state.currentPlayerIndex];
    const victory = engine.getVictoryStatus(state);

    statusEl.textContent =
      "Turn " +
      state.turn +
      " | Active: " +
      current.id +
      " | Rome cities " +
      state.playersById.rome.cityIds.length +
      " | Carthage cities " +
      state.playersById.carthage.cityIds.length;

    victoryEl.textContent = victory.winnerId
      ? "Victory: " + victory.type + " by " + victory.winnerId
      : "No winner yet.";

    boardEl.innerHTML = "";
    for (let r = 0; r < state.map.height; r += 1) {
      for (let q = 0; q < state.map.width; q += 1) {
        boardEl.appendChild(renderTile(q, r));
      }
    }

    endTurnBtn.disabled = !isHumanTurn() || Boolean(victory.winnerId);
  }

  function newGame() {
    const scenario = engine.loadScenario("italia");
    state = engine.createInitialGameState(scenario.config);
    selectedUnitId = null;
    render();
  }

  newGameBtn.addEventListener("click", newGame);
  endTurnBtn.addEventListener("click", function () {
    if (!isHumanTurn()) return;
    apply({ type: "END_TURN", playerId: "rome" });
  });

  newGame();
})();
