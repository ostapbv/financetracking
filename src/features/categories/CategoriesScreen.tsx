import React, { useState, useMemo } from 'react';
import {
  Plus,
  ArrowUpDown,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';
import { IconRenderer } from '../../components/common/IconRenderer';
import { CategoryModal } from './CategoryModal';
import { DeleteCategoryModal } from './DeleteCategoryModal';
import type { Category, TransactionKind } from '../../db/types';

export const CategoriesScreen: React.FC = () => {
  const { categories, transactions, reorderCategories, updateCategory } = useFinanceStore();
  const { openCategoryModal, openDeleteCategoryModal } = useUIStore();

  const [activeTab, setActiveTab] = useState<TransactionKind>('expense');
  const [showArchived, setShowArchived] = useState(false);

  const activeCategories = useMemo(() => {
    return categories
      .filter((c) => c.kind === activeTab && !c.archived)
      .sort((a, b) => a.order - b.order);
  }, [categories, activeTab]);

  const archivedCategories = useMemo(() => {
    return categories
      .filter((c) => c.kind === activeTab && c.archived)
      .sort((a, b) => a.order - b.order);
  }, [categories, activeTab]);

  // Reorder up/down helper
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const list = [...activeCategories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Preserve categories of other kind
    const otherKindList = categories.filter((c) => c.kind !== activeTab || c.archived);
    await reorderCategories([...list, ...otherKindList]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 m-0">
            Categories
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">
            Customize icons, badges, colors, and arrangement for tracking
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCategoryModal(undefined, activeTab)}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl transition-all shadow-xs active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add {activeTab === 'expense' ? 'Expense' : 'Income'} Category</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-px">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'expense'
                ? 'border-amber-600 dark:border-amber-400 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Expenses ({categories.filter((c) => c.kind === 'expense' && !c.archived).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'income'
                ? 'border-amber-600 dark:border-amber-400 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Income ({categories.filter((c) => c.kind === 'income' && !c.archived).length})
          </button>
        </div>

        {archivedCategories.length > 0 && (
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 pb-2 flex items-center space-x-1"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Hide Archived' : `Show Archived (${archivedCategories.length})`}</span>
          </button>
        )}
      </div>

      {/* Category List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60">
        {activeCategories.map((cat, idx) => {
          const count = transactions.filter((t) => t.categoryId === cat.id).length;
          return (
            <div
              key={cat.id}
              className="py-3 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors group"
            >
              <div className="flex items-center space-x-3">
                {/* Reorder Buttons */}
                <div className="flex flex-col space-y-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-0.5 hover:text-amber-600 disabled:opacity-20"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === activeCategories.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-0.5 hover:text-amber-600 disabled:opacity-20"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Badge Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                  style={{
                    backgroundColor: `${cat.color}15`,
                    color: cat.color,
                  }}
                >
                  <IconRenderer name={cat.icon} className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 m-0">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {count} {count === 1 ? 'transaction' : 'transactions'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => openCategoryModal(cat)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Category"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openDeleteCategoryModal(cat)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Archived Categories Section */}
      {showArchived && archivedCategories.length > 0 && (
        <div className="space-y-2 pt-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider m-0">
            Archived {activeTab} Categories
          </h3>
          <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 divide-y divide-slate-100 dark:divide-slate-800/40 opacity-75">
            {archivedCategories.map((cat) => (
              <div key={cat.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  >
                    <IconRenderer name={cat.icon} className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {cat.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateCategory(cat.id, { archived: false })}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Unarchive</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CategoryModal />
      <DeleteCategoryModal />
    </div>
  );
};
