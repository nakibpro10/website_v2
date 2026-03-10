import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function ResetPasswordModal({ initialEmail = '', onClose }) {
  const { sendPasswordReset } = useAuth();
  const { showToast, language } = useApp();
  const t = (en, bn) => language === 'en' ? en : bn;
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!email) { showToast(t('Please enter your email', 'আপনার ইমেইল দিন'), 'warning'); return; }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
      showToast(t('Password reset email sent!', 'পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে!'), 'success');
      setTimeout(() => onClose(), 3000);
    } catch (err) {
      let msg = t('Failed to send reset email', 'রিসেট ইমেইল পাঠাতে ব্যর্থ');
      if (err.code === 'auth/user-not-found') msg = t('No account found with this email', 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই');
      showToast(msg, 'error');
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay active" id="resetPasswordModal">
      <div className="modal modal-sm">
        <div className="modal-header">
          <h3><i className="fas fa-key"></i> <span className="lang-en">Reset Password</span><span className="lang-bn">পাসওয়ার্ড রিসেট</span></h3>
          <button className="modal-close" id="closeResetModal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {!sent ? (
            <div id="resetFormView">
              <p><span className="lang-en">Enter your email to receive a password reset link.</span><span className="lang-bn">পাসওয়ার্ড রিসেট লিংক পেতে আপনার ইমেইল দিন।</span></p>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label><span className="lang-en">Email Address</span><span className="lang-bn">ইমেইল এড্রেস</span></label>
                <input type="email" className="form-control" id="resetEmailInput" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSend()}
                  autoFocus />
              </div>
            </div>
          ) : (
            <div id="resetSuccessView" className="show">
              <div className="reset-success-icon"><i className="fas fa-check-circle"></i></div>
              <h3><span className="lang-en">Email Sent!</span><span className="lang-bn">ইমেইল পাঠানো হয়েছে!</span></h3>
              <p><span className="lang-en">Check your inbox for the reset link.</span><span className="lang-bn">রিসেট লিংকের জন্য আপনার ইনবক্স চেক করুন।</span></p>
            </div>
          )}
        </div>
        {!sent && (
          <div className="modal-footer" id="resetModalFooter">
            <button className="btn btn-ghost" id="cancelResetBtn" onClick={onClose}>
              <span className="lang-en">Cancel</span><span className="lang-bn">বাতিল</span>
            </button>
            <button className="btn btn-primary" id="sendResetBtn" onClick={handleSend} disabled={loading}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-paper-plane"></i> <span className="lang-en">Send Link</span><span className="lang-bn">লিংক পাঠান</span></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
