import { createOne, scan } from '../src/index';
import * as crypto from 'crypto';
import { getStackResources, getTestContext } from './common.js';

const run = async () => {
    try {
        const { tableName } = await getStackResources();
        const ctx = getTestContext();

        const pkPrefix = `recursive-scan-${crypto.randomUUID()}`;

        // Setup - Create 5 items
        console.log('\n🚀 Creating 5 items for scan test...');
        for (let i = 0; i < 5; i++) {
            await createOne(ctx)({
                tableName,
                item: {
                    id: `${pkPrefix}-${i}`,
                    pk: `${pkPrefix}-${i}`,
                    sk: 'test-sk',
                    data: `scan-data-${i}`,
                },
            });
        }

        console.log('\n🚀 Testing recursive scan (Limit parameter removed)...');
        // Test: Scan returns all items (at least the 5 we created)
        const scanRes = await scan(ctx)({ tableName });
        const found = scanRes.Items?.filter((i: any) => i.pk && i.pk.startsWith(pkPrefix));
        console.log(`  Scan found total ${scanRes.Items?.length || 0} items`);
        console.log(`  Found ${found?.length || 0} of our test items`);

        if ((found?.length || 0) !== 5)
            throw new Error(`Expected 5 items but found ${found?.length}`);

        console.log('  ✅ scan successful');
        process.exit(0);
    } catch (error) {
        console.error('scan test failed:', error);
        process.exit(1);
    }
};

run();
