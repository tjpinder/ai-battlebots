import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { TableClient, TableServiceClient } from '@azure/data-tables';
import { v4 as uuidv4 } from 'uuid';
import { runHeadlessBattle, BotConfig, BattleResult } from '../battle/simulator';

interface QueueBattleRequest {
  playerBot: BotConfig;
  opponentType: 'random' | 'specific';
  opponentBot?: BotConfig;
  arenaId: string;
}

// Predefined opponent bots for "random" battles
const RANDOM_OPPONENTS: BotConfig[] = [
  {
    id: 'ai-spinner',
    name: 'Spin Master',
    chassisId: 'brawler',
    weaponIds: ['miniSpinner', 'miniSpinner'],
    armorId: null,
    aiConfig: { primaryBehavior: 'aggressive', secondaryBehavior: 'ram', aggression: 75, engagementDistance: 80 },
    color: '#ff4444',
    script: `WHEN distance_to_enemy < 100 DO attack
WHEN my_hp_percent < 30 DO retreat
DEFAULT attack`,
  },
  {
    id: 'ai-tank',
    name: 'Iron Wall',
    chassisId: 'tank',
    weaponIds: ['basicWedge', 'spikeHammer'],
    armorId: 'steelPlating',
    aiConfig: { primaryBehavior: 'defensive', secondaryBehavior: 'reactive', aggression: 30, engagementDistance: 120 },
    color: '#888888',
    script: `WHEN my_hp_percent < 20 DO retreat
WHEN enemy_hp_percent < 30 DO attack
WHEN distance_to_enemy < 80 DO circle_left
DEFAULT approach`,
  },
  {
    id: 'ai-speed',
    name: 'Lightning',
    chassisId: 'scout',
    weaponIds: ['basicFlipper'],
    armorId: null,
    aiConfig: { primaryBehavior: 'flanker', secondaryBehavior: 'aggressive', aggression: 90, engagementDistance: 60 },
    color: '#ffff44',
    script: `WHEN i_am_faster DO circle_right
WHEN distance_to_enemy < 60 DO attack
WHEN my_hp_percent < 25 DO flee_to_center
DEFAULT flank`,
  },
  {
    id: 'ai-hammer',
    name: 'Crusher',
    chassisId: 'brawler',
    weaponIds: ['spikeHammer', 'basicWedge'],
    armorId: 'compositePlating',
    aiConfig: { primaryBehavior: 'ram', secondaryBehavior: 'aggressive', aggression: 80, engagementDistance: 100 },
    color: '#ff8844',
    script: `WHEN i_am_heavier DO ram
WHEN distance_to_enemy < 80 DO attack
WHEN my_hp_percent < 15 DO retreat
DEFAULT approach`,
  },
  {
    id: 'ai-flanker',
    name: 'Shadow',
    chassisId: 'scout',
    weaponIds: ['miniSpinner'],
    armorId: 'lightPlating',
    aiConfig: { primaryBehavior: 'flanker', secondaryBehavior: 'defensive', aggression: 60, engagementDistance: 100 },
    color: '#8844ff',
    script: `WHEN distance_to_enemy < 60 DO attack
WHEN distance_to_enemy < 150 DO flank
WHEN my_hp_percent < 25 DO retreat
DEFAULT circle_right`,
  },
];

function getTableClient(): TableClient {
  const connectionString = process.env.STORAGE_CONNECTION_STRING || 'UseDevelopmentStorage=true';
  return TableClient.fromConnectionString(connectionString, 'battles');
}

async function ensureTableExists(): Promise<void> {
  const connectionString = process.env.STORAGE_CONNECTION_STRING || 'UseDevelopmentStorage=true';
  const serviceClient = TableServiceClient.fromConnectionString(connectionString);
  try {
    await serviceClient.createTable('battles');
  } catch (e: any) {
    if (e.statusCode !== 409) {
      throw e;
    }
  }
}

export async function queueBattle(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Queue battle request received');

  try {
    const body = await request.json() as QueueBattleRequest;

    if (!body.playerBot || !body.arenaId) {
      return {
        status: 400,
        jsonBody: { error: 'Missing playerBot or arenaId' },
      };
    }

    // Select opponent
    let opponentBot: BotConfig;
    if (body.opponentType === 'specific' && body.opponentBot) {
      opponentBot = body.opponentBot;
    } else {
      opponentBot = RANDOM_OPPONENTS[Math.floor(Math.random() * RANDOM_OPPONENTS.length)];
    }

    const battleId = uuidv4();
    const now = new Date().toISOString();

    // Run the battle simulation immediately (fast, < 1 second)
    context.log('Running battle simulation...');
    let result: BattleResult;
    try {
      result = runHeadlessBattle(body.playerBot, opponentBot, body.arenaId);
      context.log(`Battle completed: winner=${result.winner}, duration=${result.duration}ms`);
    } catch (simError: any) {
      context.error('Battle simulation error:', simError);
      return {
        status: 500,
        jsonBody: { error: 'Battle simulation failed', details: simError.message },
      };
    }

    // Store the completed battle
    await ensureTableExists();
    const tableClient = getTableClient();

    const entity = {
      partitionKey: 'battle',
      rowKey: battleId,
      status: 'completed',
      playerBot: JSON.stringify(body.playerBot),
      opponentBot: JSON.stringify(opponentBot),
      arenaId: body.arenaId,
      result: JSON.stringify(result),
      createdAt: now,
      completedAt: new Date().toISOString(),
    };

    await tableClient.createEntity(entity);

    // Determine if player won
    const playerWon = result.winner === body.playerBot.id;

    return {
      status: 200,
      jsonBody: {
        battleId,
        status: 'completed',
        playerBot: {
          id: body.playerBot.id,
          name: body.playerBot.name,
          color: body.playerBot.color,
        },
        opponentBot: {
          id: opponentBot.id,
          name: opponentBot.name,
          color: opponentBot.color,
        },
        arenaId: body.arenaId,
        result: {
          winner: result.winner,
          winnerName: playerWon ? body.playerBot.name : opponentBot.name,
          playerWon,
          duration: result.duration,
          frameCount: result.frameCount,
          finalStates: result.finalStates,
          commentary: result.commentary,
        },
        createdAt: now,
        completedAt: entity.completedAt,
      },
    };
  } catch (error: any) {
    context.error('Error processing battle:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to process battle', details: error.message },
    };
  }
}

app.http('queueBattle', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'battles',
  handler: queueBattle,
});
