import toPath from './toPath.js';

function get<T extends object, D = any>(
  object: T | null | undefined,
  path: string | string[],
  defaultValue?: D
): any[] | D {
  const keys = toPath(path);

  // Handle wildcard paths
  if (keys.includes('[]')) {
    const result: any[] = [];
    processWildcardGet(object, keys, result);
    return result.length > 0 ? result : (defaultValue !== undefined ? defaultValue : []);
  }

  // Standard get behavior
  let current: any = object;
  for (const key of keys) {
    current = current != null ? current[key] : undefined;
    if (current == null) return defaultValue;
  }
  return current !== undefined ? current : defaultValue;
}

function processWildcardGet(current: any, keys: string[], result: any[]): void {
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
      result.push(value);
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
  value.forEach((item: any) => {
    processWildcardGet(item, suffixKeys, result);
  });
}

export default get;
