import { motion } from 'framer-motion';
import { ChefHat, Sparkles } from 'lucide-react';

export type WelcomeStepProps = {
  onNext: () => void;
};

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto text-center"
    >
      <div className="inline-flex p-6 bg-terracotta-100 rounded-full mb-8 relative">
        <ChefHat className="w-12 h-12 text-terracotta-600" />
        <motion.div 
            animate={{ scale: [1, 1.2, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 bg-yellow-400 p-1.5 rounded-full border-2 border-white"
        >
            <Sparkles className="w-4 h-4 text-yellow-900" />
        </motion.div>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-4">Let's set up your kitchen</h2>
      <p className="text-gray-600 text-lg mb-8 leading-relaxed">
        Tell us a few things about how you like to cook, and we'll instantly generate <span className="font-semibold text-terracotta-600">3 personalized recipes</span> just for you.
      </p>

      <ul className="text-left space-y-4 mb-10 max-w-xs mx-auto">
          <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center font-bold text-sm">1</span>
              <span className="text-gray-700">Set dietary filters</span>
          </li>
          <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center font-bold text-sm">2</span>
              <span className="text-gray-700">Choose your time & skill</span>
          </li>
          <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center font-bold text-sm">3</span>
              <span className="text-gray-700">Get custom recipes</span>
          </li>
      </ul>

      <button
        onClick={onNext}
        className="w-full px-8 py-4 bg-terracotta-500 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-terracotta-600 transition-all transform hover:scale-[1.02]"
      >
        Get Started
      </button>
    </motion.div>
  );
}
