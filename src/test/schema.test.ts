import assert from 'assert';

import { Schema } from '../main/schema.js';
import { SchemaRefs } from '../main/schema-def.js';

describe('schema', () => {

    describe('type: boolean', () => {

        it('coerce from basic types', () => {
            assert.strictEqual(new Schema<boolean>({ type: 'boolean' }).decode('false'), false);
            assert.strictEqual(new Schema<boolean>({ type: 'boolean' }).decode('true'), true);
            assert.strictEqual(new Schema<boolean>({ type: 'boolean' }).decode(1), true);
        });

        it('throws on invalid values', () => {
            assert.throws(() => new Schema<boolean>({ type: 'boolean' }).decode('foo'));
            assert.throws(() => new Schema<boolean>({ type: 'boolean', default: true }).decode('foo'));
        });

    });

    describe('type: string', () => {

        it('coerce from basic types', () => {
            assert.strictEqual(new Schema<string>({ type: 'string' }).decode(true), 'true');
            assert.strictEqual(new Schema<string>({ type: 'string' }).decode(42), '42');
            assert.strictEqual(new Schema<string>({ type: 'string' }).decode(42.5), '42.5');
        });

        it('throws on invalid values', () => {
            assert.throws(() => new Schema<string>({ type: 'string', enum: ['a', 'b'] }).decode('foo'));
        });

        it('users default', () => {
            assert.strictEqual(
                new Schema<string>({ type: 'string', enum: ['a', 'b'], default: 'a' }).decode(undefined),
                'a'
            );
        });

    });

    describe('type: number', () => {

        it('coerce from basic types', () => {
            assert.strictEqual(new Schema<number>({ type: 'number' }).decode(true), 1);
            assert.strictEqual(new Schema<number>({ type: 'number' }).decode('42'), 42);
            assert.strictEqual(new Schema<number>({ type: 'number' }).decode('42.5'), 42.5);
        });

        it('throws on invalid values', () => {
            assert.throws(() => new Schema<number>({ type: 'number' }).decode('foo'));
            assert.throws(() => new Schema<number>({ type: 'number' }).decode('false'));
            assert.throws(() => new Schema<number>({ type: 'number', default: 42 }).decode('foo'));
        });

    });

    describe('type: integer', () => {

        it('coerce from basic types', () => {
            assert.strictEqual(new Schema<number>({ type: 'integer' }).decode(true), 1);
            assert.strictEqual(new Schema<number>({ type: 'integer' }).decode('42'), 42);
            assert.strictEqual(new Schema<number>({ type: 'integer' }).decode('42.5'), 42);
            assert.strictEqual(new Schema<number>({ type: 'integer' }).decode(42.5), 42);
        });

        it('throws on invalid values', () => {
            assert.throws(() => new Schema<number>({ type: 'integer' }).decode('foo'));
            assert.throws(() => new Schema<number>({ type: 'integer', default: 42 }).decode('foo'));
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

        context('properties with default', () => {
            type T = {
                foo: 'a' | 'b';
            };
            const schema = new Schema<T>({
                type: 'object',
                properties: {
                    foo: {
                        type: 'string',
                        enum: ['a', 'b'],
                        default: 'a',
                    },
                }
            });

            it('uses default when property not included', () => {
                assert.deepStrictEqual(schema.decode({}), {
                    foo: 'a'
                });
            });

            it('throws if value is incorrect', () => {
                assert.throws(() => schema.decode({ foo: 'c' }));
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
                foo?: number;
                bar: number | null;
                baz?: number | null;
            };
            const schema = new Schema<T>({
                type: 'object',
                properties: {
                    foo: { type: 'number', optional: true },
                    bar: { type: 'number', nullable: true },
                    baz: { type: 'number', optional: true, nullable: true },
                }
            });

            it('applies defaults when unspecified', () => {
                assert.deepStrictEqual(schema.decode({}), {
                    bar: null,
                });
            });

            it('throws if optionals are invalid', () => {
                assert.throws(() => schema.decode({
                    foo: {},
                    bar: {},
                    baz: {}
                }));
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
