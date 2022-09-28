import {
  Heading, Lobby, Player, Position,
} from './types';

export const manhattanDistance = (position1: Position, position2: Position, bounds: Position) => (Math.abs(position1[0] - position2[0]) % bounds[0]) + (Math.abs(position1[1] - position2[1]) % bounds[1]);

const getAdjacentPositions = (bounds: Position, targetSpace: Position): Position[] => {
  const modifiers = [-1, 1];

  const generatedMoves: Position[] = [];

  modifiers.forEach((modifierX) => {
    modifiers.forEach((modifierY) => {
      const adjustedX = (targetSpace[0] + modifierX) % bounds[0];
      const adjustedY = (targetSpace[1] + modifierY) % bounds[1];

      generatedMoves.push([adjustedX, adjustedY]);
    });
  });

  return generatedMoves;
};

export const generateRandomMove = (lobby: Lobby, player: Player): Position => {
  const currentPlayerPosition = player.position;

  const possibleMoves = getAdjacentPositions(lobby.bounds, currentPlayerPosition);

  const movesNotOnPath = possibleMoves.filter((possMove) => !player.history.find((historyMove) => historyMove === possMove));

  const randomIndex = Math.floor(Math.random() * movesNotOnPath.length);
  return movesNotOnPath[randomIndex];
};

const headingMap: Record<string, Heading> = {
  '-1-1': Heading.SouthWest,
  '-10': Heading.West,
  '-11': Heading.NorthWest,
  '01': Heading.North,
  11: Heading.NorthEast,
  10: Heading.East,
  '1-1': Heading.SouthEast,
  '0-1': Heading.South,
};

export const getHeading = (startingPosition: Position, targetPosition: Position): Heading => {
  const xDif = targetPosition[0] - startingPosition[0] / Math.abs(targetPosition[0] - startingPosition[0]);
  const yDif = targetPosition[1] - startingPosition[1] / Math.abs(targetPosition[1] - startingPosition[1]);

  return headingMap[`${xDif}${yDif}`];
};

export const deepCloneLobby = (lobby: Lobby): Lobby => JSON.parse(JSON.stringify(lobby));

export const findPlayerInLobby = (lobby: Lobby, playerId: string): Player | undefined => lobby.players.find((player) => player.id === playerId);

export const handlePlayerDamage = (lobby: Lobby, playerId: string, damage: number): Lobby => {
  const lobbyCopy = deepCloneLobby(lobby);
  const player = findPlayerInLobby(lobby, playerId);

  if (!player) {
    console.error('Unable to find player to give damage: ', playerId);
    return lobbyCopy;
  }

  if (!player.alive) {
    return lobbyCopy;
  }

  // reduce health
  player.health -= Math.max(damage, 0);

  // handle player elimination
  if (player.health <= 0) {
    player.alive = false;
  }

  // reset path
  player.history = [];

  return lobbyCopy;
};

export const getEntitiesInRange = (lobby: Lobby, targetSpace: Position, range: number = 0) => {
  const torpedoes = lobby.weapons.torpedoes.filter((weapon) => manhattanDistance(weapon.position, targetSpace, lobby.bounds) <= range);
  const mines = lobby.weapons.mines.filter((mine) => manhattanDistance(mine.position, targetSpace, lobby.bounds) <= range);

  const players = lobby.players.filter((player) => manhattanDistance(player.position, targetSpace, lobby.bounds) <= range);
  return {
    torpedoes,
    players,
    mines,
  };
};
