import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const LOGIN_ATTEMPTS_KEY = 'nakib-cloud-login-attempts';
const RESET_ATTEMPTS_KEY = 'nakib-cloud-reset-attempts';
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_RESET_ATTEMPTS = 3;
const RESET_LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

function getLoginAttempts() {
  try {
    const data = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY));
    if (!data) return { count: 0, lastAttempt: null, lockedUntil: null };
    // Clear expired lock
    if (data.lockedUntil && Date.now() > data.lockedUntil) {
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      return { count: 0, lastAttempt: null, lockedUntil: null };
    }
    return data;
  } catch { return { count: 0, lastAttempt: null, lockedUntil: null }; }
}

function setLoginAttempts(data) {
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(data));
}

function getResetAttempts() {
  try {
    const data = JSON.parse(localStorage.getItem(RESET_ATTEMPTS_KEY));
    if (!data) return { count: 0, firstAttempt: null };
    // Reset if window has passed
    if (data.firstAttempt && Date.now() - data.firstAttempt > RESET_LOCK_DURATION) {
      localStorage.removeItem(RESET_ATTEMPTS_KEY);
      return { count: 0, firstAttempt: null };
    }
    return data;
  } catch { return { count: 0, firstAttempt: null }; }
}

function setResetAttempts(data) {
  localStorage.setItem(RESET_ATTEMPTS_KEY, JSON.stringify(data));
}

