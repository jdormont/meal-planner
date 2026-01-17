import { X, ChevronDown, Check } from 'lucide-react';
import { useState } from 'react';

type FilterDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    selectedTags: string[];
    onTagToggle: (tag: string) => void;
    availableTags: string[];
    recipeType: 'food' | 'cocktail';
    selectedTimeFilter?: string;
    onTimeFilterChange?: (filter: string) => void;
    onClearAll: () => void;
};

type FilterCategory = {
    name: string;
    tags: string[];
};

export function FilterDrawer({
    isOpen,
    onClose,
    selectedTags,
    onTagToggle,
    availableTags,
    recipeType,
    selectedTimeFilter,
    onTimeFilterChange,
    onClearAll
}: FilterDrawerProps) {
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
            if (lowerTag.startsWith('base:')) return 'Spirit Base';
            if (lowerTag.startsWith('flavor:')) return 'Flavor Profile';
            if (lowerTag.startsWith('strength:')) return 'Strength';
            if (lowerTag.startsWith('method:')) return 'Method';
            if (lowerTag.startsWith('occasion:')) return 'Occasion';
            if (lowerTag.startsWith('garnish:')) return 'Garnish';
            if (lowerTag.startsWith('style:')) return 'Style';
            return 'Other';
        }

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

        if (lowerTag.startsWith('protein:')) return 'Protein';
        if (lowerTag.startsWith('grain:')) return 'Grain';

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

    const cleanTagDisplay = (tag: string): string => {
        return tag.includes(':') ? tag.split(':')[1] : tag;
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={onClose}
            />
            <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Active Filters Summary */}
                    {(selectedTags.length > 0 || selectedTimeFilter) && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Active</span>
                                <button
                                    onClick={onClearAll}
                                    className="text-sm text-terracotta-600 hover:text-terracotta-700 font-medium"
                                >
                                    Clear all
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedTimeFilter && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                                        {timeFilters.find(f => f.id === selectedTimeFilter)?.icon}
                                        <button onClick={() => onTimeFilterChange?.('')} className="ml-1 hover:text-blue-900"><X className="w-3 h-3" /></button>
                                    </span>
                                )}
                                {selectedTags.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-terracotta-50 text-terracotta-700 rounded-full text-sm">
                                        {cleanTagDisplay(tag)}
                                        <button onClick={() => onTagToggle(tag)} className="ml-1 hover:text-terracotta-900"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Time Filter */}
                    {onTimeFilterChange && recipeType === 'food' && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900">Time</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {timeFilters.map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => onTimeFilterChange(selectedTimeFilter === filter.id ? '' : filter.id)}
                                        className={`p-3 rounded-xl border-2 text-left transition ${selectedTimeFilter === filter.id
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                            }`}
                                    >
                                        <div className="text-xl mb-1">{filter.icon}</div>
                                        <div className="text-sm font-medium">{filter.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Categories */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Categories</h3>
                        {categorizedTags.map((category) => {
                            const isOpen = openDropdown === category.name;
                            const activeCount = category.tags.filter(t => selectedTags.includes(t)).length;

                            return (
                                <div key={category.name} className="border border-gray-200 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setOpenDropdown(isOpen ? null : category.name)}
                                        className={`w-full flex items-center justify-between p-4 text-left transition ${isOpen ? 'bg-gray-50' : 'bg-white'
                                            }`}
                                    >
                                        <span className="font-medium text-gray-700 flex items-center gap-2">
                                            {category.name}
                                            {activeCount > 0 && (
                                                <span className="bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                                                    {activeCount}
                                                </span>
                                            )}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isOpen && (
                                        <div className="p-2 bg-gray-50 border-t border-gray-200 space-y-1">
                                            {category.tags.map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={() => onTagToggle(tag)}
                                                    className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition ${selectedTags.includes(tag)
                                                        ? 'bg-terracotta-50 text-terracotta-700 font-medium'
                                                        : 'text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {cleanTagDisplay(tag)}
                                                    {selectedTags.includes(tag) && <Check className="w-4 h-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-terracotta-500 text-white rounded-xl font-semibold hover:bg-terracotta-600 transition shadow-lg"
                    >
                        Show Results
                    </button>
                </div>
            </div>
        </>
    );
}
