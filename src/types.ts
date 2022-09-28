export type Position = [number, number];

export type Lobby = {
  id: string;
  currentDay: number;
  isStarted: boolean;
  players: Player[];
  bounds: [number, number];
  backups: Omit<Lobby, 'backups'>[];
  history: string[];
  weapons: {
    mines: Mine[]
    torpedoes: Torpedo[]
  }
};

export type KnowledgeEntry = { entity: string, location: Position };

export enum Action {
  Scan = 'scan',
  DetonateMine = 'detonateMine',
  PlaceMine = 'placeMine',
  FireTorpedo = 'torpedo',
  Evade = 'evade',
  Move = 'move',
  Crash = 'crash',
  NoAction = 'noAction',
}

export type ActionPlan = {
  type: Action,
  targetSpace: Position,
};

export const actionCostMap: Record<Action, number> = {
  scan: 1,
  detonateMine: 0,
  placeMine: 1,
  torpedo: 3,
  evade: 3,
  move: 0,
  crash: 0,
  noAction: 0,
};

export enum Heading {
  North = 'north',
  NorthEast = 'northEast',
  East = 'east',
  SouthEast = 'southEast',
  South = 'south',
  SouthWest = 'southWest',
  West = 'west',
  NorthWest = 'northWest',
}

export type Player = {
  id: string,
  name: string,
  supply: number,
  alive: boolean,
  position: [number, number],
  health: number,
  kills: number,
  heading: Heading,
  history: Position[],
  fullHistory: Position[],
  knowledge: Record<number, KnowledgeEntry[]>
  actionPlan: ActionPlan[]
};

export enum WeaponType {
  Mine = 'mine',
  Torpedo = 'torpedo',
}

type Weapon = {
  owner: string,
  position: Position,
};

export type Mine = Weapon;

export type Torpedo = Weapon & {
  heading: Heading,
};
