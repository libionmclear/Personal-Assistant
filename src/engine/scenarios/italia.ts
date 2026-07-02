import type { CreateGameConfig } from "../types";

export const italiaScenario: CreateGameConfig = {
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
