

You're absolutely right! Lodash's `isEmpty` already returns `true` for `null`, `undefined`, empty strings, empty arrays, and empty objects. However, it also returns `true` for `false` and `0`, which you want to treat as **not empty**.

So, you only need to add a guard for primitive types (number, boolean, symbol, bigint, function) to return `false`, and otherwise delegate to `_.isEmpty`.

Here’s the concise refactored function:

```typescript
import _ from 'lodash';

export function superIsEmpty(value: any): boolean {
  // Primitives that should never be considered empty
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'symbol' ||
    typeof value === 'bigint' ||
    typeof value === 'function'
  ) {
    return false;
  }
  // Delegate to lodash for everything else
  return _.isEmpty(value);
}
```

### Jest Tests (unchanged)

```typescript
import { superIsEmpty } from './superIsEmpty';

describe('superIsEmpty', () => {
  it.each([
    [null, true],
    [undefined, true],
    [0, false],
    [1, false],
    [true, false],
    [false, false],
    ['', true],
    ['   ', false], // lodash treats whitespace as not empty
    ['abc', false],
    [[], true],
    [[1, 2], false],
    [{}, true],
    [{ a: 1 }, false],
    [() => {}, false],
    [Symbol('sym'), false],
    [BigInt(10), false],
  ])('should return %s for %p', (input, expected) => {
    expect(superIsEmpty(input)).toBe(expected);
  });
});
```

**Note:**  
- Lodash's `isEmpty('   ')` returns `false` because the string is not empty, just whitespace. If you want to treat whitespace-only strings as empty, you need to add a special case for strings:

```typescript
if (typeof value === 'string') {
  return value.trim().length === 0;
}
```

Let me know if you want to handle whitespace-only strings as empty, or if you need further tweaks!
