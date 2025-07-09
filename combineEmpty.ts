function combineEmpty(arr: string[]): string[] {
  const result: string[] = [];
  let emptyCount = 0;

  for (const item of arr) {
    if (item === '') {
      emptyCount++;
    } else {
      // Non-empty item
      if (emptyCount > 0) {
        // Combine empty items as dots with the current non-empty item
        result.push('.'.repeat(emptyCount) + item);
        emptyCount = 0;
      } else {
        // No preceding empty items, add item as is
        result.push(item);
      }
    }
  }

  // Handle trailing empty items (add them as a single item with dots)
  if (emptyCount > 0) {
    result.push('.'.repeat(emptyCount));
  }

  return result;
}

export default combineEmpty;
