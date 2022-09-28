import { MongoClient } from 'mongodb';
import { Lobby, Player } from './types';

const uri = 'mongodb+srv://dcolgin:JvGf3usAW6VQqNQR@sub-strategies.6hi08ft.mongodb.net/test';

const client = new MongoClient(uri);
let lobbies: any = null;

export const connect = async () => {
  try {
    console.log('connecting...');
    await client.connect();

    const database = client.db('sub-strategies');
    lobbies = database.collection('lobbies');
    console.log('Connected to db!');
  } catch (error) {
    console.log(error);
  }
};

// eslint-disable-next-line max-len
export const fetchLobby = async (lobbyId: string): Promise<Lobby> => lobbies.findOne({ id: lobbyId });

export const createLobby = async (lobby: Lobby) => {
  const foundLobby = await fetchLobby(lobby.id);
  if (!foundLobby) {
    await lobbies.insertOne(lobby);
  } else {
    console.log(`Unable to create db with id: ${lobby.id}. Already exists`);
  }
};

export const fetchPlayerById = async (lobbyId: string, playerId: string): Promise<Player | undefined> => lobbies.findOne({ id: lobbyId, players: { id: playerId } });

export const fetchPlayerByName = async (lobbyId: string, playerName: string): Promise<Player | undefined> => lobbies.findOne({ id: lobbyId, players: { name: playerName } });

// eslint-disable-next-line max-len
export const updateLobby = async (lobbyId: string, updatedLobby: Lobby) => lobbies.replaceOne({ id: lobbyId }, updatedLobby);

export const addPlayerToLobby = async (lobbyId: string, player: Player) => {
  // lobbies.updateOne({ id: lobbyId }, { players: { $push: player } });

  const lobby = await fetchLobby(lobbyId);

  if (!lobby) {
    throw new Error('Unable to find lobby with id');
  }

  lobby.players.push(player);

  await updateLobby(lobbyId, lobby);
};

export const removeLobby = async (lobbyId: string) => {
  await lobbies.deleteOne({ id: lobbyId });
};
