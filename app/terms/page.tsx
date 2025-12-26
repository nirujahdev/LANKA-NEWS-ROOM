'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#5F6368] hover:text-[#202124] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-[#202124] mb-6">Terms & Conditions</h1>
          
          <div className="prose prose-sm max-w-none text-[#202124] space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-[#5F6368] leading-relaxed">
                By accessing and using Lanka News Room, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
              <p className="text-[#5F6368] leading-relaxed">
                Permission is granted to temporarily access the materials on Lanka News Room for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-[#5F6368]">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on Lanka News Room</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-[#5F6368] leading-relaxed">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Content</h2>
              <p className="text-[#5F6368] leading-relaxed">
                Our service allows you to access news content. The content is provided for informational purposes only. We do not guarantee the accuracy, completeness, or usefulness of any information on the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Privacy</h2>
              <p className="text-[#5F6368] leading-relaxed">
                Your use of Lanka News Room is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Limitation of Liability</h2>
              <p className="text-[#5F6368] leading-relaxed">
                In no event shall Lanka News Room or its suppliers be liable for any damages arising out of the use or inability to use the materials on Lanka News Room.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Revisions</h2>
              <p className="text-[#5F6368] leading-relaxed">
                Lanka News Room may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Contact Information</h2>
              <p className="text-[#5F6368] leading-relaxed">
                If you have any questions about these Terms & Conditions, please contact us.
              </p>
            </section>

            <p className="text-sm text-[#5F6368] mt-8 pt-6 border-t border-[#E8EAED]">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

