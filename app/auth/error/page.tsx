'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');

    setError(errorParam || 'unknown_error');
    setMessage(messageParam || 'An authentication error occurred');
  }, [searchParams]);

  const getErrorTitle = (errorCode: string): string => {
    const errorTitles: Record<string, string> = {
      'no_code': 'No Authentication Code',
      'exchange_failed': 'Authentication Failed',
      'no_user': 'User Not Found',
      'profile_creation_failed': 'Profile Creation Failed',
      'unexpected': 'Unexpected Error',
      'access_denied': 'Access Denied',
      'invalid_request': 'Invalid Request',
    };

    return errorTitles[errorCode] || 'Authentication Error';
  };

  const getErrorDescription = (errorCode: string): string => {
    const errorDescriptions: Record<string, string> = {
      'no_code': 'The authentication process did not provide a valid code. Please try signing in again.',
      'exchange_failed': 'Failed to complete authentication. This may be due to an expired or invalid code.',
      'no_user': 'User information could not be retrieved. Please try signing in again.',
      'profile_creation_failed': 'Your account was created but we could not set up your profile. Please contact support.',
      'unexpected': 'An unexpected error occurred during authentication. Please try again.',
      'access_denied': 'You denied access to your Google account. Please grant access to continue.',
      'invalid_request': 'The authentication request was invalid. Please try again.',
    };

    return errorDescriptions[errorCode] || 'An error occurred during the authentication process. Please try again.';
  };

  const handleRetry = () => {
    // Redirect to home page where user can try signing in again
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-[#202124] mb-2">
            {getErrorTitle(error)}
          </h1>

          {/* Error Message */}
          <p className="text-sm text-[#5F6368] mb-6">
            {message || getErrorDescription(error)}
          </p>

          {/* Error Code (for debugging) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-3 bg-gray-100 rounded-lg text-xs font-mono text-gray-600">
              Error Code: {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1A73E8] text-white rounded-lg font-medium hover:bg-[#1557B0] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#E8EAED] text-[#202124] rounded-lg font-medium hover:bg-[#F8F9FA] transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Home
            </Link>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-xs text-[#5F6368]">
            If this problem persists, please{' '}
            <a
              href="/contact"
              className="text-[#1A73E8] hover:underline"
            >
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

