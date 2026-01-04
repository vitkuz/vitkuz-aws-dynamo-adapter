import { createOne } from '../src/index';
import * as crypto from 'crypto';
import { getStackResources, getTestContext, waitForLogs } from './common.js';

const run = async () => {
    try {
        const { tableName, logGroupName } = await getStackResources();
        const ctx = getTestContext();

        const requestId = crypto.randomUUID();
        const pk = `item-${crypto.randomUUID()}`;
        const item = {
            id: pk,
            pk,
            sk: 'test-sk',
            'x-request-id': requestId,
            data: 'stream-data',
        };

        console.log(`\n🚀 Testing Stream Logging (RequestID: ${requestId})...`);
        // Trigger stream by creating an item
        await createOne(ctx)({ tableName, item });

        console.log('⏳ Waiting for Lambda Stream to process...');
        const success = await waitForLogs(logGroupName, [requestId]);

        if (success) {
            console.log('\n✅ DynamoDB Stream Log Verified!');
            process.exit(0);
        } else {
            console.error('\n❌ Stream Verified Failed: Log not found within timeout.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Stream test failed:', error);
        process.exit(1);
    }
};

run();
