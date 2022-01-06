import { SchemaType } from './schema';

type DefaultsMap = {
    [K in SchemaType]: any;
}

export const defaults: DefaultsMap = {
    any: null,
    array: [],
    boolean: false,
    integer: 0,
    number: 0,
    object: {},
    string: '',
};
