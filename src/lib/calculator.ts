import { toMinorUnits } from './money';

export type CalcOperator = '+' | '-' | '*' | '/';

/**
 * Tokenizes a calculator expression string into numbers and operators.
 * Handles Unicode multiplication/division symbols (×, ÷, −).
 */
export function tokenizeExpression(expr: string): string[] {
  if (!expr || !expr.trim()) return ['0'];

  const normalized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\s+/g, '');

  const tokens: string[] = [];
  let currentNum = '';

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if ((char >= '0' && char <= '9') || char === '.') {
      currentNum += char;
    } else if (char === '+' || char === '-' || char === '*' || char === '/') {
      // Handle leading or unary minus (e.g. at start or right after an operator)
      if (char === '-' && (i === 0 || ['+', '-', '*', '/'].includes(normalized[i - 1]))) {
        currentNum = '-' + currentNum;
      } else {
        if (currentNum) {
          tokens.push(currentNum);
          currentNum = '';
        }
        tokens.push(char);
      }
    }
  }

  if (currentNum) {
    tokens.push(currentNum);
  }

  return tokens;
}

/**
 * Evaluates an arithmetic expression respecting standard operator precedence (* and / before + and -).
 * Safely ignores trailing operators (e.g., "10 + " -> 10).
 */
export function evaluateExpression(expr: string): number {
  if (!expr || !expr.trim()) return 0;

  const rawTokens = tokenizeExpression(expr);
  if (rawTokens.length === 0) return 0;

  // Trim trailing operator if user didn't finish typing second operand
  let tokens = [...rawTokens];
  while (tokens.length > 0 && ['+', '-', '*', '/'].includes(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  if (tokens.length === 0) return 0;
  if (tokens.length === 1) {
    const val = parseFloat(tokens[0]);
    return isNaN(val) ? 0 : val;
  }

  // Pass 1: Handle multiplication and division (* and /)
  const pass1Tokens: (number | string)[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    if (token === '*' || token === '/') {
      const prevVal = pass1Tokens.pop();
      const nextToken = tokens[i + 1];
      const left = typeof prevVal === 'number' ? prevVal : parseFloat(String(prevVal));
      const right = parseFloat(nextToken);

      if (isNaN(left) || isNaN(right)) {
        pass1Tokens.push(left || 0);
      } else if (token === '*') {
        pass1Tokens.push(left * right);
      } else {
        // Division: prevent divide by zero
        pass1Tokens.push(right === 0 ? 0 : left / right);
      }
      i += 2; // skip operator and right operand
    } else {
      const num = parseFloat(token);
      pass1Tokens.push(isNaN(num) ? token : num);
      i++;
    }
  }

  // Pass 2: Handle addition and subtraction (+ and -)
  if (pass1Tokens.length === 0) return 0;
  let result = typeof pass1Tokens[0] === 'number' ? pass1Tokens[0] : parseFloat(String(pass1Tokens[0]));
  if (isNaN(result)) result = 0;

  let j = 1;
  while (j < pass1Tokens.length) {
    const op = pass1Tokens[j];
    const nextVal = pass1Tokens[j + 1];
    const right = typeof nextVal === 'number' ? nextVal : parseFloat(String(nextVal));

    if (!isNaN(right)) {
      if (op === '+') {
        result += right;
      } else if (op === '-') {
        result -= right;
      }
    }
    j += 2;
  }

  return Math.round(result * 10000) / 10000;
}

/**
 * Evaluates calculator expression directly into integer minor units (e.g. cents).
 */
export function evaluateExpressionToMinor(expr: string, precision = 2): number {
  const major = evaluateExpression(expr);
  return toMinorUnits(major, precision);
}

/**
 * State manipulator: appends a digit to current calculator input
 */
export function appendDigit(current: string, digit: string): string {
  if (current === '0' || current === '') {
    return digit;
  }
  return current + digit;
}

/**
 * State manipulator: appends a decimal dot, preventing multiple dots in the same number token
 */
export function appendDot(current: string): string {
  if (!current || current === '0') return '0.';

  const trimmed = current.trim();
  const lastChar = trimmed.slice(-1);

  if (['+', '-', '*', '/', '×', '÷'].includes(lastChar)) {
    return current + '0.';
  }

  // Check last number segment
  const parts = current.split(/[+\-×*÷/]/);
  const lastPart = parts[parts.length - 1].trim();

  if (lastPart.includes('.')) {
    return current; // already has dot in current operand
  }

  return current + '.';
}

/**
 * State manipulator: appends an operator (+, −, ×, ÷), replacing consecutive operators if necessary
 */
export function appendOperator(current: string, op: string): string {
  if (!current || current === '0') {
    return op === '-' ? '-' : '0 ' + op + ' ';
  }

  const trimmed = current.trim();
  const lastChar = trimmed.slice(-1);

  if (['+', '-', '*', '/', '×', '÷'].includes(lastChar)) {
    // Replace trailing operator
    return trimmed.slice(0, -1) + op + ' ';
  }

  return trimmed + ' ' + op + ' ';
}

/**
 * State manipulator: removes the last character or trailing operator
 */
export function backspaceExpression(current: string): string {
  if (!current || current.length <= 1) return '0';
  const trimmed = current.trim();
  if (trimmed.length <= 1) return '0';
  return trimmed.slice(0, -1).trim();
}
