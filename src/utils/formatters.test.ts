import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatIndianDate,
  formatIndianDayMonth,
  formatIndianNumber,
  formatIndianShortDate,
  toIsoDateString,
} from './formatters.ts';

test('toIsoDateString handles Firestore Timestamp objects cleanly', () => {
  const mockTimestamp = {
    toDate: () => new Date('2026-11-19T10:30:00.000Z'),
  };
  assert.equal(toIsoDateString(mockTimestamp, '', true), '2026-11-19');
  assert.equal(toIsoDateString(mockTimestamp, '', false), '2026-11-19T10:30:00.000Z');
});

test('toIsoDateString handles seconds-only Timestamp objects', () => {
  const mockSecondsTs = { seconds: 1795046400 }; // 2026-11-19T00:00:00Z
  assert.equal(toIsoDateString(mockSecondsTs, '', true), '2026-11-19');
});

test('formatIndianDate formats ISO dates in DD MMM YYYY Indian order', () => {
  assert.equal(formatIndianDate('2026-11-19'), '19 Nov 2026');
  assert.equal(formatIndianDate('2026-03-05T14:20:00.000Z'), '05 Mar 2026');
  assert.equal(formatIndianDate(null, 'Not set'), 'Not set');
});

test('formatIndianShortDate formats ISO dates in DD/MM/YYYY Indian order', () => {
  assert.equal(formatIndianShortDate('2026-11-19'), '19/11/2026');
  assert.equal(formatIndianShortDate('2026-01-07'), '07/01/2026');
});

test('formatIndianDayMonth formats chart ticks as DD MMM', () => {
  assert.equal(formatIndianDayMonth('2026-03-09'), '09 Mar');
});

test('formatIndianNumber applies en-IN grouping', () => {
  assert.equal(formatIndianNumber(125000), '1,25,000');
});
