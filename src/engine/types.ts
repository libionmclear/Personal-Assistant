export type TerrainType =
  | "plains"
  | "valley"
  | "forest"
  | "hills"
  | "mountains"
  | "desert"
  | "coast"
  | "sea";

export type WeatherType = "clear" | "rain" | "fog" | "storm" | "heat";

export type DomainType = "land" | "naval" | "civilian";
export type Veterancy = "recruit" | "veteran" | "elite";

export interface Coord {
  q: number;
  r: number;
}

export interface Tile {
  terrain: TerrainType;
  region: string;
}

export interface TerrainRule {
  moveCost: number;
  yields: { food: number; production: number; gold: number };
  defense: number;
  vision: number;
  impassableWithoutTech?: string;
  navalOnly?: boolean;
  requiresTech?: string;
}

export interface UnitRule {
  domain: DomainType;
  movement: number;
  attack: number;
  defense: number;
  maxHp: number;
  range: number;
  upkeep: number;
  mounted?: boolean;
}

export interface TechRule {
  age: 1 | 2 | 3;
  prerequisites: string[];
  forkGroup?: string;
  forkBranch?: string;
}

export interface Unit {
  id: string;
  type: string;
  ownerId: string;
  position: Coord;
  hp: number;
  maxHp: number;
  movementRemaining: number;
  veterancy: Veterancy;
}

export interface City {
  id: string;
  ownerId: string;
  position: Coord;
  population: number;
  hp: number;
  maxHp: number;
  isCapital?: boolean;
}

export interface Player {
  id: string;
  civ: string;
  food: number;
  production: number;
  gold: number;
  techs: string[];
  forkChoices: Record<string, string>;
  cityIds: string[];
  unitIds: string[];
}

export interface GameMap {
  width: number;
  height: number;
  tiles: Record<string, Tile>;
  rivers: Record<string, boolean>;
  regions: string[];
  cities: Record<string, City>;
  units: Record<string, Unit>;
}

export interface WeatherState {
  current: Record<string, WeatherType>;
  forecast: Record<string, WeatherType>;
}

export interface GameState {
  version: number;
  seed: string;
  turn: number;
  currentPlayerIndex: number;
  players: Player[];
  playersById: Record<string, Player>;
  map: GameMap;
  weather: WeatherState;
  actionLog: ActionLogEntry[];
}

export interface ActionLogEntry {
  turn: number;
  playerId: string;
  action: GameAction;
}

export interface MoveUnitAction {
  type: "MOVE_UNIT";
  playerId: string;
  unitId: string;
  destination: Coord;
  path?: Coord[];
}

export interface AttackAction {
  type: "ATTACK";
  playerId: string;
  attackerId: string;
  defenderId: string;
}

export interface ResearchTechAction {
  type: "RESEARCH_TECH";
  playerId: string;
  techId: string;
}

export interface ChooseForkAction {
  type: "CHOOSE_FORK";
  playerId: string;
  forkGroup: string;
  branch: string;
}

export interface EndTurnAction {
  type: "END_TURN";
  playerId: string;
}

export interface FoundCityAction {
  type: "FOUND_CITY";
  playerId: string;
  settlerId: string;
  cityId: string;
}

export interface BuildUnitAction {
  type: "BUILD_UNIT";
  playerId: string;
  cityId: string;
  unitType: string;
  unitId: string;
}

export interface AttackCityAction {
  type: "ATTACK_CITY";
  playerId: string;
  attackerId: string;
  cityId: string;
}

export type GameAction =
  | MoveUnitAction
  | AttackAction
  | ResearchTechAction
  | ChooseForkAction
  | EndTurnAction
  | FoundCityAction
  | BuildUnitAction
  | AttackCityAction;

export interface VictoryStatus {
  winnerId: string | null;
  type: "domination" | null;
  reason: string | null;
}

export interface CombatPreview {
  damageToDefender: number;
  damageToAttacker: number;
  attackerRemainingHp: number;
  defenderRemainingHp: number;
}

export interface CreateGameConfig {
  seed?: string;
  players?: Partial<Player>[];
  map?: {
    width?: number;
    height?: number;
    tiles?: Record<string, Partial<Tile>>;
    rivers?: Record<string, boolean>;
    regions?: string[];
    cities?: Record<
      string,
      Partial<City> & Pick<City, "id" | "ownerId" | "position" | "population">
    >;
    units?: Record<string, Partial<Unit> & Pick<Unit, "id" | "type" | "ownerId" | "position">>;
  };
}
