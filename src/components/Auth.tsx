import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, Loader2, ChefHat, Globe, Calendar, Sparkles, Chrome } from 'lucide-react';

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = isSignUp
      ? await signUp(email, password, fullName)
      : await signIn(email, password);

    if (authError) {
      setError(authError.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream-200 texture-linen">
      <div className="min-h-screen flex flex-col lg:flex-row">
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="max-w-xl w-full">
            <div className="mb-8 lg:mb-12">
              <div className="inline-flex items-center gap-3 mb-6">
                <img src="/gemini_generated_image_9fuv9w9fuv9w9fuv-remove-background.com.png" alt="Sous" className="h-12" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Cook smarter.<br />Plan effortlessly.
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed">
                Save your favorite recipes, plan meals for the week, and let AI help you cook with confidence.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-cream-50 rounded-2xl border border-sage-200">
                <div className="flex-shrink-0 p-2 bg-terracotta-100 rounded-xl">
                  <ChefHat className="w-6 h-6 text-terracotta-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Save & organize recipes</h3>
                  <p className="text-sm text-gray-600">Keep all your favorite food and cocktail recipes in one place</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-cream-50 rounded-2xl border border-sage-200">
                <div className="flex-shrink-0 p-2 bg-sage-200 rounded-xl">
                  <div className="relative">
                    <Globe className="w-6 h-6 text-sage-700" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Import from anywhere</h3>
                  <p className="text-sm text-gray-600">Grab recipes from websites or snap photos of cookbook pages</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-cream-50 rounded-2xl border border-sage-200">
                <div className="flex-shrink-0 p-2 bg-warmtan-200 rounded-xl">
                  <Calendar className="w-6 h-6 text-warmtan-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Plan meals effortlessly</h3>
                  <p className="text-sm text-gray-600">Organize weekly dinners and plan special multi-dish occasions</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-cream-50 rounded-2xl border border-sage-200">
                <div className="flex-shrink-0 p-2 bg-terracotta-100 rounded-xl">
                  <div className="relative">
                    <ChefHat className="w-6 h-6 text-terracotta-600" />
                    <Sparkles className="w-3 h-3 absolute -top-0.5 -right-0.5 text-terracotta-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Meet Your Sous Chef</h3>
                  <p className="text-sm text-gray-600">A culinary partner that learns your tastes, scans your pantry, and helps you decide what to cook in seconds.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-center p-6 lg:p-12 lg:w-[500px]">
          <div className="w-full max-w-md">
            <div className="bg-cream-50 rounded-3xl shadow-2xl p-8 border border-sage-200">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-terracotta-100 p-3 rounded-2xl">
                  {isSignUp ? (
                    <UserPlus className="w-8 h-8 text-terracotta-600" />
                  ) : (
                    <LogIn className="w-8 h-8 text-terracotta-600" />
                  )}
                </div>
              </div>

              <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-center text-gray-600 mb-8">
                {isSignUp
                  ? 'Your personal recipe collection awaits'
                  : 'Your recipes are waiting for you'}
              </p>

              <div className="space-y-4 mb-6">
                <button
                  onClick={() => signInWithGoogle()}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-sage-300 font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-3 shadow-sm"
                >
                  <Chrome className="w-5 h-5 text-gray-900" />
                  Sign in with Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-sage-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-cream-50 text-gray-500">Or continue with email</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignUp && (
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-sage-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none transition bg-white"
                      placeholder="John Doe"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-sage-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none transition bg-white"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-sage-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none transition bg-white"
                    placeholder="••••••••"
                  />
                  {isSignUp && (
                    <p className="mt-2 text-xs text-gray-500">At least 6 characters</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {isSignUp && (
                  <div className="bg-sage-50 border border-sage-200 px-4 py-3 rounded-xl text-sm text-gray-700">
                    Your account will be reviewed by an admin before approval
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-terracotta-600 hover:bg-terracotta-700 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isSignUp ? (
                    'Create Account'
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setFullName('');
                  }}
                  className="text-terracotta-600 hover:text-terracotta-700 text-sm font-medium transition"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <a href="/privacy" className="text-sm text-gray-500 hover:text-gray-900 transition underline underline-offset-4">
                Privacy Policy & Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
