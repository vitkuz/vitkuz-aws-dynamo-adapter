import { GetCommand, GetCommandInput, GetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DynamoContext, BaseItem } from '../types';

export interface GetOneInput {
    tableName: string;
    item: {
        pk: string;
        sk?: string;
    };
}

export const getOne =
    (context: DynamoContext) =>
    async <T extends BaseItem>(input: GetOneInput): Promise<T | undefined> => {
        const { client, logger } = context;
        const { tableName, item } = input;
        const { pk, sk } = item;

        if (!pk || !sk) {
            throw new Error('pk and sk are required');
        }

        logger?.debug('getOne:start', { data: { tableName, pk, sk } });

        try {
            const command = new GetCommand({
                TableName: tableName,
                Key: { pk, sk },
            });
            const result = await client.send(command);
            logger?.debug('getOne:success', { data: { found: !!result.Item } });
            return result.Item as T | undefined;
        } catch (error) {
            logger?.debug('getOne:error', { error });
            throw error;
        }
    };
