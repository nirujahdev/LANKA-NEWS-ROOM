'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-[#202124] mb-6">Privacy Policy</h1>
          
          <div className="prose prose-sm max-w-none text-[#202124] space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-[#5F6368] leading-relaxed mb-3">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#5F6368]">
                <li>Name and email address when you create an account</li>
                <li>Language preferences and location information</li>
                <li>News topics of interest</li>
                <li>Usage data and reading history</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-[#5F6368] leading-relaxed mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#5F6368]">
                <li>Provide, maintain, and improve our services</li>
                <li>Personalize your news feed based on your preferences</li>
                <li>Send you updates and notifications (with your consent)</li>
                <li>Analyze usage patterns to improve user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
              <p className="text-[#5F6368] leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-[#5F6368]">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>With service providers who assist in operating our platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
              <p className="text-[#5F6368] leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
              <p className="text-[#5F6368] leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#5F6368]">
                <li>Access your personal information</li>
                <li>Update or correct your information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of certain communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Cookies and Tracking</h2>
              <p className="text-[#5F6368] leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Third-Party Services</h2>
              <p className="text-[#5F6368] leading-relaxed">
                Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
              <p className="text-[#5F6368] leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
              <p className="text-[#5F6368] leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
              <p className="text-[#5F6368] leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us.
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

