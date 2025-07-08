import toPath from './toPath.js';

interface ResultObject {
  [key: string]: any;
}

function pick<T extends object>(object: T | null | undefined, paths: string | string[]): ResultObject {
  if (object == null) {
    return {};
  }

  const props = Array.isArray(paths) ? paths : [paths];
  const result: ResultObject = {};

  props.forEach((path) => {
    const keys = toPath(path);

    // Handle paths with wildcards
    if (keys.includes('[]')) {
      const rootKey = keys[0];
      result[rootKey] = processWildcardPath(object, keys, 0);
    } else {
      // Standard pick behavior
      let current: any = object;
      let index = 0;
      while (current != null && index < keys.length) {
        current = current[keys[index]];
        index++;
      }
      if (index && index === keys.length && current !== undefined) {
        result[keys[keys.length - 1]] = current;
      }
    }
  });

  return result;
}

function processWildcardPath(current: any, keys: string[], index: number): any {
  if (current == null || index >= keys.length) {
    return undefined;
  }

  const key = keys[index];
  if (key !== '[]') {
    // Non-wildcard key
    const nextValue = current[key];
    if (index === keys.length - 1) {
      // Last key, return value if defined
      return nextValue !== undefined ? { [key]: nextValue } : undefined;
    }
    // Recurse to next key
    const result = processWildcardPath(nextValue, keys, index + 1);
    return result !== undefined ? { [key]: result } : undefined;
  }

  // Wildcard key
  if (!Array.isArray(current)) {
    return undefined;
  }

  // Process each array element
  const result = current
    .map((item: any) => processWildcardPath(item, keys, index + 1))
    .filter((item: any) => item !== undefined);

  return result.length > 0 ? result : undefined;
}

export default pick;
