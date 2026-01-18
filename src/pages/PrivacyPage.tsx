
import { Shield, Lock, ChefHat, Mail, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/gemini_generated_image_9fuv9w9fuv9w9fuv-remove-background.com.png" alt="Sous" className="h-8" />
                        <span className="font-bold text-xl text-gray-900">Sous</span>
                    </div>
                    <a href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to App
                    </a>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="prose prose-slate max-w-none">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy & Terms</h1>
                    <p className="text-lg text-gray-600 mb-8">Last updated: January 2026</p>

                    <div className="my-10 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                        <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-blue-900 text-lg mb-1 mt-0">Our Commitment to Privacy</h3>
                            <p className="text-blue-800 m-0">
                                Sous is designed to be a helpful cooking companion. We believe your recipes and personal data belong to you.
                                We do not sell your personal data to third parties.
                            </p>
                        </div>
                    </div>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Lock className="w-6 h-6 text-gray-400" />
                            1. Data Collection & Usage
                        </h2>
                        <p className="text-gray-700 leading-relaxed">
                            We collect information to provide you with a better cooking experience. This includes:
                        </p>
                        <ul className="space-y-2 text-gray-700 list-disc pl-5 mt-4">
                            <li><strong>Account Information:</strong> When you sign up via Google or email, we store your email address and name to identify your account.</li>
                            <li><strong>Recipes & Content:</strong> The recipes, images, and notes you save or create are stored securely in our database so you can access them across devices.</li>
                            <li><strong>Usage Data:</strong> We may collect anonymous analytics data (such as which features are used most) to help us improve the app.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ChefHat className="w-6 h-6 text-gray-400" />
                            2. AI & Third-Party Processors
                        </h2>
                        <p className="text-gray-700 leading-relaxed">
                            Sous uses advanced Artificial Intelligence (AI) to help you generate recipes, parse ingredients, and answer cooking questions.
                        </p>
                        <div className="mt-4 pl-4 border-l-4 border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-2">How AI Data is Handled</h4>
                            <p className="text-gray-700">
                                When you use AI features (like "Generate with AI" or the "Chef Assistant"), the text and context you provide are sent to our AI providers (such as OpenAI or Google) for processing.
                                <strong> This data is NOT used by our providers to train their models.</strong> We have strict agreements in place to ensure your data remains private.
                            </p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Safety Disclaimer</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Cooking involves real-world risks, including sharp knives, high heat, and raw ingredients.
                        </p>
                        <ul className="space-y-2 text-gray-700 list-disc pl-5">
                            <li><strong>AI Limitations:</strong> AI-generated recipes may contain errors. Always use your best judgment.</li>
                            <li><strong>Food Safety:</strong> You are responsible for following proper food safety guidelines. Ensure all meats are cooked to safe internal temperatures regardless of what a recipe states.</li>
                            <li><strong>Allergens:</strong> AI may not always identify allergens. Always double-check ingredients if you have food sensitivities.</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Terms of Service</h2>
                        <p className="text-gray-700 leading-relaxed">
                            By using Sous, you agree to these terms. You are responsible for maintaining the security of your account.
                            We reserve the right to suspend accounts that violate our usage policies or engage in abusive behavior. Use of the Instacart integration is subject to Instacart's own terms and privacy policy.
                        </p>
                    </section>

                    <div className="bg-gray-50 rounded-2xl p-8 text-center">
                        <Mail className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-900 text-lg mb-2">Have Questions?</h3>
                        <p className="text-gray-600 mb-4">
                            If you have any questions about our privacy practices, please contact us.
                        </p>
                        <a href="mailto:support@sousapp.com" className="inline-block bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-medium px-6 py-2 rounded-lg transition-colors shadow-sm">
                            support@sousapp.com
                        </a>
                    </div>
                </div>
            </main>

            <footer className="max-w-3xl mx-auto px-6 py-8 border-t border-gray-100 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Sous App. All rights reserved.
            </footer>
        </div>
    );
}
