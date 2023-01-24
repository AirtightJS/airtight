import { DecodeJob, DecodeOptions } from './decode.js';
import { DecodeError } from './errors.js';
import { SchemaDef } from './schema-def.js';
import { DeepPartial } from './util.js';

export interface SchemaLike<T> {
    create(partials: DeepPartial<T>, options: Partial<DecodeOptions>): T;
    decode(value: unknown, options: Partial<DecodeOptions>): T;
    validate(value: unknown): DecodeError[];
}

export class Schema<T> implements SchemaLike<T> {
    readonly schema: SchemaDef<T>;

    protected _refs: Map<string, SchemaDef> | null = null;

    constructor(schema: SchemaDef<T>) {
        this.schema = schema;
    }

    create(partials: DeepPartial<T>, options: Partial<DecodeOptions> = { strictRequired: false }): T {
        return this.decode(partials, options);
    }

    decode(value: unknown, options: Partial<DecodeOptions> = { strictRequired: false }): T {
        return new DecodeJob(this, value, options).decode();
    }

    validate(value: unknown): DecodeError[] {
        const job = new DecodeJob(this, value, { ignoreErrors: true });
        job.decode();
        return job.errors;
    }

    getRef(schemaId: string): SchemaDef | null {
        return this.getRefs().get(schemaId) ?? null;
    }

    getRefs() {
        if (!this._refs) {
            this._refs = new Map();
            this._collectRefs(this._refs, this.schema);
        }
        return this._refs;
    }

    protected _collectRefs(refs: Map<string, SchemaDef>, schema: SchemaDef) {
        if (schema.id) {
            refs.set(schema.id, schema);
        }
        if (schema.refs) {
            for (const ref of schema.refs) {
                this._collectRefs(refs, ref);
            }
        }
        if (schema.type === 'object') {
            if (schema.additionalProperties) {
                this._collectRefs(refs, schema.additionalProperties);
            }
            if (schema.properties) {
                for (const ref of Object.values(schema.properties)) {
                    this._collectRefs(refs, ref as SchemaDef);
                }
            }
        }
        if (schema.type === 'array') {
            if (schema.items) {
                this._collectRefs(refs, schema.items);
            }
        }
    }

}
