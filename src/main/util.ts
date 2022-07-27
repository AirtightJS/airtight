export type DataType = 'string' | 'boolean' | 'number' | 'object' | 'array' | 'any' | 'null';

export function getType(value: unknown): DataType {
    if (value == null) {
        return 'null';
    }
    if (Array.isArray(value)) {
        return 'array';
    }
    const type = typeof value;
    if (type === 'object' || type === 'number' || type === 'string' || type === 'boolean') {
        return type;
    }
    return 'any';
}

export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
