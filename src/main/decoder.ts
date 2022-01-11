import { Exception } from 'typesafe-exception';

import { DecodeJob } from './job';
import { Schema, SchemaLike } from './schema';
import { SchemaStore } from './store';

export class ValidationError extends Exception<{ errors: DecodeError[] }> {
    status = 400;

    constructor(errors: DecodeError[]) {
        super('Validation failed', { errors });
    }
}

export interface DecodeError {
    path: string[];
    message: string;
}

export interface DecodeOptions {
    throw?: boolean;
    refs?: SchemaLike[];
}

export function decode<T>(schema: Schema<T>, value: unknown, options: DecodeOptions = {}): T {
    return new SchemaDecoder(schema).decode(value, options);
}

export class SchemaDecoder<T> {
    readonly schema: Schema<T>;
    readonly store: SchemaStore;

    constructor(schema: Schema<T>, store?: SchemaStore) {
        this.schema = schema;
        this.store = store ?? new SchemaStore().add(schema);
    }

    decode(value: unknown, options: DecodeOptions = {}): T {
        return new DecodeJob(this, value, options).decode();
    }

}
