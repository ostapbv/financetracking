import { describe, it, expect } from 'vitest';
import {
  evaluateExpression,
  evaluateExpressionToMinor,
  appendDigit,
  appendDot,
  appendOperator,
  backspaceExpression,
} from '../lib/calculator';

describe('Calculator Keypad Expression Parser', () => {
  it('evaluates basic single numbers', () => {
    expect(evaluateExpression('42')).toBe(42);
    expect(evaluateExpression('12.50')).toBe(12.5);
    expect(evaluateExpression('0')).toBe(0);
    expect(evaluateExpression('')).toBe(0);
  });

  it('evaluates basic binary operations', () => {
    expect(evaluateExpression('10 + 5')).toBe(15);
    expect(evaluateExpression('20 - 8')).toBe(12);
    expect(evaluateExpression('6 * 7')).toBe(42);
    expect(evaluateExpression('100 / 4')).toBe(25);
  });

  it('supports Unicode calculator symbols: ×, ÷, −', () => {
    expect(evaluateExpression('6 × 7')).toBe(42);
    expect(evaluateExpression('50 ÷ 2')).toBe(25);
    expect(evaluateExpression('30 − 10')).toBe(20);
  });

  it('respects operator precedence (* and / before + and -)', () => {
    // 2 + 3 * 4 should be 2 + 12 = 14 (not 20)
    expect(evaluateExpression('2 + 3 * 4')).toBe(14);
    // 20 - 10 / 2 should be 20 - 5 = 15 (not 5)
    expect(evaluateExpression('20 - 10 / 2')).toBe(15);
    // 10 + 4 * 2 - 6 / 2 = 10 + 8 - 3 = 15
    expect(evaluateExpression('10 + 4 * 2 - 6 / 2')).toBe(15);
  });

  it('gracefully handles trailing operators', () => {
    expect(evaluateExpression('15 +')).toBe(15);
    expect(evaluateExpression('20 * ')).toBe(20);
  });

  it('safely handles division by zero', () => {
    expect(evaluateExpression('10 / 0')).toBe(0);
  });

  it('evaluates directly to integer minor units', () => {
    expect(evaluateExpressionToMinor('12.50 + 2.50', 2)).toBe(1500); // $15.00
    expect(evaluateExpressionToMinor('3.33 * 3', 2)).toBe(999);
  });

  describe('Keypad state helpers', () => {
    it('appends digits correctly', () => {
      let expr = '0';
      expr = appendDigit(expr, '5');
      expect(expr).toBe('5');
      expr = appendDigit(expr, '2');
      expect(expr).toBe('52');
    });

    it('prevents multiple dots in same number token', () => {
      let expr = '12';
      expr = appendDot(expr);
      expect(expr).toBe('12.');
      expr = appendDot(expr);
      expect(expr).toBe('12.'); // no duplicate dot
      expr = appendDigit(expr, '5');
      expect(expr).toBe('12.5');
      expr = appendOperator(expr, '+');
      expect(expr).toBe('12.5 + ');
      expr = appendDot(expr);
      expect(expr).toBe('12.5 + 0.'); // creates 0. for new operand
    });

    it('replaces consecutive operators', () => {
      let expr = '10 + ';
      expr = appendOperator(expr, '-');
      expect(expr).toBe('10 - ');
      expr = appendOperator(expr, '×');
      expect(expr).toBe('10 × ');
    });

    it('handles backspace appropriately', () => {
      expect(backspaceExpression('123')).toBe('12');
      expect(backspaceExpression('1')).toBe('0');
      expect(backspaceExpression('10 + ')).toBe('10');
      expect(backspaceExpression('0')).toBe('0');
    });
  });
});
