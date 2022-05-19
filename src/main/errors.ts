import { SchemaDef } from './schema-def.js';

export class ValidationError extends Error {
    status = 400;
    details: { errors: DecodeError[] };

    constructor(schema: SchemaDef, errors: DecodeError[]) {
        super();
        const msg = this.formatMessage(errors);
        const type = schema.id ?? schema.type;
        this.message = `${type} validation failed:\n${msg}`;
        this.name = 'ValidationError';
        this.details = {
            errors,
        };
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
