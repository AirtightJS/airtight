import { Exception } from 'typesafe-exception';

import { coerce } from './coerce';
import { defaults } from './defaults';
import { ArraySchema, NumberSchema, ObjectSchema, Schema, SchemaType, StringSchema } from './schema';
import { DataType, getType } from './util';

export class ValidationError extends Exception<{ errors: DecodeError[] }> {
    status = 400;

    constructor(errors: DecodeError[]) {
        super('Validation failed', { errors });
    }
}

export interface DecodeResult<T> {
    value: T;
    errors: DecodeError[];
}

export interface DecodeError {
    path: string[];
    message: string;
}

export function decode<T>(schema: Schema<T>, value: unknown, throwOnInvalid = false): T {
    const errors: DecodeError[] = [];
    const res = decodeAny(schema, value, [], errors);
    if (throwOnInvalid && errors.length > 0) {
        throw new ValidationError(errors);
    }
    return res;
}

function decodeAny<T>(
    schema: Schema<T>,
    value: unknown,
    path: string[],
    errors: DecodeError[],
) {
    const untypedSchema: any = schema;
    // Null/Undefined
    if (value == null) {
        if (untypedSchema.nullable) {
            return null;
        }
        if (untypedSchema.optional) {
            return undefined;
        }
        errors.push({ path, message: 'must not be null' });
        value = defaultValue(schema);
    }
    // Any Schema
    if (schema.type === 'any') {
        return value;
    }
    // Coercion
    if (!typesMatch(schema.type, getType(value))) {
        const coercedValue = coerce(schema.type, value);
        if (coercedValue === undefined) {
            errors.push({ path, message: `must be ${schema.type}` });
            return defaultValue(schema);
        }
        value = coercedValue;
    }
    // Per-type
    switch (schema.type) {
        case 'boolean':
            return value;
        case 'number':
        case 'integer':
            return decodeNumber(untypedSchema, value, path, errors);
        case 'string':
            return decodeString(untypedSchema, value, path, errors);
        case 'object':
            return decodeObject(untypedSchema, value, path, errors);
        case 'array':
            return decodeArray(untypedSchema, value, path, errors);
        default:
            errors.push({ path, message: 'must be a valid data type' });
            return defaultValue(schema);
    }
}

function decodeNumber(schema: NumberSchema, value: unknown, path: string[], errors: DecodeError[]): number {
    const num = value as number;
    let valid = true;
    if (schema.minimum != null && num < schema.minimum) {
        errors.push({ path, message: `must be greater than or equal to ${schema.minimum}` });
        valid = false;
    }
    if (schema.maximum != null && num > schema.maximum) {
        errors.push({ path, message: `must be less than or equal to ${schema.maximum}` });
        valid = false;
    }
    return valid ? num : defaultValue(schema);
}

function decodeString(schema: StringSchema, value: unknown, path: string[], errors: DecodeError[]): string {
    const str = value as string;
    let valid = true;
    if (schema.enum != null && !schema.enum.includes(str)) {
        errors.push({ path, message: `must be an allowed value` });
        valid = false;
    }
    if (schema.pattern != null && new RegExp(schema.pattern).test(str)) {
        errors.push({ path, message: `must be in allowed format` });
        valid = false;
    }
    return valid ? str : defaultValue(schema);
}

function decodeObject<T>(schema: ObjectSchema<T>, value: unknown, path: string[], errors: DecodeError[]) {
    const propKeys = new Set<string>();
    const result: any = {};
    const original: any = value;
    for (const [key, propSchema] of Object.entries(schema.properties)) {
        const value = original[key];
        const decoded = decodeAny(propSchema as Schema<any>, value, path.concat([key]), errors);
        if (decoded !== undefined) {
            result[key] = decoded;
        }
        propKeys.add(key);
    }
    if (schema.additionalProperties) {
        for (const [key, value] of original) {
            if (propKeys.has(key)) {
                continue;
            }
            result[key] = decodeAny(schema.additionalProperties, value, path.concat([key]), errors);
        }
    }
    return result;
}

function decodeArray<T>(schema: ArraySchema<T>, value: unknown, path: string[], errors: DecodeError[]): T[] {
    const result: any[] = [];
    const original = value as any[];
    for (const value of original) {
        const item = decodeAny(schema.items, value, path.concat(['*']), errors);
        result.push(item);
    }
    return result;
}

function typesMatch(schemaType: SchemaType, dataType: DataType) {
    return schemaType === dataType ||
        (schemaType === 'integer' && dataType === 'number');
}

function defaultValue(schema: { type: SchemaType, default?: any }) {
    return schema.default ?? defaults[schema.type];
}
