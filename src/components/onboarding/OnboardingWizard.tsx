import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { WelcomeStep } from './steps/WelcomeStep';
import { AllergyStep } from './steps/AllergyStep';
import { TimeStep } from './steps/TimeStep';
import { SkillStep } from './steps/SkillStep';
import { ReviewStep } from './steps/ReviewStep';
import { ResultsStep } from './steps/ResultsStep';
import { RecipeSuggestion } from '../RecipeSuggestionCard';
import { LogOut } from 'lucide-react';

type OnboardingWizardProps = {
  onComplete: (suggestion: RecipeSuggestion) => void;
};

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user, signOut } = useAuth();
  const [step, setStep] = useState(0); // 0 is now WelcomeStep
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  
  // Preference State
  const [allergies, setAllergies] = useState<string[]>([]);
  const [time, setTime] = useState<string>('');
  const [skill, setSkill] = useState<string>('');

  // Load existing preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('food_restrictions, time_preference, skill_level')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          if (data.food_restrictions) setAllergies(data.food_restrictions);
          if (data.time_preference) setTime(convertDbTimeToUi(data.time_preference));
          if (data.skill_level) setSkill(data.skill_level);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, [user]);

  // Helper to convert DB time to UI interaction model
  const convertDbTimeToUi = (dbTime: string) => {
      // Map DB 'quick'/'moderate'/'relaxed' to '15'/'30'/'60' if needed
      if (dbTime === 'quick') return '15';
      if (dbTime === 'moderate') return '30';
      if (dbTime === 'relaxed') return '60';
      return '30'; // Default
  }

  // Helper to convert UI time to DB
  const convertUiTimeToDb = (uiTime: string) => {
      if (uiTime === '15') return 'quick';
      if (uiTime === '30') return 'moderate';
      if (uiTime === '60') return 'relaxed';
      return 'moderate';
  }

  // Stepwise Saving
  const saveStepData = async (newAllergies?: string[], newTime?: string, newSkill?: string) => {
    if (!user) return;
    
    const updates: any = {};
    if (newAllergies !== undefined) updates.food_restrictions = newAllergies;
    if (newTime !== undefined) updates.time_preference = convertUiTimeToDb(newTime);
    if (newSkill !== undefined) updates.skill_level = newSkill;
    
    // Optimistic UI update
    if (newAllergies !== undefined) setAllergies(newAllergies);
    if (newTime !== undefined) setTime(newTime);
    if (newSkill !== undefined) setSkill(newSkill);

    try {
      // Upsert to ensure record exists
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
            user_id: user.id,
            ...updates,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving step data:', error);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => Math.max(0, prev - 1));

  const handleAllergyChange = (newAllergies: string[]) => {
      saveStepData(newAllergies, undefined, undefined);
  };

  const handleTimeChange = (newTime: string) => {
      saveStepData(undefined, newTime, undefined);
  };
  
  const handleSkillChange = (newSkill: string) => {
      saveStepData(undefined, undefined, newSkill);
  };

  const generateWowRecipes = async () => {
      if (!user) return;
      setIsGenerating(true);

      try {
           const { data: { session } } = await supabase.auth.getSession();
           const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
           
           // Construct a special "Planner Mode" message
           const plannerMessage = {
               role: 'user',
               content: `PLANNER_MODE_ACTIVATED: 
               User Context:
               - Time: ${time === '15' ? '15 mins' : time === '30' ? '30 mins' : '1 hour'}
               - Skill: ${skill}
               - Allergies: ${allergies.join(', ') || 'None'}
               
               Task: Generate 3 "Wow" recipes that perfectly match these constraints. 
               If specific allergies are present, ensure ABSOLUTE SAFETY.
               If beginner, ensure NO complex techniques.
               Return ONLY the JSON suggestions.`
           };

           const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages: [plannerMessage],
                userId: user.id,
                // We pass current preferences directly to ensure they are respected even if DB lag
                userPreferences: {
                    food_restrictions: allergies,
                    time_preference: convertUiTimeToDb(time),
                    skill_level: skill
                }
              }),
            }
          );

          if (!response.ok) throw new Error('AI generation failed');
          
          const data = await response.json();
          const suggestions = data.data?.suggestions || [];
          
          if (suggestions.length > 0) {
              setSuggestions(suggestions);
              setStep(5); // Adjusted to 5 because WelcomeStep is 0, so Results is 5
          } else {
              // Fallback or error handling
              console.warn('No suggestions returned');
          }

      } catch (error) {
          console.error("Wow generation error:", error);
      } finally {
          setIsGenerating(false);
      }
  };

  const expandRecipeDetails = async (suggestion: RecipeSuggestion) => {
      // If already has details, just proceed
      if (suggestion.full_details) {
          onComplete(suggestion);
          return;
      }

      setIsGenerating(true);
      try {
           const { data: { session } } = await supabase.auth.getSession();
           const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
           
           const expandMessage = {
               role: 'user',
               content: `Examples/Full Recipe Request:
               Please provide the FULL details (ingredients and instructions) for this recipe you just suggested: "${suggestion.title}".
               Description: ${suggestion.description}
               
               Return the JSON with "full_details" populated.`
           };

           const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages: [expandMessage],
                userId: user?.id,
                userPreferences: {
                    food_restrictions: allergies,
                    time_preference: convertUiTimeToDb(time),
                    skill_level: skill
                },
                forceCuisine: suggestion.cuisine // Keep consistent style
              }),
            }
          );

          if (!response.ok) throw new Error('Expansion failed');
          
          const data = await response.json();
          const expandedSuggestion = data.data?.suggestions?.[0]; // Usually returns suggestions array
          
          // Fallback: merge with existing if AI returns structure key
          if (expandedSuggestion) {
              const merged = { ...suggestion, ...expandedSuggestion, full_details: expandedSuggestion.full_details };
              onComplete(merged);
          } else {
             // If structure fails, we might just have to pass original and warn/hope
             onComplete(suggestion);
          }

      } catch (error) {
          console.error("Expansion error:", error);
          alert("We couldn't generate the full recipe details right now. Please try clicking it again.");
          // Do NOT proceed with incomplete data
      } finally {
          setIsGenerating(false);
      }
  };

  if (loading) return null; // Or a spinner

  return (
    <div className="fixed inset-0 bg-cream-50 z-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col">
        {/* Header Actions */}
        <div className="absolute top-4 right-4 z-50">
            <button 
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
            >
                <LogOut size={16} />
                Sign Out
            </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200">
          <motion.div 
            className="h-full bg-terracotta-500"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / 6) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8 min-h-[500px] flex flex-col justify-center relative overflow-hidden">
             <AnimatePresence mode="wait">
                {step === 0 && (
                    <WelcomeStep onNext={nextStep} />
                )}
                {step === 1 && (
                    <AllergyStep 
                        key="allergy"
                        selectedAllergies={allergies}
                        onChange={handleAllergyChange}
                        onNext={nextStep}
                    />
                )}
                {step === 2 && (
                    <TimeStep 
                        key="time"
                        selectedTime={time}
                        onChange={handleTimeChange}
                        onNext={nextStep}
                        onBack={prevStep}
                    />
                )}
                {step === 3 && (
                    <SkillStep 
                        key="skill"
                        selectedSkill={skill}
                        onChange={handleSkillChange}
                        onNext={nextStep}
                        onBack={prevStep}
                    />
                )}
                {step === 4 && (
                    <ReviewStep 
                        key="review"
                        allergies={allergies}
                        time={time}
                        skill={skill}
                        onBack={prevStep}
                        onComplete={generateWowRecipes}
                        isGenerating={isGenerating}
                    />
                )}
                {step === 5 && (
                    <ResultsStep 
                        key="results"
                        suggestions={suggestions}
                        onSelect={(s) => expandRecipeDetails(s)}
                        onRestart={() => setStep(0)}
                    />
                )}
             </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
