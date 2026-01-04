import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoContext } from '../types';
import { chunkArray, buildUpdateExpression } from '../utils';
import { DYNAMO_TRANSACT_WRITE_LIMIT } from '../const';

export interface BatchPatchInput {
    tableName: string;
    items: {
        pk: string;
        sk: string;
        [key: string]: any;
    }[];
}

export const batchPatch =
    (context: DynamoContext) =>
    async (input: BatchPatchInput): Promise<void> => {
        const { client, logger } = context;
        const { tableName, items } = input;

        if (items.length === 0) return;

        logger?.debug('batchPatch:start', { data: { tableName, count: items.length } });

        const chunks = chunkArray(items, DYNAMO_TRANSACT_WRITE_LIMIT);

        try {
            for (const chunk of chunks) {
                const transactItems = chunk.map((item) => {
                    if (!item.pk || !item.sk) {
                        throw new Error('pk and sk are required');
                    }

                    const { pk, sk, ...patch } = item;
                    const {
                        UpdateExpression,
                        ExpressionAttributeNames,
                        ExpressionAttributeValues,
                    } = buildUpdateExpression(patch);

                    if (!UpdateExpression || Object.keys(ExpressionAttributeNames).length === 0) {
                        // If an item has no patch fields, we might skip it or error?
                        // Error seems safer as it implies a bug in caller logic.
                        throw new Error(`No valid fields to patch for item ${item.pk}`);
                    }

                    return {
                        Update: {
                            TableName: tableName,
                            Key: { pk, sk },
                            UpdateExpression,
                            ExpressionAttributeNames,
                            ExpressionAttributeValues,
                        },
                    };
                });

                const command = new TransactWriteCommand({
                    TransactItems: transactItems,
                });

                await client.send(command);
            }

            logger?.debug('batchPatch:success', { data: { count: items.length } });
        } catch (error) {
            logger?.debug('batchPatch:error', { error });
            throw error;
        }
    };
