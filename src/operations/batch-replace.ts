import { BatchWriteCommand, BatchWriteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DynamoContext, BaseItem } from '../types';
import { chunkArray } from '../utils';
import { DYNAMO_BATCH_WRITE_LIMIT, MAX_RETRIES, RETRY_DELAY_BASE } from '../const';

export interface BatchReplaceInput<T extends BaseItem> {
    tableName: string;
    items: T[];
}

export const batchReplace =
    (context: DynamoContext) =>
    async <T extends BaseItem>(input: BatchReplaceInput<T>): Promise<void> => {
        const { client, logger } = context;
        const { tableName, items } = input;

        if (items.length === 0) return;

        logger?.debug('batchReplace:start', { data: { tableName, count: items.length } });

        for (const item of items) {
            if (item.id !== item.pk) {
                throw new Error(`Item id(${item.id}) must match pk(${item.pk})`);
            }
            if (!item.pk || !item.sk) {
                throw new Error('pk and sk are required');
            }
        }

        const chunks = chunkArray(items, DYNAMO_BATCH_WRITE_LIMIT);

        try {
            for (const chunk of chunks) {
                let currentItems = chunk;
                let attempt = 0;

                while (currentItems.length > 0) {
                    const command = new BatchWriteCommand({
                        RequestItems: {
                            [tableName]: currentItems.map((item) => ({
                                PutRequest: { Item: item },
                            })),
                        },
                    });

                    const result: BatchWriteCommandOutput = await client.send(command);

                    if (result.UnprocessedItems && result.UnprocessedItems[tableName]) {
                        // Extract unprocessed items to retry
                        const unprocessed = result.UnprocessedItems[tableName];
                        currentItems = unprocessed
                            .map((request) => request.PutRequest?.Item as T)
                            .filter((item): item is T => !!item);

                        attempt++;
                        if (attempt > MAX_RETRIES) {
                            // After max retries, we could throw or just log.
                            // For now let's wait a bit before retrying to avoid hot loop in a simplistic way
                            // But in a real adapter we might want better backoff.
                            await new Promise((resolve) =>
                                setTimeout(resolve, RETRY_DELAY_BASE * Math.pow(2, attempt)),
                            );
                        }
                    } else {
                        currentItems = [];
                    }
                }
            }

            logger?.debug('batchReplace:success', { data: { count: items.length } });
        } catch (error) {
            logger?.debug('batchReplace:error', { error });
            throw error;
        }
    };
