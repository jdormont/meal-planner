import { X, Clock, Users, ChefHat, CalendarPlus, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState } from 'react';

type RecipeDetailsModalProps = {
    recipe: any; // Using dynamic type for now as weekly set structure matches Recipe but is JSON
    onClose: () => void;
    onAddToWeek: (recipe: any) => void;
    onFeedback: (recipe: any, rating: 'thumbs_up' | 'thumbs_down') => void;
    isAdded: boolean;
    feedbackState: 'thumbs_up' | 'thumbs_down' | null;
};

export function RecipeDetailsModal({
    recipe,
    onClose,
    onAddToWeek,
    onFeedback,
    isAdded,
    feedbackState
}: RecipeDetailsModalProps) {
    const [adding, setAdding] = useState(false);

    const handleAdd = async () => {
        setAdding(true);
        await onAddToWeek(recipe);
        setAdding(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />
            
            <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    title="Close"
                    aria-label="Close details"
                    className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Hero Image */}
                <div className="relative h-64 sm:h-80 shrink-0">
                    {recipe.image_url ? (
                        <img 
                            src={recipe.image_url} 
                            alt={recipe.title} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <ChefHat className="w-16 h-16 text-gray-300" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {recipe.tags?.protein && (
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider">
                                    {recipe.tags.protein}
                                </span>
                            )}
                            {recipe.tags?.method && (
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider">
                                    {recipe.tags.method}
                                </span>
                            )}
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold leading-tight shadow-sm">
                            {recipe.title}
                        </h2>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-6 mb-8 text-gray-600">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-terracotta-500" />
                            <span className="font-medium">{recipe.time_estimate || '30 mins'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-terracotta-500" />
                            <span className="font-medium">{recipe.servings || 4} servings</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ChefHat className="w-5 h-5 text-terracotta-500" />
                            <span className="font-medium capitalize">{recipe.difficulty || 'Medium'}</span>
                        </div>
                    </div>

                    <p className="text-gray-700 text-lg leading-relaxed mb-8">
                        {recipe.description}
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
                        {/* Ingredients */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span>🥦</span> Ingredients
                            </h3>
                            {recipe.ingredients ? (
                                <ul className="space-y-3">
                                    {recipe.ingredients.map((ing: any, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-gray-700 pb-3 border-b border-gray-100 last:border-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-terracotta-400 mt-2 shrink-0" />
                                            <span>
                                                <span className="font-semibold">{ing.amount || ''} {ing.unit || ''}</span> {ing.name}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>

                        {/* Instructions */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span>🍳</span> Instructions
                            </h3>
                             {recipe.instructions ? (
                                <ol className="space-y-6">
                                    {recipe.instructions.map((step: string, i: number) => (
                                        <li key={i} className="flex gap-4">
                                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-terracotta-100 text-terracotta-700 font-bold flex items-center justify-center text-sm">
                                                {i + 1}
                                            </span>
                                            <p className="text-gray-700 mt-1">{step}</p>
                                        </li>
                                    ))}
                                </ol>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => onFeedback(recipe, 'thumbs_up')}
                            className={`flex-1 sm:flex-none p-3 rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                                feedbackState === 'thumbs_up' 
                                ? 'bg-green-100 border-green-200 text-green-700' 
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <ThumbsUp className={`w-5 h-5 ${feedbackState === 'thumbs_up' ? 'fill-current' : ''}`} />
                            <span className="sm:hidden font-medium">Like</span>
                        </button>
                        <button
                            onClick={() => onFeedback(recipe, 'thumbs_down')}
                            className={`flex-1 sm:flex-none p-3 rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                                feedbackState === 'thumbs_down' 
                                ? 'bg-red-100 border-red-200 text-red-700' 
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <ThumbsDown className={`w-5 h-5 ${feedbackState === 'thumbs_down' ? 'fill-current' : ''}`} />
                            <span className="sm:hidden font-medium">Dislike</span>
                        </button>
                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={isAdded || adding}
                        className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                            isAdded
                            ? 'bg-green-600 text-white cursor-default'
                            : 'bg-terracotta-600 text-white hover:bg-terracotta-700 hover:shadow-xl hover:-translate-y-0.5'
                        }`}
                    >
                        {isAdded ? (
                            <>Based on your week! <CalendarPlus className="w-5 h-5" /></>
                        ) : adding ? (
                            <>Adding... <span className="animate-spin">⏳</span></>
                        ) : (
                            <>Add to My Week <CalendarPlus className="w-5 h-5" /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
