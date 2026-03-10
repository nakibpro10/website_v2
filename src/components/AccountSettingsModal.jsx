import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function AccountSettingsModal({ onClose, onChangePin, onChangePassword }) {
  const { currentUser, userData, updateUserProfile } = useAuth();
  const { showToast, language } = useApp();
  const t = (en, bn) => language === 'en' ? en : bn;
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  const displayName = currentUser?.displayName || 'User';
  const email = currentUser?.email || '';
  const photoURL = (currentUser?.photoURL && currentUser.photoURL !== 'null')
    ? currentUser.photoURL
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=667eea&color=fff&size=100`;

  async function handleSaveName() {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await updateUserProfile({ displayName: newName.trim() });
      showToast(t('Name updated successfully', 'নাম আপডেট হয়েছে'), 'success');
      setEditingName(false);
    } catch (err) {
      showToast(t('Failed to update name', 'নাম আপডেট করতে ব্যর্থ'), 'error');
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay active" id="settingsModal">
      <div className="modal">
        <div className="modal-header">
          <h3><i className="fas fa-user-cog"></i> <span className="lang-en">Account Settings</span><span className="lang-bn">অ্যাকাউন্ট সেটিংস</span></h3>
          <button className="modal-close" id="closeSettingsModal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="settings-avatar-section">
            <img className="settings-avatar" id="settingsAvatar" src={photoURL} alt="User" />
            <div className="settings-user-info">
              <div className="settings-user-name" id="settingsUserName">{displayName}</div>
              <div className="settings-user-email" id="settingsUserEmail">{email}</div>
            </div>
          </div>

          <div className="settings-section">
            <h4 className="settings-section-title">
              <span className="lang-en">Profile</span><span className="lang-bn">প্রোফাইল</span>
            </h4>
            <div className="settings-row">
              <div className="settings-row-label">
                <span className="lang-en">Display Name</span><span className="lang-bn">প্রদর্শনী নাম</span>
              </div>
              {!editingName ? (
                <div id="nameDisplayMode" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span id="currentDisplayName">{displayName}</span>
                  <button className="btn btn-ghost btn-sm" id="editNameBtn" onClick={() => { setEditingName(true); setNewName(displayName); }}>
                    <i className="fas fa-pencil-alt"></i>
                  </button>
                </div>
              ) : (
                <div id="nameEditMode" className="active" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="text" className="form-control form-control-sm" id="editNameInput" value={newName}
                    onChange={e => setNewName(e.target.value)} autoFocus />
                  <button className="btn btn-ghost btn-sm" id="cancelNameBtn" onClick={() => setEditingName(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                  <button className="btn btn-primary btn-sm" id="saveNameBtn" onClick={handleSaveName} disabled={loading}>
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                  </button>
                </div>
              )}
            </div>
            <div className="settings-row">
              <div className="settings-row-label">
                <span className="lang-en">Email</span><span className="lang-bn">ইমেইল</span>
              </div>
              <span id="settingsEmailDisplay">{email}</span>
            </div>
          </div>

          <div className="settings-section">
            <h4 className="settings-section-title">
              <span className="lang-en">Security</span><span className="lang-bn">নিরাপত্তা</span>
            </h4>
            <button className="settings-action-btn" id="changePasswordBtn" onClick={onChangePassword}>
              <i className="fas fa-lock"></i>
              <span className="lang-en">Change Password</span><span className="lang-bn">পাসওয়ার্ড পরিবর্তন</span>
              <i className="fas fa-chevron-right ml-auto"></i>
            </button>
            <button className="settings-action-btn" id="changePinSettingBtn" onClick={onChangePin}>
              <i className="fas fa-key"></i>
              <span className="lang-en">Change PIN</span><span className="lang-bn">পিন পরিবর্তন</span>
              <i className="fas fa-chevron-right ml-auto"></i>
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            <span className="lang-en">Close</span><span className="lang-bn">বন্ধ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
}
