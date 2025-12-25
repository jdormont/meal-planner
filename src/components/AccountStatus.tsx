import { useAuth } from '../contexts/AuthContext';
import { LogOut, Clock, XCircle } from 'lucide-react';

export function AccountStatus() {
  const { user, userProfile, signOut } = useAuth();

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-cream-200 texture-linen flex items-center justify-center p-4">
        <div className="bg-cream-50 rounded-3xl shadow-xl p-8 w-full max-w-md border border-sage-200">
          <div className="text-center">
            <img src="/gemini_generated_image_9fuv9w9fuv9w9fuv-remove-background.com.png" alt="Sous" className="h-12 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading your account status...</p>
          </div>
        </div>
      </div>
    );
  }

  const isPending = userProfile.status === 'PENDING';
  const isRejected = userProfile.status === 'REJECTED';

  return (
    <div className="min-h-screen bg-cream-200 texture-linen flex items-center justify-center p-4">
      <div className="bg-cream-50 rounded-3xl shadow-xl p-8 w-full max-w-md border border-sage-200">
        <div className="text-center mb-6">
          <div className={`inline-flex p-4 rounded-2xl mb-4 ${
            isPending ? 'bg-warmtan-100' : 'bg-red-100'
          }`}>
            {isPending ? (
              <Clock className="w-12 h-12 text-warmtan-600" />
            ) : (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isPending ? 'Account Under Review' : 'Account Not Approved'}
          </h1>

          <p className="text-gray-600 text-lg">
            {isPending
              ? 'Your account is currently being reviewed by our team. You will be notified once your account has been approved.'
              : 'Your account was not approved at this time. Please contact support if you believe this is an error.'}
          </p>
        </div>

        <div className="bg-sage-50 border border-sage-200 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium text-gray-900">{userProfile.full_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${
              isPending ? 'text-warmtan-600' : 'text-red-600'
            }`}>
              {userProfile.status}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Signed up:</span>
            <span className="font-medium text-gray-900">
              {new Date(userProfile.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {isPending && (
          <div className="bg-warmtan-50 border border-warmtan-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-warmtan-900">
              Your account is in the approval queue. This process typically takes 1-2 business days.
              Please check back later or contact support if you have questions.
            </p>
          </div>
        )}

        <button
          onClick={signOut}
          className="w-full bg-sage-600 hover:bg-sage-700 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
