import assert from 'assert';

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

const PriceSchema = new Schema<Price>({
    type: 'object',
    properties: {
        value: { type: 'integer' },
        currency: {
            type: 'string',
            enum: ['gbp', 'eur', 'usd'],
            default: 'gbp',
        },
    },
});

const ProductSchema = new Schema<Product>({
    type: 'object',
    properties: {
        title: {
            type: 'string',
            default: 'Unknown Product',
        },
        price: PriceSchema.schema,
        salePrice: { ...PriceSchema.schema, optional: true },
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
});


describe('decode', () => {

    describe('with defaults', () => {

        it('empty object', () => {
            const product = ProductSchema.decode({});
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
            const product = ProductSchema.decode({
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

        it('throws on invalid values', () => {
            try {
                PriceSchema.decode({
                    value: 'foo',
                    currency: 'bar',
                });
            } catch (error: any) {
                assert.strictEqual(error.name, 'ValidationError');
                assert.deepStrictEqual(error.details.errors, [
                    { path: '.value', message: 'must be integer' },
                    { path: '.currency', message: 'must be an allowed value' },
                ]);
            }
        });

    });

    describe('strict required', () => {

        it('throws if required fields are missing', () => {
            try {
                PriceSchema.decode({}, { strictRequired: true });
                throw new Error('Unexpected success');
            } catch (err: any) {
                assert.strictEqual(err.name, 'ValidationError');
                assert.deepStrictEqual(err.details.errors, [{ path: '.value', message: 'must not be null' }]);
            }
        });

        it('does not throw if schema default is specified', () => {
            const price = PriceSchema.decode({ value: 123 }, { strictRequired: true });
            assert.deepStrictEqual(price, { value: 123, currency: 'gbp' });
        });

    });

});
