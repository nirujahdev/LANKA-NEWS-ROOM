import Link from 'next/link';
import { Mail, ExternalLink } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-black rounded-t-[2rem] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Lanka News Room</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              An AI system for srilankan news insights
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
            <a 
              href="mailto:lanka.news.room.contact@gmail.com"
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>lanka.news.room.contact@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Copyright and License */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-gray-300">
              <p>© {currentYear} Lanka News Room, Apache License 2.0</p>
            </div>
            <div className="text-sm text-white">
              <span>Developed by </span>
              <a 
                href="https://instagram.com/benaiah_4"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline hover:decoration-red-500 hover:decoration-2 transition-all inline-flex items-center gap-1"
              >
                <span>Benaiah Nicholas Nimal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

