import { createOne, listAllBySk, getOne } from '../src/index';
import * as crypto from 'crypto';
import { getStackResources, getTestContext } from './common.js';
import { DynamoContext } from '../src/index';

const run = async () => {
    try {
        const { tableName } = await getStackResources();
        const ctx = getTestContext();

        // We need to inject GSI name into Context because listAllBySk requires it
        // The adapter usually takes gsiName in factory, but here we are using getTestContext which might not have it set?
        // Let's check common.ts... getTestContext() returns ctx with just logger and client.
        // We need to override it.
        // With Inverted Index (PK=sk, SK=pk) on GSI:
        // GSI PK Name is 'sk' (attribute name in index key schema)
        // DynamoDB projects 'sk' from base table into GSI PK.
        const gsiCtx: DynamoContext = { ...ctx, gsiName: 'GSI1', gsiPkName: 'sk' };

        const pk1 = `item-pk1-${crypto.randomUUID()}`;
        const pk2 = `item-pk2-${crypto.randomUUID()}`;

        const uniqueSk = `common-sk-${crypto.randomUUID()}`;

        const item1 = {
            id: pk1,
            pk: pk1,
            sk: uniqueSk, // Unique SK for this test run
            data: 'item-1',
        };
        const item2 = {
            id: pk2,
            pk: pk2,
            sk: uniqueSk, // Unique SK for this test run
            data: 'item-2',
        };

        // Setup
        await createOne(ctx)({ tableName, item: item1 });
        await createOne(ctx)({ tableName, item: item2 });

        const checkItem = await getOne(ctx)({ tableName, item: { pk: pk1, sk: uniqueSk } });
        console.log('DEBUG checkItem:', checkItem);

        console.log(`\n🚀 Testing listAllBySk (SK: ${uniqueSk})...`);

        // GSI is eventually consistent, so we might need to retry
        let result;
        const maxRetries = 10;
        for (let i = 0; i < maxRetries; i++) {
            result = await listAllBySk(gsiCtx)({
                tableName,
                sk: uniqueSk,
            });

            console.log(`  Attempt ${i + 1}: Found ${result.Items?.length || 0} items`);

            if (result.Items?.length === 2) {
                console.log('  ✅ listAllBySk successful');
                process.exit(0);
            }

            // Wait 2 seconds before next retry
            await new Promise((r) => setTimeout(r, 2000));
        }

        throw new Error(
            `listAllBySk failed: Expected 2 items, found ${result?.Items?.length} after ${maxRetries} attempts`,
        );
    } catch (error) {
        console.error('listAllBySk test failed:', error);
        process.exit(1);
    }
};

run();
