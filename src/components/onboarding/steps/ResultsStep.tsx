import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { RecipeSuggestion } from '../../RecipeSuggestionCard';
import { RecipeSuggestionCard } from '../../RecipeSuggestionCard';

export type ResultsStepProps = {
  suggestions: RecipeSuggestion[];
  onSelect: (suggestion: RecipeSuggestion) => void;
  onRestart: () => void;
};

export function ResultsStep({ suggestions, onSelect, onRestart }: ResultsStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto w-full"
    >
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-terracotta-100 text-terracotta-600 rounded-full mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">We found 3 perfect matches!</h2>
        <p className="text-gray-600">Pick one to start cooking instantly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {suggestions.map((suggestion, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 + 0.3 }}
            className="h-full"
          >
             <div className="h-full transform transition-transform hover:-translate-y-1 duration-300">
                <RecipeSuggestionCard 
                    suggestion={suggestion}
                    onSave={async () => {
                        // For the onboarding "wow", save/view are similar actions - "I want this one"
                        onSelect(suggestion);
                    }}
                    onClick={() => onSelect(suggestion)}
                />
             </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onRestart}
          className="text-gray-400 hover:text-gray-600 font-medium text-sm flex items-center gap-2"
        >
          Start over
        </button>
      </div>
    </motion.div>
  );
}
