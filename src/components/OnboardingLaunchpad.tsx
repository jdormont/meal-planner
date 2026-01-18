import { Camera, ChefHat, Link } from 'lucide-react';

type OnboardingLaunchpadProps = {
    onScan: () => void;
    onChat: () => void;
    onImport: () => void;
};

export function OnboardingLaunchpad({ onScan, onChat, onImport }: OnboardingLaunchpadProps) {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Welcome to Sous! Let's fill your kitchen.
                </h2>
                <p className="text-lg text-gray-600">
                    Get started by adding your first recipe in seconds.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card A: Vision */}
                <button
                    onClick={onScan}
                    className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-terracotta-200 transition-all group text-left flex flex-col items-start h-full"
                >
                    <div className="p-3 bg-warmtan-100 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Camera className="w-8 h-8 text-warmtan-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-terracotta-600 transition-colors">
                        Scan Ingredients
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                        Take a photo of ingredients or a recipe page to instantly digitize it.
                    </p>
                </button>

                {/* Card B: AI Chat */}
                <button
                    onClick={onChat}
                    className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-terracotta-200 transition-all group text-left flex flex-col items-start h-full"
                >
                    <div className="p-3 bg-indigo-100 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                        <ChefHat className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        Ask the Chef
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                        Tell our AI Chef what you're craving and get a custom recipe in seconds.
                    </p>
                </button>

                {/* Card C: Import */}
                <button
                    onClick={onImport}
                    className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-terracotta-200 transition-all group text-left flex flex-col items-start h-full"
                >
                    <div className="p-3 bg-sage-100 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Link className="w-8 h-8 text-sage-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-sage-600 transition-colors">
                        Import from Web
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                        Paste a URL from your favorite food blog to save it to your collection.
                    </p>
                </button>
            </div>
        </div>
    );
}
