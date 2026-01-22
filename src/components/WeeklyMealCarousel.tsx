import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Check, ThumbsDown, ThumbsUp, CalendarPlus, Loader2 } from 'lucide-react';

type WeeklyMealSet = {
    id: string;
    recipes: any[]; // The JSON structure from weekly-planner
    week_start_date: string;
};

export function WeeklyMealCarousel() {
    const { user } = useAuth();
    const [weeklySet, setWeeklySet] = useState<WeeklyMealSet | null>(null);
    const [loading, setLoading] = useState(true);
    const [addingToWeek, setAddingToWeek] = useState<Record<string, boolean>>({});
    const [addedToWeek, setAddedToWeek] = useState<Record<string, boolean>>({});
    const [feedback, setFeedback] = useState<Record<string, 'thumbs_up' | 'thumbs_down' | null>>({});

    useEffect(() => {
        if (!user) return;
        fetchWeeklySet();
    }, [user]);

    async function fetchWeeklySet() {
        try {
            setLoading(true);
            // Get latest set
            const { data, error } = await supabase
                .from('weekly_meal_sets')
                .select('*')
                .eq('user_id', user?.id)
                .order('week_start_date', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            setWeeklySet(data);
        } catch (err) {
            console.error('Error fetching weekly meals:', err);
        } finally {
            setLoading(false);
        }
    }

    // Manual trigger for dev/demo if no set exists
    async function triggerGeneration() {
        if (!user) return;
        setLoading(true);
        try {
            // Call Edge Function
            const { error } = await supabase.functions.invoke('weekly-planner', {
                body: { userId: user.id }
            });
            if (error) throw error;
            // Fetch again
            await fetchWeeklySet();
        } catch (err) {
            console.error("Error generating meals:", err);
            alert("Failed to generate weekly meals. Check console.");
        } finally {
            setLoading(false);
        }
    }

    async function handleAddToWeek(recipe: any) {
        if (!user) return;
        const recipeTitle = recipe.title;
        setAddingToWeek(prev => ({ ...prev, [recipeTitle]: true }));

        try {
            // Create a meal entry
            // Note: We might want to create the REAL recipe first?
            // "Add to My Week" usually implies adding to the Calendar.
            // Our 'meals' table has (name, date, etc.).
            // If the recipe doesn't exist in 'recipes' table, we just add it as a loose meal description?
            // Or we import it?
            // For V1 "Instant Addition", let's Insert into 'meals' with name = Title.
            // Ideally we also Link it to a recipe, but if it's transient...
            // Let's just insert into `meals`.
            
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1); // Default to tomorrow? Or Unscheduled?
            // 'date' is NOT NULL in schema. Default Current Date.
            // Let's default to today.
            
            const { error } = await supabase.from('meals').insert({
                user_id: user.id,
                name: recipe.title,
                date: new Date().toISOString().split('T')[0], // Today
                description: `Weekly Planner Suggestion: ${recipe.description}`,
                notes: `Time: ${recipe.time_estimate}. Difficulty: ${recipe.difficulty}.`
            });

            if (error) throw error;

            setAddedToWeek(prev => ({ ...prev, [recipeTitle]: true }));
            
            // Show toast/timer to reset "Added" state?
            setTimeout(() => {
                setAddedToWeek(prev => ({ ...prev, [recipeTitle]: true })); // Keep it checked?
            }, 3000);

        } catch (err) {
            console.error("Error adding to week:", err);
            alert("Failed to add meal.");
        } finally {
            setAddingToWeek(prev => ({ ...prev, [recipeTitle]: false }));
        }
    }

    async function handleFeedback(recipe: any, rating: 'thumbs_up' | 'thumbs_down') {
        if (!user) return;
        const recipeTitle = recipe.title;
        
        // Optimistic UI
        setFeedback(prev => ({ ...prev, [recipeTitle]: rating }));

        try {
            const { error } = await supabase.from('meal_feedback').insert({
                user_id: user.id,
                target_id: recipeTitle, // Using Title as ID for transient items
                target_type: 'suggestion',
                rating: rating,
                details: { recipe_snapshot: recipe }
            });
            if (error) throw error;
        } catch (err) {
            console.error("Feedback error:", err);
            // Revert on error
            setFeedback(prev => ({ ...prev, [recipeTitle]: null }));
        }
    }

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-terracotta-500" /></div>;
    }

    if (!weeklySet) {
        return (
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-8 rounded-2xl mb-8 flex flex-col items-center text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready for your Weekly Menu?</h2>
                <p className="text-gray-600 mb-6 max-w-md">
                    Get 5 chef-curated recipes tailored to your taste, every Sunday.
                </p>
                <button 
                    onClick={triggerGeneration}
                    className="px-6 py-3 bg-terracotta-600 text-white rounded-xl font-bold hover:bg-terracotta-700 transition shadow-lg flex items-center gap-2"
                >
                    <CalendarPlus className="w-5 h-5" />
                    Generate My Menu Now
                </button>
            </div>
        );
    }

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Your Weekly Menu Drop</h2>
                    <p className="text-gray-500 text-sm">Curated for the week of {new Date(weeklySet.week_start_date).toLocaleDateString()}</p>
                </div>
                {/* Optional: Add "See All" or "Settings" link */}
            </div>

            <div className="relative">
                {/* Carousel Container */}
                <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                    {weeklySet.recipes.map((recipe, idx) => {
                        const isLiked = feedback[recipe.title] === 'thumbs_up';
                        const isDisliked = feedback[recipe.title] === 'thumbs_down';
                        const isAdded = addedToWeek[recipe.title];
                        const isBusy = addingToWeek[recipe.title];

                        return (
                            <div 
                                key={idx} 
                                className="min-w-[280px] w-[280px] md:min-w-[320px] md:w-[320px] snap-center bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all"
                            >
                                {/* Image Placeholder / Gradient */}
                                <div className="h-40 bg-gradient-to-br from-orange-100 to-rose-50 relative p-4 flex flex-col justify-end">
                                    <div className="absolute top-3 right-3 flex gap-1 bg-white/80 backdrop-blur rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleFeedback(recipe, 'thumbs_down')}
                                            title="I don't like this"
                                            className={`p-1.5 rounded-full hover:bg-rose-100 ${isDisliked ? 'text-rose-500 bg-rose-50' : 'text-gray-400'}`}
                                        >
                                            <ThumbsDown size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleFeedback(recipe, 'thumbs_up')}
                                            title="I like this"
                                            className={`p-1.5 rounded-full hover:bg-green-100 ${isLiked ? 'text-green-500 bg-green-50' : 'text-gray-400'}`}
                                        >
                                            <ThumbsUp size={14} />
                                        </button>
                                    </div>
                                    <div className="absolute top-3 left-3">
                                        <span className="bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-gray-700 shadow-sm">
                                            {recipe.tags?.protein || 'Main'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col flex-grow">
                                    <h3 className="font-bold text-gray-900 mb-1 leading-tight line-clamp-1">{recipe.title}</h3>
                                    <p className="text-xs text-gray-500 mb-3">{recipe.time_estimate} • {recipe.difficulty}</p>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-grow">{recipe.description}</p>

                                    <button 
                                        onClick={() => handleAddToWeek(recipe)}
                                        disabled={isAdded || isBusy}
                                        className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                                            isAdded 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-stone-900 text-white hover:bg-stone-800'
                                        }`}
                                    >
                                        {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                                         isAdded ? <><Check className="w-4 h-4" /> Added</> : 'Add to My Week'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
