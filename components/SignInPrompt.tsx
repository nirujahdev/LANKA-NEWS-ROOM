'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import EmailAuth from './EmailAuth';

interface SignInPromptProps {
  onClose: () => void;
}

const SignInPrompt: React.FC<SignInPromptProps> = ({ onClose }) => {
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const supabase = getSupabaseClient();

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5F6368] hover:text-[#202124] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!showEmailAuth ? (
          <div className="p-8">
            <h2 className="text-2xl font-medium text-[#202124] mb-2">
              Sign in to personalize your news
            </h2>
            <p className="text-sm text-[#5F6368] mb-6">
              Get personalized news recommendations based on your interests and location.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-[#E8EAED] rounded-lg hover:bg-[#F8F9FA] transition-colors text-[#202124] font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={() => setShowEmailAuth(true)}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-[#E8EAED] rounded-lg hover:bg-[#F8F9FA] transition-colors text-[#202124] font-medium"
              >
                Continue with Email
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-4 text-sm text-[#5F6368] hover:text-[#202124] transition-colors"
            >
              Not now
            </button>
          </div>
        ) : (
          <div className="p-8">
            <EmailAuth onBack={() => setShowEmailAuth(false)} onSuccess={onClose} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SignInPrompt;

