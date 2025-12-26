'use client';

import React, { useState, useEffect } from 'react';
import { Share2, Twitter, Facebook, Linkedin, Link as LinkIcon, Copy, Check } from 'lucide-react';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  language?: 'en' | 'si' | 'ta';
}

export default function SocialShare({ url, title, description, imageUrl, language = 'en' }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const fullUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${url}`
    : url;
  
  const shareText = description ? `${title} - ${description}` : title;
  
  // Update Open Graph meta tags for sharing
  useEffect(() => {
    if (typeof window !== 'undefined' && imageUrl) {
      // Update og:image meta tag
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', imageUrl);
      
      // Update twitter:image meta tag
      let twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (!twitterImage) {
        twitterImage = document.createElement('meta');
        twitterImage.setAttribute('name', 'twitter:image');
        document.head.appendChild(twitterImage);
      }
      twitterImage.setAttribute('content', imageUrl);
    }
  }, [imageUrl]);
  
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`
  };
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title,
          text: description || title,
          url: fullUrl
        };
        
        // Include image if available (some browsers support this)
        if (imageUrl) {
          try {
            // Try to fetch and convert image to File for sharing
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'image.jpg', { type: blob.type });
            (shareData as any).files = [file];
          } catch (error) {
            // If image sharing fails, continue without it
            console.warn('Could not include image in share:', error);
          }
        }
        
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          setShowMenu(true);
        }
      }
    } else {
      setShowMenu(true);
    }
  };
  
  const getLabel = (en: string, si?: string, ta?: string) => {
    if (language === 'si' && si) return si;
    if (language === 'ta' && ta) return ta;
    return en;
  };
  
  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-4 py-2 bg-[#1A73E8] text-white rounded-lg hover:bg-[#1557B0] transition-colors"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm font-medium">{getLabel('Share', 'බෙදාගන්න', 'பகிர்')}</span>
      </button>
      
      {showMenu && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-[#E8EAED] rounded-lg shadow-lg p-2 z-50 min-w-[200px]">
          <div className="space-y-1">
            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 hover:bg-[#F8F9FA] rounded transition-colors"
            >
              <Twitter className="w-5 h-5 text-[#1DA1F2]" />
              <span className="text-sm">Twitter</span>
            </a>
            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 hover:bg-[#F8F9FA] rounded transition-colors"
            >
              <Facebook className="w-5 h-5 text-[#1877F2]" />
              <span className="text-sm">Facebook</span>
            </a>
            <a
              href={shareLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 hover:bg-[#F8F9FA] rounded transition-colors"
            >
              <Linkedin className="w-5 h-5 text-[#0A66C2]" />
              <span className="text-sm">LinkedIn</span>
            </a>
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#F8F9FA] rounded transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-5 h-5" />
                  <span className="text-sm">{getLabel('Copy Link', 'සබැඳිය පිටපත්', 'இணைப்பை நகலெடு')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

