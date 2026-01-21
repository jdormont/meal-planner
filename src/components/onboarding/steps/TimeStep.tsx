import { motion } from 'framer-motion';
import { ArrowLeft, Clock } from 'lucide-react';

export type TimeStepProps = {
  selectedTime: string;
  onChange: (time: string) => void;
  onNext: () => void;
  onBack: () => void;
};

const TIME_OPTIONS = [
  { id: '15', label: 'Super Fast', sub: 'Under 15 mins' },
  { id: '30', label: 'Balanced', sub: 'Under 30 mins' },
  { id: '60', label: 'Relaxed', sub: 'Up to an hour' },
];

export function TimeStep({ selectedTime, onChange, onNext, onBack }: TimeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-2">How much time do you have?</h2>
      <p className="text-gray-600 mb-8">We'll find recipes that fit your schedule.</p>

      <div className="space-y-4 mb-8">
        {TIME_OPTIONS.map((option) => {
          const isSelected = selectedTime === option.id;
          return (
            <button
              key={option.id}
              onClick={() => {
                  onChange(option.id);
                  // Auto-advance for single select is snappy
                  setTimeout(onNext, 250);
              }}
              className={`w-full p-6 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${
                isSelected
                  ? 'border-terracotta-500 bg-terracotta-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className={`p-3 rounded-full ${isSelected ? 'bg-terracotta-100 text-terracotta-600' : 'bg-gray-100 text-gray-500'}`}>
                <Clock className="w-6 h-6" />
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
