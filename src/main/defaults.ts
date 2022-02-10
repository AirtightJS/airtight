import { SchemaDefType } from './schema-def';

type DefaultsMap = {
    [K in SchemaDefType]: any;
};

export const defaults: DefaultsMap = {
    any: null,
    ref: null,
    array: [],
    boolean: false,
    integer: 0,
    number: 0,
    object: {},
    string: '',
};
