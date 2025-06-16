// matrixUtils.test.ts
import { matrixToObjectArray, columnMatrixToObjectArray  } from './matrixUtils';

describe('matrixToObjectArray', () => {
  it('should convert a matrix with string data to array of objects', () => {
    const matrix = [
      ['header1', 'header2', 'header3'],
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ] as [string[], ...string[][]];

    expect(matrixToObjectArray(matrix)).toEqual([
      { header1: 'a', header2: 'b', header3: 'c' },
      { header1: 'd', header2: 'e', header3: 'f' },
    ]);
  });

  it('should handle an empty matrix', () => {
    expect(matrixToObjectArray([] as any)).toEqual([]);
  });

  it('should handle matrix with only headers', () => {
    const matrix = [
      ['header1', 'header2'],
    ] as [string[], ...string[][]];

    expect(matrixToObjectArray(matrix)).toEqual([]);
  });
});

describe('columnMatrixToObjectArray', () => {
  it('should convert a column-oriented matrix to an array of objects', () => {
    const matrix = [
      ['header1', 1, 4],
      ['header2', 2, 5],
      ['header3', 3, 6],
    ] as [string, ...number[]][];

    expect(columnMatrixToObjectArray(matrix)).toEqual([
      { header1: 1, header2: 2, header3: 3 },
      { header1: 4, header2: 5, header3: 6 },
    ]);
  });

  it('should handle an empty matrix', () => {
    expect(columnMatrixToObjectArray([] as any)).toEqual([]);
  });

  it('should handle matrix with only headers', () => {
    const matrix = [
      ['header1'],
      ['header2'],
      ['header3'],
    ] as [string][]

    expect(columnMatrixToObjectArray(matrix)).toEqual([]);
  });
});

