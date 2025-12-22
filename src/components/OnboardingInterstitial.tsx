import { X } from 'lucide-react';

type OnboardingInterstitialProps = {
  onClose: () => void;
};

export function OnboardingInterstitial({ onClose }: OnboardingInterstitialProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex p-4 bg-gradient-to-br from-terracotta-100 to-cream-100 rounded-full mb-6">
            <span className="text-5xl">👨‍🍳</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Think of this as a smart cooking partner.
          </h2>

          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            It remembers what's worked, keeps things from getting repetitive, and helps you choose meals that actually fit your week.
          </p>

          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
