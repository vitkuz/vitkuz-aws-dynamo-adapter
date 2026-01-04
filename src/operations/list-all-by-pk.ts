import { QueryCommand, QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DynamoContext, BaseItem } from '../types';

export interface ListAllByPkInput {
    tableName: string;
    pk: string;
}

export const listAllByPk =
    (context: DynamoContext) =>
    async <T extends BaseItem>(input: ListAllByPkInput): Promise<QueryCommandOutput> => {
        const { client, logger } = context;
        const { tableName, pk } = input;

        logger?.debug('listAllByPk:start', { data: { tableName, pk } });

        let items: Record<string, any>[] = [];
        let count = 0;
        let lastEvaluatedKey: Record<string, any> | undefined = undefined;

        try {
            do {
                const command: QueryCommand = new QueryCommand({
                    TableName: tableName,
                    KeyConditionExpression: 'pk = :pk',
                    ExpressionAttributeValues: {
                        ':pk': pk,
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
                ScannedCount: count,
            };

            logger?.debug('listAllByPk:success', { data: { totalCount: count } });
            return finalResult;
        } catch (error) {
            logger?.debug('listAllByPk:error', { error });
            throw error;
        }
    };
