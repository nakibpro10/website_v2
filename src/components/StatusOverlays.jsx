import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { calculateDaysLeft } from '../utils';
import { PENDING_APPROVAL_DAYS } from '../config';

export default function StatusOverlays({ onSubscribe }) {
  const { userData, logout } = useAuth();
  const { language } = useApp();
  const t = (en, bn) => language === 'en' ? en : bn;

  if (!userData) return null;

  const daysLeft = userData.pendingStartDate ? calculateDaysLeft(userData.pendingStartDate, PENDING_APPROVAL_DAYS) : 0;

  // Trial Expired
  if (userData.status === 'trial-expired-overlay') {
    return (
      <div className="blocking-overlay active" id="trialExpiredOverlay">
        <div className="blocking-overlay-content">
          <div className="blocking-overlay-icon"><i className="fas fa-clock"></i></div>
          <h2><span className="lang-en">Free Trial Ended</span><span className="lang-bn">ফ্রি ট্রায়াল শেষ</span></h2>
          <p><span className="lang-en">Your 7-day free trial has expired. Subscribe to continue using Nakib Cloud.</span><span className="lang-bn">আপনার ৭ দিনের ফ্রি ট্রায়াল শেষ হয়েছে। Nakib Cloud ব্যবহার চালিয়ে যেতে সাবস্ক্রাইব করুন।</span></p>
          <button className="btn btn-primary btn-lg" id="trialSubscribeBtn" onClick={onSubscribe}>
            <i className="fas fa-crown"></i> <span className="lang-en">Subscribe Now</span><span className="lang-bn">এখনই সাবস্ক্রাইব করুন</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export function TrialExpiredOverlay({ onSubscribe }) {
  return (
    <div className="blocking-overlay active" id="trialExpiredOverlay">
      <div className="blocking-overlay-content">
        <div className="blocking-overlay-icon trial"><i className="fas fa-hourglass-end"></i></div>
        <h2><span className="lang-en">Free Trial Ended</span><span className="lang-bn">ফ্রি ট্রায়াল শেষ</span></h2>
        <p><span className="lang-en">Your 7-day free trial has expired. Subscribe to continue using Nakib Cloud.</span><span className="lang-bn">আপনার ৭ দিনের ফ্রি ট্রায়াল শেষ হয়েছে।</span></p>
        <button className="btn btn-primary btn-lg" id="trialSubscribeBtn" onClick={onSubscribe}>
          <i className="fas fa-crown"></i> <span className="lang-en">Subscribe Now</span><span className="lang-bn">এখনই সাবস্ক্রাইব করুন</span>
        </button>
      </div>
    </div>
  );
}

export function PendingApprovalOverlay({ daysLeft, onContinue }) {
  return (
    <div className="blocking-overlay active" id="pendingApprovalOverlay">
      <div className="blocking-overlay-content">
        <div className="blocking-overlay-icon pending"><i className="fas fa-clock"></i></div>
        <h2><span className="lang-en">Payment Under Review</span><span className="lang-bn">পেমেন্ট পর্যালোচনাধীন</span></h2>
        <p><span className="lang-en">Your payment is being reviewed. You have temporary access for <span id="pendingTimeLeft">{daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>.</span><span className="lang-bn">আপনার পেমেন্ট যাচাই করা হচ্ছে। আপনার <span id="pendingTimeLeft">{daysLeft} দিন</span> সাময়িক অ্যাক্সেস আছে।</span></p>
        <button className="btn btn-primary btn-lg" id="pendingContinueBtn" onClick={onContinue}>
          <i className="fas fa-arrow-right"></i> <span className="lang-en">Continue Using</span><span className="lang-bn">ব্যবহার চালিয়ে যান</span>
        </button>
      </div>
    </div>
  );
}

export function PaymentNotApprovedOverlay({ onSubscribe }) {
  return (
    <div className="blocking-overlay active" id="paymentNotApprovedOverlay">
      <div className="blocking-overlay-content">
        <div className="blocking-overlay-icon expired"><i className="fas fa-times-circle"></i></div>
        <h2><span className="lang-en">Access Expired</span><span className="lang-bn">অ্যাক্সেস মেয়াদোত্তীর্ণ</span></h2>
        <p><span className="lang-en">Your payment could not be verified within 3 days. Please resubmit your payment.</span><span className="lang-bn">৩ দিনের মধ্যে আপনার পেমেন্ট যাচাই করা সম্ভব হয়নি। আবার পেমেন্ট করুন।</span></p>
        <button className="btn btn-primary btn-lg" id="resubscribeBtn" onClick={onSubscribe}>
          <i className="fas fa-redo"></i> <span className="lang-en">Resubmit Payment</span><span className="lang-bn">পুনরায় পেমেন্ট করুন</span>
        </button>
      </div>
    </div>
  );
}

export function WaitingApprovalOverlay({ onSubscribeAgain }) {
  return (
    <div className="blocking-overlay active" id="waitingApprovalOverlay">
      <div className="blocking-overlay-content">
        <div className="blocking-overlay-icon pending"><i className="fas fa-hourglass-half"></i></div>
        <h2><span className="lang-en">Payment Pending</span><span className="lang-bn">পেমেন্ট অপেক্ষমান</span></h2>
        <p><span className="lang-en">Your payment is being reviewed by our team. Please wait for admin approval. We'll notify you once verified.</span><span className="lang-bn">আমাদের টিম আপনার পেমেন্ট পর্যালোচনা করছে। অ্যাডমিন অনুমোদনের জন্য অপেক্ষা করুন।</span></p>
        <button className="btn btn-ghost btn-lg" id="waitingSubscribeAgainBtn" onClick={onSubscribeAgain}>
          <i className="fas fa-refresh"></i> <span className="lang-en">Submit Again</span><span className="lang-bn">আবার সাবমিট করুন</span>
        </button>
      </div>
    </div>
  );
}

export function PaymentRejectedOverlay({ onSubscribe }) {
  return (
    <div className="blocking-overlay active" id="paymentRejectedOverlay">
      <div className="blocking-overlay-content">
        <div className="blocking-overlay-icon danger"><i className="fas fa-ban"></i></div>
        <h2><span className="lang-en">Payment Rejected</span><span className="lang-bn">পেমেন্ট প্রত্যাখ্যাত</span></h2>
        <p><span className="lang-en">Your payment was rejected. Please contact support or try again with a valid transaction.</span><span className="lang-bn">আপনার পেমেন্ট প্রত্যাখ্যাত হয়েছে। সাপোর্টে যোগাযোগ করুন বা আবার চেষ্টা করুন।</span></p>
        <button className="btn btn-primary btn-lg" id="rejectedSubscribeBtn" onClick={onSubscribe}>
          <i className="fas fa-redo"></i> <span className="lang-en">Try Again</span><span className="lang-bn">আবার চেষ্টা করুন</span>
        </button>
      </div>
    </div>
  );
}

export function BannedOverlay({ onLogout }) {
  return (
    <div className="blocking-overlay active" id="bannedOverlay">
      <div className="blocking-overlay-content">
        <div className="blocking-overlay-icon danger"><i className="fas fa-ban"></i></div>
        <h2><span className="lang-en">Account Banned</span><span className="lang-bn">অ্যাকাউন্ট নিষিদ্ধ</span></h2>
        <p><span className="lang-en">Your account has been suspended due to policy violations.</span><span className="lang-bn">নীতি লঙ্ঘনের কারণে আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে।</span></p>
        <button className="btn btn-ghost btn-lg" id="bannedLogoutBtn" onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i> <span className="lang-en">Sign Out</span><span className="lang-bn">সাইন আউট</span>
        </button>
      </div>
    </div>
  );
}
