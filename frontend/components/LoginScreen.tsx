import { useState, useEffect } from 'react';
import { Home } from 'lucide-react';

interface LoginScreenProps {
  onGoogleSignIn: (role?: 'tenants' | 'admin') => void;
  apiError: string | null;
  apiMessage: string | null;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.021,35.596,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

export default function LoginScreen({ onGoogleSignIn, apiError, apiMessage }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<'tenants' | 'admin'>('tenants');
  const [loading, setLoading] = useState(false);

  // Check for token in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.location.href = '/dashboard'; // Hard redirect to clear URL params and init dashboard
    }
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    localStorage.setItem('login_intent_role', selectedRole);
    // Passing the selected role to the API/Google Auth flow
    // @ts-ignore - We updated the signature but props might lag in TS check
    await onGoogleSignIn(selectedRole);
    // setLoading(false); // Don't stop loading, we expect a redirect
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Home className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Tenancy Tracker</h1>
          <p className="text-slate-500 mt-1">Sign in to continue</p>
        </div>

        {/* Role Toggle - Visual Only (backend determines actual role) */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setSelectedRole('tenants')}
            className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all ${selectedRole === 'tenants'
              ? 'border-blue-600 bg-blue-50 text-blue-600'
              : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
              }`}
          >
            tenants
          </button>
          <button
            onClick={() => setSelectedRole('admin')}
            className={`flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all ${selectedRole === 'admin'
              ? 'border-blue-600 bg-blue-50 text-blue-600'
              : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
              }`}
          >
            admin
          </button>
        </div>

        {apiMessage && (
          <p className="text-sm text-amber-700 text-center p-3 bg-amber-50 border border-amber-200 rounded-md mb-4">
            {apiMessage}
          </p>
        )}

        {apiError && apiError.includes('Google Login failed') ? (
          <p className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-md mb-4 font-semibold">
            Google Login failed
          </p>
        ) : apiError ? (
          <p className="text-sm text-red-600 text-center p-3 bg-red-50 rounded-md mb-4">
            {apiError}
          </p>
        ) : null}

        {/* Google Sign In Button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-700 font-semibold py-3 rounded-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50 mb-4"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <GoogleIcon />
              Sign in with Google
            </>
          )}
        </button>

        {/* Email and Password Fields - Optional/Future Enhancement */}
        <div className="border-t pt-4 mt-4">
          <p className="text-xs text-slate-400 text-center mb-3">Or sign in with email</p>

          <div className="mb-3">
            <label className="text-sm font-medium text-slate-600 mb-1 block">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-slate-600 mb-1 block">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 text-slate-400 cursor-not-allowed"
            />
          </div>

          <button
            disabled
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg opacity-50 cursor-not-allowed"
          >
            Sign In
          </button>

          <p className="text-xs text-center text-slate-500 mt-4">
            Don't have an account? <span className="text-blue-600 cursor-not-allowed">Sign up</span>
          </p>
        </div>
      </div>
    </div>
  );
}
