import { useApp } from '../context/AppContext';
import { formatSize, formatStorageLimit, calculateDaysLeft } from '../utils';
import { useAuth } from '../context/AuthContext';
import { useFiles } from '../context/FileContext';
import { TRIAL_DAYS } from '../config';

export default function Sidebar({ currentPage, onNavigate, onUpgrade, onNewUpload }) {
  const { language } = useApp();
  const { userData } = useAuth();
  const { userFiles, trashFiles, trashFolders } = useFiles();
  const t = (en, bn) => language === 'en' ? en : bn;

  const trashCount = trashFiles.length + trashFolders.length;
  const storageUsed = userFiles.reduce((sum, f) => sum + (f.size || 0), 0);
  
  let daysLeft = 0;
  let storageLabel = '/ Unlimited';
  let statusBadgeClass = 'trial';
  let statusBadgeText = t('Trial', 'ট্রায়াল');
  let storageLeftText = t('7 days left', '৭ দিন বাকি');
  let upgradeDisabled = false;

  if (userData) {
    if (userData.status === 'premium') {
      statusBadgeClass = 'premium';
      statusBadgeText = 'Premium';
      storageLabel = '/ ' + formatStorageLimit(userData.storageLimit);
      storageLeftText = formatStorageLimit(userData.storageLimit);
      upgradeDisabled = true;
    } else if (userData.status === 'pending') {
      statusBadgeClass = 'pending';
      statusBadgeText = t('Pending', 'অপেক্ষমান');
      storageLeftText = t('Verifying...', 'যাচাই হচ্ছে...');
    } else if (userData.status === 'trial') {
      daysLeft = calculateDaysLeft(userData.trialStartDate || userData.createdAt, TRIAL_DAYS);
      statusBadgeClass = 'trial';
      statusBadgeText = t('Trial', 'ট্রায়াল');
      storageLeftText = t(`${daysLeft} days left`, `${daysLeft} দিন বাকি`);
    }
  }

  const storagePercentage = userData?.status === 'premium' && userData?.storageLimit
    ? Math.min((storageUsed / (userData.storageLimit * 1024 * 1024 * 1024)) * 100, 100)
    : Math.min((storageUsed / (100 * 1024 * 1024 * 1024)) * 100, 100);

  const barClass = storagePercentage > 90 ? 'danger' : storagePercentage > 70 ? 'warning' : '';

  const navItems = [
    { page: 'home', icon: 'fa-home', en: 'Home', bn: 'হোম' },
    { page: 'my-files', icon: 'fa-folder', en: 'My Files', bn: 'আমার ফাইল' },
    { page: 'recent', icon: 'fa-clock', en: 'Recent', bn: 'সাম্প্রতিক' },
    { page: 'starred', icon: 'fa-star', en: 'Starred', bn: 'তারকাচিহ্নিত' },
  ];

  const categoryItems = [
    { page: 'images', icon: 'fa-image', en: 'Images', bn: 'ছবি' },
    { page: 'videos', icon: 'fa-video', en: 'Videos', bn: 'ভিডিও' },
    { page: 'audio', icon: 'fa-music', en: 'Audio', bn: 'অডিও' },
    { page: 'documents', icon: 'fa-file-alt', en: 'Documents', bn: 'ডকুমেন্ট' },
  ];

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <a href="#" className="sidebar-logo" id="sidebarLogo">
          <div className="sidebar-logo-icon"><i className="fas fa-cloud"></i></div>
          <span className="sidebar-logo-text">Nakib Cloud</span>
        </a>
        <button className="sidebar-close btn btn-icon btn-ghost" id="sidebarClose" onClick={() => {
          document.getElementById('sidebar')?.classList.remove('open');
          document.getElementById('sidebarOverlay')?.classList.remove('active');
          document.body.style.overflow = '';
        }}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <button className="new-upload-btn" id="newUploadBtn" onClick={onNewUpload}>
        <i className="fas fa-plus"></i>
        <span className="lang-en">New</span>
        <span className="lang-bn">নতুন</span>
      </button>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {navItems.map(item => (
            <a key={item.page} href="#" className={`nav-item ${currentPage === item.page ? 'active' : ''}`}
               data-page={item.page}
               onClick={e => { e.preventDefault(); onNavigate(item.page); }}>
              <i className={`fas ${item.icon}`}></i>
              <span className="lang-en">{item.en}</span>
              <span className="lang-bn">{item.bn}</span>
            </a>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">
            <span className="lang-en">Categories</span>
            <span className="lang-bn">বিভাগসমূহ</span>
          </div>
          {categoryItems.map(item => (
            <a key={item.page} href="#" className={`nav-item ${currentPage === item.page ? 'active' : ''}`}
               data-page={item.page}
               onClick={e => { e.preventDefault(); onNavigate(item.page); }}>
              <i className={`fas ${item.icon}`}></i>
              <span className="lang-en">{item.en}</span>
              <span className="lang-bn">{item.bn}</span>
            </a>
          ))}
        </div>

        <div className="nav-section">
          <a href="#" className={`nav-item ${currentPage === 'trash' ? 'active' : ''}`}
             data-page="trash"
             onClick={e => { e.preventDefault(); onNavigate('trash'); }}>
            <i className="fas fa-trash-alt"></i>
            <span className="lang-en">Trash</span>
            <span className="lang-bn">ট্র্যাশ</span>
            <span className={`nav-badge ${trashCount === 0 ? 'hidden' : ''}`} id="trashBadge">
              {trashCount > 99 ? '99+' : trashCount}
            </span>
          </a>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="storage-info">
          <div className="storage-header">
            <span><strong id="storageUsed">{formatSize(storageUsed)}</strong> <span className="lang-en">used</span><span className="lang-bn">ব্যবহৃত</span></span>
            <span id="storageTotal">{storageLabel}</span>
          </div>
          <div className="storage-bar">
            <div className={`storage-bar-fill ${barClass}`} id="storageBarFill" style={{ width: `${storagePercentage}%` }}></div>
          </div>
          <div className="storage-text">
            <span id="userStatusBadge" className={`user-status-badge ${statusBadgeClass}`}>
              <i className={`fas ${statusBadgeClass === 'premium' ? 'fa-crown' : 'fa-clock'}`}></i>
              {statusBadgeText}
            </span>
            <span id="trialDaysLeft">{storageLeftText}</span>
          </div>
        </div>
        <button className="upgrade-btn" id="upgradeBtn" disabled={upgradeDisabled} onClick={onUpgrade}
          style={upgradeDisabled ? { background: 'var(--success)', boxShadow: '0 4px 15px rgba(52,168,83,0.3)' } : {}}>
          <i className={`fas ${upgradeDisabled ? 'fa-check-circle' : 'fa-crown'}`}></i>
          {upgradeDisabled ? (
            <><span className="lang-en">Premium Active</span><span className="lang-bn">প্রিমিয়াম সক্রিয়</span></>
          ) : (
            <><span className="lang-en" id="upgradeBtnTextEn">Get Premium</span><span className="lang-bn" id="upgradeBtnTextBn">প্রিমিয়াম নিন</span></>
          )}
        </button>
      </div>
    </aside>
  );
}
