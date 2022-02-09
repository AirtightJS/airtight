import { Exception } from 'typesafe-exception';

import { Schema } from './schema';
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
            const pointer = e.path;
            return `  - ${pointer} ${e.path}`;
        }).join('\n');
    }
}

export interface DecodeError {
    path: string;
    message: string;
}
