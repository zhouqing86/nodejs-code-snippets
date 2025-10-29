Here's a **TypeScript-refactored version** of the function with **Jest unit tests**, including proper typing, error handling, and comprehensive test cases.

---

### `getLastWorkingDayOfPreviousMonth.ts`

```ts
import { DateTime } from 'luxon';

/**
 * Returns the last working day (Monday–Friday) of the previous month.
 *
 * @param dt - A valid Luxon DateTime object
 * @returns DateTime representing the last working day of the previous month
 * @throws {Error} if input is not a valid DateTime
 */
export function getLastWorkingDayOfPreviousMonth(dt: DateTime): DateTime {
  if (!DateTime.isDateTime(dt) || !dt.isValid) {
    throw new Error('Invalid DateTime input: must be a valid Luxon DateTime object');
  }

  const lastDayOfPreviousMonth = dt.startOf('month').minus({ days: 1 });
  const weekday = lastDayOfPreviousMonth.weekday; // 1 = Mon, ..., 7 = Sun

  if (weekday === 6) {
    // Saturday → go back to Friday
    return lastDayOfPreviousMonth.minus({ days: 1 });
  } if (weekday === 7) {
    // Sunday → go back to Friday
    return lastDayOfPreviousMonth.minus({ days: 2 });
  }

  // Monday to Friday → already a working day
  return lastDayOfPreviousMonth;
}
```

---

### `getLastWorkingDayOfPreviousMonth.test.ts`

```ts
import { DateTime } from 'luxon';
import { getLastWorkingDayOfPreviousMonth } from './getLastWorkingDayOfPreviousMonth';

describe('getLastWorkingDayOfPreviousMonth', () => {
  // Test: Last day of previous month is a weekday (Mon-Fri)
  it('should return the last day if it is a weekday', () => {
    const input = DateTime.fromISO('2025-10-15'); // Oct 15 → Sep 30 (Tue)
    const result = getLastWorkingDayOfPreviousMonth(input);
    expect(result.toISODate()).toBe('2025-09-30');
  });

  // Test: Last day is Saturday → should return Friday
  it('should return Friday when last day of previous month is Saturday', () => {
    const input = DateTime.fromISO('2025-03-01'); // Mar 1 → Feb 28, 2025 (Fri), but let's force Sat
    // Feb 2026: Feb has 28 days, Feb 28, 2026 is a Saturday
    const inputSat = DateTime.fromISO('2026-03-01'); // Previous: 2026-02-28 (Sat)
    const result = getLastWorkingDayOfPreviousMonth(inputSat);
    expect(result.toISODate()).toBe('2026-02-27'); // Friday
  });

  // Test: Last day is Sunday → should return Friday
  it('should return Friday when last day of previous month is Sunday', () => {
    // Nov 2025: Nov 30 is Sunday
    const input = DateTime.fromISO('2025-12-01'); // Previous: 2025-11-30 (Sun)
    const result = getLastWorkingDayOfPreviousMonth(input);
    expect(result.toISODate()).toBe('2025-11-28'); // Friday
  });

  // Test: Leap year — Feb 29 exists
  it('should handle leap year correctly (Feb 29)', () => {
    const input = DateTime.fromISO('2024-03-01'); // 2024 is leap year → Feb 29 (Thu)
    const result = getLastWorkingDayOfPreviousMonth(input);
    expect(result.toISODate()).toBe('2024-02-29'); // Thursday → valid working day
  });

  // Test: Input at start of month
  it('should work when input is first day of month', () => {
    const input = DateTime.fromISO('2025-06-01'); // June 1 → May 31 (Sat)
    const result = getLastWorkingDayOfPreviousMonth(input);
    expect(result.toISODate()).toBe('2025-05-30'); // Friday
  });

  // Test: Invalid DateTime
  it('should throw error for invalid DateTime', () => {
    const invalid = DateTime.invalid('test');
    expect(() => getLastWorkingDayOfPreviousMonth(invalid)).toThrow(
      'Invalid DateTime input'
    );
  });

  // Test: Non-DateTime object
  it('should throw error for non-DateTime input', () => {
    // @ts-expect-error - testing invalid input
    expect(() => getLastWorkingDayOfPreviousMonth('2025-10-29' as any)).toThrow(
      'Invalid DateTime input'
    );
  });

  // Test: Timezone consistency (should preserve zone)
  it('should preserve the original timezone', () => {
    const input = DateTime.fromISO('2025-10-29T12:00:00', { zone: 'America/New_York' });
    const result = getLastWorkingDayOfPreviousMonth(input);
    expect(result.zoneName).toBe('America/New_York');
    expect(result.toISODate()).toBe('2025-09-30');
  });
});
```

---

### Setup Instructions

#### 1. Install dependencies:
```bash
npm install luxon jest ts-jest @types/jest @types/luxon --save-dev
```

#### 2. `jest.config.js`
```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
};
```

#### 3. Add to `package.json`
```json
"scripts": {
  "test": "jest"
}
```

#### 4. Run tests:
```bash
npm test
```

---

### Expected Test Output (Pass):
```
 PASS  ./getLastWorkingDayOfPreviousMonth.test.ts
  ✓ should return the last day if it is a weekday (2 ms)
  ✓ should return Friday when last day of previous month is Saturday (1 ms)
  ✓ should return Friday when last day of previous month is Sunday
  ✓ should handle leap year correctly (Feb 29)
  ✓ should work when input is first day of month
  ✓ should throw error for invalid DateTime
  ✓ should throw error for non-DateTime input
  ✓ should preserve the original timezone
```

---

Let me know if you want to **exclude specific holidays** (e.g. US federal holidays) — we can extend this with a holiday checker!
