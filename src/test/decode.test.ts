import assert from 'assert';

import { decode } from '../main/decode';
import { Schema } from '../main/schema';

interface Product {
    title: string;
    price: {
        value: number;
        currency: 'gbp' | 'eur' | 'usd';
    },
    tags: string[];
}

const ProductSchema: Schema<Product> = {
    type: 'object',
    properties: {
        title: {
            type: 'string',
            default: 'Unknown Product',
        },
        price: {
            type: 'object',
            properties: {
                value: { type: 'integer' },
                currency: {
                    type: 'string',
                    enum: ['gbp', 'eur', 'usd'],
                },
            },
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
                price: {},
                tags: [],
            });
        });

    });

});
