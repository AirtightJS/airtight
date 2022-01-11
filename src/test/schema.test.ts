import assert from 'assert';

import { decode } from '../main/decoder';
import { Schema } from '../main/schema';
import { SchemaStore } from '../main/store';

describe('schema', () => {

    describe('type: boolean', () => {
        it('coerce from basic types', () => {
            assert.strictEqual(decode<boolean>({ type: 'boolean' }, 'foo'), false);
            assert.strictEqual(decode<boolean>({ type: 'boolean' }, 'false'), false);
            assert.strictEqual(decode<boolean>({ type: 'boolean' }, 'true'), true);
            assert.strictEqual(decode<boolean>({ type: 'boolean' }, 1), true);
        });

        it('applies default for invalid values', () => {
            assert.strictEqual(decode<boolean>({ type: 'boolean' }, 'foo'), false);
            assert.strictEqual(decode<boolean>({ type: 'boolean', default: true }, 'foo'), true);
        });
    });

    describe('type: number', () => {
        it('coerce from basic types', () => {
            assert.strictEqual(decode<number>({ type: 'number' }, 'foo'), 0);
            assert.strictEqual(decode<number>({ type: 'number' }, 'false'), 0);
            assert.strictEqual(decode<number>({ type: 'number' }, true), 1);
            assert.strictEqual(decode<number>({ type: 'number' }, '42'), 42);
            assert.strictEqual(decode<number>({ type: 'number' }, '42.5'), 42.5);
        });

        it('applies default for invalid values', () => {
            assert.strictEqual(decode<number>({ type: 'number' }, 'foo'), 0);
            assert.strictEqual(decode<number>({ type: 'number', default: 42 }, 'foo'), 42);
        });
    });

    describe('type: integer', () => {
        it('coerce from basic types', () => {
            assert.strictEqual(decode<number>({ type: 'integer' }, 'foo'), 0);
            assert.strictEqual(decode<number>({ type: 'integer' }, 'false'), 0);
            assert.strictEqual(decode<number>({ type: 'integer' }, true), 1);
            assert.strictEqual(decode<number>({ type: 'integer' }, '42'), 42);
            assert.strictEqual(decode<number>({ type: 'integer' }, '42.5'), 42);
            assert.strictEqual(decode<number>({ type: 'integer' }, 42.5), 42);
        });

        it('applies default for invalid values', () => {
            assert.strictEqual(decode<number>({ type: 'integer' }, 'foo'), 0);
            assert.strictEqual(decode<number>({ type: 'integer', default: 42 }, 'foo'), 42);
        });
    });

    describe('type: object', () => {

        context('simple properties', () => {
            type T = {
                foo: string;
                bar: number;
                baz: boolean;
            };
            const schema: Schema<T> = {
                type: 'object',
                properties: {
                    foo: { type: 'string' },
                    bar: { type: 'number' },
                    baz: { type: 'boolean' },
                }
            };

            it('decodes each property', () => {
                assert.deepStrictEqual(decode(schema, {
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
                assert.deepStrictEqual(decode(schema, {}), {
                    foo: '',
                    bar: 0,
                    baz: false,
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
            const schema: Schema<T> = {
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
            };

            it('decodes recursively', () => {
                assert.deepStrictEqual(decode(schema, {}), {
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
            const schema: Schema<T> = {
                type: 'object',
                properties: {
                    foo: { type: 'string', optional: true },
                    bar: { type: 'string', nullable: true },
                    baz: { type: 'string', optional: true, nullable: true },
                }
            };

            it('applies defaults when unspecified', () => {
                assert.deepStrictEqual(decode(schema, {}), {
                    bar: null,
                });
            });

            it('omits invalid optionals', () => {
                assert.deepStrictEqual(decode(schema, {
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

            const schema: Schema<Node> = {
                id: 'Node',
                type: 'object',
                properties: {
                    data: { type: 'string' },
                    children: {
                        type: 'array',
                        items: { type: 'ref', schemaId: 'Node' },
                    }
                }
            };

            it('decodes recursive objects', () => {
                const decoded = decode(schema, {
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

            const store = new SchemaStore();
            const FooSchema = store.createDecoder<Foo>({
                id: 'Foo',
                type: 'object',
                properties: {
                    bar: { type: 'ref', schemaId: 'Bar', optional: true, },
                }
            });

            store.register<Bar>('Bar', {
                type: 'object',
                properties: {
                    foo: { type: 'ref', schemaId: 'Foo', optional: true, },
                }
            });

            it('decodes with external references using schema store', () => {
                const decoded = FooSchema.decode({ bar: { foo: { bar: {} } } });
                assert.deepStrictEqual(decoded, { bar: { foo: { bar: {} } } });
            });

        });

    });

});
