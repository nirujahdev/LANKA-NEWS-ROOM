import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Lanka News Room',
  description: 'Privacy Policy for Lanka News Room - Learn how we handle your data and cookies.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-[#E8EAED] p-8">
          <h1 className="text-3xl font-bold text-[#202124] mb-6">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-[#5F6368] mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">Your Privacy Matters</h2>
              <p className="text-[#5F6368] mb-4">
                At Lanka News Room, we respect your privacy and are committed to protecting your personal data. 
                This privacy policy explains how we collect, use, and safeguard your information when you visit our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">Cookies and Similar Technologies</h2>
              <p className="text-[#5F6368] mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 text-[#5F6368] mb-4 space-y-2">
                <li>Personalize content and ads</li>
                <li>Measure website traffic and usage</li>
                <li>Improve your browsing experience</li>
                <li>Analyze how our website is used</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">Consent Management</h2>
              <p className="text-[#5F6368] mb-4">
                If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, 
                we will ask for your consent before using cookies for advertising and analytics purposes.
              </p>
              <p className="text-[#5F6368] mb-4">
                You can manage your cookie preferences at any time by clicking the "Manage options" button 
                in our consent banner or by adjusting your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">Third-Party Services</h2>
              <p className="text-[#5F6368] mb-4">
                We use Google AdSense to display advertisements on our website. Google may use cookies 
                to serve personalized ads based on your interests. You can learn more about how Google 
                uses data by visiting{' '}
                <a 
                  href="https://policies.google.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#1A73E8] hover:underline"
                >
                  Google's Privacy Policy
                </a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">Your Rights</h2>
              <p className="text-[#5F6368] mb-4">
                Depending on your location, you may have the following rights regarding your personal data:
              </p>
              <ul className="list-disc pl-6 text-[#5F6368] mb-4 space-y-2">
                <li>Right to access your personal data</li>
                <li>Right to rectify inaccurate data</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
                <li>Right to withdraw consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">Contact Us</h2>
              <p className="text-[#5F6368] mb-4">
                If you have any questions about this Privacy Policy or wish to exercise your rights, 
                please contact us through our website.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-[#E8EAED]">
              <Link 
                href="/" 
                className="text-[#1A73E8] hover:underline font-medium"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

