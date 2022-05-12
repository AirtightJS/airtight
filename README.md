# Airtight

JSON Schema inspired library for validating and decoding messages.

**Status:** beta

## Key features

- 👗 Very slim — about 4KB minified, few hundred bytes gzipped
- ⚡️ Blazing fast
- 🔨 Simple and well defined, gets the job done
- 🗜 Very strict feature set
- 🔬 100% type safe

## Why?

[JSON Schema](https://json-schema.org/) is great, but sometimes it can be a bit too much.

- It has a lot of **features**. Some of the features are seldomly used in practice, but still contribute to the size of standards-compliant libraries. More importantly, combinations of different features raise the complexity exponentially, resulting in non-obvious behaviour and, ultimately, bugs in production.

- It's too **flexible**. You can write definitions, references, mix in different references and keywords with combinators, implement mutually recursive schemas, etc, etc. Allowing too much means limiting the capabilities of how schemas can be consumed for the purposes other than validation (e.g. good luck generating a reasonable documentation for a yarn ball of `$oneOf`, `$anyOf` and `$ref`).

- It has an Achilles' heel: `{}` is a perfectly valid schema which does no validation whatsoever. If you do not validates schemas themselves, then they are prone to errors like `{ tpye: 'number' }` which does no validation. This makes TypeScript users cringe because it means `any`-as-a-fallback.

- Type conversions and coercions are not currently part of standards. This makes it tricky to use for the purposes like message encoding/decoding (i.e. similar to Protobuf) where schema evolution should be taken in consideration.

- Some libraries offer some extras (defaults, coercion, etc) but tend to perform modifications in-place. We think this is a signficant downside to API ergonomics and opted to never apply in-place modifications.

## API Cheatsheet

```ts
// Type definitions for compile-time checks

interface Product {
    title: string;
    price: Price;
    salePrice?: Price;
    promoCode: string | null;
    tags: string[];
}

interface Price {
    value: number;
    currency: 'gbp' | 'eur' | 'usd';
}

// Schema performs the checks in runtime so it needs a runtime spec.
// TypeScript makes sure that the runtime spec matches compile-time types
// (including all nested types and designations like `optional`, `nullable`, etc).

const PriceSchema: SchemaDef<Price> = {
    type: 'object',
    properties: {
        value: { type: 'integer' },
        currency: {
            type: 'string',
            enum: ['gbp', 'eur', 'usd'],
            default: 'gbp',
        },
    },
};

const ProductSchema: SchemaDef<Product> = {
    type: 'object',
    properties: {
        title: {
            type: 'string',
            default: 'Unknown Product',
        },
        price: PriceSchema,
        salePrice: { ...PriceSchema, optional: true },
        promoCode: {
            type: 'string',
            nullable: true,
        },
        tags: {
            type: 'array',
            items: {
                type: 'string',
            }
        },
    }
};

// Schema API

// Create an object with defaults (argument is DeepPartial<T>):

const o1 = ProductSchema.create({});

assert.deepStrictEqual(o1, {
    title: 'Unknown Product',
    price: { value: 0, currency: 'gbp' },
    promoCode: null,
    tags: [],
});

// Decode an object (argument is unknown):

const o2 = ProductSchema.decode({
    title: 'Shampoo',
    price: { value: '42' },
});

assert.deepStrictEqual(o1, {
    title: 'Shampoo',
    price: { value: 42, currency: 'gbp' },
    promoCode: null,
    tags: [],
});

// Decode throws if validation fails

try {
    ProductSchema.decode({
        title: { something: 'wrong' },
    });
} catch (error) {
    // ValidationError: object validation failed:
    // - .title must be a string
}
```

## Usage

- Create a schema with `new Schema<T>({ ... })` where `T` is either a `type` or an `interface`. TypeScript will guide you through composing a schema definition that matches `T`.

- `schema.decode(value: unknown)` decodes the message as follows:

    - if the schema is nullable or optional and the value is null-ish, either `null` or `undefined` is returned according to schema
    - if the schema is required (i.e. neither nullable nor optional) and the value is null-ish, the default is used; this is not considered a validation failure
    - `type: 'any'` schema is returned as-is
    - `type: 'ref'` schema is dereferenced and validated
    - the value is coerced to schema type if possible (see below); type conversion is not considered a validation failure
    - per-type validations are applied (see below), recursing into object properties and array items

- `schema.create(value: DeepPartial<T>)` is a convenience method that offers an additional advantage of type-checking `value` — useful for creating objects programmatically from code so that the arguments you pass can be statically checked.

## Supported types

Airtight supports exactly 8 types with following validators:

1. `type: 'boolean'`
2. `type: 'number'`
    - `minimum?: number`
    - `maximum?: number`
3. `type: 'integer'`
    - `minimum?: number`
    - `maximum?: number`
4. `type: 'string'`
    - `regex?: string`
    - `regexFlags?: string`
    - `enum?: string[]`
5. `type: 'object'`
    - `properties: ObjectPropsDef<T>`
    - `additionalProperties?: SchemaDef<any>`
6. `type: 'array'`
    - `type: 'array'`
    - `items: SchemaDef<T>`
7. `type: 'any'` means no validation and has to be explicit
8. `type: 'ref'` (see [Recursive schema](#recursive-schema))

Additionally, all schema definitions support following fields:

- `id?: string` — a string identifier used in referencing and documentation
- `title?: string`
- `description?: string`
- `metadata?: any` — arbitrary data attached to schema
- `default?: T | (() => T)` — used by `decode` in non-throw mode when validation fails
- `refs?: SchemaRefs` — a collection of auxiliary schema that can be used in `type: 'ref'`

### Type conversion

Type conversion happens automatically when the actual type does not match the desired type according to the following rules:

| Schema type      | Type (Value)          | Result                   |
|------------------|-----------------------|--------------------------|
| boolean          | number (<= 0)         | false                    |
| boolean          | number (> 0)          | true                     |
| boolean          | number (any other)    | ❌                        |
| boolean          | string ("true")       | true                     |
| boolean          | string ("false")      | false                    |
| boolean          | string (any other)    | ❌                        |
| number           | string ("42")         | 42                       |
| number           | boolean (true)        | 1                        |
| number           | boolean (false)       | 0                        |
| integer          | string ("42")         | 42                       |
| integer          | string ("42.234")     | 42                       |
| integer          | boolean (true)        | 1                        |
| integer          | boolean (false)       | 0                        |
| integer          | number (42.234)       | 42                       |
| string           | null                  | ''                       |
| string           | number (42.234)       | '42.243'                 |
| string           | boolean (true)        | 'true'                   |
| string           | boolean (false)       | 'false'                  |
| array            | null                  | ❌                        |
| array            | any (value)           | [value]                  |
| any              | array of length 1     | convert(array[0])        |

Summary:

- booleans are converted only from exact strings and number values (0, 1)
- integers are rounded where possible
- any value can be converted to a single-element array, except `null`
- single-element array can be converted to any other type
- no types are converted to/from objects

As mentioned previously, type conversion does not count as validation error.
A failed type conversion means that the default value is used if `throw: false` or the error is thrown if `throw: true`.

### Recursive schema

It is possible to create a schema with mutual recursion like this:

```ts
interface Foo { bar?: Bar }
interface Bar { foo?: Foo }

const refs: SchemaRefs = [
    {
        id: 'Foo',
        type: 'object',
        properties: {
            bar: { type: 'ref', schemaId: 'Bar', optional: true, },
        }
    },
    {
        id: 'Bar',
        type: 'object',
        properties: {
            foo: { type: 'ref', schemaId: 'Foo', optional: true, },
        }
    }
];

const FooSchema = new Schema<Foo>({
    type: 'ref',
    schemaId: 'Foo',
    refs,
});

const BarSchema = new Schema<Foo>({
    type: 'ref',
    schemaId: 'Bar',
    refs,
});

assert.deepStrictEqual(
    FooSchema.decode({ bar: { foo: { bar: {} } } }),
    { bar: { foo: { bar: {} } } });
assert.deepStrictEqual(
    BarSchema.decode({ foo: { bar: {} } }),
    { foo: { bar: {} } });
```
