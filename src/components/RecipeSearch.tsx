import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { FilterDrawer } from './FilterDrawer';

type RecipeSearchProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  availableTags: string[];
  recipeType?: 'food' | 'cocktail';
  selectedTimeFilter?: string;
  onTimeFilterChange?: (filter: string) => void;
  onRecipeTypeChange?: (type: 'food' | 'cocktail') => void;
};

export function RecipeSearch({
  searchTerm,
  onSearchChange,
  selectedTags,
  onTagToggle,
  availableTags,
  recipeType = 'food',
  selectedTimeFilter,
  onTimeFilterChange,
  onRecipeTypeChange
}: RecipeSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFiltersCount = selectedTags.length + (selectedTimeFilter ? 1 : 0);

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search recipes..."
              className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none text-base"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`px-4 rounded-xl border-2 flex items-center gap-2 font-medium transition ${activeFiltersCount > 0
              ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-terracotta-500 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Smart Chips Row */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* Cocktail Mode Toggle */}
          <button
            onClick={() => {
              if (recipeType === 'cocktail') {
                if (onRecipeTypeChange) onRecipeTypeChange('food');
              } else {
                if (onRecipeTypeChange) onRecipeTypeChange('cocktail');
              }
            }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full border transition font-medium text-sm flex items-center gap-1.5 ${recipeType === 'cocktail'
              ? 'bg-sage-50 border-sage-500 text-sage-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <span>🍸</span>
            <span>Cocktails</span>
          </button>

          {/* Quick Filters */}
          {recipeType === 'food' && (
            <>
              <button
                onClick={() => onTimeFilterChange && onTimeFilterChange(selectedTimeFilter === 'quick' ? '' : 'quick')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full border transition font-medium text-sm flex items-center gap-1.5 ${selectedTimeFilter === 'quick'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <span>⚡</span>
                <span>&lt; 30 min</span>
              </button>

              <button
                onClick={() => onTagToggle('Vegetarian')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full border transition font-medium text-sm flex items-center gap-1.5 ${selectedTags.includes('Vegetarian')
                  ? 'bg-terracotta-50 border-terracotta-500 text-terracotta-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <span>🥗</span>
                <span>Vegetarian</span>
              </button>

              <button
                onClick={() => onTagToggle('Chicken')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full border transition font-medium text-sm flex items-center gap-1.5 ${selectedTags.includes('Chicken')
                  ? 'bg-terracotta-50 border-terracotta-500 text-terracotta-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <span>🍗</span>
                <span>Chicken</span>
              </button>

              <button
                onClick={() => onTagToggle('Dessert')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full border transition font-medium text-sm flex items-center gap-1.5 ${selectedTags.includes('Dessert')
                  ? 'bg-terracotta-50 border-terracotta-500 text-terracotta-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <span>🍰</span>
                <span>Dessert</span>
              </button>
            </>
          )}
        </div>
      </div>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedTags={selectedTags}
        onTagToggle={onTagToggle}
        availableTags={availableTags}
        recipeType={recipeType}
        selectedTimeFilter={selectedTimeFilter}
        onTimeFilterChange={onTimeFilterChange}
        onClearAll={() => {
          selectedTags.forEach(tag => onTagToggle(tag));
          if (onTimeFilterChange) onTimeFilterChange('');
        }}
      />
    </>
  );
}
