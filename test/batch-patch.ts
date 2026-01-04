import { batchCreate, batchPatch, getOne } from '../src/index';
import * as crypto from 'crypto';
import { getStackResources, getTestContext } from './common.js';

const run = async () => {
    try {
        const { tableName } = await getStackResources();
        const ctx = getTestContext();

        const count = 5;
        const pkPrefix = `batch-patch-${crypto.randomUUID()}`;

        console.log(`\n🚀 Testing batchPatch with ${count} items...`);

        // Setup: Create items
        const items = [];
        for (let i = 0; i < count; i++) {
            const pk = `${pkPrefix}-${i}`;
            items.push({
                id: pk,
                pk,
                sk: 'test-sk',
                data: `initial-${i}`,
            });
        }
        await batchCreate(ctx)({ tableName, items });

        // Patch items
        const patches = items.map((item) => ({
            pk: item.pk,
            sk: item.sk,
            data: `patched-${item.pk.split('-').pop()}`,
        }));

        await batchPatch(ctx)({
            tableName,
            items: patches,
        });

        console.log('  Verifying items patched...');

        for (const patch of patches) {
            const result = await getOne(ctx)({
                tableName,
                item: { pk: patch.pk, sk: patch.sk },
            });
            const expectedData = patch.data;
            if (!result) throw new Error(`Item ${patch.pk} not found`);
            if (result.data !== expectedData)
                throw new Error(
                    `Item ${patch.pk} data mismatch: expected ${expectedData}, got ${result.data}`,
                );
        }

        console.log('  ✅ batchPatch successful');
        process.exit(0);
    } catch (error) {
        console.error('batchPatch test failed:', error);
        process.exit(1);
    }
};

run();
