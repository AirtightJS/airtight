import { DecodeJob } from './job';
import { SchemaDef } from './schema-def';
import { DeepPartial } from './util.js';

export interface DecodeOptions {
    throw?: boolean;
}

export class Schema<T> {
    readonly schema: SchemaDef<T>;

    constructor(schema: SchemaDef<T>) {
        this.schema = schema;
    }

    create(partials: DeepPartial<T>): T {
        return this.decode(partials, { throw: false });
    }

    decode(value: unknown, options: DecodeOptions = {}): T {
        return new DecodeJob(this, value, options).decode();
    }

    validate(value: unknown): void {
        new DecodeJob(this, value, { throw: true }).decode();
    }

}
