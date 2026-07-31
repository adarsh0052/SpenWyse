import { getRemainingDaysInMonth, calculateFinanceSnapshot } from './finance';

describe('Finance Engine Calculations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getRemainingDaysInMonth', () => {
    test('should return correct remaining days for a standard month mid-cycle (July 15th, 2026)', () => {
      // July has 31 days. Remaining: 31 - 15 + 1 = 17 days.
      jest.setSystemTime(new Date('2026-07-15T12:00:00Z'));
      expect(getRemainingDaysInMonth()).toBe(17);
    });

    test('should return 1 on the last day of the month (July 31st, 2026)', () => {
      // Remaining: 31 - 31 + 1 = 1 day.
      jest.setSystemTime(new Date('2026-07-31T12:00:00Z'));
      expect(getRemainingDaysInMonth()).toBe(1);
    });

    test('should return correct remaining days for February in a leap year (Feb 15th, 2028)', () => {
      // 2028 is a leap year (29 days). Remaining: 29 - 15 + 1 = 15 days.
      jest.setSystemTime(new Date('2028-02-15T12:00:00Z'));
      expect(getRemainingDaysInMonth()).toBe(15);
    });

    test('should return correct remaining days for February in a non-leap year (Feb 15th, 2029)', () => {
      // 2029 is a non-leap year (28 days). Remaining: 28 - 15 + 1 = 14 days.
      jest.setSystemTime(new Date('2029-02-15T12:00:00Z'));
      expect(getRemainingDaysInMonth()).toBe(14);
    });
  });

  describe('calculateFinanceSnapshot', () => {
    test('should calculate standard snapshot correct mid-cycle', () => {
      jest.setSystemTime(new Date('2026-07-15T12:00:00Z')); // 17 days remaining
      const snapshot = calculateFinanceSnapshot({
        income: 30000,
        commitments: 10000,
        spent: 5000,
      });

      expect(snapshot).toEqual({
        income: 30000,
        commitments: 10000,
        spent: 5000,
        flexiblePool: 15000, // 30000 - 10000 - 5000
        remainingDays: 17,
        dailySpendLimit: 882, // Math.floor(15000 / 17)
      });
    });

    test('should return 0 daily limit when flexible pool is zero', () => {
      jest.setSystemTime(new Date('2026-07-15T12:00:00Z'));
      const snapshot = calculateFinanceSnapshot({
        income: 30000,
        commitments: 15000,
        spent: 15000,
      });

      expect(snapshot.flexiblePool).toBe(0);
      expect(snapshot.dailySpendLimit).toBe(0);
    });

    test('should cap daily limit at 0 and return negative flexible pool when spent/commitments exceed income', () => {
      jest.setSystemTime(new Date('2026-07-15T12:00:00Z'));
      const snapshot = calculateFinanceSnapshot({
        income: 30000,
        commitments: 15000,
        spent: 20000,
      });

      expect(snapshot.flexiblePool).toBe(-5000);
      expect(snapshot.dailySpendLimit).toBe(0); // Should not be negative
    });

    test('should handle month-end calculation (last day of month)', () => {
      jest.setSystemTime(new Date('2026-07-31T12:00:00Z')); // 1 day remaining
      const snapshot = calculateFinanceSnapshot({
        income: 30000,
        commitments: 10000,
        spent: 5000,
      });

      expect(snapshot.remainingDays).toBe(1);
      expect(snapshot.flexiblePool).toBe(15000);
      expect(snapshot.dailySpendLimit).toBe(15000); // Pool divided by 1 day
    });

    test('should recalculate correctly when commitments change mid-cycle', () => {
      jest.setSystemTime(new Date('2026-07-15T12:00:00Z')); // 17 days remaining
      // User starts with income = 30000, spent = 5000, commitments = 5000
      let snapshot = calculateFinanceSnapshot({
        income: 30000,
        commitments: 5000,
        spent: 5000,
      });
      expect(snapshot.dailySpendLimit).toBe(1176);

      // User locks an additional 10000 in goals mid-cycle (commitments becomes 15000)
      snapshot = calculateFinanceSnapshot({
        income: 30000,
        commitments: 15000,
        spent: 5000,
      });
      expect(snapshot.flexiblePool).toBe(10000);
      expect(snapshot.dailySpendLimit).toBe(588); // 10000 / 17 = 588
    });
  });
});
