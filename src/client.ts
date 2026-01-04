import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, TranslateConfig } from '@aws-sdk/lib-dynamodb';

export const createDynamoClient = (
    config: DynamoDBClientConfig,
    translateConfig?: TranslateConfig,
): DynamoDBDocumentClient => {
    const client = new DynamoDBClient(config);
    return DynamoDBDocumentClient.from(client, {
        marshallOptions: {
            removeUndefinedValues: true,
            convertClassInstanceToMap: true,
        },
        ...translateConfig,
    });
};
