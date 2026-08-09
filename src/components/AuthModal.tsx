import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User as UserIcon, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'signup';
  onLoginSuccess: (user: { name: string; email: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setIsSubmitted(false);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userName = name || email.split('@')[0] || 'Craft Lover';
    setIsSubmitted(true);
    setTimeout(() => {
      onLoginSuccess({
        name: userName,
        email: email || 'crafter@stitchedmemories.com',
      });
      setIsSubmitted(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-[#FAF6EE] border border-[#E8E1D2] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#6B7869] hover:text-[#1D231E] hover:bg-[#E8E1D2]/50 rounded-full transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#E06C38]/10 text-[#E06C38] mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#1D231E]">
            {tab === 'login' ? 'Welcome Back!' : 'Create an Account'}
          </h2>
          <p className="text-sm text-[#5B675A] mt-1">
            {tab === 'login'
              ? 'Sign in to access your saved cross-stitch patterns & order history.'
              : 'Join StitchedMemories to convert photos and save custom patterns.'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-[#E8E1D2]/60 p-1 rounded-full mb-6">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-white text-[#1D231E] shadow-sm'
                : 'text-[#6B7869] hover:text-[#1D231E]'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              tab === 'signup'
                ? 'bg-white text-[#1D231E] shadow-sm'
                : 'text-[#6B7869] hover:text-[#1D231E]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-[#2E7D32] animate-bounce" />
            <h3 className="text-lg font-bold text-[#1D231E]">
              {tab === 'login' ? 'Logged In Successfully!' : 'Account Created!'}
            </h3>
            <p className="text-xs text-[#5B675A]">Redirecting to your craft space...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#3A4538] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A9588]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Miller"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D5CDBC] rounded-xl text-sm text-[#1D231E] focus:outline-none focus:ring-2 focus:ring-[#E06C38]/40"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#3A4538] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A9588]" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D5CDBC] rounded-xl text-sm text-[#1D231E] focus:outline-none focus:ring-2 focus:ring-[#E06C38]/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3A4538] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A9588]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D5CDBC] rounded-xl text-sm text-[#1D231E] focus:outline-none focus:ring-2 focus:ring-[#E06C38]/40"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-[#E06C38] hover:bg-[#d05c28] text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{tab === 'login' ? 'Log In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E8E1D2]" />
          </div>
          <span className="relative px-3 bg-[#FAF6EE] text-[11px] uppercase tracking-wider text-[#8A9588] font-medium">
            Or quick demo login
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            onLoginSuccess({ name: 'Craft Enthusiast', email: 'demo@stitchedmemories.com' });
            onClose();
          }}
          className="w-full py-2.5 bg-white hover:bg-[#F2EFE8] border border-[#D5CDBC] text-[#1D231E] text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continue as Demo Guest</span>
        </button>
      </div>
    </div>
  );
};
