import { SchemaDecoder } from './decoder';
import { ArraySchema, ObjectSchema, Schema, SchemaLike } from './schema';

export class SchemaStore {
    protected refMap = new Map<string, SchemaLike>();

    constructor(readonly parent: SchemaStore | null = null) {}

    register<T>(id: string, schema: Schema<T>): this {
        this.refMap.set(id, schema);
        this.add(schema);
        return this;
    }

    add(...schemas: SchemaLike[]) {
        for (const schema of schemas) {
            this.buildRefMap(schema);
        }
        return this;
    }

    get<T>(schemaId: string): Schema<T> | null {
        const schema = this.refMap.get(schemaId);
        if (schema) {
            return schema as Schema<T>;
        }
        return this.parent?.get(schemaId) ?? null;
    }

    createDecoder<T>(schema: Schema<T>): SchemaDecoder<T> {
        this.add(schema);
        return new SchemaDecoder(schema, this);
    }

    protected buildRefMap(schema: SchemaLike) {
        if (schema.type === 'ref') {
            return;
        }
        if (schema.id) {
            this.refMap.set(schema.id, schema);
        }
        if (schema.type === 'object') {
            const objSchema = schema as ObjectSchema<any>;
            for (const s of Object.values(objSchema.properties ?? {})) {
                this.buildRefMap(s);
            }
            if (objSchema.additionalProperties) {
                this.buildRefMap(objSchema.additionalProperties);
            }
        }
        if (schema.type === 'array') {
            const arrSchema = schema as ArraySchema<any>;
            if (arrSchema.items) {
                this.buildRefMap(arrSchema.items);
            }
        }
    }

}
