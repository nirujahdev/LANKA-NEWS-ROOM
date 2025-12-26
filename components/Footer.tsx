import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-[#E8EAED] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold text-[#202124] mb-4">About Lanka News Room</h3>
            <p className="text-sm text-[#5F6368] leading-relaxed">
              An AI-powered news summary platform designed to help users understand Sri Lankan news 
              more clearly by combining information from multiple public sources.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-[#202124] mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="text-sm text-[#5F6368] hover:text-[#1A73E8] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy-policy" 
                  className="text-sm text-[#5F6368] hover:text-[#1A73E8] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms-of-use" 
                  className="text-sm text-[#5F6368] hover:text-[#1A73E8] transition-colors"
                >
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-lg font-semibold text-[#202124] mb-4">Contact</h3>
            <a 
              href="mailto:nathanbenaiah4@gmail.com"
              className="flex items-center gap-2 text-sm text-[#5F6368] hover:text-[#1A73E8] transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>nathanbenaiah4@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Copyright and License */}
        <div className="border-t border-[#E8EAED] pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-[#5F6368]">
              <p>© {currentYear} Lanka News Room</p>
              <p className="mt-1">Apache License 2.0</p>
            </div>
            <div className="text-sm text-[#5F6368]">
              <p>Developed by Benaiah Nicholas Nimal</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

