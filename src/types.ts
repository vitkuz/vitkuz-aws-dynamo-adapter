import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export interface Logger {
    debug: (message: string, context?: { error?: any; data?: any }) => void;
    [key: string]: any;
}

export interface DynamoContext {
    client: DynamoDBDocumentClient;
    logger?: Logger;
    gsiName?: string;
    gsiPkName?: string;
}

export interface BaseItem {
    id: string; // Same as pk
    pk: string; // Partition Key
    sk?: string; // Sort Key / Entity Type
    [key: string]: any;
}
