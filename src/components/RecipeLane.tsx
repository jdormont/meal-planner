import { Recipe } from '../lib/supabase';
import { Clock, Users } from 'lucide-react';

type RecipeLaneProps = {
    title: string;
    recipes: Recipe[];
    onRecipeClick: (recipe: Recipe) => void;
};

export function RecipeLane({ title, recipes, onRecipeClick }: RecipeLaneProps) {
    if (recipes.length === 0) return null;

    return (
        <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-900 mb-4 px-3 sm:px-0">{title}</h3>
            <div className="flex overflow-x-auto pb-4 gap-4 px-6 sm:px-0 scroll-pl-6 sm:scroll-pl-0 snap-x snap-mandatory no-scrollbar -mx-3 sm:mx-0">
                {recipes.map((recipe) => (
                    <div
                        key={recipe.id}
                        onClick={() => onRecipeClick(recipe)}
                        className="flex-shrink-0 w-72 snap-start bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                    >
                        <div className="h-40 overflow-hidden relative">
                            {recipe.image_url ? (
                                <img
                                    src={recipe.image_url}
                                    alt={recipe.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    <span className="text-4xl">🍳</span>
                                </div>
                            )}
                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-700 shadow-sm">
                                {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                            </div>
                        </div>

                        <div className="p-4">
                            <h4 className="font-bold text-gray-900 mb-1 truncate">{recipe.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)}m</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{recipe.servings}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1">
                                {recipe.tags?.slice(0, 2).map((tag) => (
                                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
                                        {tag}
                                    </span>
                                ))}
                                {(recipe.tags?.length || 0) > 2 && (
                                    <span className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md text-xs">
                                        +{recipe.tags!.length - 2}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
