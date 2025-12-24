import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import SignInPromptManager from '@/components/SignInPromptManager';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'Lanka News Room - Multi-Source News Summarizer',
  description: 'Trusted, neutral news summaries from multiple Sri Lankan sources in English, Sinhala, and Tamil',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="font-montserrat antialiased bg-white text-[#1E293B]">
        <SignInPromptManager>
          {children}
        </SignInPromptManager>
      </body>
    </html>
  );
}

