import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Palette, Store, Tag, Heart } from 'lucide-react';

const ROLES = [
  { value: 'creator',  label: 'Creator',  desc: 'Yoga, art, music, wellness…',     icon: Palette },
  { value: 'business', label: 'Business', desc: 'Café, studio, gallery, bar…',      icon: Store },
  { value: 'brand',    label: 'Brand',    desc: 'Sponsor or partner with creators', icon: Tag },
  { value: 'charity',  label: 'Charity',  desc: 'Cause-driven collaborations',      icon: Heart },
];

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode]       = useState('signin');  // 'signin' | 'signup'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole]       = useState('');
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (mode === 'signup') {
        if (!role) { setError('Please select a role.'); setBusy(false); return; }
        await signUp({ email, password, fullName, role });
      } else {
        await signIn({ email, password });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-600 mb-8">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="card p-8">
          <h1 className="font-display text-2xl text-surface-800 mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-surface-400 mb-6">
            {mode === 'signin'
              ? 'Sign in to continue to Venueo.'
              : 'Join Venueo and start finding partners.'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Sara Jones"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {/* Role selection — signup only */}
            {mode === 'signup' && (
              <div>
                <label className="label">I am a…</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all duration-150 ${
                        role === r.value
                          ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-400/20'
                          : 'border-surface-200 hover:border-surface-300'
                      }`}
                    >
                      <r.icon size={18} className={role === r.value ? 'text-brand-600' : 'text-surface-400'} strokeWidth={1.8} />
                      <div>
                        <p className="text-sm font-medium text-surface-800">{r.label}</p>
                        <p className="text-xs text-surface-400 leading-snug">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-surface-400 mt-5">
            {mode === 'signin' ? (
              <>Don't have an account?{' '}
                <button onClick={() => { setMode('signup'); setError(''); }} className="text-brand-600 font-medium hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('signin'); setError(''); }} className="text-brand-600 font-medium hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
