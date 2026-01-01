import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { TableClient } from '@azure/data-tables';

function getTableClient(): TableClient {
  const connectionString = process.env.STORAGE_CONNECTION_STRING || 'UseDevelopmentStorage=true';
  return TableClient.fromConnectionString(connectionString, 'battles');
}

export async function getBattle(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const battleId = request.params.id;

  if (!battleId) {
    return {
      status: 400,
      jsonBody: { error: 'Missing battle ID' },
    };
  }

  try {
    const tableClient = getTableClient();
    const entity = await tableClient.getEntity('battle', battleId);

    const response: any = {
      battleId: entity.rowKey,
      status: entity.status,
      playerBot: JSON.parse(entity.playerBot as string),
      opponentBot: JSON.parse(entity.opponentBot as string),
      arenaId: entity.arenaId,
      createdAt: entity.createdAt,
    };

    if (entity.result) {
      response.result = JSON.parse(entity.result as string);
    }

    if (entity.completedAt) {
      response.completedAt = entity.completedAt;
    }

    return {
      status: 200,
      jsonBody: response,
    };
  } catch (error: any) {
    if (error.statusCode === 404) {
      return {
        status: 404,
        jsonBody: { error: 'Battle not found' },
      };
    }
    context.error('Error getting battle:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to get battle', details: error.message },
    };
  }
}

app.http('getBattle', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'battles/{id}',
  handler: getBattle,
});
