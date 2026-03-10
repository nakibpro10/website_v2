import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function PrivacyPage() {
  const { language, toggleLanguage, toggleTheme, theme } = useApp();
  const navigate = useNavigate();
  const t = (en, bn) => language === 'en' ? en : bn;

  return (
    <div className="legal-page">
      {/* Sticky Header */}
      <header className="legal-header">
        <div className="legal-header-inner">
          <button className="legal-back-btn" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i>
            <span className="lang-en">Back</span>
            <span className="lang-bn">ফিরুন</span>
          </button>

          <Link to="/auth" className="legal-logo">
            <div className="legal-logo-icon"><i className="fas fa-cloud"></i></div>
            <span className="legal-logo-text">Nakib Cloud</span>
          </Link>

          <div className="legal-header-actions">
            <button className="lang-toggle-btn" onClick={toggleLanguage} title="Toggle Language">
              <span className="lang-en">বাং</span>
              <span className="lang-bn">EN</span>
            </button>
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
              <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="legal-content">
        <div className="legal-hero">
          <div className="legal-hero-icon"><i className="fas fa-user-shield"></i></div>
          <h1>
            <span className="lang-en">Privacy Policy</span>
            <span className="lang-bn">গোপনীয়তা নীতি</span>
          </h1>
          <p className="legal-updated">
            <span className="lang-en">Last updated: January 2025</span>
            <span className="lang-bn">সর্বশেষ আপডেট: জানুয়ারী ২০২৫</span>
          </p>
        </div>

        <div className="legal-body">
          <section className="legal-section">
            <h2>
              <i className="fas fa-database"></i>
              <span className="lang-en">1. Information We Collect</span>
              <span className="lang-bn">১. আমরা যে তথ্য সংগ্রহ করি</span>
            </h2>
            <ul>
              <li>
                <strong>
                  <span className="lang-en">Account Information: </span>
                  <span className="lang-bn">অ্যাকাউন্ট তথ্য: </span>
                </strong>
                <span className="lang-en">Name, email address, and authentication details.</span>
                <span className="lang-bn">নাম, ইমেইল ঠিকানা এবং প্রমাণীকরণ বিবরণ।</span>
              </li>
              <li>
                <strong>
                  <span className="lang-en">File Metadata: </span>
                  <span className="lang-bn">ফাইল মেটাডেটা: </span>
                </strong>
                <span className="lang-en">File names, sizes, types, and upload timestamps.</span>
                <span className="lang-bn">ফাইলের নাম, আকার, ধরন এবং আপলোডের সময়।</span>
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>
              <i className="fas fa-lock"></i>
              <span className="lang-en">2. Data Security</span>
              <span className="lang-bn">২. ডেটা নিরাপত্তা</span>
            </h2>
            <div className="legal-info-box highlight">
              <i className="fas fa-shield-alt"></i>
              <p>
                <span className="lang-en"><strong>End-to-End Encryption:</strong> All your files are encrypted with your personal PIN. We cannot access your encrypted files without your PIN.</span>
                <span className="lang-bn"><strong>এন্ড-টু-এন্ড এনক্রিপশন:</strong> আপনার সমস্ত ফাইল আপনার ব্যক্তিগত পিন দিয়ে এনক্রিপ্ট করা। আমরা আপনার পিন ছাড়া আপনার এনক্রিপ্টেড ফাইল অ্যাক্সেস করতে পারি না।</span>
              </p>
            </div>
          </section>

          <section className="legal-section">
            <h2>
              <i className="fas fa-ban"></i>
              <span className="lang-en">3. We Do NOT</span>
              <span className="lang-bn">৩. আমরা করি না</span>
            </h2>
            <ul>
              <li>
                <span className="lang-en">Sell your personal data to third parties</span>
                <span className="lang-bn">তৃতীয় পক্ষের কাছে আপনার ব্যক্তিগত তথ্য বিক্রি করি</span>
              </li>
              <li>
                <span className="lang-en">Share your encrypted files with anyone</span>
                <span className="lang-bn">আপনার এনক্রিপ্টেড ফাইল কারও সাথে শেয়ার করি</span>
              </li>
              <li>
                <span className="lang-en">Access your files without legal authorization</span>
                <span className="lang-bn">আইনি অনুমোদন ছাড়া আপনার ফাইল অ্যাক্সেস করি</span>
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>
              <i className="fas fa-cookie-bite"></i>
              <span className="lang-en">4. Cookies & Local Storage</span>
              <span className="lang-bn">৪. কুকিজ এবং লোকাল স্টোরেজ</span>
            </h2>
            <p>
              <span className="lang-en">We use local storage to save your preferences (theme, language) and authentication session. We do not use tracking cookies or share data with advertisers.</span>
              <span className="lang-bn">আমরা আপনার পছন্দ (থিম, ভাষা) এবং প্রমাণীকরণ সেশন সংরক্ষণ করতে লোকাল স্টোরেজ ব্যবহার করি। আমরা ট্র্যাকিং কুকিজ ব্যবহার করি না বা বিজ্ঞাপনদাতাদের সাথে ডেটা শেয়ার করি না।</span>
            </p>
          </section>

          <div className="legal-info-box">
            <i className="fas fa-envelope"></i>
            <p>
              <span className="lang-en"><strong>Questions?</strong> Contact us if you have any questions about our privacy practices.</span>
              <span className="lang-bn"><strong>প্রশ্ন?</strong> আমাদের গোপনীয়তা অনুশীলন সম্পর্কে কোনো প্রশ্ন থাকলে যোগাযোগ করুন।</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="legal-footer">
        <p>
          <span className="lang-en">© 2025 Nakib Cloud. All rights reserved.</span>
          <span className="lang-bn">© ২০২৫ Nakib Cloud। সর্বস্বত্ব সংরক্ষিত।</span>
        </p>
        <div className="legal-footer-links">
          <Link to="/tos">
            <span className="lang-en">Terms of Service</span>
            <span className="lang-bn">সেবার শর্তাবলী</span>
          </Link>
          <Link to="/auth">
            <span className="lang-en">Sign In</span>
            <span className="lang-bn">সাইন ইন</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
