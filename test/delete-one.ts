import { createOne, deleteOne, getOne } from '../src/index';
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
            data: 'to-be-deleted',
        };

        // Setup
        await createOne(ctx)({ tableName, item });

        console.log(`\n🚀 Testing deleteOne (PK: ${pk})...`);
        await deleteOne(ctx)({
            tableName,
            item: { pk, sk: 'test-sk' },
        });

        const readItem = await getOne(ctx)({
            tableName,
            item: { pk, sk: 'test-sk' },
        });

        if (!readItem) {
            console.log('  ✅ deleteOne successful');
            process.exit(0);
        } else {
            throw new Error('deleteOne failed: Item still exists');
        }
    } catch (error) {
        console.error('deleteOne test failed:', error);
        process.exit(1);
    }
};

run();
