export type Schema<T> = (StrictTypeSchema<T> | AnySchema)
    & (undefined extends T ? { optional: true } : {})
    & (null extends T ? { nullable: true } : {});

export type SchemaType = Schema<any>['type'];

export type StrictTypeSchema<T> = (
    T extends boolean ? BooleanSchema :
    T extends number ? NumberSchema :
    T extends string ? StringSchema :
    T extends Array<infer P> ? ArraySchema<P>:
    T extends object ? ObjectSchema<T>:
    never
);

export type ReferenceSchema = { reference: string };

export type BaseSchema = {
    id?: string;
    title?: string;
    description?: string;
}

export type AnySchema = {
    type: 'any',
    default?: any,
} & BaseSchema;

export type BooleanSchema = {
    type: 'boolean';
    default?: boolean;
} & BaseSchema;

export type NumberSchema = {
    type: 'number' | 'integer';
    default?: number;
    minimum?: number;
    maximum?: number;
} & BaseSchema;

export type StringSchema = {
    type: 'string';
    default?: string;
    regex?: string;
    regexFlags?: string;
    enum?: string[];
} & BaseSchema;

export type ObjectSchema<T> = {
    type: 'object';
    default?: object;
    properties: PropertiesSpec<T>;
    additionalProperties?: Schema<any>;
} & BaseSchema;

export type ArraySchema<T> = {
    type: 'array';
    default?: Array<any>;
    items: Schema<T>;
} & BaseSchema;

export type PropertiesSpec<T> = {
    [K in keyof T]-?: Schema<T[K]>;
}
