import toPath from './toPath.js';

function get<T extends object, D = any>(
  object: T | null | undefined,
  path: string | string[],
  defaultValue?: D
): any[] | D {
  const keys = toPath(path);

  // Handle wildcard paths
  if (keys.includes('[]')) {
    const result = processWildcardGet(object, keys, 0);
    return result !== undefined && result.length > 0 ? result : (defaultValue !== undefined ? defaultValue : []);
  }

  // Standard get behavior
  let current: any = object;
  for (const key of keys) {
    current = current != null ? current[key] : undefined;
    if (current == null) return defaultValue;
  }
  return current !== undefined ? current : defaultValue;
}

function processWildcardGet(current: any, keys: string[], index: number): any[] | undefined {
  if (current == null || index >= keys.length) {
    return undefined;
  }

  const key = keys[index];
  if (key !== '[]') {
    // Non-wildcard key
    if (index === keys.length - 1) {
      // Last key, return value if defined
      return current[key] !== undefined ? [current[key]] : undefined;
    }
    // Recurse to next key
    return processWildcardGet(current[key], keys, index + 1);
  }

  // Wildcard key
  if (!Array.isArray(current)) {
    return undefined;
  }

  // Process each array element
  const result = current
    .map((item: any) => processWildcardGet(item, keys, index + 1))
    .filter((item: any) => item !== undefined);

  return result.length > 0 ? result : undefined;
}

export default get;
