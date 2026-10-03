import React, { useEffect } from 'react';
import { Delete, Equal } from 'lucide-react';
import {
  appendDigit,
  appendOperator,
  appendDot,
  backspaceExpression,
  evaluateExpression,
} from '../../lib/calculator';

interface CalculatorKeypadProps {
  expression: string;
  onChange: (newExpr: string) => void;
  onEvaluate?: () => void;
  currencySymbol?: string;
}

export const CalculatorKeypad: React.FC<CalculatorKeypadProps> = ({
  expression,
  onChange,
  onEvaluate,
  currencySymbol = '$',
}) => {
  // Listen for physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input field (e.g. Note)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        onChange(appendDigit(expression, e.key));
      } else if (e.key === '.') {
        e.preventDefault();
        onChange(appendDot(expression));
      } else if (e.key === '+' || e.key === '-') {
        e.preventDefault();
        onChange(appendOperator(expression, e.key));
      } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        onChange(appendOperator(expression, '×'));
      } else if (e.key === '/') {
        e.preventDefault();
        onChange(appendOperator(expression, '÷'));
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        onChange(backspaceExpression(expression));
      } else if (e.key === '=' || e.key === 'Enter') {
        e.preventDefault();
        const evaluated = evaluateExpression(expression);
        onChange(evaluated.toString());
        onEvaluate?.();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        onChange('0');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, onChange, onEvaluate]);

  const handleDigit = (digit: string) => {
    onChange(appendDigit(expression, digit));
  };

  const handleOp = (op: string) => {
    onChange(appendOperator(expression, op));
  };

  const handleDot = () => {
    onChange(appendDot(expression));
  };

  const handleBackspace = () => {
    onChange(backspaceExpression(expression));
  };

  const handleClear = () => {
    onChange('0');
  };

  const handleEqual = () => {
    const evaluated = evaluateExpression(expression);
    onChange(evaluated.toString());
    onEvaluate?.();
  };

  const btnClass =
    'h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl transition-all active:scale-95 flex items-center justify-center select-none';
  const numBtnClass = `${btnClass} bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100`;
  const opBtnClass = `${btnClass} bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold`;

  return (
    <div className="w-full space-y-2">
      {/* Expression Display */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 flex flex-col justify-end text-right min-h-[58px]">
        <div className="text-[11px] text-slate-400 font-mono overflow-x-auto whitespace-nowrap scrollbar-none">
          {expression.includes('+') || expression.includes('-') || expression.includes('×') || expression.includes('÷') || expression.includes('*') || expression.includes('/') ? (
            <span>= {evaluateExpression(expression)}</span>
          ) : (
            <span>Amount</span>
          )}
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums overflow-x-auto whitespace-nowrap">
          <span className="text-amber-600 dark:text-amber-400 mr-1">{currencySymbol}</span>
          {expression || '0'}
        </div>
      </div>

      {/* Calculator Keypad Grid */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        <button type="button" onClick={handleClear} className={`${opBtnClass} text-rose-600 dark:text-rose-400`}>
          C
        </button>
        <button type="button" onClick={() => handleOp('÷')} className={opBtnClass}>
          ÷
        </button>
        <button type="button" onClick={() => handleOp('×')} className={opBtnClass}>
          ×
        </button>
        <button type="button" onClick={handleBackspace} className={opBtnClass} aria-label="Backspace">
          <Delete className="w-4 h-4" />
        </button>

        <button type="button" onClick={() => handleDigit('7')} className={numBtnClass}>
          7
        </button>
        <button type="button" onClick={() => handleDigit('8')} className={numBtnClass}>
          8
        </button>
        <button type="button" onClick={() => handleDigit('9')} className={numBtnClass}>
          9
        </button>
        <button type="button" onClick={() => handleOp('-')} className={opBtnClass}>
          −
        </button>

        <button type="button" onClick={() => handleDigit('4')} className={numBtnClass}>
          4
        </button>
        <button type="button" onClick={() => handleDigit('5')} className={numBtnClass}>
          5
        </button>
        <button type="button" onClick={() => handleDigit('6')} className={numBtnClass}>
          6
        </button>
        <button type="button" onClick={() => handleOp('+')} className={opBtnClass}>
          +
        </button>

        <button type="button" onClick={() => handleDigit('1')} className={numBtnClass}>
          1
        </button>
        <button type="button" onClick={() => handleDigit('2')} className={numBtnClass}>
          2
        </button>
        <button type="button" onClick={() => handleDigit('3')} className={numBtnClass}>
          3
        </button>
        <button
          type="button"
          onClick={handleEqual}
          className={`${btnClass} bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white row-span-2 shadow-xs`}
          aria-label="Calculate equals"
        >
          <Equal className="w-5 h-5" />
        </button>

        <button type="button" onClick={() => handleDigit('0')} className={`${numBtnClass} col-span-2`}>
          0
        </button>
        <button type="button" onClick={handleDot} className={numBtnClass}>
          .
        </button>
      </div>
    </div>
  );
};
