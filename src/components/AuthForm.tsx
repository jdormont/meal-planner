import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Chrome, UserPlus, LogIn } from 'lucide-react';

type AuthMode = 'signin' | 'signup';

interface AuthFormProps {
  mode?: AuthMode;
  onSuccess?: () => void;
}

export function AuthForm({ mode: initialMode = 'signin', onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = mode === 'signup'
      ? await signUp(email, password, fullName)
      : await signIn(email, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      setLoading(false);
      if (onSuccess) onSuccess();
    }
  };

  const isSignUp = mode === 'signup';

  return (
    <div className="w-full max-w-md mx-auto">


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
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
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
            setMode(isSignUp ? 'signin' : 'signup');
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
      
      <div className="mt-8 text-center">
        <a href="/privacy" className="text-sm text-gray-500 hover:text-gray-900 transition underline underline-offset-4">
          Privacy Policy & Terms
        </a>
      </div>
    </div>
  );
}
