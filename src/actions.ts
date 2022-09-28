import {
  KnowledgeEntry, Lobby, Mine, Player, Position, Torpedo, WeaponType,
} from './types';
import {
  deepCloneLobby, findPlayerInLobby, getEntitiesInRange, getHeading, handlePlayerDamage,
} from './utilities';

export const placeMine = (lobby: Lobby, actingPlayerId: string, targetSpace: Position): Lobby => {
  const lobbyCopy = deepCloneLobby(lobby);
  const actingPlayer = findPlayerInLobby(lobby, actingPlayerId);

  if (!actingPlayer) {
    console.error('Unable to place mine for player: ', actingPlayerId);
    return lobbyCopy;
  }

  // create mine
  const mine: Mine = { owner: actingPlayer.id, position: targetSpace };

  // update player knowledge and lobby
  lobbyCopy.weapons.mines.push(mine);

  actingPlayer.knowledge[lobbyCopy.currentDay].push({ entity: WeaponType.Mine, location: targetSpace });

  return lobbyCopy;
};

export const detonateMine = (lobby: Lobby, actingPlayerId: string, targetSpace: Position): Lobby => {
  let lobbyCopy = deepCloneLobby(lobby);
  const actingPlayer = findPlayerInLobby(lobby, actingPlayerId);

  if (!actingPlayer) {
    console.error('Unable to find player to detonate mine: ', actingPlayerId);
    return lobbyCopy;
  }

  const detonatedMine = lobbyCopy.weapons.mines.find((mine) => mine.owner === actingPlayer.id && targetSpace === mine.position);

  if (!detonatedMine) {
    console.error('Unable to find mine to detonate ', actingPlayer.name, ' ', targetSpace);
  }

  const { mines, players, torpedoes } = getEntitiesInRange(lobbyCopy, targetSpace, 1);

  // if any torpedoes, destroy
  lobbyCopy.weapons.torpedoes = lobbyCopy.weapons.torpedoes.filter((torpedo) => !torpedoes.find((tor) => tor.position === torpedo.position));

  // if any players, deal damage
  players.forEach((player) => {
    const damage = player.position === targetSpace ? 2 : 1;
    lobbyCopy = handlePlayerDamage(lobby, actingPlayerId, damage);
  });

  // if any mines in range, detonate
  mines.forEach((mine) => {
    lobbyCopy = detonateMine(lobbyCopy, actingPlayerId, mine.position);
  });

  return lobbyCopy;
};

export const scan = (lobby: Lobby, actingPlayerId: string, targetSpace: Position): Lobby => {
  const lobbyCopy = deepCloneLobby(lobby);
  const actingPlayer = findPlayerInLobby(lobby, actingPlayerId);

  if (!actingPlayer) {
    console.error('Unable to find player to scan with: ', actingPlayerId);
    return lobbyCopy;
  }

  const { mines, players, torpedoes } = getEntitiesInRange(lobbyCopy, targetSpace, 1);

  const currendDay = lobbyCopy.currentDay;

  const knowledgeEntries: KnowledgeEntry[] = [];

  mines.forEach((mine) => {
    if (mine.owner !== actingPlayer.id) {
      knowledgeEntries.push({ entity: WeaponType.Mine, location: mine.position });
    }
  });

  players.forEach((player) => {
    if (player.id !== actingPlayer.id) {
      knowledgeEntries.push({ entity: player.id, location: player.position });
    }
  });

  torpedoes.forEach((torpedo) => {
    if (torpedo.owner !== actingPlayer.id) {
      knowledgeEntries.push({ entity: WeaponType.Torpedo, location: torpedo.position });
    }
  });

  actingPlayer.knowledge[currendDay].push(...knowledgeEntries);

  return lobbyCopy;
};

export const fireTorpedo = (lobby: Lobby, actingPlayerId: string, targetSpace: Position): Lobby => {
  const lobbyCopy = deepCloneLobby(lobby);
  const actingPlayer = findPlayerInLobby(lobby, actingPlayerId);

  if (!actingPlayer) {
    console.error('Unable to find player to scan with: ', actingPlayerId);
    return lobbyCopy;
  }

  // create torpedo
  const torpedoHeading = getHeading(actingPlayer.position, targetSpace);
  const torpedo: Torpedo = { owner: actingPlayer.id, position: targetSpace, heading: torpedoHeading };

  // update player knowledge and lobby
  lobbyCopy.weapons.torpedoes.push(torpedo);

  actingPlayer.knowledge[lobbyCopy.currentDay].push({ entity: WeaponType.Torpedo, location: targetSpace });

  return lobbyCopy;
};

export const evade = (lobby: Lobby, actingPlayerId: string, targetSpace: Position): Lobby => {
  const lobbyCopy = deepCloneLobby(lobby);
  const actingPlayer = findPlayerInLobby(lobby, actingPlayerId);

  if (!actingPlayer) {
    console.error('Unable to find player for evade: ', actingPlayerId);
    return lobbyCopy;
  }
  actingPlayer.history.push(actingPlayer.position);

  actingPlayer.heading = getHeading(actingPlayer.position, targetSpace);
  actingPlayer.position = targetSpace;

  return lobbyCopy;
};

export const move = (lobby: Lobby, actingPlayerId: string, targetSpace: Position): Lobby => {
  const lobbyCopy = deepCloneLobby(lobby);
  const actingPlayer = findPlayerInLobby(lobbyCopy, actingPlayerId);

  if (!actingPlayer) {
    console.error('Unable to find player for move: ', actingPlayerId);
    return lobbyCopy;
  }

  actingPlayer.history.push(actingPlayer.position);

  actingPlayer.heading = getHeading(actingPlayer.position, targetSpace);
  actingPlayer.position = targetSpace;

  return lobbyCopy;
};
