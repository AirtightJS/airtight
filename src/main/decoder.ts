import { DecodeJob } from './job';
import { Schema } from './schema';
import { SchemaStore } from './store';
import { DeepPartial } from './util.js';

export interface DecodeOptions {
    throw?: boolean;
}

export class SchemaDecoder<T> {
    readonly schema: Schema<T>;
    readonly store: SchemaStore;

    constructor(schema: Schema<T>, store?: SchemaStore) {
        this.schema = schema;
        this.store = new SchemaStore(store).add(schema);
    }

    create(partials: DeepPartial<T>): T {
        return this.decode(partials, { throw: false });
    }

    decode(value: unknown, options: DecodeOptions = {}): T {
        return new DecodeJob(this, value, options).decode();
    }

}
