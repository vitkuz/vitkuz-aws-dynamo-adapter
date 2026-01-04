import { createOne, patchOne, getOne } from '../src/index';
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

        console.log(`\n🚀 Testing patchOne (PK: ${pk})...`);
        await patchOne(ctx)({
            tableName,
            item: {
                pk,
                sk: 'test-sk',
                data: 'patched-data',
            },
        });

        const readItem = await getOne(ctx)({
            tableName,
            item: { pk, sk: 'test-sk' },
        });

        if (readItem?.data === 'patched-data') {
            console.log('  ✅ patchOne successful');
            process.exit(0);
        } else {
            throw new Error('patchOne failed: Data mismatch');
        }
    } catch (error) {
        console.error('patchOne test failed:', error);
        process.exit(1);
    }
};

run();
