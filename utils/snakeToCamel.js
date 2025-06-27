export function snakeToCamel(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => {
            const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
            return [camelKey, value];
        })
    );
}

export function snakeToCamelAll(rows) {
    return Array.isArray(rows) ? rows.map(snakeToCamel) : [];
}