import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function TosPage() {
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
          <div className="legal-hero-icon"><i className="fas fa-file-contract"></i></div>
          <h1>
            <span className="lang-en">Terms of Service</span>
            <span className="lang-bn">সেবার শর্তাবলী</span>
          </h1>
          <p className="legal-updated">
            <span className="lang-en">Last updated: January 2025</span>
            <span className="lang-bn">সর্বশেষ আপডেট: জানুয়ারী ২০২৫</span>
          </p>
        </div>

        <div className="legal-body">
          <section className="legal-section">
            <h2>
              <i className="fas fa-info-circle"></i>
              <span className="lang-en">1. Service Agreement</span>
              <span className="lang-bn">১. সেবার চুক্তি</span>
            </h2>
            <p>
              <span className="lang-en">By using Nakib Cloud, you agree to these terms. Nakib Cloud provides encrypted cloud storage services. All files are encrypted with your personal PIN.</span>
              <span className="lang-bn">Nakib Cloud ব্যবহার করে আপনি এই শর্তাবলীতে সম্মত হন। Nakib Cloud এনক্রিপ্টেড ক্লাউড স্টোরেজ সেবা প্রদান করে। সমস্ত ফাইল আপনার ব্যক্তিগত পিন দিয়ে এনক্রিপ্ট করা হয়।</span>
            </p>
          </section>

          <section className="legal-section">
            <h2>
              <i className="fas fa-user"></i>
              <span className="lang-en">2. User Responsibilities</span>
              <span className="lang-bn">২. ব্যবহারকারীর দায়িত্ব</span>
            </h2>
            <ul>
              <li>
                <span className="lang-en">Keep your PIN and password secure</span>
                <span className="lang-bn">আপনার পিন এবং পাসওয়ার্ড নিরাপদ রাখুন</span>
              </li>
              <li>
                <span className="lang-en">Do not share your account with others</span>
                <span className="lang-bn">অন্যদের সাথে আপনার অ্যাকাউন্ট শেয়ার করবেন না</span>
              </li>
              <li>
                <span className="lang-en">Do not upload illegal or prohibited content</span>
                <span className="lang-bn">অবৈধ বা নিষিদ্ধ বিষয়বস্তু আপলোড করবেন না</span>
              </li>
              <li>
                <span className="lang-en">Use the service in compliance with applicable laws</span>
                <span className="lang-bn">প্রযোজ্য আইন মেনে সেবা ব্যবহার করুন</span>
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>
              <i className="fas fa-shield-alt"></i>
              <span className="lang-en">3. Admin Rights</span>
              <span className="lang-bn">৩. অ্যাডমিনের অধিকার</span>
            </h2>
            <p>
              <span className="lang-en">The administrator reserves the right to suspend or ban accounts that violate these terms without prior notice.</span>
              <span className="lang-bn">অ্যাডমিনিস্ট্রেটর পূর্ব নোটিশ ছাড়াই এই শর্ত লঙ্ঘনকারী অ্যাকাউন্ট স্থগিত বা নিষিদ্ধ করার অধিকার সংরক্ষণ করেন।</span>
            </p>
          </section>

          <section className="legal-section">
            <h2>
              <i className="fas fa-credit-card"></i>
              <span className="lang-en">4. Payment Policy</span>
              <span className="lang-bn">৪. পেমেন্ট নীতি</span>
            </h2>
            <ul>
              <li>
                <span className="lang-en">All subscriptions are processed manually</span>
                <span className="lang-bn">সমস্ত সাবস্ক্রিপশন ম্যানুয়ালি প্রক্রিয়া করা হয়</span>
              </li>
              <li>
                <span className="lang-en">Payments are reviewed within 24 hours</span>
                <span className="lang-bn">পেমেন্ট ২৪ ঘণ্টার মধ্যে পর্যালোচনা করা হয়</span>
              </li>
              <li>
                <span className="lang-en">Refunds are not provided once service is activated</span>
                <span className="lang-bn">সেবা সক্রিয় হলে ফেরত প্রদান করা হয় না</span>
              </li>
            </ul>
          </section>

          <div className="legal-info-box">
            <i className="fas fa-calendar-alt"></i>
            <p>
              <span className="lang-en"><strong>Last Updated:</strong> January 2025. We may update these terms from time to time.</span>
              <span className="lang-bn"><strong>সর্বশেষ আপডেট:</strong> জানুয়ারী ২০২৫। আমরা সময়ে সময়ে এই শর্তাবলী আপডেট করতে পারি।</span>
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
          <Link to="/privacy-policy">
            <span className="lang-en">Privacy Policy</span>
            <span className="lang-bn">গোপনীয়তা নীতি</span>
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
