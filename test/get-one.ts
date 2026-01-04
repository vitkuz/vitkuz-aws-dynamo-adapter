import { createOne, getOne } from '../src/index';
import * as crypto from 'crypto';
import { getStackResources, getTestContext } from './common.js';

const run = async () => {
    try {
        const { tableName } = await getStackResources();
        const ctx = getTestContext();

        const pk = `item-${crypto.randomUUID()}`;
        const item = {
            id: pk,
            pk,
            sk: 'test-sk',
            data: 'get-one-data',
        };

        // Setup
        await createOne(ctx)({ tableName, item });

        console.log(`\n🚀 Testing getOne (PK: ${pk})...`);
        const readItem = await getOne(ctx)({
            tableName,
            item: { pk, sk: 'test-sk' },
        });

        if (readItem?.pk === pk && readItem?.data === 'get-one-data') {
            console.log('  ✅ getOne successful');
            process.exit(0);
        } else {
            throw new Error('getOne failed: Data mismatch or not found');
        }
    } catch (error) {
        console.error('getOne test failed:', error);
        process.exit(1);
    }
};

run();
