import { Search, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';

type RecipeSearchProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  availableTags: string[];
  recipeType?: 'food' | 'cocktail';
  selectedTimeFilter?: string;
  onTimeFilterChange?: (filter: string) => void;
};

type FilterCategory = {
  name: string;
  tags: string[];
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
}: RecipeSearchProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const timeFilters = [
    { id: 'quick', label: '30 min or less', icon: '⚡' },
    { id: 'medium', label: '30-45 min', icon: '⏱️' },
    { id: 'hour', label: 'About an hour', icon: '🕐' },
    { id: 'project', label: 'Big project', icon: '🎯' },
  ];

  const categorizeTag = (tag: string): string => {
    const lowerTag = tag.toLowerCase();

    if (recipeType === 'cocktail') {
      // Cocktail-specific categorization
      if (lowerTag.startsWith('base:')) {
        return 'Spirit Base';
      }
      if (lowerTag.startsWith('flavor:')) {
        return 'Flavor Profile';
      }
      if (lowerTag.startsWith('strength:')) {
        return 'Strength';
      }
      if (lowerTag.startsWith('method:')) {
        return 'Method';
      }
      if (lowerTag.startsWith('occasion:')) {
        return 'Occasion';
      }
      if (lowerTag.startsWith('garnish:')) {
        return 'Garnish';
      }
      if (lowerTag.startsWith('style:')) {
        return 'Style';
      }
      return 'Other';
    }

    // Food recipe categorization
    if (lowerTag.includes('breakfast') || lowerTag.includes('lunch') ||
        lowerTag.includes('dinner') || lowerTag.includes('snack') ||
        lowerTag.includes('dessert') || lowerTag.includes('appetizer')) {
      return 'Meal Type';
    }

    if (lowerTag.includes('italian') || lowerTag.includes('mexican') ||
        lowerTag.includes('chinese') || lowerTag.includes('thai') ||
        lowerTag.includes('indian') || lowerTag.includes('french') ||
        lowerTag.includes('american') || lowerTag.includes('japanese') ||
        lowerTag.includes('korean') || lowerTag.includes('mediterranean') ||
        lowerTag.includes('greek') || lowerTag.includes('spanish') ||
        lowerTag.includes('vietnamese') || lowerTag.includes('middle eastern')) {
      return 'Cuisine';
    }

    if (lowerTag.includes('vegetarian') || lowerTag.includes('vegan') ||
        lowerTag.includes('gluten-free') || lowerTag.includes('dairy-free') ||
        lowerTag.includes('keto') || lowerTag.includes('paleo') ||
        lowerTag.includes('low-carb') || lowerTag.includes('pescatarian')) {
      return 'Diet';
    }

    if (lowerTag.includes('quick') || lowerTag.includes('easy') ||
        lowerTag.includes('30-minute') || lowerTag.includes('slow cooker') ||
        lowerTag.includes('instant pot') || lowerTag.includes('one-pot') ||
        lowerTag.includes('make-ahead') || lowerTag.includes('no-cook')) {
      return 'Cooking Style';
    }

    if (lowerTag.startsWith('protein:')) {
      return 'Protein';
    }

    if (lowerTag.startsWith('grain:')) {
      return 'Grain';
    }

    return 'Other';
  };

  const categorizedTags: FilterCategory[] = (() => {
    const categories: { [key: string]: string[] } = {};

    availableTags.forEach(tag => {
      const category = categorizeTag(tag);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(tag);
    });

    const order = recipeType === 'cocktail'
      ? ['Spirit Base', 'Flavor Profile', 'Strength', 'Method', 'Occasion', 'Style', 'Garnish', 'Other']
      : ['Meal Type', 'Cuisine', 'Protein', 'Grain', 'Diet', 'Cooking Style', 'Other'];

    return order
      .filter(cat => categories[cat] && categories[cat].length > 0)
      .map(cat => ({
        name: cat,
        tags: categories[cat].sort()
      }));
  })();

  const getSelectedInCategory = (categoryTags: string[]) => {
    return categoryTags.filter(tag => selectedTags.includes(tag));
  };

  const clearAllFilters = () => {
    selectedTags.forEach(tag => onTagToggle(tag));
    if (selectedTimeFilter && onTimeFilterChange) {
      onTimeFilterChange('');
    }
  };

  const cleanTagDisplay = (tag: string): string => {
    if (tag.includes(':')) {
      return tag.split(':')[1];
    }
    return tag;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search recipes by name, ingredients..."
          className="w-full pl-12 pr-12 py-3 min-h-[48px] border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none text-base"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 touch-manipulation"
            title="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {onTimeFilterChange && recipeType === 'food' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Filter by time:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {timeFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onTimeFilterChange(selectedTimeFilter === filter.id ? '' : filter.id)}
                className={`px-3 sm:px-4 py-2.5 min-h-[44px] rounded-xl border-2 transition text-sm font-medium touch-manipulation ${
                  selectedTimeFilter === filter.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{filter.icon}</span>
                  <span className="truncate">{filter.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {categorizedTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Filter by category:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {categorizedTags.map((category) => {
              const selectedInCategory = getSelectedInCategory(category.tags);
              return (
                <div key={category.name} className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === category.name ? null : category.name)}
                    className={`w-full px-3 sm:px-4 py-2.5 min-h-[44px] rounded-xl border-2 transition flex items-center justify-between text-sm font-medium touch-manipulation ${
                      selectedInCategory.length > 0
                        ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                    title={category.name}
                  >
                    <span className="truncate">
                      {category.name}
                      {selectedInCategory.length > 0 && ` (${selectedInCategory.length})`}
                    </span>
                    <ChevronDown className={`w-4 h-4 ml-1 flex-shrink-0 transition-transform ${openDropdown === category.name ? 'rotate-180' : ''}`} />
                  </button>

                  {openDropdown === category.name && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenDropdown(null)}
                      />
                      <div className="absolute z-20 mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {category.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              onTagToggle(tag);
                            }}
                            className={`w-full px-4 py-3 min-h-[44px] text-left text-sm hover:bg-gray-50 transition touch-manipulation ${
                              selectedTags.includes(tag)
                                ? 'bg-terracotta-50 text-terracotta-700 font-medium'
                                : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{cleanTagDisplay(tag)}</span>
                              {selectedTags.includes(tag) && (
                                <span className="text-terracotta-500 text-base">✓</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(selectedTags.length > 0 || selectedTimeFilter) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 min-h-[36px] text-sm text-terracotta-600 hover:text-terracotta-700 hover:bg-terracotta-50 rounded-xl font-medium transition touch-manipulation"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTimeFilter && onTimeFilterChange && (
              <span className="pl-3 pr-2 py-2 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                {timeFilters.find(f => f.id === selectedTimeFilter)?.icon} {timeFilters.find(f => f.id === selectedTimeFilter)?.label}
                <button
                  onClick={() => onTimeFilterChange('')}
                  className="p-1 hover:text-blue-900 hover:bg-blue-200 rounded-full transition touch-manipulation"
                  title="Remove time filter"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="pl-3 pr-2 py-2 bg-terracotta-100 text-terracotta-700 rounded-full text-sm flex items-center gap-2"
              >
                {cleanTagDisplay(tag)}
                <button
                  onClick={() => onTagToggle(tag)}
                  className="p-1 hover:text-terracotta-900 hover:bg-terracotta-200 rounded-full transition touch-manipulation"
                  title={`Remove ${cleanTagDisplay(tag)} filter`}
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
