import { PutCommand, PutCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DynamoContext, BaseItem } from '../types';

export interface ReplaceOneInput<T extends BaseItem> {
    tableName: string;
    item: T;
}

export const replaceOne =
    (context: DynamoContext) =>
    async <T extends BaseItem>(input: ReplaceOneInput<T>): Promise<PutCommandOutput> => {
        const { client, logger } = context;
        const { tableName, item } = input;

        if (item.id !== item.pk) {
            throw new Error(`Item id (${item.id}) must match pk (${item.pk})`);
        }

        if (!item.pk || !item.sk) {
            throw new Error('pk and sk are required');
        }

        logger?.debug('replaceOne:start', { data: { tableName, pk: item.pk, sk: item.sk } });

        try {
            const command = new PutCommand({
                TableName: tableName,
                Item: item,
            });
            const result = await client.send(command);
            logger?.debug('replaceOne:success');
            return result;
        } catch (error) {
            logger?.debug('replaceOne:error', { error });
            throw error;
        }
    };
