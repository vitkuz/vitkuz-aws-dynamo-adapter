import { batchCreate, getOne } from '../src/index';
import * as crypto from 'crypto';
import { getStackResources, getTestContext } from './common.js';

const run = async () => {
    try {
        const { tableName } = await getStackResources();
        const ctx = getTestContext();

        const count = 5;
        const pkPrefix = `batch-create-${crypto.randomUUID()}`;
        const requestId = crypto.randomUUID();

        // Pass x-request-id to logger context so we can understand what caused creation
        if (ctx.logger && typeof ctx.logger.child === 'function') {
            ctx.logger = ctx.logger.child({ requestId });
        }

        console.log(`\n🚀 Testing batchCreate with ${count} items (Request ID: ${requestId})...`);

        const items = [];
        for (let i = 0; i < count; i++) {
            const pk = `${pkPrefix}-${i}`;
            items.push({
                id: pk,
                pk,
                sk: 'test-sk',
                data: `data-${i}`,
                timestamp: Date.now(),
                'x-request-id': requestId, // Store trace ID in item
            });
        }

        await batchCreate(ctx)({
            tableName,
            items,
        });

        console.log('  Verifying items created...');

        for (const item of items) {
            const result = await getOne(ctx)({
                tableName,
                item: { pk: item.pk, sk: item.sk },
            });
            if (!result) throw new Error(`Item ${item.pk} not found`);
            if (result.data !== item.data) throw new Error(`Item ${item.pk} data mismatch`);
            if (result['x-request-id'] !== requestId)
                throw new Error(`Item ${item.pk} request ID mismatch`);
        }

        console.log('  ✅ batchCreate successful');
        process.exit(0);
    } catch (error) {
        console.error('batchCreate test failed:', error);
        process.exit(1);
    }
};

run();
