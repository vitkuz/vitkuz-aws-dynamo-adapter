export const noop = () => {};

export interface UpdateExpressionResult {
    UpdateExpression: string;
    ExpressionAttributeNames: Record<string, string>;
    ExpressionAttributeValues: Record<string, any>;
}

export const buildUpdateExpression = (patch: Record<string, any>): UpdateExpressionResult => {
    const UpdateExpressionParts: string[] = [];
    const ExpressionAttributeNames: Record<string, string> = {};
    const ExpressionAttributeValues: Record<string, any> = {};

    Object.entries(patch).forEach(([key, value]) => {
        // Skip keys that cannot be updated or are part of the key
        if (key === 'id' || key === 'pk' || key === 'sk') return;

        const attrName = `#${key}`;
        const attrValue = `:${key}`;

        UpdateExpressionParts.push(`${attrName} = ${attrValue}`);
        ExpressionAttributeNames[attrName] = key;
        ExpressionAttributeValues[attrValue] = value;
    });

    return {
        UpdateExpression: `SET ${UpdateExpressionParts.join(', ')}`,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
    };
};

export const chunkArray = <T>(array: T[], size: number): T[][] => {
    const chunked: T[][] = [];
    let index = 0;
    while (index < array.length) {
        chunked.push(array.slice(index, size + index));
        index += size;
    }
    return chunked;
};
