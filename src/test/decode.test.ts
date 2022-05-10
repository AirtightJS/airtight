import assert from 'assert';

import { decode } from '../main/decode';
import { SchemaDef } from '../main/schema-def';
import { Schema } from '../main/schema.js';

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


describe('decode', () => {

    describe('with defaults', () => {

        it('empty object', () => {
            const product = decode(ProductSchema, {});
            assert.deepStrictEqual(product, {
                title: 'Unknown Product',
                price: {
                    value: 0,
                    currency: 'gbp',
                },
                promoCode: null,
                tags: [],
            });
        });

        it('type coercion', () => {
            const product = decode(ProductSchema, {
                title: 42,
                price: {
                    value: '42',
                },
                promoCode: 42,
                tags: [42, true, null]
            });
            assert.deepStrictEqual(product, {
                title: '42',
                price: {
                    value: 42,
                    currency: 'gbp'
                },
                promoCode: '42',
                tags: ['42', 'true', ''],
            });
        });

        it('use default for invalid values', () => {
            const price = decode(PriceSchema, {
                value: 'foo',
                currency: 'bar',
            });
            assert.deepStrictEqual(price, {
                value: 0,
                currency: 'gbp',
            });
        });

    });

    describe('throw on invalid', () => {

        it('throws on invalid values', () => {
            try {
                decode(PriceSchema, {
                    value: 'foo',
                    currency: 'bar',
                }, { throw: true });
            } catch (error: any) {
                assert.strictEqual(error.name, 'ValidationError');
                assert.deepStrictEqual(error.details.errors, [
                    { path: '.value', message: 'must be integer' },
                    { path: '.currency', message: 'must be an allowed value' },
                ]);
            }
        });

    });

});
