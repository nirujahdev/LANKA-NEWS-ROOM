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
          <h1 className="text-3xl font-bold text-[#202124] mb-2">Privacy Policy</h1>
          
          <p className="text-[#5F6368] mb-8">
            <strong>Last updated:</strong> 1st Jan 2026
          </p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <p className="text-[#5F6368] mb-6 leading-relaxed">
                Welcome to Lanka News Room ("we", "our", "us").
              </p>
              <p className="text-[#5F6368] mb-6 leading-relaxed">
                Lanka News Room is an AI-powered news summary platform designed to help users understand 
                Sri Lankan news more clearly by combining information from multiple public sources.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">1. Use of the Website</h2>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                You can use Lanka News Room without creating an account.
              </p>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                Signing in is optional and only required if you want a personalized experience.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-[#202124] mb-3 mt-4">2.1 Information You Choose to Provide</h3>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                If you decide to sign in or customize your experience, we may collect:
              </p>
              <ul className="list-disc pl-6 text-[#5F6368] mb-4 space-y-2">
                <li>Name</li>
                <li>Email address</li>
                <li>Preferred language (English, Sinhala, Tamil)</li>
                <li>Favorite topics</li>
                <li>Preferred city</li>
              </ul>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                This information is used only to personalize your news feed.
              </p>

              <h3 className="text-xl font-semibold text-[#202124] mb-3 mt-4">2.2 Automatically Collected Information</h3>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                We may collect basic usage data such as:
              </p>
              <ul className="list-disc pl-6 text-[#5F6368] mb-4 space-y-2">
                <li>Pages visited</li>
                <li>Time spent on the website</li>
                <li>Device and browser type</li>
              </ul>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                This data is used only to improve website performance and user experience.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">3. How We Use Information</h2>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                We use collected information to:
              </p>
              <ul className="list-disc pl-6 text-[#5F6368] mb-4 space-y-2">
                <li>Show relevant news based on your interests</li>
                <li>Improve content quality and relevance</li>
                <li>Improve website performance and usability</li>
                <li>Display advertisements</li>
              </ul>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                We do not sell, rent, or trade personal data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">4. Cookies</h2>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                We use cookies to:
              </p>
              <ul className="list-disc pl-6 text-[#5F6368] mb-4 space-y-2">
                <li>Remember preferences</li>
                <li>Understand how users interact with the website</li>
                <li>Support advertising and analytics</li>
              </ul>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                You can disable cookies through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">5. Advertising</h2>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                Advertisements may appear on Lanka News Room.
              </p>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                These ads help support the operation of the website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">6. Data Security</h2>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                We take reasonable steps to protect your information.
              </p>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                However, no online platform can guarantee complete security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">7. Children's Privacy</h2>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                Lanka News Room is not intended for children under 13 years of age.
              </p>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                We do not knowingly collect personal information from children.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">8. Your Rights</h2>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                You may:
              </p>
              <ul className="list-disc pl-6 text-[#5F6368] mb-4 space-y-2">
                <li>Request deletion of your account or data</li>
                <li>Update your preferences at any time</li>
              </ul>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                For requests, contact:
              </p>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                <a 
                  href="mailto:nathanbenaiah4@gmail.com"
                  className="text-[#1A73E8] hover:underline"
                >
                  📧 nathanbenaiah4@gmail.com
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">9. Changes to This Policy</h2>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                This Privacy Policy may be updated from time to time.
              </p>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                Changes will be posted on this page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#202124] mb-4">10. Contact</h2>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                If you have questions about this Privacy Policy:
              </p>
              <p className="text-[#5F6368] mb-4 leading-relaxed">
                <a 
                  href="mailto:nathanbenaiah4@gmail.com"
                  className="text-[#1A73E8] hover:underline"
                >
                  📧 nathanbenaiah4@gmail.com
                </a>
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
