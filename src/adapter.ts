import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { TranslateConfig } from '@aws-sdk/lib-dynamodb';
import { createDynamoClient } from './client';
import { Logger } from './types';
import { createOne } from './operations/create-one';
import { getOne } from './operations/get-one';
import { deleteOne } from './operations/delete-one';
import { replaceOne } from './operations/replace-one';
import { patchOne } from './operations/patch-one';

import { listAllByPk } from './operations/list-all-by-pk';
import { listAllBySk } from './operations/list-all-by-sk';
import { scan } from './operations/scan';

export const createAdapter = (
    config: DynamoDBClientConfig,
    logger?: Logger,
    gsiName?: string,
    translateConfig?: TranslateConfig,
) => {
    const client = createDynamoClient(config, translateConfig);
    const context = { client, logger, gsiName };

    return {
        client,
        createOne: createOne(context),
        getOne: getOne(context),
        deleteOne: deleteOne(context),
        replaceOne: replaceOne(context),
        patchOne: patchOne(context),

        listAllByPk: listAllByPk(context),
        listAllBySk: listAllBySk(context),
        scan: scan(context),
    };
};
