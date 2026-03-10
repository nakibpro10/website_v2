import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function GooglePasswordSetupModal() {
  const { handleGoogleSetup } = useAuth();
  const { showToast, language } = useApp();
  const t = (en, bn) => language === 'en' ? en : bn;
  const [password, setPassword] = useState('');
  const [tosAgree, setTosAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTos, setShowTos] = useState(false);

  async function handleSkip() {
    if (!tosAgree) { showToast(t('Please agree to the Terms of Service', 'সেবার শর্তাবলীতে সম্মত হন'), 'warning'); return; }
    await handleGoogleSetup();
  }

  async function handleComplete() {
    if (!tosAgree) { showToast(t('Please agree to the Terms of Service', 'সেবার শর্তাবলীতে সম্মত হন'), 'warning'); return; }
    setLoading(true);
    try {
      await handleGoogleSetup(password);
    } catch (err) {
      showToast(t('Failed to set password', 'পাসওয়ার্ড সেট করতে ব্যর্থ'), 'error');
    } finally { setLoading(false); }
  }

  async function handleClose() {
    await signOut(auth);
  }

  return (
    <div className="modal-overlay active" id="googleSetupModal">
      <div className="modal">
        <div className="modal-header">
          <h3><i className="fas fa-google"></i> <span className="lang-en">Google Account Setup</span><span className="lang-bn">গুগল অ্যাকাউন্ট সেটআপ</span></h3>
          <button className="modal-close" id="closeGoogleSetupModal" onClick={handleClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="google-setup-info">
            <div className="google-setup-icon"><i className="fas fa-shield-alt"></i></div>
            <h3><span className="lang-en">Set a Password (Optional)</span><span className="lang-bn">পাসওয়ার্ড সেট করুন (ঐচ্ছিক)</span></h3>
            <p><span className="lang-en">You can set a password for email/password login, or skip to use Google sign-in only.</span><span className="lang-bn">আপনি ইমেইল/পাসওয়ার্ড লগইনের জন্য পাসওয়ার্ড সেট করতে পারেন, অথবা শুধুমাত্র গুগল সাইন-ইন ব্যবহার করতে এড়িয়ে যান।</span></p>
          </div>
          <div className="form-group">
            <label><span className="lang-en">Password (Optional)</span><span className="lang-bn">পাসওয়ার্ড (ঐচ্ছিক)</span></label>
            <input type="password" className="form-control" id="googleSetupPassword" placeholder={t('Min 6 characters', 'কমপক্ষে ৬ অক্ষর')} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="form-check">
            <input type="checkbox" id="googleTosAgree" checked={tosAgree} onChange={e => setTosAgree(e.target.checked)} />
            <label htmlFor="googleTosAgree">
              <span className="lang-en">I agree to the <a href="#" className="tos-trigger" onClick={e => { e.preventDefault(); setShowTos(true); }}>Terms of Service</a></span>
              <span className="lang-bn">আমি <a href="#" className="tos-trigger" onClick={e => { e.preventDefault(); setShowTos(true); }}>সেবার শর্তাবলীতে</a> সম্মত</span>
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" id="skipGoogleSetup" onClick={handleSkip}>
            <span className="lang-en">Skip</span><span className="lang-bn">এড়িয়ে যান</span>
          </button>
          <button className="btn btn-primary" id="completeGoogleSetup" onClick={handleComplete} disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-check"></i> <span className="lang-en">Complete Setup</span><span className="lang-bn">সেটআপ সম্পূর্ণ</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
