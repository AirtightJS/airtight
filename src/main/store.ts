import { SchemaWithId } from '.';
import { SchemaDecoder } from './decoder';
import { Schema } from './schema';

export class SchemaStore {
    protected map = new Map<string, Schema<unknown>>();

    constructor(readonly parent: SchemaStore | null = null) {}

    register<T>(schema: SchemaWithId<T>): SchemaDecoder<T> {
        this.map.set(schema.id, schema);
        return new SchemaDecoder(schema, this);
    }

    add(...schemas: Schema<unknown>[]): this {
        for (const schema of schemas) {
            const id = (schema as any).id;
            if (id) {
                this.map.set(id, schema);
            }
        }
        return this;
    }

    get<T>(schemaId: string): Schema<T> | null {
        const schema = this.map.get(schemaId);
        if (schema) {
            return schema as Schema<T>;
        }
        return this.parent?.get(schemaId) ?? null;
    }

}
