import { coerce } from './coerce';
import { DecodeError, DecodeOptions, SchemaDecoder, ValidationError } from './decoder';
import { defaults } from './defaults';
import { ArraySchema, NumberSchema, ObjectSchema, Schema, SchemaType, StringSchema } from './schema';
import { getType } from './util';

export class DecodeJob<T> {
    errors: DecodeError[] = [];

    constructor(
        readonly decoder: SchemaDecoder<T>,
        readonly value: unknown,
        readonly options: DecodeOptions,
    ) { }

    decode(): T {
        const res = this.decodeAny(this.decoder.schema, this.value, []);
        if (this.options.throw && this.errors.length > 0) {
            throw new ValidationError(this.errors);
        }
        return res;
    }

    protected decodeAny<T>(schema: Schema<T>, value: unknown, path: string[]) {
        const untypedSchema: Schema<unknown> = schema;
        // Null/Undefined
        if (value == null) {
            if (untypedSchema.optional) {
                return undefined;
            }
            if (untypedSchema.nullable) {
                return null;
            }
            this.errors.push({ path, message: 'must not be null' });
            value = this.defaultValue(schema);
        }
        // Any Schema
        if (schema.type === 'any') {
            return value;
        }
        // Ref Schema
        if (schema.type === 'ref') {
            return this.decodeRef(schema.schemaId, value, path);
        }
        // Coercion
        if (schema.type !== getType(value)) {
            const coercedValue = coerce(schema.type, value);
            if (coercedValue === undefined) {
                this.errors.push({ path, message: `must be ${schema.type}` });
                return this.defaultValue(schema);
            }
            value = coercedValue;
        }
        // Per-type
        switch (schema.type) {
            case 'boolean':
                return value;
            case 'number':
            case 'integer':
                return this.decodeNumber(schema, value, path);
            case 'string':
                return this.decodeString(schema, value, path);
            case 'object':
                return this.decodeObject(schema, value, path);
            case 'array':
                return this.decodeArray(schema, value, path);
            default:
                this.errors.push({ path, message: 'must be a valid data type' });
                return this.defaultValue(schema);
        }
    }


    decodeNumber(schema: NumberSchema, value: unknown, path: string[]): number {
        const num = value as number;
        let valid = true;
        if (schema.minimum != null && num < schema.minimum) {
            this.errors.push({ path, message: `must be greater than or equal to ${schema.minimum}` });
            valid = false;
        }
        if (schema.maximum != null && num > schema.maximum) {
            this.errors.push({ path, message: `must be less than or equal to ${schema.maximum}` });
            valid = false;
        }
        return valid ? num : this.defaultValue(schema);
    }

    decodeString(schema: StringSchema, value: unknown, path: string[]): string {
        const str = value as string;
        let valid = true;
        if (schema.enum != null && !schema.enum.includes(str)) {
            this.errors.push({ path, message: `must be an allowed value` });
            valid = false;
        }
        if (schema.regex != null && new RegExp(schema.regex, schema.regexFlags ?? '').test(str)) {
            this.errors.push({ path, message: `must be in allowed format` });
            valid = false;
        }
        return valid ? str : this.defaultValue(schema);
    }

    decodeObject<T>(schema: ObjectSchema<T>, value: unknown, path: string[]) {
        const propKeys = new Set<string>();
        const result: any = {};
        const original: any = value;
        for (const [key, propSchema] of Object.entries(schema.properties)) {
            const value = original[key];
            const decoded = this.decodeAny(propSchema as Schema<any>, value, path.concat([key]));
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
                result[key] = this.decodeAny(schema.additionalProperties, value, path.concat([key]));
            }
        }
        return result;
    }

    decodeArray<T>(schema: ArraySchema<T>, value: unknown, path: string[]): T[] {
        const result: any[] = [];
        const original = value as any[];
        for (const value of original) {
            const item = this.decodeAny(schema.items, value, path.concat(['*']));
            result.push(item);
        }
        return result;
    }

    decodeRef(schemaId: string, value: unknown, path: string[]): any {
        const refSchema = this.decoder.store.get(schemaId);
        if (!refSchema) {
            this.errors.push({ path, message: `unknown type ${schemaId}` });
            return undefined;
        }
        return this.decodeAny(refSchema as Schema<any>, value, path);
    }

    defaultValue(schema: { type: SchemaType; default?: any; optional?: true; nullable?: true }) {
        const schemaDefault = schema.default;
        if (typeof schemaDefault === 'function') {
            return schemaDefault();
        }
        return schemaDefault ?? (schema.optional ? undefined : schema.nullable ? null : defaults[schema.type]);
    }

}
