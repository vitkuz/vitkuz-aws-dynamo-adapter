import { createOne } from '../src/index';
import * as crypto from 'crypto';
import { getStackResources, getTestContext } from './common.js';

const run = async () => {
    try {
        console.log('🔍 Discovering Stack Resources...');
        const { tableName } = await getStackResources();
        console.log(`  Table Name: ${tableName}`);

        const ctx = getTestContext();

        const pk = `item-${crypto.randomUUID()}`;
        const item = {
            id: pk,
            pk,
            sk: 'test-sk',
            data: 'create-one-data',
            timestamp: Date.now(),
        };

        console.log(`\n🚀 Testing createOne (PK: ${pk})...`);
        await createOne(ctx)({
            tableName,
            item,
        });
        console.log('  ✅ createOne successful');
        process.exit(0);
    } catch (error) {
        console.error('createOne test failed:', error);
        process.exit(1);
    }
};

run();
