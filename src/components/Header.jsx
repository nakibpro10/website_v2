import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatStorageLimit, calculateDaysLeft } from '../utils';
import { TRIAL_DAYS } from '../config';

export default function Header({ onMenuToggle, onSubscription, onSettings, onChangePin, onSupport, onTos }) {
  const { toggleLanguage, toggleTheme, theme, language } = useApp();
  const { currentUser, userData, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const displayName = currentUser?.displayName || 'User';
  const email = currentUser?.email || '';
  const photoURL = (currentUser?.photoURL && currentUser.photoURL !== 'null')
    ? currentUser.photoURL
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=667eea&color=fff`;

  let statusBadgeHtml = null;
  if (userData) {
    switch (userData.status) {
      case 'premium':
        statusBadgeHtml = <span className="premium-badge"><i className="fas fa-crown"></i> Premium</span>;
        break;
      case 'pending':
        statusBadgeHtml = <span className="status-badge pending"><i className="fas fa-clock"></i> <span className="lang-en">Pending</span><span className="lang-bn">অপেক্ষমান</span></span>;
        break;
      case 'trial':
        const daysLeft = calculateDaysLeft(userData.trialStartDate || userData.createdAt, TRIAL_DAYS);
        statusBadgeHtml = <span className="status-badge trial"><i className="fas fa-hourglass-half"></i> <span className="lang-en">Trial ({daysLeft}d)</span><span className="lang-bn">ট্রায়াল ({daysLeft} দিন)</span></span>;
        break;
    }
  }

  return (
    <header className="header">
      <button className="menu-toggle btn btn-icon btn-ghost" id="menuToggle" onClick={onMenuToggle}>
        <i className="fas fa-bars"></i>
      </button>

      <div className="search-container" id="searchContainer">
        <div className="search-bar">
          <i className="fas fa-search search-icon"></i>
          <input type="text" id="searchInput" autoComplete="off" placeholder={language === 'en' ? 'Search' : 'খুঁজুন'}
            value={searchValue} onChange={e => setSearchValue(e.target.value)} />
          <span className="search-shortcut">Ctrl+K</span>
        </div>
      </div>

      <div className="header-actions">
        <button className="header-btn lang-toggle-btn" id="langToggleDashboard" title="Toggle Language" onClick={toggleLanguage}>
          <span className="lang-en" style={{ fontSize: '11px', fontWeight: 700 }}>বাং</span>
          <span className="lang-bn" style={{ fontSize: '11px', fontWeight: 700 }}>EN</span>
        </button>

        <button className="header-btn" id="themeToggleDashboard" title="Toggle Theme" onClick={toggleTheme}>
          <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>

        <div className="user-profile" id="userProfileBtn" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <img className="user-avatar" id="userAvatar" src={photoURL} alt="User" />
          <span className="user-name" id="userName">{displayName}</span>
          <i className="fas fa-chevron-down user-dropdown-icon"></i>
        </div>

        {dropdownOpen && (
          <div className="user-dropdown active" id="userDropdown">
            <div className="user-dropdown-header">
              <img className="user-dropdown-avatar" id="dropdownAvatar" src={`${photoURL}&size=72`} alt="User" />
              <div className="user-dropdown-name" id="dropdownName">{displayName}</div>
              <div className="user-dropdown-email" id="dropdownEmail">{email}</div>
              <div className="user-dropdown-status" id="dropdownStatus">{statusBadgeHtml}</div>
            </div>
            <div className="user-dropdown-menu">
              <a href="#" className="user-dropdown-item" id="accountSettingsBtn" onClick={e => { e.preventDefault(); setDropdownOpen(false); onSettings(); }}>
                <i className="fas fa-user-cog"></i>
                <span className="lang-en">Account Settings</span><span className="lang-bn">অ্যাকাউন্ট সেটিংস</span>
              </a>
              <a href="#" className="user-dropdown-item" id="subscriptionBtn" onClick={e => { e.preventDefault(); setDropdownOpen(false); onSubscription(); }}>
                <i className="fas fa-crown"></i>
                <span className="lang-en">Subscription</span><span className="lang-bn">সাবস্ক্রিপশন</span>
              </a>
              <a href="#" className="user-dropdown-item" id="changePinBtn" onClick={e => { e.preventDefault(); setDropdownOpen(false); onChangePin(); }}>
                <i className="fas fa-key"></i>
                <span className="lang-en">Change PIN</span><span className="lang-bn">পিন পরিবর্তন</span>
              </a>
              <div className="user-dropdown-divider"></div>
              <a href="#" className="user-dropdown-item" id="supportBtn" onClick={e => { e.preventDefault(); setDropdownOpen(false); onSupport(); }}>
                <i className="fas fa-headset"></i>
                <span className="lang-en">Help &amp; Support</span><span className="lang-bn">সাহায্য ও সাপোর্ট</span>
              </a>
              <a href="#" className="user-dropdown-item" id="tosBtn" onClick={e => { e.preventDefault(); setDropdownOpen(false); onTos(); }}>
                <i className="fas fa-file-contract"></i>
                <span className="lang-en">Terms of Service</span><span className="lang-bn">সেবার শর্তাবলী</span>
              </a>
              <div className="user-dropdown-divider"></div>
              <a href="#" className="user-dropdown-item danger" id="logoutBtn" onClick={e => { e.preventDefault(); setDropdownOpen(false); logout(); }}>
                <i className="fas fa-sign-out-alt"></i>
                <span className="lang-en">Sign Out</span><span className="lang-bn">সাইন আউট</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
