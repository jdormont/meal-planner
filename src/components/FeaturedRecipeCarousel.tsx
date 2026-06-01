import { useState, useEffect } from 'react';
import { Recipe } from '../lib/supabase';
import { Clock, Users, ChevronRight, ChevronLeft, Award } from 'lucide-react';
import { formatTime } from '../utils/time';

type FeaturedRecipeCarouselProps = {
    recipes: Recipe[];
    onClick: (recipe: Recipe) => void;
};

export function FeaturedRecipeCarousel({ recipes, onClick }: FeaturedRecipeCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-advance
    useEffect(() => {
        if (recipes.length <= 1) return;
        
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % recipes.length);
        }, 6000); // 6 seconds

        return () => clearInterval(timer);
    }, [recipes.length]);

    if (!recipes || recipes.length === 0) return null;

    const currentRecipeValue = recipes[currentIndex];
    if (!currentRecipeValue) return null;

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % recipes.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + recipes.length) % recipes.length);
    };



    return (
        <div className="relative w-full h-[400px] sm:h-[450px] rounded-3xl overflow-hidden shadow-2xl mb-12 group bg-gray-900">
            {/* Background Images with Cross-fade */}
            {recipes.map((recipe, index) => (
                <div
                    key={recipe.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                    {recipe.image_url ? (
                        <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className={`w-full h-full object-cover transition-transform duration-[8000ms] ease-linear ${
                                index === currentIndex ? 'scale-110' : 'scale-100'
                            }`}
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <span className="text-6xl">🍳</span>
                        </div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>
            ))}

            {/* Navigation Buttons (Overlay) */}
            <button 
                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10"
                aria-label="Previous Match"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 border border-white/10"
                aria-label="Next Match"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Content (z-index 20) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white z-20 pointer-events-none">
                <div className="pointer-events-auto">
                    <div 
                        className="inline-flex items-center gap-2 px-3 py-1 bg-terracotta-500/90 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wide mb-3 shadow-lg cursor-pointer hover:bg-terracotta-400 transition"
                        onClick={() => onClick(currentRecipeValue)}
                    >
                        <Award className="w-3 h-3" />
                        <span>Daily Spotlight {currentIndex + 1}/{recipes.length}</span>
                    </div>

                    <h2 
                        className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight shadow-sm max-w-3xl cursor-pointer hover:text-terracotta-100 transition-colors"
                        onClick={() => onClick(currentRecipeValue)}
                    >
                        {currentRecipeValue.title}
                    </h2>

                    <p 
                        className="text-gray-200 text-lg mb-6 line-clamp-2 max-w-2xl font-light cursor-pointer hidden sm:block"
                        onClick={() => onClick(currentRecipeValue)}
                    >
                        {currentRecipeValue.description || 'A delicious meal waiting for you to cook.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4">
                        <div className="flex items-center gap-2 text-gray-100 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                            <Clock className="w-5 h-5 text-terracotta-200" />
                            <span className="font-medium">{formatTime(currentRecipeValue.total_time)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-100 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                            <Users className="w-5 h-5 text-terracotta-200" />
                            <span className="font-medium">{currentRecipeValue.servings} servings</span>
                        </div>

                        <button 
                            onClick={() => onClick(currentRecipeValue)}
                            className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition flex items-center gap-2 shadow-xl ml-auto sm:ml-0 pointer-events-auto"
                        >
                            Cook Now
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30 pointer-events-none">
                {recipes.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                        className={`transition-all duration-300 rounded-full h-1.5 shadow-sm pointer-events-auto ${
                            idx === currentIndex 
                                ? 'bg-white w-8' 
                                : 'bg-white/40 w-2 hover:bg-white/60'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
