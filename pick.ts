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
      processWildcardPath(object, keys, [], result);
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

function processWildcardPath(
  current: any,
  keys: string[],
  indices: number[],
  result: ResultObject,
  keyPrefix: string = ''
): void {
  if (current == null) return;

  const wildcardIndex = keys.indexOf('[]');
  if (wildcardIndex === -1) {
    // No more wildcards, traverse remaining keys
    let value = current;
    for (const key of keys) {
      if (value == null) return;
      value = value[key];
    }
    if (value !== undefined) {
      // Generate key with indices (e.g., c_0_1)
      const lastKey = keys[keys.length - 1];
      result[`${lastKey}${keyPrefix}_${indices.join('_')}`] = value;
    }
    return;
  }

  // Traverse to the wildcard
  const prefixKeys = keys.slice(0, wildcardIndex);
  let value = current;
  for (const key of prefixKeys) {
    if (value == null) return;
    value = value[key];
  }

  // Ensure value is an array
  if (!Array.isArray(value)) return;

  // Process each array element
  const suffixKeys = keys.slice(wildcardIndex + 1);
  value.forEach((item: any, index: number) => {
    processWildcardPath(item, suffixKeys, [...indices, index], result, keyPrefix);
  });
}

export default pick;
