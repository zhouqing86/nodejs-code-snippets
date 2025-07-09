import combineEmpty from './combineEmpty';

describe('combineEmpty', () => {
  test('should combine empty items with closest non-empty item', () => {
    expect(combineEmpty(['a', '', '', 'c'])).toEqual(['a', '..c']);
    expect(combineEmpty(['a', '', 'b', '', '', 'c'])).toEqual(['a', '.b', '..c']);
  });

  test('should handle array with only empty items', () => {
    expect(combineEmpty(['', ''])).toEqual(['..']);
    expect(combineEmpty([''])).toEqual(['.']);
  });

  test('should handle array with no empty items', () => {
    expect(combineEmpty(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  test('should handle empty array', () => {
    expect(combineEmpty([])).toEqual([]);
  });

  test('should handle trailing empty items', () => {
    expect(combineEmpty(['a', '', ''])).toEqual(['a', '..']);
    expect(combineEmpty(['a', ''])).toEqual(['a', '.']);
  });

  test('should handle leading empty items', () => {
    expect(combineEmpty(['', '', 'c'])).toEqual(['..c']);
    expect(combineEmpty(['', 'c'])).toEqual(['.c']);
  });

  test('should handle mixed cases', () => {
    expect(combineEmpty(['', 'a', '', '', 'b', '', 'c', ''])).toEqual(['.a', '..b', '.c', '.']);
    expect(combineEmpty(['a', '', 'b', '', ''])).toEqual(['a', '.b', '..']);
  });
});
