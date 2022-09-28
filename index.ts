import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import {
  connect, createLobby, fetchLobby, fetchPlayerById, removeLobby, updateLobby,
} from './src/database';
import { Player } from './src/types';
import addRoutes from "./src/routeManager";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static('public'));

addRoutes(app);

app.listen(3000, () => console.log('server started'));


const dbTest = async () => {
  await connect();

  await removeLobby('test')

  await createLobby({
    currentDay: 0,
    backups: [],
    bounds: [15, 15],
    history: [],
    id: 'test',
    isStarted: false,
    players: [],
    weapons: {
      mines: [],
      torpedoes: [],
    }
  });

  const foundLobby = await fetchLobby('test');
  console.log(foundLobby);

  let foundPlayer = await fetchPlayerById('test', 'playerId');
  console.log(foundPlayer);

  // await updateLobby('test', {
  //   backups: [],
  //   bounds: [0, 0],
  //   history: [],
  //   id: 'test',
  //   currentDay: 0,
  //   isStarted: true,
  //   players: [{ id: 'playerIdadad' } as Player],
  //   weapons: {
  //     mines: [],
  //     torpedoes: [],
  //   }
  // });

  foundPlayer = await fetchPlayerById('test', 'playerIdadad');
  console.log(foundPlayer);
};

dbTest();
