import {
  addPlayerToLobby,
  fetchLobby,
  fetchPlayerById,
  fetchPlayerByName,
  updateLobby,
} from './database';
import {
  Action,
  actionCostMap,
  ActionPlan,
  Heading,
  Lobby,
  Player,
  Position,
} from './types';
import { deepCloneLobby, getEntitiesInRange, manhattanDistance } from './utilities';
import {
  detonateMine, evade, fireTorpedo, move, placeMine, scan,
} from './actions';

export const getGamestate = (lobbyId: string, playerId: string): any => {
  // fetch lobby

  // fetch player

  // calculate visibility

  // find destroyer and items in visible spaces
};

export const isValidID = async (lobbyId: string, playerId: string): Promise<boolean> => {
  const player = await fetchPlayerById(lobbyId, playerId);
  return !!player;
};

const createPlayerHelper = (playerId: string, playerName: string): Player => ({
  alive: true,
  health: 0,
  id: playerId,
  kills: 0,
  name: playerName,
  position: [0, 0],
  supply: 0,
  heading: Heading.East,
  history: [],
  fullHistory: [],
  knowledge: {},
  actionPlan: [],
});

export const registerPlayer = async (
  lobbyId: string,
  playerId: string,
  name: string,
) => {
  const newPlayer = createPlayerHelper(playerId, name);

  await addPlayerToLobby(lobbyId, newPlayer);
};

export const isNameTaken = async (
  lobbyId: string,
  name: string,
): Promise<boolean> => Boolean(await fetchPlayerByName(lobbyId, name));

export const restoreFromBackup = (lobbyId: string, time: string) => {

};

export const updateUserState = (lobbyId: string, userId: string, userState: any) => {

};

export const removeUser = (lobbyId: string, userId: string) => {
};

export const getUserByName = async (
  lobbyId: string,
  name: string,
): Promise<Player | undefined> => fetchPlayerByName(lobbyId, name);

export const isValidAction = async (
  lobby: Lobby,
  action: Action,
  actingPlayerId: string,
  targetSpace: Position | 'random',
): Promise<boolean> => {
  if (action === Action.NoAction) {
    return true;
  }

  // can only target random if moving
  if (targetSpace === 'random') {
    return action === Action.Move;
  }

  // attempting to do valid action
  const actionCost = actionCostMap[action];

  // target is within bounds
  if (targetSpace[0] > lobby.bounds[0] || targetSpace[1] > lobby.bounds[1]) {
    throw new Error('Target is outside bounds');
  }

  const actingPlayer = lobby.players.find((player) => player.id === actingPlayerId);

  if (!actingPlayer) {
    throw new Error('Unable to find player for action');
  }
  if (actingPlayer.supply < actionCost) {
    return false;
  }

  const distancePlayerToTarget = manhattanDistance(actingPlayer.position, targetSpace, lobby.bounds);

  // target space is valid given action
  const {
    torpedoes,
    mines,
  } = getEntitiesInRange(lobby, targetSpace);

  switch (action) {
    case Action.Move:
      if (distancePlayerToTarget > 1) {
        return false;
      }

      if (actingPlayer.history.find((position) => position === targetSpace)) {
        return false;
      }
      break;
    case Action.Evade:
      // Can target space up to 3 away from current position
      if (distancePlayerToTarget > 3) {
        return false;
      }
      break;
    case Action.DetonateMine:
      // Can target any space
      break;
    case Action.FireTorpedo:
      if (distancePlayerToTarget > 1
                || torpedoes.find((torpedo) => torpedo.owner === actingPlayer.id)) {
        return false;
      }
      break;
    case Action.PlaceMine:
      // Can only place one tile away, where there isn't a mine already
      if (distancePlayerToTarget > 1
                || mines.find((mine) => mine.owner === actingPlayer.id)) {
        return false;
      }
      break;
    case Action.Scan:
      // No restriction, can target anywhere
      break;
    default:
      console.log('Encountered unexpected action type: ', action);
      break;
  }

  return true;
};

export const executeAction = (
  lobby: Lobby,
  actionPlan: ActionPlan,
  actingPlayerId: string,
): Lobby => {
  const {
    targetSpace,
    type: action,
  } = actionPlan;
  const actingPlayer = lobby.players.find((player) => player.id === actingPlayerId);
  let lobbyCopy = lobby;

  if (!actingPlayer) {
    console.error('Unable to find player while executing action: ', actingPlayerId);
    return lobbyCopy;
  }

  switch (action) {
    case Action.Scan:
      lobbyCopy = scan(lobby, actingPlayerId, targetSpace);

      break;
    case Action.DetonateMine:
      lobbyCopy = detonateMine(lobby, actingPlayerId, targetSpace);

      break;
    case Action.PlaceMine:
      lobbyCopy = placeMine(lobby, actingPlayerId, targetSpace);

      break;
    case Action.FireTorpedo:
      lobbyCopy = fireTorpedo(lobby, actingPlayerId, targetSpace);

      break;
    case Action.Evade:
      lobbyCopy = evade(lobby, actingPlayerId, targetSpace);

      break;
    case Action.Move:
      lobbyCopy = move(lobby, actingPlayerId, targetSpace);

      break;
    case Action.Crash:
      console.log('CRASH!');
      break;
    case Action.NoAction:
      break;
    default:
      console.log('Attempted to execute unknown action type: ', action);
  }

  return lobbyCopy;
};

