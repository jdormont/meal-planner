import { Bookmark, Clock, Signal } from 'lucide-react';
import { useState } from 'react';

export type RecipeSuggestion = {
    title: string;
    description: string;
    time_estimate: string;
    difficulty: string;
    reason_for_recommendation: string;
    full_details?: {
        ingredients: string[];
        instructions: string[];
        nutrition_notes?: string;
    };
    image_url?: string;
};

type RecipeSuggestionCardProps = {
    suggestion: RecipeSuggestion;
    onSave: () => Promise<void>;
    onClick: () => void;
};

export function RecipeSuggestionCard({ suggestion, onSave, onClick }: RecipeSuggestionCardProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSaving || isSaved) return;
        setIsSaving(true);
        try {
            await onSave();
            setIsSaved(true);
        } catch (error) {
            console.error('Failed to save recipe:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            onClick={onClick}
            className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer flex flex-col gap-3 h-full group"
        >
            <div className="flex justify-between items-start gap-3">
                <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {suggestion.title}
                </h3>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="text-gray-400 hover:text-orange-500 transition-colors flex-shrink-0"
                    title="Save Recipe"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-orange-500 text-orange-500' : ''}`} />
                    )}
                </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    <Clock size={14} className="text-gray-400" />
                    <span>{suggestion.time_estimate}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Signal size={14} className="text-gray-400" />
                    <span>{suggestion.difficulty || 'Easy'}</span>
                </div>
            </div>

            <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                {suggestion.description}
            </p>
        </div>
    );
}
