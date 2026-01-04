import {
    CloudFormationClient,
    DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import type { FilterLogEventsCommandOutput } from '@aws-sdk/client-cloudwatch-logs';
import { createDynamoClient, DynamoContext } from '../src/index';
import { createLogger } from '@vitkuz/aws-logger';

export const STACK_NAME = 'vitkuz-testing-dynamo';
export const REGION = process.env.AWS_REGION || 'us-east-1';

export const getStackResources = async () => {
    const cf = new CloudFormationClient({ region: REGION });
    const command = new DescribeStackResourcesCommand({ StackName: STACK_NAME });
    const response = await cf.send(command);

    if (!response.StackResources) throw new Error('No resources found');

    const table = response.StackResources.find((r) => r.ResourceType === 'AWS::DynamoDB::Table');
    const lambda = response.StackResources.find(
        (r) =>
            r.ResourceType === 'AWS::Lambda::Function' &&
            r.LogicalResourceId?.includes('DynamoHandler'),
    );

    if (!table?.PhysicalResourceId || !lambda?.PhysicalResourceId) {
        throw new Error('Could not find TableName or Lambda Function Name in stack resources');
    }

    return {
        tableName: table.PhysicalResourceId,
        logGroupName: `/aws/lambda/${lambda.PhysicalResourceId}`,
    };
};

export const waitForLogs = async (
    logGroupName: string,
    searchStrings: string[],
    timeoutMs = 60000,
): Promise<boolean> => {
    const logs = new CloudWatchLogsClient({ region: REGION });
    const startTime = Date.now();
    let foundCount = 0;
    const foundStrings = new Set<string>();

    console.log(`Polling logs in ${logGroupName} for ${searchStrings.length} items...`);

    while (Date.now() - startTime < timeoutMs) {
        try {
            const command = new FilterLogEventsCommand({
                logGroupName,
                startTime: Date.now() - 60000,
            });

            const events: FilterLogEventsCommandOutput = await logs.send(command);

            if (events.events) {
                for (const e of events.events) {
                    for (const str of searchStrings) {
                        if (e.message?.includes(str) && !foundStrings.has(str)) {
                            console.log(`✅ Found log for: ${str}`);
                            foundStrings.add(str);
                            foundCount++;
                        }
                    }
                }
            }

            if (foundCount >= searchStrings.length) return true;
        } catch (error: any) {
            console.warn(`Error polling logs: ${error.message}`);
        }

        await new Promise((r) => setTimeout(r, 2000));
    }

    return foundCount >= searchStrings.length;
};

export const getTestContext = () => {
    const client = createDynamoClient({ region: REGION });
    const logger = createLogger();
    const ctx: DynamoContext = { logger, client };
    return ctx;
};
