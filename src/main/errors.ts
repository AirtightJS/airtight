import { Exception } from 'typesafe-exception';

import { SchemaDef } from './schema-def.js';

export class ValidationError extends Exception<{ errors: DecodeError[] }> {
    status = 400;

    constructor(schema: SchemaDef, errors: DecodeError[]) {
        super('ValidationError', { errors });
        const msg = this.formatMessage(errors);
        const type = schema.id ?? schema.type;
        this.message = `${type} validation failed:\n${msg}`;
    }

    protected formatMessage(errors: DecodeError[]) {
        const errs = errors.map(e => {
            return `  - ${e.path} ${e.message}`;
        });
        const lines = [...new Set(errs)];
        return lines.sort().join('\n');
    }
}

export interface DecodeError {
    path: string;
    message: string;
}
