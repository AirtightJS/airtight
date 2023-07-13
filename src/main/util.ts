import { defaults } from './defaults.js';
import { SchemaDefType } from './schema-def.js';

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

export function getDefaultValue(schema: {
    type: SchemaDefType;
    default?: any;
    optional?: boolean;
    nullable?: boolean;
}) {
    if (typeof schema.default === 'function') {
        return schema.default();
    }
    if (typeof schema.default === 'string') {
        try {
            return JSON.parse(schema.default);
        } catch (error) {}
    }
    return schema.default ?? (schema.optional ? undefined : schema.nullable ? null : defaults[schema.type]);
}

export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends (object | undefined) ? DeepPartial<T[K]> : T[K];
};
