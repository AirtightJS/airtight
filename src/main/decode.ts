import { coerce } from './coerce.js';
import { defaults } from './defaults.js';
import { DecodeError, ValidationError } from './errors.js';
import { Schema } from './schema.js';
import { ArraySchemaDef, NumberSchemaDef, ObjectSchemaDef, SchemaDef, SchemaDefType, StringSchemaDef } from './schema-def.js';
import { getType } from './util.js';

export interface DecodeOptions {
    throw: boolean;
    strictRequired: boolean;
}

export class DecodeJob<T> {
    options: DecodeOptions;
    errors: DecodeError[] = [];

    constructor(
        readonly schema: Schema<T>,
        readonly value: unknown,
        options: Partial<DecodeOptions> = {},
    ) {
        this.options = {
            throw: true,
            strictRequired: false,
            ...options,
        };
    }

    decode(): T {
        const res = this.decodeAny(this.schema.schema, this.value, '');
        if (this.options.throw && this.errors.length > 0) {
            throw new ValidationError(this.schema.schema, this.errors);
        }
        return res;
    }

    protected decodeAny<T>(schema: SchemaDef<T>, value: unknown, path: string) {
        const untypedSchema: SchemaDef<unknown> = schema;
        // Any Schema
        if (schema.type === 'any') {
            return value;
        }
        // Null/Undefined
        if (value == null) {
            if (untypedSchema.optional) {
                return undefined;
            }
            if (untypedSchema.nullable) {
                return null;
            }
            value = this.defaultValue(schema);
            if (this.options.strictRequired && schema.default == null) {
                this.errors.push({ path, message: 'must not be null' });
            }
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

    protected decodeNumber(schema: NumberSchemaDef, value: unknown, path: string): number {
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

    protected decodeString(schema: StringSchemaDef, value: unknown, path: string): string {
        const str = value as string;
        let valid = true;
        if (schema.enum != null && !schema.enum.includes(str)) {
            this.errors.push({ path, message: `must be an allowed value` });
            valid = false;
        }
        if (schema.regex != null) {
            const regex = new RegExp(schema.regex, schema.regexFlags ?? '');
            if (!regex.test(str)) {
                this.errors.push({ path, message: `must be in allowed format` });
                valid = false;
            }
        }
        return valid ? str : this.defaultValue(schema);
    }

    protected decodeObject<T>(schema: ObjectSchemaDef<T>, value: unknown, path: string) {
        const propKeys = new Set<string>();
        const result: any = {};
        const original: any = value;
        for (const [key, propSchema] of Object.entries(schema.properties)) {
            const value = original[key];
            const decoded = this.decodeAny(propSchema as SchemaDef<any>, value, `${path}.${key}`);
            if (decoded !== undefined) {
                result[key] = decoded;
            }
            propKeys.add(key);
        }
        if (schema.additionalProperties) {
            for (const [key, value] of Object.entries(original)) {
                if (propKeys.has(key)) {
                    continue;
                }
                result[key] = this.decodeAny(schema.additionalProperties, value, `${path}.${key}`);
            }
        }
        return result;
    }

    protected decodeArray<T>(schema: ArraySchemaDef<T>, value: unknown, path: string): T[] {
        const result: any[] = [];
        const original = value as any[];
        for (const value of original) {
            const item = this.decodeAny(schema.items, value, `${path}.*`);
            result.push(item);
        }
        return result;
    }

    protected decodeRef(schemaId: string, value: unknown, path: string): any {
        const refSchema = this.schema.getRef(schemaId);
        if (!refSchema) {
            this.errors.push({ path, message: `unknown type ${schemaId}` });
            return undefined;
        }
        return this.decodeAny(refSchema, value, path);
    }

    protected defaultValue(schema: { type: SchemaDefType; default?: any; optional?: true; nullable?: true }) {
        const schemaDefault = schema.default;
        if (typeof schemaDefault === 'function') {
            return schemaDefault();
        }
        return schemaDefault ?? (schema.optional ? undefined : schema.nullable ? null : defaults[schema.type]);
    }

}
