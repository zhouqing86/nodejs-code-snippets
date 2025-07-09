import toPath from './toPath';
import pick from './pick';
import get from './get';

// Sample object for testing
const testObject = {
  a: [
    {
      b: [
        { c: 42 },  // a[0].b[0].c
        { c: 43 },  // a[0].b[1].c
      ],
    },
    {
      b: [
        { c: 99 },  // a[1].b[0].c
        { c: 100 }, // a[1].b[1].c
      ],
    },
  ],
  x: 100,
};

// Object with missing values
const objectWithMissing = {
  a: [
    { b: [{ c: 42 }, {}] }, // Missing c in a[0].b[1]
    { b: [{ c: 99 }] },
  ],
};

describe('toPath', () => {
  test('should handle nested wildcard path', () => {
    expect(superToPath('a.[].b.[].c')).toEqual(['a', '[]', 'b', '[]', 'c']);
  });

  test('should handle single wildcard path', () => {
    expect(superToPath('a.[].b')).toEqual(['a', '[]', 'b']);
  });

  test('should handle standard path without wildcards', () => {
    expect(superToPath('a.b.c')).toEqual(['a', 'b', 'c']);
  });

  test('should handle complex segments with bracket notation', () => {
    expect(superToPath('a.b[0].[].c')).toEqual(['a', 'b', '0', '[]', 'c']);
    expect(superToPath('a["b.c"].[].d')).toEqual(['a', 'b.c', '[]', 'd']);
    expect(superToPath('a.["b"].[].["c"]')).toEqual(['a', '[]', 'b', '[]', 'c']);
  });

  test('should handle array input', () => {
    expect(superToPath(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(superToPath(['a', '', '', 'c'])).toEqual(['a', '..c']);
  });

  test('should handle empty or null input', () => {
    expect(superToPath('')).toEqual([]);
    expect(superToPath(null as any)).toEqual([]);
    expect(superToPath(undefined as any)).toEqual([]);
  });

  test('should handle consecutive wildcards', () => {
    expect(superToPath('a.[].[].c')).toEqual(['a', '[]', '[]', 'c']);
  });

  test('should handle single segment', () => {
    expect(superToPath('a')).toEqual(['a']);
  });

  test('should handle trailing or leading wildcards', () => {
    expect(superToPath('.[].a')).toEqual(['.', '[]', 'a']);
    expect(superToPath('a.[].')).toEqual(['a', '[]', '.']);
  });

  test('should handle empty segments', () => {
    expect(superToPath('.[]..[].')).toEqual(['.', '[]', '.', '[]', '.']);
  });

  test('should handle segments with empty strings via combineEmpty', () => {
    expect(superToPath('a..[].c')).toEqual(['a', '..c', '[]', 'c']);
    expect(superToPath('a..c.[].d')).toEqual(['a', '..c', '[]', 'd']);
    expect(superToPath('..[].c')).toEqual(['.c', '[]', 'c']);
  });

  test('should handle complex quoted paths with empty segments', () => {
    expect(superToPath('a.[""].[].["c"]')).toEqual(['a', '[]', 'c']);
    expect(superToPath('a.[""].[].b.[""]')).toEqual(['a', '[]', 'b', '.']);
  });
});

describe('pick', () => {
  test('should pick standard path', () => {
    expect(pick(testObject, 'a[0].b[0].c')).toEqual({ c: 42 });
    expect(pick(testObject, 'x')).toEqual({ x: 100 });
  });

  test('should handle single wildcard path', () => {
    expect(pick(testObject, 'a.[].b[0].c')).toEqual({
      a: [
        { b: [{ c: 42 }] },
        { b: [{ c: 99 }] },
      ],
    });
  });

  test('should handle nested wildcard path', () => {
    expect(pick(testObject, 'a.[].b.[].c')).toEqual({
      a: [
        { b: [{ c: 42 }, { c: 43 }] },
        { b: [{ c: 99 }, { c: 100 }] },
      ],
    });
  });

  test('should handle missing values in wildcard path', () => {
    expect(pick(objectWithMissing, 'a.[].b.[].c')).toEqual({
      a: [
        { b: [{ c: 42 }] },
        { b: [{ c: 99 }] },
      ],
    });
  });

  test('should return empty object for null/undefined input', () => {
    expect(pick(null, 'a.b.c')).toEqual({});
    expect(pick(undefined, 'a.b.c')).toEqual({});
  });

  test('should handle multiple paths', () => {
    expect(pick(testObject, ['a[0].b[0].c', 'x'])).toEqual({
      c: 42,
      x: 100,
    });
  });

  test('should return empty object for invalid path', () => {
    expect(pick(testObject, 'z.y')).toEqual({});
  });

  test('should handle non-array at wildcard position', () => {
    expect(pick({ a: { b: { c: 1 } } }, 'a.[].b.c')).toEqual({});
  });
});

describe('get', () => {
  test('should get value at standard path', () => {
    expect(get(testObject, 'a[0].b[0].c')).toEqual(42);
    expect(get(testObject, 'x')).toEqual(100);
  });

  test('should handle single wildcard path', () => {
    expect(get(testObject, 'a.[].b[0].c')).toEqual([[42], [99]]);
  });

  test('should handle nested wildcard path', () => {
    expect(get(testObject, 'a.[].b.[].c')).toEqual([[42, 43], [99, 100]]);
  });

  test('should handle missing values in wildcard path', () => {
    expect(get(objectWithMissing, 'a.[].b.[].c')).toEqual([[42], [99]]);
  });

  test('should return defaultValue for null/undefined input', () => {
    expect(get(null, 'a.b.c', 'not found')).toEqual('not found');
    expect(get(undefined, 'a.b.c', 'not found')).toEqual('not found');
  });

  test('should return defaultValue for invalid path', () => {
    expect(get(testObject, 'z.y', 'not found')).toEqual('not found');
  });

  test('should return defaultValue for non-array at wildcard position', () => {
    expect(get({ a: { b: { c: 1 } } }, 'a.[].b.c', 'not found')).toEqual('not found');
  });

  test('should return empty array for wildcard path with no valid values', () => {
    expect(get({ a: [{}] }, 'a.[].b.c')).toEqual([]);
  });

  test('should handle array path input', () => {
    expect(get(testObject, ['a', '0', 'b', '0', 'c'])).toEqual(42);
  });
});
