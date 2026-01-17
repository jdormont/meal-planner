import { Recipe } from '../lib/supabase';
import { Clock, Users, ChevronRight } from 'lucide-react';

type FeaturedBannerProps = {
    recipe: Recipe;
    onClick: () => void;
};

export function FeaturedBanner({ recipe, onClick }: FeaturedBannerProps) {
    const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

    return (
        <div
            onClick={onClick}
            className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-xl mb-10 cursor-pointer group"
        >
            {/* Background Image */}
            {recipe.image_url ? (
                <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            ) : (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <span className="text-6xl">🍳</span>
                </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-terracotta-500/90 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wide mb-3 shadow-lg">
                    <span>🌟 Featured Recipe</span>
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight max-w-3xl shadow-sm">
                    {recipe.title}
                </h2>

                <p className="text-gray-200 text-lg mb-6 line-clamp-2 max-w-2xl">
                    {recipe.description || 'A delicious meal waiting for you to cook.'}
                </p>

                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2 text-gray-100 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">{totalTime} min</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-100 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                        <Users className="w-5 h-5" />
                        <span className="font-medium">{recipe.servings} servings</span>
                    </div>

                    <button className="px-6 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition flex items-center gap-2 shadow-lg ml-auto sm:ml-0">
                        Cook Now
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
