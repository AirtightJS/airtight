import { DecodeOptions, Schema } from './schema';
import { SchemaDef } from './schema-def';

export function decode<T>(schema: SchemaDef<T>, value: unknown, options: DecodeOptions = {}): T {
    return new Schema(schema).decode(value, options);
}
