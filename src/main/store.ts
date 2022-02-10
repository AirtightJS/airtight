import { Schema } from './schema';
import { SchemaDef } from './schema-def';
import { SchemaDefWithId } from './schema-def.js';

export class SchemaStore {
    protected map = new Map<string, SchemaDef<unknown>>();

    constructor(readonly parent: SchemaStore | null = null) {}

    register<T>(schema: SchemaDefWithId<T>): Schema<T> {
        this.map.set(schema.id, schema);
        return new Schema(schema, this);
    }

    add(...schemas: SchemaDef<unknown>[]): this {
        for (const schema of schemas) {
            const id = (schema as any).id;
            if (id) {
                this.map.set(id, schema);
            }
        }
        return this;
    }

    get<T>(schemaId: string): Schema<T> | null {
        const sch = this.map.get(schemaId);
        if (sch) {
            return new Schema<T>(sch, this);
        }
        return this.parent?.get(schemaId) ?? null;
    }

}
