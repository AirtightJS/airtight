import assert from 'assert';

import { Schema } from '../main/schema.js';
import { SchemaRefs } from '../main/schema-def';

describe('schema', () => {

    describe('type: boolean', () => {
        it('coerce from basic types', () => {
            assert.strictEqual(new Schema<boolean>({ type: 'boolean' }).decode('foo'), false);
            assert.strictEqual(new Schema<boolean>({ type: 'boolean' }).decode('false'), false);
            assert.strictEqual(new Schema<boolean>({ type: 'boolean' }).decode('true'), true);
            assert.strictEqual(new Schema<boolean>({ type: 'boolean' }).decode(1), true);
        });

        it('applies default for invalid values', () => {
            assert.strictEqual(new Schema<boolean>({ type: 'boolean' }).decode('foo'), false);
            assert.strictEqual(new Schema<boolean>({ type: 'boolean', default: true }).decode('foo'), true);
        });
    });

    describe('type: number', () => {
        it('coerce from basic types', () => {
            assert.strictEqual(new Schema<number>({ type: 'number' }).decode('foo'), 0);
            assert.strictEqual(new Schema<number>({ type: 'number' }).decode('false'), 0);
            assert.strictEqual(new Schema<number>({ type: 'number' }).decode(true), 1);
            assert.strictEqual(new Schema<number>({ type: 'number' }).decode('42'), 42);
            assert.strictEqual(new Schema<number>({ type: 'number' }).decode('42.5'), 42.5);
        });

        it('applies default for invalid values', () => {
            assert.strictEqual(new Schema<number>({ type: 'number' }).decode('foo'), 0);
            assert.strictEqual(new Schema<number>({ type: 'number', default: 42 }).decode('foo'), 42);
        });
    });

    describe('type: integer', () => {
        it('coerce from basic types', () => {
            assert.strictEqual(new Schema<number>({ type: 'integer' }).decode('foo'), 0);
            assert.strictEqual(new Schema<number>({ type: 'integer' }).decode('false'), 0);
            assert.strictEqual(new Schema<number>({ type: 'integer' }).decode(true), 1);
            assert.strictEqual(new Schema<number>({ type: 'integer' }).decode('42'), 42);
            assert.strictEqual(new Schema<number>({ type: 'integer' }).decode('42.5'), 42);
            assert.strictEqual(new Schema<number>({ type: 'integer' }).decode(42.5), 42);
        });

        it('applies default for invalid values', () => {
            assert.strictEqual(new Schema<number>({ type: 'integer' }).decode('foo'), 0);
            assert.strictEqual(new Schema<number>({ type: 'integer', default: 42 }).decode('foo'), 42);
        });
    });

    describe('type: object', () => {

        context('simple properties', () => {
            type T = {
                foo: string;
                bar: number;
                baz: boolean;
            };
            const schema = new Schema<T>({
                type: 'object',
                properties: {
                    foo: { type: 'string' },
                    bar: { type: 'number' },
                    baz: { type: 'boolean' },
                }
            });

            it('decodes each property', () => {
                assert.deepStrictEqual(schema.decode({
                    foo: '123',
                    bar: '42.5',
                    baz: true,
                }), {
                    foo: '123',
                    bar: 42.5,
                    baz: true,
                });
            });

            it('applies defaults', () => {
                assert.deepStrictEqual(schema.decode({}), {
                    foo: '',
                    bar: 0,
                    baz: false,
                });
            });
        });

        context('additional properties', () => {

            it('decodes additional properties when allowed', () => {
                type T = {
                    foo: string;
                    [key: string]: string;
                };
                const schema = new Schema<T>({
                    type: 'object',
                    properties: {
                        foo: { type: 'string' },
                    },
                    additionalProperties: { type: 'string' },
                });
                assert.deepStrictEqual(schema.decode({
                    foo: 123,
                    bar: true,
                    baz: 'one',
                    buz: null
                }), {
                    foo: '123',
                    bar: 'true',
                    baz: 'one',
                    buz: '',
                });
            });

            it('drops additional properties when not allowed', () => {
                type T = {
                    foo: string;
                };
                const schema = new Schema<T>({
                    type: 'object',
                    properties: {
                        foo: { type: 'string' }
                    },
                });
                assert.deepStrictEqual(schema.decode({
                    foo: 123,
                    bar: true,
                    baz: 'one',
                    buz: null
                }), {
                    foo: '123',
                });
            });

        });

        context('nested objects', () => {
            type T = {
                prop: string;
                obj: {
                    foo: string;
                };
            };
            const schema = new Schema<T>({
                type: 'object',
                properties: {
                    prop: { type: 'string' },
                    obj: {
                        type: 'object',
                        properties: {
                            foo: { type: 'string' },
                        }
                    }
                }
            });

            it('decodes recursively', () => {
                assert.deepStrictEqual(schema.decode({}), {
                    prop: '',
                    obj: {
                        foo: '',
                    }
                });
            });
        });

        context('nullable, optional', () => {
            type T = {
                foo?: string;
                bar: string | null;
                baz?: string | null;
            };
            const schema = new Schema<T>({
                type: 'object',
                properties: {
                    foo: { type: 'string', optional: true },
                    bar: { type: 'string', nullable: true },
                    baz: { type: 'string', optional: true, nullable: true },
                }
            });

            it('applies defaults when unspecified', () => {
                assert.deepStrictEqual(schema.decode({}), {
                    bar: null,
                });
            });

            it('omits invalid optionals', () => {
                assert.deepStrictEqual(schema.decode({
                    foo: {},
                    bar: {},
                    baz: {}
                }), {
                    bar: null,
                });
            });
        });
    });

    describe('type: ref', () => {

        context('simple recursion', () => {
            interface Node {
                data: string;
                children: Node[];
            }

            const schema = new Schema<Node>({
                id: 'Node',
                type: 'object',
                properties: {
                    data: { type: 'string' },
                    children: {
                        type: 'array',
                        items: { type: 'ref', schemaId: 'Node' },
                    }
                }
            });

            it('decodes recursive objects', () => {
                const decoded = schema.decode({
                    data: 'foo',
                    children: [
                        { data: 'bar' },
                        {
                            data: 'baz',
                            children: [
                                { data: 'fuz' },
                            ]
                        },
                    ]
                });
                assert.deepStrictEqual(decoded, {
                    data: 'foo',
                    children: [
                        {
                            data: 'bar',
                            children: [],
                        },
                        {
                            data: 'baz',
                            children: [
                                {
                                    data: 'fuz',
                                    children: [],
                                },
                            ]
                        },
                    ]
                });
            });
        });

        context('mutual recursion', () => {

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

            it('decodes with external references using schema store', () => {
                assert.deepStrictEqual(
                    FooSchema.decode({ bar: { foo: { bar: {} } } }),
                    { bar: { foo: { bar: {} } } });
                assert.deepStrictEqual(
                    BarSchema.decode({ foo: { bar: {} } }),
                    { foo: { bar: {} } });
            });

        });

    });

});