function generateRandomID() {
  return 'testPlayer';
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 5; i += 1) {
    result += characters.charAt(Math.floor(Math.random()
                                                   * charactersLength));
  }
  return result;
}

export const generateId = async (lobbyId: string) => {
  let randomId = generateRandomID();

  let isValidId = await fetchPlayerById(lobbyId, randomId);

  while (isValidId) {
    randomId = generateRandomID();
    // eslint-disable-next-line no-await-in-loop
    isValidId = await fetchPlayerById(lobbyId, randomId);
  }

  return randomId;
};

export const isValidActionPlan = (
  lobby: Lobby,
  actingPlayerId: string,
  firstAction: ActionPlan,
  secondAction: ActionPlan,
) => {
  const isFirstActionValid = isValidAction(lobby, firstAction.type, actingPlayerId, firstAction.targetSpace);

  if (!isFirstActionValid) {
    return false;
  }

  const updatedLobby = executeAction(lobby, firstAction, actingPlayerId);

  return isValidAction(updatedLobby, secondAction.type, actingPlayerId, secondAction.targetSpace);
};

export const isValidActionPlanFromId = async (
  lobbyId: string,
  actingPlayerId: string,
  firstAction: ActionPlan,
  secondAction: ActionPlan,
) => {
  const lobby = await fetchLobby(lobbyId);

  return isValidActionPlan(lobby, actingPlayerId, firstAction, secondAction);
};

export const planActions = async (
  lobbyId: string,
  actingPlayerId: string,
  firstAction: ActionPlan,
  secondAction: ActionPlan,
) => {
  const lobby = await fetchLobby(lobbyId);

  if (isValidActionPlan(lobby, actingPlayerId, firstAction, secondAction)) {
    const actingPlayer = lobby.players.find((player) => player.id === actingPlayerId);

    if (!actingPlayer) {
      console.error('Unable find player to plan actions for actor: ', actingPlayerId);

      return;
    }

    actingPlayer.actionPlan = [firstAction, secondAction];

    await updateLobby(lobbyId, lobby);
  }
};

const crashAction: ActionPlan = {
  type: Action.Crash,
  targetSpace: [0, 0],
};
const crashFirstActionPlan: [ActionPlan, ActionPlan] = [crashAction, {
  type: Action.NoAction,
  targetSpace: [0, 0],
}];

export const executeActionPlans = async (lobbyId: string): Promise<Lobby> => {
  const lobby = await fetchLobby(lobbyId);
  let plannedLobby = deepCloneLobby(lobby);
  const playerIds = lobby.players.map((player) => player.id);

  // calc the end move for all players' first action
  let endPositionMap: Record<string, string> = {};

  // if any collisions, change move to 'crash', change second move to 'no action'
  playerIds.forEach((playerId) => {
    const player = plannedLobby.players.find((pl) => pl.id === playerId);

    if (!player) {
      console.error('Unable to find player while executing first action');

      return;
    }
    let endPositionHash = '';
    if (player.actionPlan[0].type === Action.Move) {
      endPositionHash = JSON.stringify(player.actionPlan[0].targetSpace);
    } else {
      endPositionHash = JSON.stringify(player.position);
    }

    if (!endPositionMap[endPositionHash]) {
      endPositionMap[endPositionHash] = player.id;
    } else {
      const conflictingPlayer = plannedLobby.players.find((pl) => pl.id
                === endPositionMap[endPositionHash]);

      if (!conflictingPlayer) {
        console.error('Could not find player with matching end action on first action, when it should have');
        return;
      }
      // Update both players actions

      conflictingPlayer.actionPlan = crashFirstActionPlan;
      player.actionPlan = crashFirstActionPlan;
    }
  });

  // execute first action

  plannedLobby.players.forEach((player) => {
    plannedLobby = executeAction(plannedLobby, player.actionPlan[0], player.id);
  });

  // calc end move of second action for all players

  endPositionMap = {};

  playerIds.forEach((playerId) => {
    const player = plannedLobby.players.find((pl) => pl.id === playerId);

    if (!player) {
      console.error('Unable to find player while executing second action');

      return;
    }

    let endPositionHash = '';
    if (player.actionPlan[1].type === Action.Move) {
      endPositionHash = JSON.stringify(player.actionPlan[1].targetSpace);
    } else {
      endPositionHash = JSON.stringify(player.position);
    }

    // if any collisions, change second action to crash
    if (!endPositionMap[endPositionHash]) {
      endPositionMap[endPositionHash] = player.id;
    } else {
      const conflictingPlayer = plannedLobby.players.find((pl) => pl.id
                === endPositionMap[endPositionHash]);
      const playerB = plannedLobby.players.find((pl) => pl.id === player.id);

      if (!conflictingPlayer || !playerB) {
        console.error('Could not find player with matching end action on first action, when it should have');
        return;
      }
      // Update both players actions

      conflictingPlayer.actionPlan[1] = crashAction;
      playerB.actionPlan[1] = crashAction;
    }
  });

  // execute second action
  plannedLobby.players.forEach((player) => {
    plannedLobby = executeAction(plannedLobby, player.actionPlan[1], player.id);
  });

  // update lobby day, clear action plans

  plannedLobby.currentDay += 1;

  return plannedLobby;
};
