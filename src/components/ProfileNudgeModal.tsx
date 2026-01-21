import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Globe, Camera, UserCircle, ChefHat } from 'lucide-react';

type ProfileNudgeModalProps = {
  onClose: () => void;
  onGoToSettings: () => void;
};

export function ProfileNudgeModal({ onClose, onGoToSettings }: ProfileNudgeModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
      >
        <div className="relative p-6 text-center">
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X size={20} />
            </button>

            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat size={32} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Recipe Saved!</h2>
            <p className="text-gray-600 mb-8">
                That's one down. Here are 3 ways to keep building your cookbook:
            </p>

            {/* 3 Ways Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="flex flex-col items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Sparkles size={20} />
                    </div>
                    <span className="text-xs font-semibold text-indigo-900">AI Gen</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 bg-sage-50 rounded-xl border border-sage-100">
                     <div className="p-2 bg-sage-100 text-sage-600 rounded-lg">
                        <Globe size={20} />
                    </div>
                    <span className="text-xs font-semibold text-sage-900">Web Import</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 bg-warmtan-50 rounded-xl border border-warmtan-100">
                     <div className="p-2 bg-warmtan-100 text-warmtan-600 rounded-lg">
                        <Camera size={20} />
                    </div>
                    <span className="text-xs font-semibold text-warmtan-900">Scan Photo</span>
                </div>
            </div>

            {/* Profile Nudge Box */}
            <div className="bg-terracotta-50 border border-terracotta-100 rounded-xl p-4 mb-6 text-left flex gap-4">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-terracotta-100 text-terracotta-600 rounded-full flex items-center justify-center">
                        <UserCircle size={20} />
                    </div>
                </div>
                <div>
                     <h3 className="font-bold text-gray-900 text-sm mb-1">Get better recommendations</h3>
                     <p className="text-sm text-gray-600 leading-relaxed">
                        Take a moment to complete your profile (dietary needs, household size) so our AI can suggest even better meals.
                     </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
                <button
                    onClick={() => {
                        onGoToSettings();
                        onClose();
                    }}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg"
                >
                    Complete My Profile
                </button>
                <button
                    onClick={onClose}
                    className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
                >
                    Maybe later
                </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
