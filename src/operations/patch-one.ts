import { UpdateCommand, UpdateCommandOutput } from '@aws-sdk/lib-dynamodb';
import { DynamoContext } from '../types';
import { buildUpdateExpression } from '../utils';

export interface PatchOneInput {
    tableName: string;
    item: {
        pk: string;
        sk?: string;
        [key: string]: any;
    };
}

export const patchOne =
    (context: DynamoContext) =>
    async (input: PatchOneInput): Promise<UpdateCommandOutput> => {
        const { client, logger } = context;
        const { tableName, item } = input;
        const { pk, sk, ...patch } = item;

        if (!pk || !sk) {
            throw new Error('pk and sk are required');
        }

        logger?.debug('patchOne:start', {
            data: { tableName, pk, sk, patchKeys: Object.keys(patch) },
        });

        const { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
            buildUpdateExpression(patch);

        if (!UpdateExpression || Object.keys(ExpressionAttributeNames).length === 0) {
            throw new Error('No valid fields to patch');
        }

        try {
            const command = new UpdateCommand({
                TableName: tableName,
                Key: { pk, ...(sk && { sk }) },
                UpdateExpression,
                ExpressionAttributeNames,
                ExpressionAttributeValues,
                ReturnValues: 'ALL_NEW',
            });
            const result = await client.send(command);
            logger?.debug('patchOne:success', { data: result.Attributes });
            return result;
        } catch (error) {
            logger?.debug('patchOne:error', { error });
            throw error;
        }
    };
