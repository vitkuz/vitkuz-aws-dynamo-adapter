import { batchCreate, batchReplace, getOne } from '../src/index';
import * as crypto from 'crypto';
import { getStackResources, getTestContext } from './common.js';

const run = async () => {
    try {
        const { tableName } = await getStackResources();
        const ctx = getTestContext();

        const count = 5;
        const pkPrefix = `batch-replace-${crypto.randomUUID()}`;

        console.log(`\n🚀 Testing batchReplace with ${count} items...`);

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

        // Replace items
        const replacements = items.map((item) => ({
            ...item,
            data: `replaced-${item.pk.split('-').pop()}`,
        }));

        await batchReplace(ctx)({
            tableName,
            items: replacements,
        });

        console.log('  Verifying items replaced...');

        for (const replacement of replacements) {
            const result = await getOne(ctx)({
                tableName,
                item: { pk: replacement.pk, sk: replacement.sk },
            });
            const expectedData = replacement.data;
            if (!result) throw new Error(`Item ${replacement.pk} not found`);
            if (result.data !== expectedData)
                throw new Error(
                    `Item ${replacement.pk} data mismatch: expected ${expectedData}, got ${result.data}`,
                );
        }

        console.log('  ✅ batchReplace successful');
        process.exit(0);
    } catch (error) {
        console.error('batchReplace test failed:', error);
        process.exit(1);
    }
};

run();
