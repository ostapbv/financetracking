import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { IconPicker } from '../../components/common/IconPicker';
import { ColorPicker } from '../../components/common/ColorPicker';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';
import type { TransactionKind } from '../../db/types';
import { IconRenderer } from '../../components/common/IconRenderer';

export const CategoryModal: React.FC = () => {
  const { categoryModal, closeCategoryModal } = useUIStore();
  const { categories, createCategory, updateCategory } = useFinanceStore();

  const isEditing = Boolean(categoryModal.category);

  const [name, setName] = useState('');
  const [kind, setKind] = useState<TransactionKind>(categoryModal.defaultKind || 'expense');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#10B981');
  const [archived, setArchived] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (categoryModal.category) {
      const cat = categoryModal.category;
      setName(cat.name);
      setKind(cat.kind);
      setIcon(cat.icon);
      setColor(cat.color);
      setArchived(cat.archived);
    } else {
      setName('');
      setKind(categoryModal.defaultKind || 'expense');
      setIcon(categoryModal.defaultKind === 'income' ? 'Coins' : 'ShoppingBag');
      setColor(categoryModal.defaultKind === 'income' ? '#10B981' : '#F59E0B');
      setArchived(false);
    }
    setError('');
  }, [categoryModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a category name');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && categoryModal.category) {
        await updateCategory(categoryModal.category.id, {
          name: name.trim(),
          kind,
          icon,
          color,
          archived,
        });
      } else {
        const nextOrder = categories.filter((c) => c.kind === kind).length + 1;
        await createCategory({
          name: name.trim(),
          kind,
          icon,
          color,
          order: nextOrder,
          archived: false,
        });
      }
      closeCategoryModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={categoryModal.isOpen}
      onClose={closeCategoryModal}
      title={isEditing ? 'Edit Category' : 'Create Category'}
      subtitle="Organize your spending and income streams"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40">
            {error}
          </div>
        )}

        {/* Live Preview Badge */}
        <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <IconRenderer name={icon} className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Category Preview</div>
            <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              {name.trim() || 'New Category'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category Name
            </label>
            <input
              type="text"
              placeholder="e.g. Groceries"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Type
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as TransactionKind)}
              disabled={isEditing}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-60"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Badge Color & Icon
          </label>
          <ColorPicker value={color} onChange={setColor} />
          <div className="mt-2">
            <IconPicker value={icon} onChange={setIcon} accentColor={color} />
          </div>
        </div>

        {isEditing && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={archived}
                onChange={(e) => setArchived(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span>Archive this category (keeps past records, hides from quick selector)</span>
            </label>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={closeCategoryModal}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
