import { DecodeOptions, SchemaDecoder } from './decoder';
import { Schema } from './schema';

export function decode<T>(schema: Schema<T>, value: unknown, options: DecodeOptions = {}): T {
    return new SchemaDecoder(schema).decode(value, options);
}
