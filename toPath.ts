function toPath(value: string | string[]): string[] {
  // If value is already an array, return a copy
  if (Array.isArray(value)) {
    return value.slice();
  }
  // Parse string path
  return stringToPath(value);
}

function stringToPath(string: string): string[] {
  const cache: { [key: string]: string[] } = {};
  if (cache[string]) {
    return cache[string];
  }

  const result: string[] = [];
  if (string == null) {
    return result;
  }

  // Regex to match property names, '[]', and bracket notation
  const rePropName = /[^.[\]]+|\[\]|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

  string = string.replace(/\\(\\)?/g, '$1');

  let match: RegExpExecArray | null;
  while ((match = rePropName.exec(string))) {
    const key = match[0] === '[]' ? '[]' : (match[1] || match[3] || '');
    if (key) {
      result.push(key);
    }
  }

  cache[string] = result;
  return result;
}

export default toPath;
