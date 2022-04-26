export type SchemaDef<T = unknown> =
    unknown extends T ? UnknownSchemaDef : (
        (StrictSchemaDef<T> | AnySchemaDef | RefSchemaDef) &
        (undefined extends T ? { optional: true } : {}) &
        (null extends T ? { nullable: true } : {}) &
        BaseSchemaDef<T>
    );

export type SchemaDefWithId<T = unknown> = SchemaDef<T> & { id: string };

export type SchemaDefType = SchemaDef<any>['type'];

export type StrictSchemaDef<T> = (
    T extends boolean ? BooleanSchemaDef :
    T extends number ? NumberSchemaDef :
    T extends string ? StringSchemaDef :
    T extends Array<infer P> ? ArraySchemaDef<P>:
    T extends object ? ObjectSchemaDef<T> :
    never
);

export type UnknownSchemaDef = (
    AnySchemaDef | RefSchemaDef |
    BooleanSchemaDef | NumberSchemaDef | StringSchemaDef |
    ObjectSchemaDef<unknown> | ArraySchemaDef<unknown>
) & { optional?: true; nullable?: true } & BaseSchemaDef<unknown>;

export type SchemaRefs = SchemaDefWithId<unknown>[];

export type BaseSchemaDef<T> = {
    id?: string;
    title?: string;
    description?: string;
    metadata?: any;
    default?: T | (() => T);
    refs?: SchemaRefs;
};

export type AnySchemaDef = {
    type: 'any';
};

export type RefSchemaDef = {
    type: 'ref';
    schemaId: string;
};

export type BooleanSchemaDef = {
    type: 'boolean';
};

export type NumberSchemaDef = {
    type: 'number' | 'integer';
    minimum?: number;
    maximum?: number;
};

export type StringSchemaDef = {
    type: 'string';
    regex?: string;
    regexFlags?: string;
    enum?: string[];
};

export type ObjectSchemaDef<T> = {
    type: 'object';
    properties: ObjectPropsDef<T>;
    additionalProperties?: SchemaDef<any>;
};

export type ArraySchemaDef<T> = {
    type: 'array';
    items: SchemaDef<T>;
};

export type ObjectPropsDef<T> = {
    [K in keyof T]-?: SchemaDef<T[K]>;
};
