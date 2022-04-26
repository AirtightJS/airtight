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
    [P in keyof T]?: DeepPartial<T[P]>;
};
