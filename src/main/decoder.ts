import { Exception } from 'typesafe-exception';

import { DecodeJob } from './job';
import { Schema } from './schema';
import { SchemaStore } from './store';
import { capitalize } from './util';

export class ValidationError extends Exception<{ errors: DecodeError[] }> {
    status = 400;

    constructor(schema: Schema<unknown>, errors: DecodeError[]) {
        super('ValidationError', { errors });
        const type = capitalize(schema.id ?? schema.type);
        const msg = this.formatMessage(errors);
        this.message = `${type} validation failed:\n${msg}`;
    }

    protected formatMessage(errors: DecodeError[]) {
        return errors.map(e => {
            const pointer = e.path.join('.');
            return `  - ${pointer} ${e.path}`;
        }).join('\n');
    }
}

export interface DecodeError {
    path: string[];
    message: string;
}

export interface DecodeOptions {
    throw?: boolean;
    refs?: Schema<unknown>[];
}

export function decode<T>(schema: Schema<T>, value: unknown, options: DecodeOptions = {}): T {
    return new SchemaDecoder(schema).decode(value, options);
}

export class SchemaDecoder<T> {
    readonly schema: Schema<T>;
    readonly store: SchemaStore;

    constructor(schema: Schema<T>, store?: SchemaStore) {
        this.schema = schema;
        this.store = new SchemaStore(store).add(schema);
    }

    decode(value: unknown, options: DecodeOptions = {}): T {
        return new DecodeJob(this, value, options).decode();
    }

}
