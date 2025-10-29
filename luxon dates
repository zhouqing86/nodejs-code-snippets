Here's a Luxon `DateTime` function that returns the **last working day (Monday–Friday)** of the **previous month**, given an input `DateTime`:

```javascript
const { DateTime } = require('luxon');

/**
 * Returns the last working day (Mon-Fri) of the previous month
 * @param {DateTime} dt - Input DateTime (any date/time in the target month or after)
 * @returns {DateTime} - Last working day of the previous month
 */
function getLastWorkingDayOfPreviousMonth(dt) {
  if (!DateTime.isDateTime(dt) || !dt.isValid) {
    throw new Error('Invalid DateTime input');
  }

  // Get the first day of the current month, then subtract 1 day to get last day of previous month
  const lastDayOfPreviousMonth = dt.startOf('month').minus({ days: 1 });

  const weekday = lastDayOfPreviousMonth.weekday; // 1 = Monday, 7 = Sunday

  // If it's Saturday (6), go back to Friday
  // If it's Sunday (7), go back to Friday
  if (weekday === 6) {
    return lastDayOfPreviousMonth.minus({ days: 1 }); // Friday
  } else if (weekday === 7) {
    return lastDayOfPreviousMonth.minus({ days: 2 }); // Friday
  } else {
    // Monday to Friday - already a working day
    return lastDayOfPreviousMonth;
  }
}

// Example usage:
const input = DateTime.fromISO('2025-10-29');
const result = getLastWorkingDayOfPreviousMonth(input);
console.log(result.toISODate()); // e.g., "2025-09-30" (if Sep 30 was a Tuesday)
```

### How it works:
1. `dt.startOf('month')` → First day of the input month.
2. `.minus({ days: 1 })` → Last day of the **previous** month.
3. Check the weekday:
   - If **Saturday** → subtract 1 day → Friday
   - If **Sunday** → subtract 2 days → Friday
   - Otherwise → it's already Mon–Fri

### Test Cases:
```javascript
console.log(getLastWorkingDayOfPreviousMonth(DateTime.fromISO('2025-10-29')).toISODate()); // 2025-09-30 (Tue)
console.log(getLastWorkingDayOfPreviousMonth(DateTime.fromISO('2025-11-01')).toISODate()); // 2025-10-31 (Fri)
console.log(getLastWorkingDayOfPreviousMonth(DateTime.fromISO('2025-12-01')).toISODate()); // 2025-11-28 (Fri, since Nov 30 is Sun)
```

> **Note**: This considers **Monday–Friday** as working days. If you need to exclude holidays, you'd need a holiday calendar (not included in Luxon by default).
