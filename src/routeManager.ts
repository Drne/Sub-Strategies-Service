import {
  generateId,
  getGamestate, getUserByName,
  isNameTaken, isValidActionPlanFromId,
  isValidID,
  registerPlayer, removeUser,
  restoreFromBackup, updateUserState,
} from './stateMachine';
import { fetchLobby } from './database';

export const addRoutes = (app: any) => {
  app.get('/', (req: any, res: any) => {
    res.send('Don\'t be nosy!');
  });

  // Player info
  app.get('/api/lobby/:lobby/gameState/:id', async (req: any, res: any) => {
    const idIsValid = isValidID(req.params.lobby, req.params.id);
    if (!idIsValid) {
      res.sendStatus(404);
    } else {
      const users = getGamestate(req.params.lobby, req.params.id);
      res.send(users);
    }
  });

  // Get Lobby object
  app.get('/api/lobby/:lobby', async (req: any, res: any) => {
    const lobby = await fetchLobby(req.params.lobby);

    res.send(JSON.stringify(lobby));
  });

  // Register player
  app.put('/api/lobby/:lobby/register', async (req: any, res: any) => {
    try {
      if (req.body.key === process.env.ADMIN_KEY) {
        const playerId = await generateId(req.params.lobby);
        await registerPlayer(req.params.lobby, playerId, req.body.name);
        res.sendStatus(200);
      } else {
        res.sendStatus(401);
      }
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  });

  // check valid ID
  app.get('/api/check/:id', async (req: any, res: any) => {
    res.sendStatus(200);
    // const idIsValid = await isValidID(req.params.id);
    // if (idIsValid) {
    //   res.sendStatus(200);
    // } else {
    //   res.sendStatus(404);
    // }
  });

  // check if name is taken
  app.get('/api/nameCheck/lobby/:lobby/name/:name', async (req: any, res: any) => {
    try {
      if (req.body.key === process.env.ADMIN_KEY) {
        const isTaken = isNameTaken(req.params.lobby, req.params.name);
        if (!isTaken) {
          res.sendStatus(200);
        } else {
          res.sendStatus(409);
        }
      } else {
        res.sendStatus(401);
      }
    } catch {
      res.sendStatus(500);
    }
  });

  // check if action plan is valid
  app.post('/api/lobby/:lobby/isValidActions', async (req: any, res: any) => {
    try {
      const lobbyId = req.params.lobby;
      const { playerId } = req.body;
      const { actionPlan } = req.body;

      const isValidActions = await isValidActionPlanFromId(lobbyId, playerId, actionPlan[0], actionPlan[1]);

      if (isValidActions) {
        res.sendStatus(200);
      } else {
        res.sendStatus(406);
      }
    } catch (error: any) {
      res.sendStatus(500);
    }
  });

  // restore backup
  app.post('/api/restoreBackup', async (req: any, res: any) => {
    try {
      if (req.body.key === process.env.ADMIN_KEY) {
        restoreFromBackup(req.body.lobbyId, req.body.time);
        res.sendStatus(200);
      } else {
        res.sendStatus(401);
      }
    } catch {
      res.sendStatus(500);
    }
  });

  // manually set player data
  app.post('/api/setUserValues', async (req: any, res: any) => {
    try {
      if (req.body.key === process.env.ADMIN_KEY) {
        updateUserState(req.body.lobbyId, req.body.userId, req.body.userData);
        res.sendStatus(200);
      } else {
        res.sendStatus(401);
      }
    } catch {
      res.sendStatus(500);
    }
  });

  // remove a player from the game
  app.post('/api/concede', async (req: any, res: any) => {
    try {
      if (req.body.key === process.env.ADMIN_KEY) {
        await removeUser(req.body.lobby, req.body.userId);
        res.sendStatus(200);
      } else {
        res.sendStatus(401);
      }
    } catch {
      res.sendStatus(500);
    }
  });

  // manually get player data
  app.get('/api/id', async (req: any, res: any) => {
    try {
      if (req.body.key === process.env.ADMIN_KEY) {
        const user = await getUserByName(req.body.lobbyId, req.body.userName);
        if (!user) {
          res.sendStatus(404);
          return;
        }

        res.send(user.id);
      } else {
        res.sendStatus(401);
      }
    } catch {
      res.sendStatus(500);
    }
  });
};

export default addRoutes;
