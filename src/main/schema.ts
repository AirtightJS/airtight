export type Schema<T> = TypedSchema<T>;

export type SchemaType = TypedSchema<any>['type'];

export type TypedSchema<T> = (
    T extends boolean ? BooleanSchema :
    T extends number ? NumberSchema :
    T extends string ? StringSchema :
    T extends Array<infer P> ? ArraySchema<P> :
    T extends object ? ObjectSchema<T> :
    AnySchema
);

export type ReferenceSchema = { reference: string };

export type BaseSchema = {
    id?: string;
    title?: string;
    description?: string;
    nullable?: true;
}

export type AnySchema = {
    type: 'any',
    default?: any,
} & BaseSchema;

export type BooleanSchema = {
    type: 'boolean';
    default?: boolean;
} & BaseSchema

export type NumberSchema = {
    type: 'number' | 'integer';
    default?: number;
    minimum?: number;
    maximum?: number;
} & BaseSchema

export type StringSchema = {
    type: 'string';
    default?: string;
    pattern?: string;
    enum?: string[];
} & BaseSchema

export type ObjectSchema<T> = {
    type: 'object';
    default?: object;
    properties: PropertiesSpec<T>;
    additionalProperties?: Schema<any>;
} & BaseSchema

export type ArraySchema<T> = {
    type: 'array';
    default?: Array<any>;
    items: Schema<T>;
} & BaseSchema

export type NullableSchema<T> = Schema<T> & { nullable: true };
export type RequiredSchema<T> = Omit<Schema<T>, 'nullable'>;

export type PropertiesSpec<T> = {
    [K in keyof T]-?: InferNullableSchema<T, K>;
}

type InferNullableSchema<T, K extends keyof T> =
    T[K] extends Nullable<T> ? NullableSchema<T[K]> : RequiredSchema<T[K]>;

type Nullable<T> = undefined extends T ? T : (null extends T ? T : never);
