import { trimMatrixEnd } from './trimMatrixEnd';

describe('trimMatrixEnd', () => {
    // Matrix tests
    test('should trim empty rows from matrix', () => {
        const input = [
            [1, 2, 3],
            [4, 5, 6],
            ['', null, ' '],
            [null, null, null]
        ];
        const expected = [[1, 2, 3], [4, 5, 6]];
        expect(trimMatrixEnd(input)).toEqual(expected);
    });

    test('should return same matrix if no empty rows', () => {
        const input = [
            [1, 2, 3],
            [4, 5, 6]
        ];
        expect(trimMatrixEnd(input)).toEqual(input);
    });

    test('should handle single row matrix', () => {
        const input = [[1, 2, 3]];
        expect(trimMatrixEnd(input)).toEqual(input);
    });

    test('should handle empty matrix', () => {
        const input: any[][] = [];
        expect(trimMatrixEnd(input)).toEqual(input);
    });

    test('should handle matrix with all empty rows', () => {
        const input = [
            ['', null, ' '],
            [null, null, null]
        ];
        expect(trimMatrixEnd(input)).toEqual([]);
    });

    // Array tests
    test('should trim empty elements from array', () => {
        const input = [1, 2, 3, '', null, ' '];
        const expected = [1, 2, 3];
        expect(trimMatrixEnd(input)).toEqual(expected);
    });

    test('should return same array if no empty elements', () => {
        const input = [1, 2, 3];
        expect(trimMatrixEnd(input)).toEqual(input);
    });

    test('should handle single element array', () => {
        const input = [1];
        expect(trimMatrixEnd(input)).toEqual(input);
    });

    test('should handle empty array', () => {
        const input: any[] = [];
        expect(trimMatrixEnd(input)).toEqual(input);
    });

    test('should handle array with all empty elements', () => {
        const input = ['', null, ' '];
        expect(trimMatrixEnd(input)).toEqual([]);
    });

    // Edge cases
    test('should handle null input', () => {
        const input = null as any;
        expect(trimMatrixEnd(input)).toBe(null);
    });

    test('should handle undefined input', () => {
        const input = undefined as any;
        expect(trimMatrixEnd(input)).toBe(undefined);
    });

    test('should handle mixed content matrix', () => {
        const input = [
            [1, 'hello', true],
            [null, '', '  '],
            ['', null, undefined]
        ];
        const expected = [[1, 'hello', true]];
        expect(trimMatrixEnd(input)).toEqual(expected);
    });
});
