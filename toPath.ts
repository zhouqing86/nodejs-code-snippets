import { toPath } from 'lodash';
import combineEmpty from './combineEmpty';

/**
 * Splits a path string on '.[].', processes each segment with toPath and combineEmpty,
 * and concatenates results with '[]' separators.
 * @param value The input path string (e.g., 'a.[].b.[].c').
 * @returns Array of strings with segments processed by toPath and combineEmpty, joined with '[]'.
 */
function superToPath(value: string | string[]): string[] {
  // Handle array input by passing to toPath and combineEmpty
  if (Array.isArray(value)) {
    return combineEmpty(toPath(value));
  }

  // Handle null or undefined
  if (value == null) {
    return [];
  }

  // Split on '.[].' delimiter
  const segments = value.split('.[].');
  const result: string[] = [];

  // Process each segment with toPath and combineEmpty, concatenate with '[]'
  segments.forEach((segment, index) => {
    if (segment) {
      // Process non-empty segment with toPath and combineEmpty
      result.push(...combineEmpty(toPath(segment)));
    } else {
      // Empty segment, treat as [""]
      result.push(...combineEmpty(['']));
    }
    // Add '[]' after each segment except the last
    if (index < segments.length - 1) {
      result.push('[]');
    }
  });

  return result;
}

export default superToPath;
