import { createOne, replaceOne, getOne } from '../src/index';
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
            data: 'initial-data',
        };

        // Setup
        await createOne(ctx)({ tableName, item });

        console.log(`\n🚀 Testing replaceOne (PK: ${pk})...`);
        const replacedItem = { ...item, data: 'replaced-data' };
        await replaceOne(ctx)({
            tableName,
            item: replacedItem,
        });

        const readItem = await getOne(ctx)({
            tableName,
            item: { pk, sk: 'test-sk' },
        });

        if (readItem?.data === 'replaced-data') {
            console.log('  ✅ replaceOne successful');
            process.exit(0);
        } else {
            throw new Error('replaceOne failed: Data mismatch');
        }
    } catch (error) {
        console.error('replaceOne test failed:', error);
        process.exit(1);
    }
};

run();
