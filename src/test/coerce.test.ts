import assert from 'assert';

import { coerce } from '../main/coerce.js';
import { SchemaDefType } from '../main/schema-def.js';

describe('coerce', () => {

    describe('to boolean', () => {
        testCase('boolean', undefined, undefined);
        testCase('boolean', null, undefined);
        testCase('boolean', false, false);
        testCase('boolean', true, true);
        testCase('boolean', 0, false);
        testCase('boolean', 1, true);
        testCase('boolean', 42, true);
        testCase('boolean', 'true', true);
        testCase('boolean', '  true  ', true);
        testCase('boolean', 'false', false);
        testCase('boolean', '  false  ', false);
        testCase('boolean', 'TrUe', true);
        testCase('boolean', 'FaLsE', false);
        testCase('boolean', { foo: 123 }, undefined);
        testCase('boolean', { true: 1 }, undefined);
        testCase('boolean', [], undefined);
        testCase('boolean', [true], true);
        testCase('boolean', [false], false);
    });

    describe('to number', () => {
        testCase('number', undefined, undefined);
        testCase('number', null, undefined);
        testCase('number', false, 0);
        testCase('number', true, 1);
        testCase('number', 0, 0);
        testCase('number', 1, 1);
        testCase('number', 42, 42);
        testCase('number', 42.5, 42.5);
        testCase('number', 'something', undefined);
        testCase('number', '42', 42);
        testCase('number', '  42  ', 42);
        testCase('number', '  42.5  ', 42.5);
        testCase('number', '  abs 42.5  ', undefined);
        testCase('number', { foo: 123 }, undefined);
        testCase('number', [], undefined);
        testCase('number', ['foo'], undefined);
        testCase('number', [42], 42);
    });

    describe('to integer', () => {
        testCase('integer', undefined, undefined);
        testCase('integer', null, undefined);
        testCase('integer', false, 0);
        testCase('integer', true, 1);
        testCase('integer', 0, 0);
        testCase('integer', 1, 1);
        testCase('integer', 42, 42);
        testCase('integer', 42.5, 42);
        testCase('integer', 'something', undefined);
        testCase('integer', '42', 42);
        testCase('integer', '  42  ', 42);
        testCase('integer', '  42.5  ', 42);
        testCase('integer', '  abs 42.5  ', undefined);
        testCase('integer', { foo: 123 }, undefined);
        testCase('integer', [], undefined);
        testCase('integer', ['foo'], undefined);
        testCase('integer', [42], 42);
        testCase('integer', [42.5], 42);
    });

    describe('to string', () => {
        testCase('string', undefined, '');
        testCase('string', null, '');
        testCase('string', false, 'false');
        testCase('string', true, 'true');
        testCase('string', 42, '42');
        testCase('string', 'something', 'something');
        testCase('string', '42', '42');
        testCase('string', { foo: 123 }, '{"foo":123}');
        testCase('string', [], undefined);
        testCase('string', ['foo'], 'foo');
        testCase('string', new URL('https://example.com/'), 'https://example.com/');
    });

    describe('to object', () => {
        testCase('object', undefined, {});
        testCase('object', null, {});
        testCase('object', '', {});
        testCase('object', false, undefined);
        testCase('object', true, undefined);
        testCase('object', 42, undefined);
        testCase('object', 'something', undefined);
        testCase('object', { foo: 123 }, { foo: 123 });
        testCase('object', [], undefined);
        testCase('object', ['foo'], undefined);
        testCase('object', [{ foo: 123 }], { foo: 123 });
    });

    describe('to array', () => {
        testCase('array', undefined, []);
        testCase('array', null, []);
        testCase('array', false, [false]);
        testCase('array', true, [true]);
        testCase('array', 42, [42]);
        testCase('array', 'something', ['something']);
        testCase('array', { foo: 123 }, [{ foo: 123 }]);
        testCase('array', [], []);
        testCase('array', ['foo'], ['foo']);
        testCase('array', [['foo']], [['foo']]);
    });

});

function testCase(desiredType: SchemaDefType, value: unknown, expectedValue: any) {
    it(`${JSON.stringify(value)} -> ${JSON.stringify(expectedValue)}`, () => {
        const coercedValue = coerce(desiredType, value);
        assert.deepStrictEqual(coercedValue, expectedValue);
    });
}
