import React, { useState, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';
import { AlertTriangle, Archive, RefreshCw, Trash2 } from 'lucide-react';

export const DeleteCategoryModal: React.FC = () => {
  const { deleteCategoryModal, closeDeleteCategoryModal } = useUIStore();
  const { categories, transactions, deleteCategory, updateCategory } = useFinanceStore();

  const category = deleteCategoryModal.category;

  const [reassignTargetId, setReassignTargetId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check how many transactions currently belong to this category
  const affectedCount = useMemo(() => {
    if (!category) return 0;
    return transactions.filter((t) => t.categoryId === category.id).length;
  }, [category, transactions]);

  // Other eligible categories of same kind to reassign to
  const eligibleCategories = useMemo(() => {
    if (!category) return [];
    return categories.filter((c) => c.kind === category.kind && c.id !== category.id && !c.archived);
  }, [categories, category]);

  React.useEffect(() => {
    if (eligibleCategories.length > 0) {
      setReassignTargetId(eligibleCategories[0].id);
    } else {
      setReassignTargetId('');
    }
  }, [eligibleCategories]);

  if (!category) return null;

  const handleArchiveInstead = async () => {
    setIsSubmitting(true);
    try {
      await updateCategory(category.id, { archived: true });
      closeDeleteCategoryModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWithReassign = async () => {
    if (affectedCount > 0 && !reassignTargetId) {
      alert('Please select a replacement category to reassign existing transactions.');
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteCategory(category.id, reassignTargetId || undefined);
      closeDeleteCategoryModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={deleteCategoryModal.isOpen}
      onClose={closeDeleteCategoryModal}
      title={`Delete "${category.name}" Category?`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {affectedCount > 0 ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs space-y-2">
            <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{affectedCount} transaction(s) use this category</span>
            </div>
            <p className="text-amber-700 dark:text-amber-300 m-0">
              To keep your spending totals and history accurate, you can either archive the category or reassign its transactions to another category before deleting.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No transactions currently use this category. It will be permanently removed.
          </p>
        )}

        {affectedCount > 0 && eligibleCategories.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reassign {affectedCount} transaction(s) to:
            </label>
            <select
              value={reassignTargetId}
              onChange={(e) => setReassignTargetId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {eligibleCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.kind})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={closeDeleteCategoryModal}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl order-3 sm:order-1"
          >
            Cancel
          </button>

          {affectedCount > 0 && (
            <button
              type="button"
              onClick={handleArchiveInstead}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center space-x-1.5 order-2"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive Instead</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDeleteWithReassign}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 rounded-xl shadow-xs flex items-center justify-center space-x-1.5 order-1 sm:order-3"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{affectedCount > 0 ? 'Reassign & Delete' : 'Delete Category'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