const GoogleIcon = () => (
  <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AuthPage() {
  const { signInWithEmailAndPassword, signUpWithEmail, signInWithGoogle } = useAuth();
  const { showToast, language, toggleLanguage, toggleTheme, theme } = useApp();
  const t = (en, bn) => language === 'en' ? en : bn;

  const [activeTab, setActiveTab] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginLockCountdown, setLoginLockCountdown] = useState(null);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [tosAgree, setTosAgree] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Login lock countdown
  useEffect(() => {
    function tick() {
      const attempts = getLoginAttempts();
      if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
        const remaining = attempts.lockedUntil - Date.now();
        const min = Math.floor(remaining / 60000);
        const sec = Math.floor((remaining % 60000) / 1000);
        setLoginLockCountdown(`${min}:${sec.toString().padStart(2, '0')}`);
      } else {
        setLoginLockCountdown(null);
      }
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  function getPasswordStrength(pwd) {
    const checks = [pwd.length >= 6, /[A-Z]/.test(pwd), /[a-z]/.test(pwd), /[0-9]/.test(pwd)];
    return checks.filter(Boolean).length;
  }

  const recordLoginFailure = useCallback(() => {
    const attempts = getLoginAttempts();
    const newCount = attempts.count + 1;
    if (newCount >= MAX_LOGIN_ATTEMPTS) {
      setLoginAttempts({
        count: newCount,
        lastAttempt: Date.now(),
        lockedUntil: Date.now() + LOGIN_LOCK_DURATION,
      });
    } else {
      setLoginAttempts({
        count: newCount,
        lastAttempt: Date.now(),
        lockedUntil: null,
      });
    }
    return MAX_LOGIN_ATTEMPTS - newCount;
  }, []);

  const resetLoginAttempts = useCallback(() => {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    setLoginLockCountdown(null);
  }, []);

  async function handleLogin(e) {
    e.preventDefault();

    // Check if locked
    const attempts = getLoginAttempts();
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      showToast(t('Login locked. Please wait.', 'লগইন লক। অনুগ্রহ করে অপেক্ষা করুন।'), 'error');
      return;
    }

    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(loginEmail, loginPassword, rememberMe);
      resetLoginAttempts();
      showToast(t('Welcome back!', 'স্বাগতম!'), 'success');
    } catch (err) {
      const remaining = recordLoginFailure();
      let msg = t('Login failed', 'লগইন ব্যর্থ');
      if (err.code === 'auth/user-not-found') msg = t('No account found with this email', 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই');
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = t('Invalid email or password', 'ভুল ইমেইল বা পাসওয়ার্ড');
      else if (err.code === 'auth/too-many-requests') msg = t('Too many attempts. Try again later.', 'অনেক চেষ্টা হয়েছে। পরে আবার চেষ্টা করুন।');

      if (remaining > 0 && remaining < MAX_LOGIN_ATTEMPTS) {
        msg += ` (${t(`${remaining} attempt${remaining > 1 ? 's' : ''} remaining`, `আর ${remaining} বার চেষ্টা বাকি`)})`;
      } else if (remaining <= 0) {
        msg = t('Too many failed attempts. Login locked for 15 minutes.', 'অনেক ভুল চেষ্টা। লগইন ১৫ মিনিটের জন্য লক।');
      }
      showToast(msg, 'error');
    } finally { setLoginLoading(false); }
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (!tosAgree) { showToast(t('Please agree to the Terms of Service', 'সেবার শর্তাবলীতে সম্মত হন'), 'warning'); return; }
    if (signupPassword !== signupConfirmPassword) { showToast(t('Passwords do not match', 'পাসওয়ার্ড মেলেনি'), 'error'); return; }
    if (signupPassword.length < 6) { showToast(t('Password must be at least 6 characters', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'), 'error'); return; }
    setSignupLoading(true);
    try {
      await signUpWithEmail(signupName, signupEmail, signupPassword);
      showToast(t('Account created successfully!', 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!'), 'success');
    } catch (err) {
      let msg = t('Sign up failed', 'সাইন আপ ব্যর্থ');
      if (err.code === 'auth/email-already-in-use') msg = t('Email already in use', 'ইমেইল ইতিমধ্যে ব্যবহৃত');
      else if (err.code === 'auth/weak-password') msg = t('Password is too weak', 'পাসওয়ার্ড অনেক দুর্বল');
      showToast(msg, 'error');
    } finally { setSignupLoading(false); }
  }

  async function handleGoogleLogin() {
    try {
      await signInWithGoogle();
      resetLoginAttempts();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        showToast(t('Google sign in failed', 'Google সাইন ইন ব্যর্থ'), 'error');
      }
    }
  }

  async function handlePasswordReset() {
    // Rate limit check
    const resetData = getResetAttempts();
    if (resetData.count >= MAX_RESET_ATTEMPTS) {
      const remaining = RESET_LOCK_DURATION - (Date.now() - resetData.firstAttempt);
      const min = Math.ceil(remaining / 60000);
      showToast(t(
        `Too many reset requests. Wait ${min} minute${min > 1 ? 's' : ''}.`,
        `অনেক রিসেট রিকোয়েস্ট। ${min} মিনিট অপেক্ষা করুন।`
      ), 'error');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      // Record attempt
      setResetAttempts({
        count: resetData.count + 1,
        firstAttempt: resetData.firstAttempt || Date.now(),
      });
      showToast(t('Password reset email sent!', 'পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে!'), 'success');
      setShowResetModal(false);
    } catch (err) {
      showToast(t('Failed to send reset email', 'রিসেট ইমেইল পাঠাতে ব্যর্থ'), 'error');
    }
  }

  const pwdStrength = getPasswordStrength(signupPassword);
  const isLoginLocked = !!loginLockCountdown;

  return (
    <div className="auth-page" id="authPage">
      {showResetModal && (
        <div className="modal-overlay active" id="resetPasswordModal">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h3><i className="fas fa-key"></i> <span className="lang-en">Reset Password</span><span className="lang-bn">পাসওয়ার্ড রিসেট</span></h3>
              <button className="modal-close" onClick={() => setShowResetModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label><span className="lang-en">Email Address</span><span className="lang-bn">ইমেইল এড্রেস</span></label>
                <input type="email" className="form-control" value={resetEmail} onChange={e => setResetEmail(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="modal-footer" id="resetModalFooter">
              <button className="btn btn-ghost" onClick={() => setShowResetModal(false)}><span className="lang-en">Cancel</span><span className="lang-bn">বাতিল</span></button>
              <button className="btn btn-primary" onClick={handlePasswordReset}>
                <i className="fas fa-paper-plane"></i> <span className="lang-en">Send Link</span><span className="lang-bn">লিংক পাঠান</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Side - Decorative */}
      <div className="auth-left">
        <div className="auth-left-content">
          <svg className="auth-illustration" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="320" cy="220" rx="60" ry="30" fill="rgba(255,255,255,0.1)"/>
            <ellipse cx="80" cy="180" rx="50" ry="25" fill="rgba(255,255,255,0.1)"/>
            <path d="M300 180C300 140 270 110 230 110C220 80 190 60 155 60C110 60 75 95 75 140C75 145 75.5 150 76.5 155C45 165 25 195 25 230C25 275 60 310 105 310H270C305 310 335 280 335 245C335 215 315 190 290 182C295 180 300 175 300 180Z" fill="rgba(255,255,255,0.95)"/>
            <path d="M180 240V160M180 160L150 190M180 160L210 190" stroke="#667eea" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="120" cy="130" r="8" fill="#667eea" opacity="0.6">
              <animate attributeName="cy" values="130;120;130" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="240" cy="100" r="6" fill="#764ba2" opacity="0.6">
              <animate attributeName="cy" values="100;90;100" dur="2.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="280" cy="150" r="5" fill="#667eea" opacity="0.4">
              <animate attributeName="cy" values="150;140;150" dur="2s" repeatCount="indefinite"/>
            </circle>
            <g transform="translate(290, 70)">
              <rect x="5" y="15" width="30" height="25" rx="3" fill="#ffd700"/>
              <path d="M10 15V10C10 5 15 0 20 0C25 0 30 5 30 10V15" stroke="#ffd700" strokeWidth="4" fill="none"/>
              <circle cx="20" cy="27" r="4" fill="#333"/>
            </g>
          </svg>

          <h2>
            <span className="lang-en">Secure Cloud Storage</span>
            <span className="lang-bn">সুরক্ষিত ক্লাউড স্টোরেজ</span>
          </h2>
          <p>
            <span className="lang-en">Store your files securely with end-to-end encryption. Access anywhere, anytime.</span>
            <span className="lang-bn">এন্ড-টু-এন্ড এনক্রিপশন সহ আপনার ফাইল সুরক্ষিতভাবে সংরক্ষণ করুন। যেকোনো জায়গায়, যেকোনো সময় অ্যাক্সেস করুন।</span>
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <i className="fas fa-lock"></i>
              <span className="lang-en">E2E Encrypted</span>
              <span className="lang-bn">এনক্রিপ্টেড</span>
            </div>
            <div className="auth-feature">
              <i className="fas fa-cloud-upload-alt"></i>
              <span className="lang-en">Unlimited Upload</span>
              <span className="lang-bn">আনলিমিটেড আপলোড</span>
            </div>
            <div className="auth-feature">
              <i className="fas fa-shield-alt"></i>
              <span className="lang-en">100% Secure</span>
              <span className="lang-bn">১০০% সুরক্ষিত</span>
            </div>
            <div className="auth-feature">
              <i className="fas fa-mobile-alt"></i>
              <span className="lang-en">Access Anywhere</span>
              <span className="lang-bn">যেকোনো জায়গায়</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="auth-right">
        {/* Top Controls */}
        <div className="auth-top-controls">
          <button className="lang-toggle-btn" id="langToggleAuth" onClick={toggleLanguage} title="Toggle Language">
            <span className="lang-en">বাং</span>
            <span className="lang-bn">EN</span>
          </button>
          <button className="theme-toggle-btn" id="themeToggleAuth" onClick={toggleTheme} title="Toggle Theme">
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>

        <div className="auth-container">
          {/* Logo & Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <div className="auth-logo-icon"><i className="fas fa-cloud"></i></div>
              <span className="auth-logo-text">Nakib Cloud</span>
            </div>
            <h1>
              <span className="lang-en" id="authTitleEn">{activeTab === 'login' ? 'Welcome Back' : 'Create Account'}</span>
              <span className="lang-bn" id="authTitleBn">{activeTab === 'login' ? 'স্বাগতম' : 'অ্যাকাউন্ট তৈরি করুন'}</span>
            </h1>
            <p>
              <span className="lang-en" id="authSubtitleEn">{activeTab === 'login' ? 'Sign in to continue to Nakib Cloud' : 'Sign up to start using Nakib Cloud'}</span>
              <span className="lang-bn" id="authSubtitleBn">{activeTab === 'login' ? 'Nakib Cloud-এ চালিয়ে যেতে সাইন ইন করুন' : 'Nakib Cloud ব্যবহার শুরু করতে সাইন আপ করুন'}</span>
            </p>
          </div>

          {/* Auth Card */}
          <div className="auth-card card">
            {/* Tabs */}
            <div className="auth-tabs">
              <button className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => setActiveTab('login')}>
                <span className="lang-en">Sign In</span><span className="lang-bn">সাইন ইন</span>
              </button>
              <button className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`} onClick={() => setActiveTab('signup')}>
                <span className="lang-en">Sign Up</span><span className="lang-bn">সাইন আপ</span>
              </button>
            </div>

            {/* Login Form */}
            <form id="loginForm" className={`auth-form ${activeTab === 'login' ? 'active' : ''}`} onSubmit={handleLogin}>
              <div className="input-group">
                <input type="email" id="loginEmail" required autoComplete="email" placeholder=" "
                  value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                <i className="fas fa-envelope input-icon"></i>
                <label className="input-label">
                  <span className="lang-en">Email Address</span>
                  <span className="lang-bn">ইমেইল এড্রেস</span>
                </label>
              </div>

              <div className="input-group">
                <input type={showLoginPassword ? 'text' : 'password'} id="loginPassword" required autoComplete="current-password" placeholder=" "
                  value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                <i className="fas fa-lock input-icon"></i>
                <label className="input-label">
                  <span className="lang-en">Password</span>
                  <span className="lang-bn">পাসওয়ার্ড</span>
                </label>
                <button type="button" className="password-toggle" id="loginPasswordToggle" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                  <i className={`fas ${showLoginPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="auth-options">
                <label className="remember-me">
                  <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                  <span className="checkbox-custom"><i className="fas fa-check"></i></span>
                  <span className="lang-en">Remember me</span>
                  <span className="lang-bn">মনে রাখুন</span>
                </label>
                <a href="#" className="forgot-link" id="forgotPasswordLink" onClick={e => { e.preventDefault(); setShowResetModal(true); setResetEmail(loginEmail); }}>
                  <span className="lang-en">Forgot Password?</span>
                  <span className="lang-bn">পাসওয়ার্ড ভুলে গেছেন?</span>
                </a>
              </div>

              <button type="submit" className={`btn btn-primary btn-lg w-full ${isLoginLocked ? 'login-locked-btn' : ''}`} id="loginBtn" disabled={loginLoading || isLoginLocked}>
                {isLoginLocked ? (
                  <><i className="fas fa-lock"></i> <span className="lang-en">Locked ({loginLockCountdown})</span><span className="lang-bn">লক ({loginLockCountdown})</span></>
                ) : loginLoading ? (
                  <><i className="fas fa-spinner fa-spin"></i> <span className="lang-en">Signing in...</span><span className="lang-bn">সাইন ইন হচ্ছে...</span></>
                ) : (
                  <><i className="fas fa-sign-in-alt"></i> <span className="lang-en">Sign In</span><span className="lang-bn">সাইন ইন</span></>
                )}
              </button>

              <div className="auth-divider">
                <span className="lang-en">or continue with</span>
                <span className="lang-bn">অথবা</span>
              </div>

              <button type="button" className="google-btn" id="googleLoginBtn" onClick={handleGoogleLogin} disabled={isLoginLocked}>
                <GoogleIcon />
                <span className="lang-en">Continue with Google</span>
                <span className="lang-bn">Google দিয়ে চালিয়ে যান</span>
              </button>
            </form>

            {/* Signup Form */}
            <form id="signupForm" className={`auth-form ${activeTab === 'signup' ? 'active' : ''}`} onSubmit={handleSignup}>
              <div className="input-group">
                <input type="text" id="signupName" required autoComplete="name" placeholder=" "
                  value={signupName} onChange={e => setSignupName(e.target.value)} />
                <i className="fas fa-user input-icon"></i>
                <label className="input-label">
                  <span className="lang-en">Full Name</span>
                  <span className="lang-bn">পুরো নাম</span>
                </label>
              </div>

              <div className="input-group">
                <input type="email" id="signupEmail" required autoComplete="email" placeholder=" "
                  value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
                <i className="fas fa-envelope input-icon"></i>
                <label className="input-label">
                  <span className="lang-en">Email Address</span>
                  <span className="lang-bn">ইমেইল এড্রেস</span>
                </label>
              </div>

              <div className="input-group">
                <input type={showSignupPassword ? 'text' : 'password'} id="signupPassword" required autoComplete="new-password" placeholder=" "
                  value={signupPassword} onChange={e => setSignupPassword(e.target.value)} />
                <i className="fas fa-lock input-icon"></i>
                <label className="input-label">
                  <span className="lang-en">Password</span>
                  <span className="lang-bn">পাসওয়ার্ড</span>
                </label>
                <button type="button" className="password-toggle" id="signupPasswordToggle" onClick={() => setShowSignupPassword(!showSignupPassword)}>
                  <i className={`fas ${showSignupPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>

              {/* Password Strength */}
              {signupPassword && (
                <>
                  <div className="password-strength show" id="passwordStrength">
                    {[1,2,3,4].map(i => <div key={i} className={`strength-bar ${i <= pwdStrength ? (pwdStrength <= 1 ? 'weak' : pwdStrength <= 2 ? 'medium' : 'strong') : ''}`}></div>)}
                  </div>
                  <div className="password-criteria show" id="passwordCriteria">
                    <div className={`criteria-item ${signupPassword.length >= 6 ? 'valid' : ''}`}><i className={`fas ${signupPassword.length >= 6 ? 'fa-check-circle' : 'fa-circle'}`}></i> <span className="lang-en">At least 6 characters</span><span className="lang-bn">কমপক্ষে ৬ অক্ষর</span></div>
                    <div className={`criteria-item ${/[A-Z]/.test(signupPassword) ? 'valid' : ''}`}><i className={`fas ${/[A-Z]/.test(signupPassword) ? 'fa-check-circle' : 'fa-circle'}`}></i> <span className="lang-en">Uppercase letter</span><span className="lang-bn">বড় হাতের অক্ষর</span></div>
                    <div className={`criteria-item ${/[a-z]/.test(signupPassword) ? 'valid' : ''}`}><i className={`fas ${/[a-z]/.test(signupPassword) ? 'fa-check-circle' : 'fa-circle'}`}></i> <span className="lang-en">Lowercase letter</span><span className="lang-bn">ছোট হাতের অক্ষর</span></div>
                    <div className={`criteria-item ${/[0-9]/.test(signupPassword) ? 'valid' : ''}`}><i className={`fas ${/[0-9]/.test(signupPassword) ? 'fa-check-circle' : 'fa-circle'}`}></i> <span className="lang-en">Number</span><span className="lang-bn">সংখ্যা</span></div>
                  </div>
                </>
              )}

              <div className="input-group">
                <input type="password" id="signupPasswordConfirm" required autoComplete="new-password" placeholder=" "
                  value={signupConfirmPassword} onChange={e => setSignupConfirmPassword(e.target.value)} />
                <i className="fas fa-lock input-icon"></i>
                <label className="input-label">
                  <span className="lang-en">Confirm Password</span>
                  <span className="lang-bn">পাসওয়ার্ড নিশ্চিত করুন</span>
                </label>
              </div>

              {/* TOS Agreement */}
              <label className="tos-agree">
                <input type="checkbox" id="tosAgree" checked={tosAgree} onChange={e => setTosAgree(e.target.checked)} />
                <span className="checkbox-custom"><i className="fas fa-check"></i></span>
                <span>
                  <span className="lang-en">I agree to the <a href="/tos" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></span>
                  <span className="lang-bn">আমি <a href="/tos" target="_blank" rel="noopener noreferrer">সেবার শর্তাবলী</a> এবং <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">গোপনীয়তা নীতি</a>-তে সম্মত</span>
                </span>
              </label>

              <button type="submit" className="btn btn-primary btn-lg w-full" id="signupBtn" disabled={signupLoading}>
                {signupLoading ? <><i className="fas fa-spinner fa-spin"></i> <span className="lang-en">Creating account...</span><span className="lang-bn">অ্যাকাউন্ট তৈরি হচ্ছে...</span></> : <><i className="fas fa-user-plus"></i> <span className="lang-en">Create Account</span><span className="lang-bn">অ্যাকাউন্ট তৈরি করুন</span></>}
              </button>

              <div className="auth-divider">
                <span className="lang-en">or continue with</span>
                <span className="lang-bn">অথবা</span>
              </div>

              <button type="button" className="google-btn" id="googleSignupBtn" onClick={handleGoogleLogin}>
                <GoogleIcon />
                <span className="lang-en">Continue with Google</span>
                <span className="lang-bn">Google দিয়ে চালিয়ে যান</span>
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="auth-footer">
            <div className="auth-footer-links">
              <a href="#" id="helpLink" onClick={e => { e.preventDefault(); }}>
                <span className="lang-en">Help</span>
                <span className="lang-bn">সাহায্য</span>
              </a>
              <Link to="/privacy-policy">
                <span className="lang-en">Privacy</span>
                <span className="lang-bn">গোপনীয়তা</span>
              </Link>
              <Link to="/tos">
                <span className="lang-en">Terms</span>
                <span className="lang-bn">শর্তাবলী</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
