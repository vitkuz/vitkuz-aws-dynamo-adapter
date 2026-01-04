import { createOne, listAllByPk } from '../src/index';
import * as crypto from 'crypto';
import { getStackResources, getTestContext } from './common.js';

const run = async () => {
    try {
        const { tableName } = await getStackResources();
        const ctx = getTestContext();

        const pk = `item-pk-${crypto.randomUUID()}`;

        // Setup - Create 5 items with same PK
        console.log(`\n🚀 Creating 5 items with PK: ${pk}...`);
        const totalItems = 5;
        for (let i = 0; i < totalItems; i++) {
            await createOne(ctx)({
                tableName,
                item: {
                    id: pk, // createOne enforces id === pk
                    pk, // Same PK
                    sk: `sk-${i}`,
                    data: `item-${i}`,
                },
            });
        }

        console.log(`\n🚀 Testing listAllByPk (expect all ${totalItems} items)...`);
        const result = await listAllByPk(ctx)({
            tableName,
            pk,
        });

        console.log(`  Found ${result.Items?.length || 0} items`);
        if ((result.Items?.length || 0) !== totalItems) {
            throw new Error(
                `listAllByPk failed: Expected ${totalItems} items, found ${result.Items?.length}`,
            );
        }

        console.log('  ✅ listAllByPk successful');
        process.exit(0);
    } catch (error) {
        console.error('listAllByPk test failed:', error);
        process.exit(1);
    }
};

run();
