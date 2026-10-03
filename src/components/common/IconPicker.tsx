import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { IconRenderer } from './IconRenderer';

const CURATED_ICONS = [
  // Finance & Accounts
  'Landmark',
  'Wallet',
  'CreditCard',
  'PiggyBank',
  'Coins',
  'Banknote',
  'CircleDollarSign',
  'Receipt',
  'TrendingUp',
  'Vault',
  'Compass',
  'ShieldCheck',

  // Daily Spending & Needs
  'ShoppingBag',
  'Utensils',
  'Coffee',
  'Fuel',
  'Car',
  'Bus',
  'Train',
  'Plane',
  'Home',
  'Smartphone',
  'Wifi',
  'Lightbulb',
  'Shirt',
  'Sparkles',

  // Lifestyle & Health
  'HeartPulse',
  'Film',
  'Gamepad2',
  'Tv',
  'Music',
  'BookOpen',
  'Dumbbell',
  'Gift',
  'Baby',
  'Smile',
  'Briefcase',
  'GraduationCap',
  'Dog',
  'Cat',
  'Truck',
  'Package',
  'Wrench',
  'Tag',
];

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  accentColor?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  accentColor = '#F59E0B',
}) => {
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return CURATED_ICONS;
    const q = search.toLowerCase();
    return CURATED_ICONS.filter((name) => name.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
      </div>

      <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 rounded-xl border border-slate-100 dark:border-slate-800">
        {filteredIcons.map((iconName) => {
          const isSelected = value === iconName;
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onChange(iconName)}
              className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-amber-500 shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
              }`}
              style={{
                backgroundColor: isSelected ? `${accentColor}20` : undefined,
                color: isSelected ? accentColor : undefined,
              }}
              title={iconName}
            >
              <IconRenderer name={iconName} className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
