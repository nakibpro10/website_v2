import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils';

const ADMIN_EMAILS = ['admin@nakibcloud.com', 'nakibpro1@gmail.com'];

export default function AdminPage({ currentUserEmail }) {
  const navigate = useNavigate();
  const onBack = () => navigate('/dashboard');
  const { showToast, language, toggleLanguage, toggleTheme, theme } = useApp();
  const t = (en, bn) => language === 'en' ? en : bn;

  const [activeTab, setActiveTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const isAdmin = ADMIN_EMAILS.includes(currentUserEmail);

  useEffect(() => {
    if (isAdmin) loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([loadPayments(), loadUsers()]);
    } finally { setLoading(false); }
  }

  async function loadPayments() {
    const q = query(collection(db, 'payments'), orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);
    setPayments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function loadUsers() {
    const snapshot = await getDocs(collection(db, 'users'));
    setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function approvePayment(payment) {
    setProcessingId(payment.id);
    try {
      await updateDoc(doc(db, 'payments', payment.id), { status: 'approved', approvedAt: new Date().toISOString() });
      await updateDoc(doc(db, 'users', payment.userId), {
        status: 'premium',
        storageLimit: parseInt(payment.storageGB),
        premiumSince: new Date().toISOString(),
        approvedPaymentId: payment.id,
      });
      setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'approved' } : p));
      setUsers(prev => prev.map(u => u.id === payment.userId ? { ...u, status: 'premium', storageLimit: parseInt(payment.storageGB) } : u));
      showToast(t('Payment approved!', 'পেমেন্ট অনুমোদিত!'), 'success');
    } catch (err) {
      showToast(t('Failed to approve', 'অনুমোদন করতে ব্যর্থ'), 'error');
    } finally { setProcessingId(null); }
  }

  async function rejectPayment(payment) {
    if (!confirm(t('Reject this payment?', 'এই পেমেন্ট প্রত্যাখ্যান করবেন?'))) return;
    setProcessingId(payment.id);
    try {
      await updateDoc(doc(db, 'payments', payment.id), { status: 'rejected', rejectedAt: new Date().toISOString() });
      await updateDoc(doc(db, 'users', payment.userId), { status: 'rejected' });
      setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'rejected' } : p));
      setUsers(prev => prev.map(u => u.id === payment.userId ? { ...u, status: 'rejected' } : u));
      showToast(t('Payment rejected', 'পেমেন্ট প্রত্যাখ্যাত'), 'warning');
    } catch (err) {
      showToast(t('Failed to reject', 'প্রত্যাখ্যান করতে ব্যর্থ'), 'error');
    } finally { setProcessingId(null); }
  }

  async function banUser(userId) {
    if (!confirm(t('Ban this user?', 'এই ব্যবহারকারীকে নিষিদ্ধ করবেন?'))) return;
    await updateDoc(doc(db, 'users', userId), { status: 'banned' });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'banned' } : u));
    showToast(t('User banned', 'ব্যবহারকারী নিষিদ্ধ হয়েছে'), 'warning');
  }

  async function unbanUser(userId) {
    await updateDoc(doc(db, 'users', userId), { status: 'trial' });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'trial' } : u));
    showToast(t('User unbanned', 'ব্যবহারকারীর নিষেধ তুলে দেওয়া হয়েছে'), 'success');
  }

  async function unlockUser(userId) {
    if (!confirm(t('Unlock this user\'s PIN?', 'এই ব্যবহারকারীর পিন আনলক করবেন?'))) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        pinAttempts: 0,
        pinLockedUntil: null,
        pinLockCount: 0,
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, pinAttempts: 0, pinLockedUntil: null, pinLockCount: 0 } : u));
      showToast(t('User PIN unlocked!', 'ব্যবহারকারীর পিন আনলক হয়েছে!'), 'success');
    } catch (err) {
      showToast(t('Failed to unlock', 'আনলক করতে ব্যর্থ'), 'error');
    }
  }

  async function giftPremium(userId, storageGB = 1024) {
    const gb = parseInt(prompt(t('Storage in GB:', 'স্টোরেজ জিবিতে:'), '1024'));
    if (!gb || isNaN(gb)) return;
    await updateDoc(doc(db, 'users', userId), {
      status: 'premium', storageLimit: gb, premiumSince: new Date().toISOString(), isPremiumGift: true,
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'premium', storageLimit: gb } : u));
    showToast(t(`Gifted ${gb} GB premium!`, `${gb} জিবি প্রিমিয়াম গিফট করা হয়েছে!`), 'success');
  }

  if (!isAdmin) {
    return (
      <div className="admin-page" id="adminPage">
        <div className="admin-access-denied">
          <i className="fas fa-ban"></i>
          <h2><span className="lang-en">Access Denied</span><span className="lang-bn">অ্যাক্সেস অস্বীকার</span></h2>
          <p><span className="lang-en">You do not have permission to access this page.</span><span className="lang-bn">আপনার এই পেজ অ্যাক্সেস করার অনুমতি নেই।</span></p>
          <button className="btn btn-primary" onClick={onBack}>
            <i className="fas fa-arrow-left"></i> <span className="lang-en">Go Back</span><span className="lang-bn">ফিরে যান</span>
          </button>
        </div>
      </div>
    );
  }

  const filteredPayments = payments.filter(p =>
    !searchQuery || p.email?.toLowerCase().includes(searchQuery.toLowerCase()) || p.trxId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    !searchQuery || u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="admin-page" id="adminPage">
      <div className="admin-header">
        <button className="back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
          <span className="lang-en">Back</span><span className="lang-bn">ফিরে যান</span>
        </button>
        <div className="admin-title">
          <i className="fas fa-shield-alt"></i>
          <h1><span className="lang-en">Admin Panel</span><span className="lang-bn">অ্যাডমিন প্যানেল</span></h1>
        </div>
        <div className="admin-header-controls">
          <button className="header-btn lang-toggle-btn" onClick={toggleLanguage}>
            <span className="lang-en" style={{ fontSize: '11px', fontWeight: 700 }}>বাং</span>
            <span className="lang-bn" style={{ fontSize: '11px', fontWeight: 700 }}>EN</span>
          </button>
          <button className="header-btn" onClick={toggleTheme}>
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <i className="fas fa-users"></i>
          <div><strong>{users.length}</strong><span><span className="lang-en">Total Users</span><span className="lang-bn">মোট ব্যবহারকারী</span></span></div>
        </div>
        <div className="admin-stat-card">
          <i className="fas fa-crown" style={{ color: 'var(--warning)' }}></i>
          <div><strong>{users.filter(u => u.status === 'premium').length}</strong><span><span className="lang-en">Premium Users</span><span className="lang-bn">প্রিমিয়াম ব্যবহারকারী</span></span></div>
        </div>
        <div className="admin-stat-card">
          <i className="fas fa-clock" style={{ color: 'var(--primary)' }}></i>
          <div><strong>{pendingPayments}</strong><span><span className="lang-en">Pending Payments</span><span className="lang-bn">অপেক্ষমান পেমেন্ট</span></span></div>
        </div>
        <div className="admin-stat-card">
          <i className="fas fa-hourglass-half" style={{ color: 'var(--success)' }}></i>
          <div><strong>{users.filter(u => u.status === 'trial').length}</strong><span><span className="lang-en">Trial Users</span><span className="lang-bn">ট্রায়াল ব্যবহারকারী</span></span></div>
        </div>
      </div>

      {/* Search */}
      <div className="admin-search">
        <i className="fas fa-search"></i>
        <input type="text" placeholder={t('Search by email or TrxID...', 'ইমেইল বা ট্রানজেকশন আইডি দিয়ে খুঁজুন...')}
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
          <i className="fas fa-credit-card"></i>
          <span className="lang-en">Payments</span><span className="lang-bn">পেমেন্ট</span>
          {pendingPayments > 0 && <span className="admin-tab-badge">{pendingPayments}</span>}
        </button>
        <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <i className="fas fa-users"></i>
          <span className="lang-en">Users</span><span className="lang-bn">ব্যবহারকারী</span>
        </button>
        <button className={`admin-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
          <i className="fas fa-shield-alt"></i>
          <span className="lang-en">Security</span><span className="lang-bn">সিকিউরিটি</span>
          {users.filter(u => (u.pinLockCount || 0) > 0 || (u.pinLockedUntil && new Date(u.pinLockedUntil) > new Date())).length > 0 && (
            <span className="admin-tab-badge">{users.filter(u => (u.pinLockCount || 0) > 0 || (u.pinLockedUntil && new Date(u.pinLockedUntil) > new Date())).length}</span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="spinner"></div></div>
      ) : (
        <div className="admin-content">
          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="admin-payments">
              {filteredPayments.length === 0 ? (
                <div className="admin-empty"><i className="fas fa-inbox"></i><p><span className="lang-en">No payments found</span><span className="lang-bn">কোনো পেমেন্ট পাওয়া যায়নি</span></p></div>
              ) : (
                <div className="admin-cards">
                  {filteredPayments.map(payment => (
                    <div key={payment.id} className={`admin-payment-card ${payment.status}`}>
                      <div className="admin-payment-info">
                        <div className="admin-payment-user">
                          <strong>{payment.displayName || 'User'}</strong>
                          <span>{payment.email}</span>
                        </div>
                        <div className="admin-payment-details">
                          <span className="admin-detail-item"><i className="fas fa-mobile-alt"></i> {payment.method}</span>
                          <span className="admin-detail-item"><i className="fas fa-receipt"></i> {payment.trxId}</span>
                          <span className="admin-detail-item"><i className="fas fa-taka-sign"></i> ৳{payment.amount}</span>
                          <span className="admin-detail-item"><i className="fas fa-hdd"></i> {parseInt(payment.storageGB) >= 1024 ? `${(parseInt(payment.storageGB)/1024).toFixed(0)} TB` : `${payment.storageGB} GB`}</span>
                          <span className="admin-detail-item"><i className="fas fa-calendar"></i> {formatDate(payment.timestamp, language)}</span>
                        </div>
                        <div className={`admin-status-badge ${payment.status}`}>
                          {payment.status === 'pending' && <><i className="fas fa-clock"></i> <span className="lang-en">Pending</span><span className="lang-bn">অপেক্ষমান</span></>}
                          {payment.status === 'approved' && <><i className="fas fa-check"></i> <span className="lang-en">Approved</span><span className="lang-bn">অনুমোদিত</span></>}
                          {payment.status === 'rejected' && <><i className="fas fa-times"></i> <span className="lang-en">Rejected</span><span className="lang-bn">প্রত্যাখ্যাত</span></>}
                        </div>
                      </div>
                      {payment.status === 'pending' && (
                        <div className="admin-payment-actions">
                          <button className="btn btn-success btn-sm" disabled={processingId === payment.id} onClick={() => approvePayment(payment)}>
                            {processingId === payment.id ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-check"></i> <span className="lang-en">Approve</span><span className="lang-bn">অনুমোদন</span></>}
                          </button>
                          <button className="btn btn-danger btn-sm" disabled={processingId === payment.id} onClick={() => rejectPayment(payment)}>
                            <i className="fas fa-times"></i> <span className="lang-en">Reject</span><span className="lang-bn">প্রত্যাখ্যান</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="admin-users">
              {filteredUsers.length === 0 ? (
                <div className="admin-empty"><i className="fas fa-users"></i><p><span className="lang-en">No users found</span><span className="lang-bn">কোনো ব্যবহারকারী পাওয়া যায়নি</span></p></div>
              ) : (
                <div className="admin-cards">
                  {filteredUsers.map(user => (
                    <div key={user.id} className={`admin-user-card ${user.status}`}>
                      <div className="admin-user-info">
                        <img className="admin-user-avatar"
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=667eea&color=fff`}
                          alt={user.displayName} />
                        <div>
                          <strong>{user.displayName || 'User'}</strong>
                          <span>{user.email}</span>
                          <div className={`admin-status-badge ${user.status}`}>
                            {user.status === 'premium' && <><i className="fas fa-crown"></i> Premium {user.storageLimit ? `(${user.storageLimit >= 1024 ? `${(user.storageLimit/1024).toFixed(0)} TB` : `${user.storageLimit} GB`})` : ''}</>}
                            {user.status === 'trial' && <><i className="fas fa-hourglass-half"></i> Trial</>}
                            {user.status === 'pending' && <><i className="fas fa-clock"></i> Pending</>}
                            {user.status === 'banned' && <><i className="fas fa-ban"></i> Banned</>}
                            {user.status === 'rejected' && <><i className="fas fa-times"></i> Rejected</>}
                          </div>
                        </div>
                      </div>
                      <div className="admin-user-actions">
                        {user.status !== 'banned' ? (
                          <button className="btn btn-warning btn-sm" onClick={() => banUser(user.id)}>
                            <i className="fas fa-ban"></i> <span className="lang-en">Ban</span><span className="lang-bn">নিষিদ্ধ</span>
                          </button>
                        ) : (
                          <button className="btn btn-success btn-sm" onClick={() => unbanUser(user.id)}>
                            <i className="fas fa-unlock"></i> <span className="lang-en">Unban</span><span className="lang-bn">নিষেধ তুলুন</span>
                          </button>
                        )}
                        <button className="btn btn-primary btn-sm" onClick={() => giftPremium(user.id)}>
                          <i className="fas fa-gift"></i> <span className="lang-en">Gift Premium</span><span className="lang-bn">প্রিমিয়াম গিফট</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="admin-security">
              {(() => {
                const lockedUsers = users.filter(u =>
                  (u.pinLockCount || 0) > 0 ||
                  (u.pinLockedUntil && new Date(u.pinLockedUntil) > new Date()) ||
                  (u.pinAttempts || 0) > 0
                );
                return lockedUsers.length === 0 ? (
                  <div className="admin-empty">
                    <i className="fas fa-shield-alt"></i>
                    <p><span className="lang-en">No locked or at-risk users</span><span className="lang-bn">কোনো লক বা ঝুঁকিপূর্ণ ব্যবহারকারী নেই</span></p>
                  </div>
                ) : (
                  <div className="admin-cards">
                    {lockedUsers.map(user => {
                      const isPermanent = (user.pinLockCount || 0) >= 3;
                      const isTempLocked = user.pinLockedUntil && new Date(user.pinLockedUntil) > new Date();
                      const lockStatus = isPermanent ? 'permanent' : isTempLocked ? 'temporary' : 'at-risk';
                      return (
                        <div key={user.id} className={`admin-user-card admin-security-card ${lockStatus}`}>
                          <div className="admin-user-info">
                            <img className="admin-user-avatar"
                              src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=667eea&color=fff`}
                              alt={user.displayName} />
                            <div>
                              <strong>{user.displayName || 'User'}</strong>
                              <span>{user.email}</span>
                              <div className="admin-security-info">
                                {isPermanent && (
                                  <span className="admin-lock-badge permanent">
                                    <i className="fas fa-ban"></i>
                                    <span className="lang-en">Permanently Locked</span>
                                    <span className="lang-bn">স্থায়ীভাবে লক</span>
                                  </span>
                                )}
                                {isTempLocked && !isPermanent && (
                                  <span className="admin-lock-badge temporary">
                                    <i className="fas fa-clock"></i>
                                    <span className="lang-en">Temporarily Locked</span>
                                    <span className="lang-bn">সাময়িকভাবে লক</span>
                                  </span>
                                )}
                                {!isPermanent && !isTempLocked && (user.pinAttempts || 0) > 0 && (
                                  <span className="admin-lock-badge at-risk">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <span className="lang-en">{user.pinAttempts} failed attempts</span>
                                    <span className="lang-bn">{user.pinAttempts} ভুল চেষ্টা</span>
                                  </span>
                                )}
                                <span className="admin-lock-detail">
                                  <span className="lang-en">Lock count: {user.pinLockCount || 0}/3</span>
                                  <span className="lang-bn">লক সংখ্যা: {user.pinLockCount || 0}/৩</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="admin-user-actions">
                            <button className="btn btn-unlock btn-sm" onClick={() => unlockUser(user.id)}>
                              <i className="fas fa-unlock-alt"></i>
                              <span className="lang-en">Unlock</span>
                              <span className="lang-bn">আনলক</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
