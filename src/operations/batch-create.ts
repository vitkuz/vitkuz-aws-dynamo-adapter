import { TransactWriteCommand, TransactWriteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { DynamoContext, BaseItem } from '../types';
import { chunkArray } from '../utils';
import { DYNAMO_TRANSACT_WRITE_LIMIT } from '../const';

export interface BatchCreateInput<T extends BaseItem> {
    tableName: string;
    items: (Omit<T, 'id' | 'pk'> & { id?: string; pk?: string })[];
}

export const batchCreate =
    (context: DynamoContext) =>
    async <T extends BaseItem>(input: BatchCreateInput<T>): Promise<void> => {
        const { client, logger } = context;
        const { tableName, items } = input;

        if (items.length === 0) return;

        logger?.debug('batchCreate:start', { data: { tableName, count: items.length } });

        // Validate and prepare all items
        const finalItems: T[] = items.map((item) => {
            const id = item.id || uuidv4();
            const pk = item.pk || id;

            if (item.id && item.pk && item.id !== item.pk) {
                throw new Error(`Item id (${item.id}) must match pk (${item.pk})`);
            }

            if (!pk || !item.sk) {
                throw new Error('pk and sk are required');
            }

            return { ...item, id, pk } as T;
        });

        for (const item of finalItems) {
            if (item.id !== item.pk) {
                throw new Error(`Item id (${item.id}) must match pk (${item.pk})`);
            }
        }

        // Chunk items into groups
        const chunks = chunkArray(finalItems, DYNAMO_TRANSACT_WRITE_LIMIT);

        try {
            for (const chunk of chunks) {
                const transactItems = chunk.map((item) => ({
                    Put: {
                        TableName: tableName,
                        Item: item,
                        ConditionExpression:
                            'attribute_not_exists(pk) AND attribute_not_exists(sk)',
                    },
                }));

                const command = new TransactWriteCommand({
                    TransactItems: transactItems,
                });

                await client.send(command);
            }

            logger?.debug('batchCreate:success', { data: { count: items.length } });
        } catch (error) {
            logger?.debug('batchCreate:error', { error });
            throw error;
        }
    };
