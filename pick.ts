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

function superPick<T extends object>(object: T | null | undefined, paths: string | string[]): ResultObject {
  if (object == null) {
    return {};
  }

  // Convert paths to array of path objects
  const props = Array.isArray(paths) ? paths : [paths];
  const pathArray: PathObject[] = props.map((p) => ({
    path: superToPath(p),
  }));

  const result: ResultObject = {};

  // Iterate over first-level properties of the object
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      // Check if key matches any path's first segment or wildcard for arrays
      if (
        pathArray.some((p) => p.path[0] === key || (p.path[0] === '[]' && Array.isArray(object[key])))
      ) {
        // Match found: recursively process paths
        result[key] = processPaths(object[key], pathArray, 0);
      } else {
        // No match: set undefined
        result[key] = undefined;
      }
    }
  }

  return result;
}

/**
 * Recursively processes paths for a given object level, handling wildcards and matching paths.
 * @param current The current object or array to process.
 * @param pathArray Array of path objects containing superToPath results.
 * @param index The current index in the path arrays.
 * @returns The processed result or undefined if no match.
 */
function processPaths(current: any, pathArray: PathObject[], index: number): any {
  if (current == null) {
    return undefined;
  }

  // Filter paths that are still valid at this level
  const validPaths = pathArray.filter((p) => p.path.length > index);
  if (validPaths.length === 0) {
    return undefined;
  }

  // Handle wildcard paths
  const wildcardPaths = validPaths.filter((p) => p.path[index] === '[]');
  if (wildcardPaths.length > 0 && Array.isArray(current)) {
    // Process each array element for wildcard paths
    const result = current
      .map((item: any) => processPaths(item, wildcardPaths, index + 1))
      .filter((item: any) => item !== undefined);
    return result.length > 0 ? result : undefined;
  }

  // Handle non-wildcard paths
  const matchingPaths = validPaths.filter(
    (p) => p.path[index] !== '[]' && (current[p.path[index]] !== undefined || index === p.path.length - 1)
  );
  if (matchingPaths.length === 0) {
    return undefined;
  }

  const result: ResultObject = {};
  for (const { path } of matchingPaths) {
    const key = path[index];
    if (index === path.length - 1) {
      // Last key: include value if it exists
      if (current[key] !== undefined) {
        result[key] = current[key];
      }
    } else {
      // Not last key: recurse
      const subResult = processPaths(current[key], matchingPaths, index + 1);
      if (subResult !== undefined) {
        result[key] = subResult;
      }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}


export default pick;
