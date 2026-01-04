export const DYNAMO_BATCH_WRITE_LIMIT = 25;
export const DYNAMO_TRANSACT_WRITE_LIMIT = 25; // Legacy safe limit, newer is 100 but 25 is safe defaults
export const MAX_RETRIES = 3;
export const RETRY_DELAY_BASE = 100;
