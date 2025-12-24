'use client';

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface EmailAuthProps {
  onBack: () => void;
  onSuccess: () => void;
}

const EmailAuth: React.FC<EmailAuthProps> = ({ onBack, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (signUpError) throw signUpError;

        setMessage('Check your email for the confirmation link!');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;

        // Check onboarding status after sign in
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, language, city')
            .eq('id', user.id)
            .single();

          const { data: prefs } = await supabase
            .from('user_preferences')
            .select('favourite_topics')
            .eq('user_id', user.id)
            .single();

          const isOnboardingComplete = 
            profile?.name && 
            profile?.language && 
            profile?.city && 
            prefs?.favourite_topics?.length === 3;

          if (!isOnboardingComplete) {
            window.location.href = '/onboarding';
            return;
          }
        }

        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-sm text-[#5F6368] hover:text-[#202124] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h2 className="text-2xl font-medium text-[#202124] mb-2">
        {isSignUp ? 'Sign up' : 'Sign in'}
      </h2>
      <p className="text-sm text-[#5F6368] mb-6">
        {isSignUp ? 'Create an account to get started' : 'Welcome back! Sign in to continue'}
      </p>

      <div className="flex gap-2 mb-6 border-b border-[#E8EAED]">
        <button
          onClick={() => {
            setIsSignUp(false);
            setError(null);
            setMessage(null);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            !isSignUp
              ? 'text-[#1A73E8] border-b-2 border-[#1A73E8]'
              : 'text-[#5F6368] hover:text-[#202124]'
          }`}
        >
          Sign in
        </button>
        <button
          onClick={() => {
            setIsSignUp(true);
            setError(null);
            setMessage(null);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            isSignUp
              ? 'text-[#1A73E8] border-b-2 border-[#1A73E8]'
              : 'text-[#5F6368] hover:text-[#202124]'
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#202124] mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-[#E8EAED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#202124] mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 border border-[#E8EAED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="text-sm text-[#D93025] bg-[#FCE8E6] p-3 rounded-lg">
            {error}
          </div>
        )}

        {message && (
          <div className="text-sm text-[#137333] bg-[#E6F4EA] p-3 rounded-lg">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-[#1A73E8] text-white rounded-lg font-medium hover:bg-[#1557B0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

export default EmailAuth;

