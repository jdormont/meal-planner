import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Check, CalendarPlus, Loader2, ChevronLeft, ChevronRight, Clock, ChefHat } from 'lucide-react';
import { RecipeDetailsModal } from './RecipeDetailsModal';
import { recipeService } from '../services/recipeService';
import { mealService } from '../services/mealService';
import { WeeklyMealSet } from '../lib/supabase';
import { showError, showInfo } from '../utils/toast';

interface WeeklyPlannerRecipe {
  title: string;
  description: string;
  image_url?: string | null;
  time_estimate?: string;
  difficulty?: string;
  ingredients?: unknown;
  instructions?: unknown;
  tags?: {
    protein?: string;
    method?: string;
  };
}

type WeeklyMealCarouselProps = {
    onMealAdded?: () => void;
};

export function WeeklyMealCarousel({ onMealAdded }: WeeklyMealCarouselProps) {
    const { user, userProfile } = useAuth();
    const [weeklySet, setWeeklySet] = useState<WeeklyMealSet | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [addedToWeek, setAddedToWeek] = useState<Record<string, boolean>>({});
    const [feedback, setFeedback] = useState<Record<string, 'thumbs_up' | 'thumbs_down' | null>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedRecipe, setSelectedRecipe] = useState<WeeklyPlannerRecipe | null>(null);

    useEffect(() => {
        fetchWeeklySet();
    }, []);

    async function fetchWeeklySet() {
        try {
            setLoading(true);
            const data = await mealService.getLatestWeeklyMealSet();
            setWeeklySet(data);
        } catch (err) {
            console.error('Error fetching weekly meals:', err);
        } finally {
            setLoading(false);
        }
    }

    async function triggerGeneration() {
        if (!user || generating) return;
        setGenerating(true);
        try {
            await mealService.generateWeeklyMealSet(user.id);
            await fetchWeeklySet();
            setCurrentIndex(0);
        } catch (err) {
            console.error("Error generating meals:", err);
            showError("Failed to generate weekly meals. Check console.");
        } finally {
            setGenerating(false);
        }
    }

    async function handleAddToWeek(recipe: WeeklyPlannerRecipe) {
        if (!user) {
            showInfo("Please sign in to add meals to your week.");
            return;
        }
        const recipeTitle = recipe.title;

        try {
            const timeInt = parseInt(recipe.time_estimate || '') || 30;

            const recipeData = {
                title: recipe.title,
                description: recipe.description || '',
                image_url: recipe.image_url || undefined,
                total_time: timeInt,
                ingredients: (recipe.ingredients as unknown as Array<{ name: string; quantity: string; unit: string }>) || [],
                instructions: (recipe.instructions as unknown as string[]) || [],
                tags: ['Weekly Drop', recipe.tags?.protein, recipe.tags?.method, recipe.difficulty].filter((t): t is string => !!t),
                source_url: 'Weekly Meal Planner',
                notes: `Difficulty: ${recipe.difficulty || ''}`,
                recipe_type: 'food' as const,
                is_shared: false,
                servings: 4
            };

            const stringRecipe = await recipeService.saveRecipe(user.id, recipeData);

            const dateStr = new Date().toISOString().split('T')[0];
            await mealService.saveMeal(
                user.id,
                {
                    name: recipe.title,
                    date: dateStr,
                    meal_type: 'dinner',
                    description: 'Added from Weekly Planner',
                    is_event: false,
                    notes: '',
                    is_archived: false
                },
                [stringRecipe.id]
            );

            if (onMealAdded) onMealAdded();

            setAddedToWeek(prev => ({ ...prev, [recipeTitle]: true }));
            setTimeout(() => {
                setAddedToWeek(prev => ({ ...prev, [recipeTitle]: false })); 
            }, 3000);

        } catch (err) {
            console.error("Error adding to week:", err);
            showError("Failed to add meal. " + (err instanceof Error ? err.message : ''));
        }
    }

    async function handleFeedback(recipe: WeeklyPlannerRecipe, rating: 'thumbs_up' | 'thumbs_down') {
        if (!user) return;
        const recipeTitle = recipe.title;
        setFeedback(prev => ({ ...prev, [recipeTitle]: rating }));

        try {
            const targetId = recipeTitle; 
            await mealService.submitFeedback(user.id, targetId, rating, recipe);
        } catch (err) {
            console.error("Feedback error:", err);
        }
    }

    const nextSlide = () => {
        if (!weeklySet?.recipes) return;
        setCurrentIndex((prev) => (prev + 1) % weeklySet.recipes.length);
    };

    const prevSlide = () => {
        if (!weeklySet?.recipes) return;
        setCurrentIndex((prev) => (prev - 1 + weeklySet.recipes.length) % weeklySet.recipes.length);
    };

    if (loading) {
        return (
            <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-2xl animate-pulse">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
        );
    }

    if (!weeklySet && !userProfile?.is_admin) {
        return null;
    }

    if (!weeklySet && userProfile?.is_admin) {
        return (
             <div className="w-full h-64 flex flex-col items-center justify-center bg-terracotta-50 rounded-2xl border-2 border-dashed border-terracotta-200">
                <ChefHat className="w-12 h-12 text-terracotta-400 mb-4" />
                <h3 className="text-lg font-semibold text-terracotta-900 mb-2">No Global Menu Set</h3>
                <button
                    onClick={triggerGeneration}
                    disabled={generating}
                    className="px-6 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 disabled:opacity-50"
                >
                    {generating ? 'Cultivating Layout...' : 'Generate New Week'}
                </button>
            </div>
        );
    }

    const recipes = weeklySet?.recipes || [];
    const currentRecipe = recipes[currentIndex] as WeeklyPlannerRecipe;

    if (!currentRecipe) return null;

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                         Menu of the Week 🗓️
                    </h2>
                    <p className="text-gray-500">Curated community favorites for {new Date(weeklySet?.week_start_date || Date.now()).toLocaleDateString()}</p>
                </div>
                
                {userProfile?.is_admin && (
                     <button
                        onClick={triggerGeneration}
                        disabled={generating}
                        className="text-sm text-terracotta-600 hover:underline disabled:opacity-50"
                    >
                        {generating ? 'Generating...' : 'Regenerate Menu (Admin)'}
                    </button>
                )}
            </div>

            {/* Hero Carousel */}
            <div className="relative group">
                <button 
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    title="Previous Slide"
                    aria-label="Previous Slide"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    title="Next Slide"
                    aria-label="Next Slide"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>

                <div 
                    onClick={() => setSelectedRecipe(currentRecipe)}
                    className="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-xl cursor-pointer transition-transform duration-500"
                >
                    {currentRecipe.image_url ? (
                        <img
                            src={currentRecipe.image_url}
                            alt={currentRecipe.title}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                            <span className="text-6xl">🍳</span>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 text-white">
                         <div className="inline-flex items-center gap-2 px-3 py-1 bg-terracotta-500/90 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wide mb-4 shadow-lg">
                            <span>🌟 Trending This Week</span>
                        </div>
                        
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight shadow-sm max-w-4xl">
                            {currentRecipe.title}
                        </h2>
                        
                        <p className="text-gray-200 text-lg sm:text-xl mb-8 line-clamp-2 max-w-2xl font-light">
                            {currentRecipe.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                            <div className="flex items-center gap-2 text-gray-100 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                                <Clock className="w-5 h-5" />
                                <span className="font-medium">{currentRecipe.time_estimate}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-100 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                                <ChefHat className="w-5 h-5" />
                                <span className="font-medium">{currentRecipe.difficulty}</span>
                            </div>
                            
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToWeek(currentRecipe);
                                }}
                                disabled={addedToWeek[currentRecipe.title]}
                                className={`ml-auto px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${
                                    addedToWeek[currentRecipe.title]
                                    ? 'bg-green-500 text-white cursor-default'
                                    : 'bg-white text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                                {addedToWeek[currentRecipe.title] ? (
                                    <>Added! <Check className="w-5 h-5" /></>
                                ) : (
                                    <>Add to Week <CalendarPlus className="w-5 h-5" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {recipes.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                            title={`Go to slide ${idx + 1}`}
                            aria-label={`Go to slide ${idx + 1}`}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                                idx === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Modal */}
            {selectedRecipe && (
                <RecipeDetailsModal 
                    recipe={selectedRecipe}
                    onClose={() => setSelectedRecipe(null)}
                    onAddToWeek={handleAddToWeek}
                    onFeedback={handleFeedback}
                    isAdded={!!addedToWeek[selectedRecipe.title]}
                    feedbackState={feedback[selectedRecipe.title] || null}
                />
            )}
        </div>
    );
}
