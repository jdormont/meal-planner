import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export type ReviewStepProps = {
  allergies: string[];
  time: string;
  skill: string;
  onBack: () => void;
  onComplete: () => void;
  isGenerating: boolean;
};

export function ReviewStep({ allergies, time, skill, onBack, onComplete, isGenerating }: ReviewStepProps) {
  
  const getSummary = () => {
    let summary = [];
    if (allergies.length > 0) {
        summary.push(`Avoiding ${allergies.length} items (Safe!)`);
    } else {
        summary.push("No allergies (Lucky!)");
    }
    
    summary.push(time === '15' ? "Under 15 mins" : time === '30' ? "Under 30 mins" : "Up to an hour");
    summary.push(skill === 'beginner' ? "Simple recipes" : skill === 'comfortable' ? "Everyday cooking" : "Pro level");
    
    return summary;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-md mx-auto text-center"
    >
      <div className="inline-flex p-4 bg-terracotta-100 rounded-full mb-6">
        <span className="text-5xl">🎉</span>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-4">You're all set!</h2>
      <p className="text-gray-600 text-lg mb-8">
        We've found some great matches for you.
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-8 text-left">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Your Setup</h3>
        <div className="space-y-4">
             {getSummary().map((line, i) => (
                 <div key={i} className="flex items-center gap-3">
                     <CheckCircle2 className="w-5 h-5 text-green-500" />
                     <span className="text-gray-700 font-medium">{line}</span>
                 </div>
             ))}
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={onComplete}
          disabled={isGenerating}
          className="w-full px-8 py-4 bg-terracotta-500 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-terracotta-600 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-3"
        >
          {isGenerating ? (
              <>
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                 Cooking up magic...
              </>
          ) : (
            "Let's Cook"
          )}
        </button>
        
        {!isGenerating && (
             <button
              onClick={onBack}
              className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 font-medium px-4 py-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Change something
            </button>
        )}
      </div>
    </motion.div>
  );
}
