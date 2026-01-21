import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export type AllergyStepProps = {
  selectedAllergies: string[];
  onChange: (allergies: string[]) => void;
  onNext: () => void;
};

const ALLERGENS = [
  { id: 'peanuts', label: 'Peanuts', icon: '🥜' },
  { id: 'tree_nuts', label: 'Tree Nuts', icon: '🌰' },
  { id: 'dairy', label: 'Dairy', icon: '🥛' },
  { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'gluten', label: 'Gluten', icon: '🍞' },
  { id: 'soy', label: 'Soy', icon: '🥢' },
  { id: 'fish', label: 'Fish', icon: '🐟' },
  { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
];

export function AllergyStep({ selectedAllergies, onChange, onNext }: AllergyStepProps) {
  const toggleAllergy = (id: string) => {
    if (selectedAllergies.includes(id)) {
      onChange(selectedAllergies.filter(a => a !== id));
    } else {
      onChange([...selectedAllergies, id]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Any allergies we should know?</h2>
      <p className="text-gray-600 mb-8">Select what your crew needs to avoid.</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {ALLERGENS.map((allergen) => {
          const isSelected = selectedAllergies.includes(allergen.id);
          return (
            <button
              key={allergen.id}
              onClick={() => toggleAllergy(allergen.id)}
              className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                isSelected
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-gray-100 bg-white hover:border-gray-200 text-gray-700'
              }`}
            >
              <span className="text-3xl">{allergen.icon}</span>
              <span className="font-medium">{allergen.label}</span>
              {isSelected && (
                <div className="absolute top-2 right-2 text-red-500">
                  <X className="w-4 h-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="px-8 py-3 bg-terracotta-500 text-white rounded-xl font-semibold shadow-lg hover:bg-terracotta-600 transition-colors"
        >
          {selectedAllergies.length > 0 ? "Got it, continue" : "No allergies, continue"}
        </button>
      </div>
    </motion.div>
  );
}
