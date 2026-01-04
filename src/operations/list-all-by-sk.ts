import { QueryCommand, QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DynamoContext, BaseItem } from '../types';

export interface ListAllBySkInput {
    tableName: string;
    sk: string; // Used as PK for GSI
}

export const listAllBySk =
    (context: DynamoContext) =>
    async <T extends BaseItem>(input: ListAllBySkInput): Promise<QueryCommandOutput> => {
        const { client, logger, gsiName } = context;
        const { tableName, sk } = input;

        if (!gsiName) {
            throw new Error(
                'GSI name is required for listAllBySk operation. Please provide it in createAdapter.',
            );
        }

        const pkName = context.gsiPkName || 'sk';

        logger?.debug('listAllBySk:start', { data: { tableName, sk, gsiName, pkName } });
        console.log('DEBUG listAllBySk:', { tableName, gsiName, pkName, sk });

        let items: Record<string, any>[] = [];
        let count = 0;
        let lastEvaluatedKey: Record<string, any> | undefined = undefined;

        try {
            do {
                const command: QueryCommand = new QueryCommand({
                    TableName: tableName,
                    IndexName: gsiName,
                    KeyConditionExpression: '#pk = :sk',
                    ExpressionAttributeNames: {
                        '#pk': pkName,
                    },
                    ExpressionAttributeValues: {
                        ':sk': sk,
                    },
                    ExclusiveStartKey: lastEvaluatedKey,
                });

                const result: QueryCommandOutput = await client.send(command);

                if (result.Items) {
                    items = items.concat(result.Items);
                    count += result.Count || 0;
                }

                lastEvaluatedKey = result.LastEvaluatedKey;
            } while (lastEvaluatedKey);

            const finalResult: QueryCommandOutput = {
                $metadata: {},
                Items: items,
                Count: count,
                ScannedCount: count, // Approximation for GSI query
            };

            logger?.debug('listAllBySk:success', { data: { totalCount: count } });
            return finalResult;
        } catch (error) {
            logger?.debug('listAllBySk:error', { error });
            throw error;
        }
    };
