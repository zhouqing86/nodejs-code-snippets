export function matrixToObjectArray<T = any>(matrix: [string[], ...T[][]]): Array<Record<string, T>> {
  if (!Array.isArray(matrix) || matrix.length < 1) return [];
  const [headers, ...rows] = matrix;
  return rows.map((row) => {
    const obj: Record<string, T> = {} as Record<string, T>;
    headers.forEach((header, idx) => {
      obj[header] = row[idx];
    });
    return obj;
  });
}


export function columnMatrixToObjectArray<T = any>(matrix: [string, ...T[]][]): Array<Record<string, T>> {
  if (!Array.isArray(matrix) || matrix.length < 1) return [];
  const numObjects = matrix[0].length - 1;
  const result: Array<Record<string, T>> = [];
  for (let i = 1; i <= numObjects; i++) {
    const obj: Record<string, T> = {} as Record<string, T>;
    matrix.forEach((row) => {
      const [header, ...values] = row;
      obj[header] = row[i];
    });
    result.push(obj);
  }
  return result;
}