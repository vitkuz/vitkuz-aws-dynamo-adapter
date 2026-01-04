import { ScanCommand, ScanCommandInput, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DynamoContext, BaseItem } from '../types';

export interface ScanInput {
    tableName: string;
    nextToken?: string;
}

export const scan =
    (context: DynamoContext) =>
    async <T extends BaseItem>(input: ScanInput): Promise<ScanCommandOutput> => {
        const { client, logger } = context;
        const { tableName, nextToken } = input;

        logger?.debug('scan:start', { data: { tableName } });

        let items: Record<string, any>[] = [];
        let count = 0;
        let scannedCount = 0;
        let lastEvaluatedKey: Record<string, any> | undefined = nextToken
            ? JSON.parse(Buffer.from(nextToken, 'base64').toString('utf8'))
            : undefined;

        try {
            do {
                const command = new ScanCommand({
                    TableName: tableName,
                    ExclusiveStartKey: lastEvaluatedKey,
                });

                const result: ScanCommandOutput = await client.send(command);

                if (result.Items) {
                    items = items.concat(result.Items);
                    count += result.Count || 0;
                    scannedCount += result.ScannedCount || 0;
                }

                lastEvaluatedKey = result.LastEvaluatedKey;
            } while (lastEvaluatedKey);

            const finalResult: ScanCommandOutput = {
                $metadata: {},
                Items: items,
                Count: count,
                ScannedCount: scannedCount,
            };

            logger?.debug('scan:success', { data: { count, scannedCount } });
            return finalResult;
        } catch (error) {
            logger?.debug('scan:error', { error });
            throw error;
        }
    };
