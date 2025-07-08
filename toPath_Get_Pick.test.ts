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
  test('should convert string path to array of keys', () => {
    expect(toPath('a.b.c')).toEqual(['a', 'b', 'c']);
    expect(toPath('a[0].b')).toEqual(['a', '0', 'b']);
  });

  test('should handle single wildcard path', () => {
    expect(toPath('a.[].b.c')).toEqual(['a', '[]', 'b', 'c']);
  });

  test('should handle nested wildcard path', () => {
    expect(toPath('a.[].b.[].c')).toEqual(['a', '[]', 'b', '[]', 'c']);
  });

  test('should handle array input', () => {
    expect(toPath(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  test('should handle empty or null input', () => {
    expect(toPath('')).toEqual([]);
    expect(toPath(null as any)).toEqual([]);
    expect(toPath(undefined as any)).toEqual([]);
  });

  test('should handle bracket notation with quotes', () => {
    expect(toPath('a["b.c"].d')).toEqual(['a', 'b.c', 'd']);
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
