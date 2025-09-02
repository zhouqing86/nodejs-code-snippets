import { DateTime } from 'luxon';

export function isTimeStringInRange(
  from: DateTime,
  to: DateTime,
  timezone: string,
  timeString: string
): boolean {
  // Validate input timeString format (hh:mm)
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(timeString)) {
    return false;
  }

  // Parse timeString into hours and minutes
  const [hours, minutes] = timeString.split(':').map(Number);

  // Get the date part from 'from' DateTime in the specified timezone
  const dateInTimezone = from.setZone(timezone).startOf('day');

  // Create a DateTime object for the timeString on the same date as 'from' in the specified timezone
  const timeToCheck = dateInTimezone.set({ hour: hours, minute: minutes });

  // Ensure 'from' and 'to' are in the same timezone for comparison
  const fromInTimezone = from.setZone(timezone);
  const toInTimezone = to.setZone(timezone);

  // Check if timeToCheck falls within the range [from, to]
  return timeToCheck >= fromInTimezone && timeToCheck <= toInTimezone;
}

import { DateTime } from 'luxon';
import { isTimeStringInRange } from './timeCheck';

describe('isTimeStringInRange', () => {
  test('should return true when timeString is within range (example 1)', () => {
    const from = DateTime.fromISO('2025-02-09T12:00:00.000Z', { zone: 'utc' });
    const to = DateTime.fromISO('2025-02-09T14:00:00.000Z', { zone: 'utc' });
    const timezone = 'utc';
    const timeString = '13:00';

    expect(isTimeStringInRange(from, to, timezone, timeString)).toBe(true);
  });

  test('should return false when timeString is outside range (example 2)', () => {
    const from = DateTime.fromISO('2025-02-09T12:00:00.000Z', { zone: 'utc' });
    const to = DateTime.fromISO('2025-02-09T14:00:00.000Z', { zone: 'utc' });
    const timezone = 'utc';
    const timeString = '15:00';

    expect(isTimeStringInRange(from, to, timezone, timeString)).toBe(false);
  });

  test('should return true when timeString is within range across days (example 3)', () => {
    const from = DateTime.fromISO('2025-02-08T23:00:00.000Z', { zone: 'utc' });
    const to = DateTime.fromISO('2025-02-09T14:00:00.000Z', { zone: 'utc' });
    const timezone = 'utc';
    const timeString = '23:59';

    expect(isTimeStringInRange(from, to, timezone, timeString)).toBe(true);
  });

  test('should return false when timeString is outside range in different timezone (example 4)', () => {
    const from = DateTime.fromISO('2025-02-09T12:00:00.000Z', { zone: 'utc' });
    const to = DateTime.fromISO('2025-02-09T14:00:00.000Z', { zone: 'utc' });
    const timezone = 'Asia/Hong_Kong';
    const timeString = '13:00';

    expect(isTimeStringInRange(from, to, timezone, timeString)).toBe(false);
  });

  test('should return false for invalid timeString format', () => {
    const from = DateTime.fromISO('2025-02-09T12:00:00.000Z', { zone: 'utc' });
    const to = DateTime.fromISO('2025-02-09T14:00:00.000Z', { zone: 'utc' });
    const timezone = 'utc';
    const timeString = '25:00'; // Invalid hour

    expect(isTimeStringInRange(from, to, timezone, timeString)).toBe(false);
  });
});
