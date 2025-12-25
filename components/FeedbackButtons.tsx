'use client';

import React, { useState, useEffect } from 'react';
import { ThumbsUp, Share2, Flag, CheckCircle } from 'lucide-react';

interface FeedbackButtonsProps {
  clusterId: string;
  slug: string;
  headline: string;
  language?: 'en' | 'si' | 'ta';
}

export default function FeedbackButtons({ 
  clusterId, 
  slug, 
  headline,
  language = 'en' 
}: FeedbackButtonsProps) {
  const [userFeedback, setUserFeedback] = useState<string[]>([]);
  const [counts, setCounts] = useState({ likes: 0, reports: 0, helpful: 0 });
  const [loading, setLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  useEffect(() => {
    loadFeedback();
  }, [clusterId]);
  
  const loadFeedback = async () => {
    try {
      const response = await fetch(`/api/feedback?clusterId=${clusterId}`);
      const data = await response.json();
      setUserFeedback(data.userFeedback?.map((f: any) => f.feedback_type) || []);
      setCounts(data.counts || { likes: 0, reports: 0, helpful: 0 });
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };
  
  const submitFeedback = async (type: string, reason?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusterId,
          feedbackType: type,
          reason
        })
      });
      
      if (response.ok) {
        await loadFeedback();
        if (type === 'report') {
          setShowReportModal(false);
          setReportReason('');
        }
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleShare = async () => {
    const url = `${window.location.origin}/${language}/story/${slug}`;
    const text = `${headline} - Lanka News Room`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: headline, text, url });
      } catch (error) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert(getLabel('Link copied to clipboard!', 'සබැඳිය පිටපත් කරන ලදී!', 'இணைப்பு நகலெடுக்கப்பட்டது!'));
    }
  };
  
  const isLiked = userFeedback.includes('like');
  const isReported = userFeedback.includes('report');
  const isHelpful = userFeedback.includes('helpful');
  
  const getLabel = (en: string, si?: string, ta?: string) => {
    if (language === 'si' && si) return si;
    if (language === 'ta' && ta) return ta;
    return en;
  };
  
  return (
    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#E8EAED]">
      {/* Like Button */}
      <button
        onClick={() => submitFeedback(isLiked ? 'dislike' : 'like')}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          isLiked
            ? 'bg-[#E8F0FE] text-[#1A73E8]'
            : 'bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8EAED]'
        }`}
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="text-sm font-medium">{getLabel('Like', 'අනුමත', 'விரும்பு')}</span>
        {counts.likes > 0 && <span className="text-xs">{counts.likes}</span>}
      </button>
      
      {/* Helpful Button */}
      <button
        onClick={() => submitFeedback(isHelpful ? 'not_helpful' : 'helpful')}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          isHelpful
            ? 'bg-[#E8F0FE] text-[#1A73E8]'
            : 'bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8EAED]'
        }`}
      >
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">{getLabel('Helpful', 'ප්‍රයෝජනවත්', 'பயனுள்ள')}</span>
        {counts.helpful > 0 && <span className="text-xs">{counts.helpful}</span>}
      </button>
      
      {/* Share Button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8EAED] transition-colors"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm font-medium">{getLabel('Share', 'බෙදාගන්න', 'பகிர்')}</span>
      </button>
      
      {/* Report Button */}
      <button
        onClick={() => setShowReportModal(true)}
        disabled={loading || isReported}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          isReported
            ? 'bg-[#FCE8E6] text-[#D93025] cursor-not-allowed'
            : 'bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8EAED]'
        }`}
      >
        <Flag className="w-4 h-4" />
        <span className="text-sm font-medium">{getLabel('Report', 'වාර්තා', 'புகார்')}</span>
      </button>
      
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">{getLabel('Report Issue', 'ගැටලුව වාර්තා කරන්න', 'சிக்கலைப் புகாரளிக்கவும்')}</h3>
            <div className="space-y-2 mb-4">
              {['inaccurate', 'misleading', 'spam', 'other'].map((reason) => (
                <label key={reason} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm capitalize">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="flex-1 px-4 py-2 border border-[#E8EAED] rounded-lg hover:bg-[#F8F9FA]"
              >
                {getLabel('Cancel', 'අවලංගු', 'ரத்து')}
              </button>
              <button
                onClick={() => reportReason && submitFeedback('report', reportReason)}
                disabled={!reportReason || loading}
                className="flex-1 px-4 py-2 bg-[#D93025] text-white rounded-lg hover:bg-[#C5221F] disabled:opacity-50"
              >
                {getLabel('Submit', 'ඉදිරිපත් කරන්න', 'சமர்ப்பிக்கவும்')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

