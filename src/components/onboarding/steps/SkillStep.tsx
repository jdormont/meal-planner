import { motion } from 'framer-motion';
import { ArrowLeft, Award, ChefHat, Flame } from 'lucide-react';

export type SkillStepProps = {
  selectedSkill: string;
  onChange: (skill: string) => void;
  onNext: () => void;
  onBack: () => void;
};

const SKILL_OPTIONS = [
  { id: 'beginner', label: 'Beginner', sub: 'I want simple & foolproof.', icon: Award },
  { id: 'comfortable', label: 'Comfortable', sub: 'I can chop & sauté.', icon: ChefHat },
  { id: 'confident', label: 'Confident', sub: 'I love a challenge.', icon: Flame },
];

export function SkillStep({ selectedSkill, onChange, onNext, onBack }: SkillStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your comfort level?</h2>
      <p className="text-gray-600 mb-8">We'll match recipes to your expertise.</p>

      <div className="space-y-4 mb-8">
        {SKILL_OPTIONS.map((option) => {
          const isSelected = selectedSkill === option.id;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => {
                onChange(option.id);
                setTimeout(onNext, 250);
              }}
              className={`w-full p-6 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${
                isSelected
                  ? 'border-terracotta-500 bg-terracotta-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className={`p-3 rounded-full ${isSelected ? 'bg-terracotta-100 text-terracotta-600' : 'bg-gray-100 text-gray-500'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className={`font-bold text-lg ${isSelected ? 'text-terracotta-900' : 'text-gray-900'}`}>{option.label}</div>
                <div className="text-gray-500">{option.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-start">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium px-4 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    </motion.div>
  );
}
