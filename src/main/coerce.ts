import { SchemaType } from './schema';
import { DataType, getType } from './util';

type CoercionMap = {
    [P in SchemaType]?: {
        [P in DataType | '*']?: (val: any) => any;
    }
};

const STATIC_COERCIONS: CoercionMap = {
    boolean: {
        number: (val: number) => val === 0 ? false : val === 1 ? true : undefined,
        string: (val: string) => {
            val = val.trim().toLowerCase();
            return val === 'true' ? true :
                val === 'false' ? false :
                    val === '' ? false :
                        undefined;
        },
    },
    number: {
        string: (val: string) => {
            const num = Number(val);
            if (!isNaN(num)) {
                return num;
            }
        },
        boolean: (val: boolean) => val ? 1 : 0,
    },
    integer: {
        number: val => Math.floor(val),
        string: (val: string) => {
            const num = parseInt(val, 10);
            if (!isNaN(num)) {
                return num;
            }
        },
        boolean: (val: boolean) => val ? 1 : 0,
    },
    string: {
        null: (_: null) => '',
        number: (val: number) => val.toString(),
        boolean: (val: boolean) => val.toString(),
    },
    array: {
        'null': (_: null) => undefined,
        '*': (val: unknown) => [val],
    }
};

export function coerce(desiredType: SchemaType, value: unknown): any | undefined {
    const actualType = getType(value);
    if (actualType === desiredType) {
        return value;
    }
    const map = STATIC_COERCIONS[desiredType] ?? {};
    const coercion = map[actualType] ?? map['*'];
    if (coercion) {
        return coercion(value);
    }
    return undefined;
}
