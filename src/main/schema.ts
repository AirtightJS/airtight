export type Schema<T> =
    unknown extends T ? UnknownSchema : (
        (StrictTypeSchema<T> | AnySchema | RefSchema) &
        (undefined extends T ? { optional: true } : {}) &
        (null extends T ? { nullable: true } : {})
    );

export type SchemaWithId<T> = Schema<T> & { id: string };

export type SchemaType = Schema<any>['type'];

export type StrictTypeSchema<T> = (
    T extends boolean ? BooleanSchema :
    T extends number ? NumberSchema :
    T extends string ? StringSchema :
    T extends Array<infer P> ? ArraySchema<P>:
    T extends object ? ObjectSchema<T> :
    never
);

export type UnknownSchema = (
    AnySchema | RefSchema |
    BooleanSchema | NumberSchema | StringSchema |
    ObjectSchema<unknown> | ArraySchema<unknown>
) & { optional?: true; nullable?: true };

export type BaseSchema<T> = {
    id?: string;
    title?: string;
    description?: string;
    metadata?: any;
    default?: T | (() => T);
};

export type AnySchema = {
    type: 'any';
} & BaseSchema<any>;

export type RefSchema = {
    type: 'ref';
    schemaId: string;
};

export type BooleanSchema = {
    type: 'boolean';
} & BaseSchema<boolean>;

export type NumberSchema = {
    type: 'number' | 'integer';
    minimum?: number;
    maximum?: number;
} & BaseSchema<number>;

export type StringSchema = {
    type: 'string';
    regex?: string;
    regexFlags?: string;
    enum?: string[];
} & BaseSchema<string>;

export type ObjectSchema<T> = {
    type: 'object';
    properties: PropertiesSpec<T>;
    additionalProperties?: Schema<any>;
} & BaseSchema<T>;

export type ArraySchema<T> = {
    type: 'array';
    items: Schema<T>;
} & BaseSchema<T[]>;

export type PropertiesSpec<T> = {
    [K in keyof T]-?: Schema<T[K]>;
};
