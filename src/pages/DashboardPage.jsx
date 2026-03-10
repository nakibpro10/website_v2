import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useFiles } from '../context/FileContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import FileCard from '../components/FileCard';
import FolderCard from '../components/FolderCard';
import ContextMenu, { TrashContextMenu } from '../components/ContextMenu';
import UploadPanel from '../components/UploadPanel';
import NewMenu from '../components/NewMenu';
import CreateFolderModal from '../components/CreateFolderModal';
import RenameModal from '../components/RenameModal';
import DeleteModal from '../components/DeleteModal';
import FileDetailsModal from '../components/FileDetailsModal';
import MediaPreviewModal from '../components/MediaPreviewModal';
import MoveToFolderModal from '../components/MoveToFolderModal';
import SupportModal from '../components/SupportModal';
import AccountSettingsModal from '../components/AccountSettingsModal';
import ChangePinModal from '../components/ChangePinModal';
import ResetPasswordModal from '../components/ResetPasswordModal';
import TosModal from '../components/TosModal';
import { TrialExpiredOverlay, PendingApprovalOverlay, PaymentNotApprovedOverlay, WaitingApprovalOverlay, PaymentRejectedOverlay, BannedOverlay } from '../components/StatusOverlays';
import { getFileType, getFileIcon, formatDate, formatSize, truncateName, sortItems, isTrialExpired, isPendingApprovalExpired, calculateDaysLeft } from '../utils';
import { PENDING_APPROVAL_DAYS } from '../config';

export default function DashboardPage() {
  const navigate = useNavigate();
  const onNavigateToSubscription = () => navigate('/subscription');
  const { language, showToast } = useApp();
  const { userData, currentUser, logout } = useAuth();
  const {
    userFiles, userFolders, trashFiles, trashFolders,
    loadFilesAndFolders,
    createFolder, renameFolder, renameFile,
    trashFolder, trashFile, restoreFolder, restoreFile,
    deleteFilePermanent, deleteFolderPermanent,
    toggleStar, moveItem, handleFileUpload, downloadFile,
  } = useFiles();
  const t = (en, bn) => language === 'en' ? en : bn;

  const [currentPage, setCurrentPage] = useState('home');
  const [currentPath, setCurrentPath] = useState('root');
  const [currentPathArray, setCurrentPathArray] = useState([{ id: 'root', name: 'My Files', nameBn: 'আমার ফাইল' }]);
  const [currentView, setCurrentView] = useState('grid');
  const [currentSort, setCurrentSort] = useState('name');
  const [currentSortOrder, setCurrentSortOrder] = useState('asc');
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState(null);
  const [trashContextMenu, setTrashContextMenu] = useState(null);

  // New Menu State
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [newMenuPos, setNewMenuPos] = useState({ x: 16, y: 120 });

  // Modal States
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [renameModal, setRenameModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  const [previewModal, setPreviewModal] = useState(null);
  const [moveModal, setMoveModal] = useState(null);
  const [showSupport, setShowSupport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showTos, setShowTos] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFolderSearch, setShowFolderSearch] = useState(false);

  // Status overlays
  const [overlay, setOverlay] = useState(null); // null, 'trial-expired', 'pending', 'payment-expired', 'waiting', 'rejected', 'banned'
  const [pendingDaysLeft, setPendingDaysLeft] = useState(0);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    checkUserStatus();
  }, [userData]);

  async function initialize() {
    setLoading(true);
    await loadFilesAndFolders();
    setLoading(false);
  }

  function checkUserStatus() {
    if (!userData) return;

    if (userData.status === 'banned') { setOverlay('banned'); return; }
    if (userData.status === 'premium') { setOverlay(null); return; }

    if (userData.status === 'pending') {
      const isRetry = userData.paymentHistory && userData.paymentHistory.length > 1;
      if (isRetry || !userData.pendingStartDate) {
        setOverlay('waiting');
      } else if (isPendingApprovalExpired(userData.pendingStartDate)) {
        setOverlay('payment-expired');
      } else {
        const days = calculateDaysLeft(userData.pendingStartDate, PENDING_APPROVAL_DAYS);
        setPendingDaysLeft(days);
        setOverlay('pending');
      }
      return;
    }

    if (userData.status === 'rejected') { setOverlay('rejected'); return; }

    if (userData.status === 'trial') {
      if (isTrialExpired(userData.trialStartDate || userData.createdAt)) {
        setOverlay('trial-expired');
        return;
      }
    }

    setOverlay(null);
  }

  function navigateToPage(page) {
    setCurrentPage(page);
    setSelectedItems([]);
    if (page !== 'my-files') {
      setCurrentPath('root');
      setCurrentPathArray([{ id: 'root', name: 'My Files', nameBn: 'আমার ফাইল' }]);
    }
    closeSidebar();
  }

  function navigateToFolder(folderId, folderName, folderNameBn = null) {
    if (folderId === 'root') {
      setCurrentPath('root');
      setCurrentPathArray([{ id: 'root', name: 'My Files', nameBn: 'আমার ফাইল' }]);
    } else {
      setCurrentPath(folderId);
      setCurrentPathArray(prev => {
        const existingIndex = prev.findIndex(p => p.id === folderId);
        if (existingIndex !== -1) return prev.slice(0, existingIndex + 1);
        return [...prev, { id: folderId, name: folderName, nameBn: folderNameBn || folderName }];
      });
    }
    setCurrentPage('my-files');
    setSelectedItems([]);
  }

  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('active');
    document.body.style.overflow = '';
  }

  function handleSelect(itemId, toggle) {
    if (toggle) {
      setSelectedItems(prev => prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]);
    } else {
      setSelectedItems([itemId]);
    }
  }

  function handleDoubleClick(itemId, type, name = '') {
    if (type === 'folder') {
      navigateToFolder(itemId, name);
    } else {
      setPreviewModal(itemId);
    }
  }

  function handleContextMenu(e, itemId, itemType) {
    e.preventDefault();
    const item = itemType === 'folder'
      ? userFolders.find(f => f.id === itemId)
      : userFiles.find(f => f.id === itemId);
    setContextMenu({ x: e.clientX, y: e.clientY, itemId, itemType, isStarred: item?.starred || item?.isStarred });
  }

  function handleContextMenuAction(action, itemId, itemType) {
    switch (action) {
      case 'open':
        const folder = userFolders.find(f => f.id === itemId);
        if (folder) navigateToFolder(itemId, folder.name);
        break;
      case 'preview':
        setPreviewModal(itemId);
        break;
      case 'download':
        const file = userFiles.find(f => f.id === itemId);
        if (file) downloadFile(itemId, file.name);
        break;
      case 'rename':
        const item = itemType === 'folder'
          ? userFolders.find(f => f.id === itemId)
          : userFiles.find(f => f.id === itemId);
        setRenameModal({ itemId, itemType, item });
        break;
      case 'move':
        setMoveModal({ itemId, itemType });
        break;
      case 'star':
        toggleStar(itemId, itemType).catch(err => showToast(err.message, 'error'));
        break;
      case 'details':
        const detailItem = itemType === 'folder'
          ? userFolders.find(f => f.id === itemId)
          : userFiles.find(f => f.id === itemId);
        setDetailsModal({ itemId, itemType, item: detailItem });
        break;
      case 'trash':
        const trashItem = itemType === 'folder'
          ? userFolders.find(f => f.id === itemId)
          : userFiles.find(f => f.id === itemId);
        setDeleteModal({ itemId, itemType, itemName: trashItem?.name || 'item', isPermanent: false });
        break;
    }
  }

  function handleTrashContextAction(action, itemId, isFolder) {
    if (action === 'restore') {
      const restore = isFolder ? restoreFolder : restoreFile;
      restore(itemId)
        .then(() => showToast(t('Restored successfully', 'পুনরুদ্ধার সফল'), 'success'))
        .catch(err => showToast(err.message, 'error'));
    } else if (action === 'delete-permanent') {
      const item = isFolder ? trashFolders.find(f => f.id === itemId) : trashFiles.find(f => f.id === itemId);
      setDeleteModal({ itemId, itemType: isFolder ? 'folder' : 'file', itemName: item?.name || 'item', isPermanent: true });
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteModal) return;
    const { itemId, itemType, isPermanent } = deleteModal;
    try {
      if (isPermanent) {
        if (itemType === 'folder') await deleteFolderPermanent(itemId);
        else await deleteFilePermanent(itemId);
        showToast(t('Deleted permanently', 'স্থায়ীভাবে মুছে গেছে'), 'success');
      } else {
        if (itemType === 'folder') await trashFolder(itemId);
        else await trashFile(itemId);
        showToast(t('Moved to Trash', 'ট্র্যাশে গেছে'), 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setDeleteModal(null); }
  }

  async function handleCreateFolder(name) {
    // Check for duplicate
    const existing = userFolders.find(f =>
      f.name.toLowerCase() === name.toLowerCase() &&
      (f.parentId || 'root') === currentPath && !f.trashed
    );
    if (existing) { showToast(t('A folder with this name already exists', 'এই নামে একটি ফোল্ডার ইতিমধ্যে আছে'), 'error'); return; }
    await createFolder(name, currentPath);
    showToast(t('Folder created successfully', 'ফোল্ডার সফলভাবে তৈরি হয়েছে'), 'success');
    setShowCreateFolder(false);
  }

  async function handleRename(newName) {
    if (!renameModal) return;
    const { itemId, itemType } = renameModal;
    try {
      if (itemType === 'folder') await renameFolder(itemId, newName);
      else await renameFile(itemId, newName);
      showToast(t('Renamed successfully', 'নাম পরিবর্তন সফল'), 'success');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setRenameModal(null); }
  }

  async function handleMove(destinationId) {
    if (!moveModal) return;
    try {
      await moveItem(moveModal.itemId, moveModal.itemType, destinationId);
      showToast(t('Moved successfully', 'সফলভাবে সরানো হয়েছে'), 'success');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setMoveModal(null); }
  }

  // Get items for current view
  function getFilteredItems() {
    let folders = [];
    let files = [];

    switch (currentPage) {
      case 'home':
      case 'my-files':
        folders = userFolders.filter(f => (f.parentId || 'root') === currentPath && !f.trashed);
        files = userFiles.filter(f => (f.folderId || 'root') === currentPath && !f.trashed);
        break;
      case 'recent':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        files = userFiles.filter(f => {
          const d = new Date(f.uploadDate || f.createdAt);
          return d >= sevenDaysAgo && !f.trashed;
        }).sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        break;
      case 'starred':
        folders = userFolders.filter(f => f.starred && !f.trashed);
        files = userFiles.filter(f => f.isStarred && !f.trashed);
        break;
      case 'images': case 'videos': case 'audio': case 'documents':
        files = userFiles.filter(f => {
          const type = getFileType(f.name);
          if (currentPage === 'documents') return ['document', 'pdf', 'spreadsheet', 'presentation'].includes(type) && !f.trashed;
          return type === currentPage.slice(0, -1) && !f.trashed;
        });
        break;
    }

    if (searchQuery) {
      folders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
      files = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (folderSearchQuery) {
      folders = folders.filter(f => f.name.toLowerCase().includes(folderSearchQuery.toLowerCase()));
      files = files.filter(f => f.name.toLowerCase().includes(folderSearchQuery.toLowerCase()));
    }

    // Sort
    const sortedFolders = sortItemsBy(folders);
    const sortedFiles = sortItemsBy(files);
    return { folders: sortedFolders, files: sortedFiles };
  }

  function sortItemsBy(items) {
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (currentSort) {
        case 'name': cmp = (a.name || '').localeCompare(b.name || ''); break;
        case 'date': cmp = new Date(b.uploadDate || b.createdAt || 0) - new Date(a.uploadDate || a.createdAt || 0); break;
        case 'size': cmp = (b.size || 0) - (a.size || 0); break;
        case 'type': cmp = (a.isFolder ? 'folder' : getFileType(a.name)).localeCompare(b.isFolder ? 'folder' : getFileType(b.name)); break;
      }
      return currentSortOrder === 'desc' ? -cmp : cmp;
    });
  }

  const { folders: displayFolders, files: displayFiles } = currentPage !== 'trash' ? getFilteredItems() : { folders: [], files: [] };
  const totalCount = displayFolders.length + displayFiles.length;
  const trashItems = [...trashFolders, ...trashFiles].sort((a, b) => new Date(b.trashedAt || 0) - new Date(a.trashedAt || 0));

  const pageTitles = {
    en: { home: 'Home', 'my-files': 'My Files', recent: 'Recent', starred: 'Starred', images: 'Images', videos: 'Videos', audio: 'Audio', documents: 'Documents', trash: 'Trash' },
    bn: { home: 'হোম', 'my-files': 'আমার ফাইল', recent: 'সাম্প্রতিক', starred: 'তারকাচিহ্নিত', images: 'ছবি', videos: 'ভিডিও', audio: 'অডিও', documents: 'ডকুমেন্ট', trash: 'ট্র্যাশ' },
  };

  function handleNewMenuOpen(e) {
    e.stopPropagation();
    const btn = document.getElementById('newUploadBtn');
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setNewMenuPos({ x: rect.left, y: rect.bottom + 8 });
    }
    setNewMenuOpen(true);
  }

  return (
    <div className="dashboard" id="dashboardPage">
      {/* Status Overlays */}
      {overlay === 'trial-expired' && <TrialExpiredOverlay onSubscribe={() => { setOverlay(null); onNavigateToSubscription(); }} />}
      {overlay === 'pending' && <PendingApprovalOverlay daysLeft={pendingDaysLeft} onContinue={() => setOverlay(null)} />}
      {overlay === 'payment-expired' && <PaymentNotApprovedOverlay onSubscribe={() => { setOverlay(null); onNavigateToSubscription(); }} />}
      {overlay === 'waiting' && <WaitingApprovalOverlay onSubscribeAgain={() => { setOverlay(null); onNavigateToSubscription(); }} />}
      {overlay === 'rejected' && <PaymentRejectedOverlay onSubscribe={() => { setOverlay(null); onNavigateToSubscription(); }} />}
      {overlay === 'banned' && <BannedOverlay onLogout={logout} />}

      <div className="sidebar-overlay" id="sidebarOverlay" onClick={closeSidebar}></div>

      <Sidebar
        currentPage={currentPage}
        onNavigate={navigateToPage}
        onUpgrade={onNavigateToSubscription}
        onNewUpload={handleNewMenuOpen}
      />

      <div className="main-content">
        <Header
          onMenuToggle={() => {
            document.getElementById('sidebar')?.classList.add('open');
            document.getElementById('sidebarOverlay')?.classList.add('active');
            document.body.style.overflow = 'hidden';
          }}
          onSubscription={onNavigateToSubscription}
          onSettings={() => setShowSettings(true)}
          onChangePin={() => setShowChangePin(true)}
          onSupport={() => setShowSupport(true)}
          onTos={() => setShowTos(true)}
        />

        <div className="content-area" id="contentArea"
          onDragOver={e => { e.preventDefault(); document.getElementById('dropZoneOverlay')?.classList.add('active'); }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) document.getElementById('dropZoneOverlay')?.classList.remove('active'); }}
          onDrop={async e => {
            e.preventDefault();
            document.getElementById('dropZoneOverlay')?.classList.remove('active');
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) await handleFileUpload(files, currentPath);
          }}>

          {/* Drop Zone */}
          <div className="drop-zone-overlay" id="dropZoneOverlay">
            <div className="drop-zone-content">
              <i className="fas fa-cloud-upload-alt"></i>
              <h3><span className="lang-en">Drop files to upload</span><span className="lang-bn">ফাইল ড্রপ করুন আপলোড করতে</span></h3>
            </div>
          </div>

          {/* Breadcrumb */}
          {(currentPage === 'home' || currentPage === 'my-files') && (
            <div className="breadcrumb" id="breadcrumb">
              {currentPathArray.map((path, index) => (
                <span key={path.id}>
                  {index > 0 && <i className="fas fa-chevron-right breadcrumb-separator"></i>}
                  <a href="#"
                    className={`breadcrumb-item ${index === currentPathArray.length - 1 ? 'active' : ''}`}
                    onClick={e => { e.preventDefault(); if (index !== currentPathArray.length - 1) navigateToFolder(path.id, path.name, path.nameBn); }}>
                    {index === 0 && <i className="fas fa-home"></i>}
                    <span className="lang-en"> {path.name}</span>
                    <span className="lang-bn"> {path.nameBn || path.name}</span>
                  </a>
                </span>
              ))}
            </div>
          )}

          {/* Content Header */}
          <div className="content-header">
            <div className="content-title-section">
              <h1 className="content-title" id="contentTitle">
                <span className="lang-en">{pageTitles.en[currentPage] || 'My Files'}</span>
                <span className="lang-bn">{pageTitles.bn[currentPage] || 'আমার ফাইল'}</span>
              </h1>
              <span className="content-count" id="contentCount">
                {currentPage === 'trash'
                  ? (language === 'en' ? `${trashItems.length} item${trashItems.length !== 1 ? 's' : ''}` : `${trashItems.length}টি আইটেম`)
                  : (language === 'en' ? `${totalCount} item${totalCount !== 1 ? 's' : ''}` : `${totalCount}টি আইটেম`)
                }
              </span>
            </div>
            <div className="content-actions">
              {/* Folder Search */}
              <button className="folder-search-btn" id="folderSearchBtn" title="Search in folder" onClick={() => setShowFolderSearch(!showFolderSearch)}>
                <i className="fas fa-search"></i>
              </button>
              {showFolderSearch && (
                <div className="folder-search-wrapper active" id="folderSearchWrapper">
                  <i className="fas fa-search"></i>
                  <input type="text" id="folderSearchInput" placeholder={t('Search in this folder...', 'এই ফোল্ডারে খুঁজুন...')}
                    value={folderSearchQuery} onChange={e => setFolderSearchQuery(e.target.value)} autoFocus />
                  <button className="folder-search-close" id="folderSearchClose" onClick={() => { setShowFolderSearch(false); setFolderSearchQuery(''); }}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}

              {/* Sort */}
              <div className="sort-dropdown" id="sortDropdown">
                <button className="sort-btn" id="sortBtn" onClick={() => setShowSortMenu(!showSortMenu)}>
                  <i className="fas fa-sort-amount-down sort-icon"></i>
                  <span className="lang-en">Sort</span><span className="lang-bn">সাজান</span>
                  <i className="fas fa-chevron-down chevron"></i>
                </button>
                {showSortMenu && (
                  <div className="sort-menu active" id="sortMenu">
                    {[['name', 'fa-font', 'Name', 'নাম'], ['date', 'fa-calendar', 'Date Modified', 'পরিবর্তনের তারিখ'], ['size', 'fa-weight', 'Size', 'আকার'], ['type', 'fa-shapes', 'Type', 'ধরন']].map(([sort, icon, en, bn]) => (
                      <div key={sort} className={`sort-option ${currentSort === sort ? 'active' : ''}`} data-sort={sort}
                        onClick={() => { setCurrentSort(sort); setShowSortMenu(false); }}>
                        <i className={`fas ${icon}`}></i>
                        <span className="lang-en">{en}</span><span className="lang-bn">{bn}</span>
                        {currentSort === sort && <i className="fas fa-check check-icon"></i>}
                      </div>
                    ))}
                    <div className="sort-divider"></div>
                    <div className={`sort-option ${currentSortOrder === 'asc' ? 'active' : ''}`}
                      onClick={() => { setCurrentSortOrder('asc'); setShowSortMenu(false); }}>
                      <i className="fas fa-sort-amount-up"></i>
                      <span className="lang-en">Ascending</span><span className="lang-bn">আরোহী</span>
                      {currentSortOrder === 'asc' && <i className="fas fa-check check-icon"></i>}
                    </div>
                    <div className={`sort-option ${currentSortOrder === 'desc' ? 'active' : ''}`}
                      onClick={() => { setCurrentSortOrder('desc'); setShowSortMenu(false); }}>
                      <i className="fas fa-sort-amount-down"></i>
                      <span className="lang-en">Descending</span><span className="lang-bn">অবরোহী</span>
                      {currentSortOrder === 'desc' && <i className="fas fa-check check-icon"></i>}
                    </div>
                  </div>
                )}
              </div>

              {/* View Toggle */}
              <div className="view-toggle">
                <button className={`view-btn ${currentView === 'grid' ? 'active' : ''}`} id="gridViewBtn" onClick={() => setCurrentView('grid')}>
                  <i className="fas fa-th"></i>
                </button>
                <button className={`view-btn ${currentView === 'list' ? 'active' : ''}`} id="listViewBtn" onClick={() => setCurrentView('list')}>
                  <i className="fas fa-list"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Trash Banner */}
          {currentPage === 'trash' && trashItems.length > 0 && (
            <div className="trash-info-banner" id="trashInfoBanner">
              <i className="fas fa-info-circle"></i>
              <span className="lang-en">Items in Trash will be automatically deleted after 30 days.</span>
              <span className="lang-bn">ট্র্যাশের আইটেম ৩০ দিন পর স্বয়ংক্রিয়ভাবে মুছে যাবে।</span>
              <button className="btn btn-ghost btn-sm" onClick={async () => {
                if (!confirm(t('Empty trash? This cannot be undone.', 'ট্র্যাশ খালি করবেন? এটি পূর্বাবস্থায় ফেরানো যাবে না।'))) return;
                await Promise.all([
                  ...trashFiles.map(f => deleteFilePermanent(f.id)),
                  ...trashFolders.map(f => deleteFolderPermanent(f.id)),
                ]);
                showToast(t('Trash emptied', 'ট্র্যাশ খালি হয়েছে'), 'success');
              }}>
                <span className="lang-en">Empty Trash</span><span className="lang-bn">ট্র্যাশ খালি করুন</span>
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="loading-state" id="loadingState">
              <div className="spinner"></div>
              <p><span className="lang-en">Loading...</span><span className="lang-bn">লোড হচ্ছে...</span></p>
            </div>
          )}

          {/* Files Container - Trash */}
          {!loading && currentPage === 'trash' && (
            <>
              {trashItems.length === 0 ? (
                <div className="empty-state" id="trashEmptyState">
                  <div className="empty-state-icon"><i className="fas fa-trash-alt"></i></div>
                  <h3><span className="lang-en">Trash is Empty</span><span className="lang-bn">ট্র্যাশ খালি</span></h3>
                  <p><span className="lang-en">No items in trash</span><span className="lang-bn">ট্র্যাশে কোনো আইটেম নেই</span></p>
                </div>
              ) : (
                <div className={`files-container ${currentView === 'list' ? 'list-view' : ''}`} id="filesContainer">
                  {trashItems.map(item => {
                    const isFolder = item.isFolder;
                    const fileType = isFolder ? 'folder' : getFileType(item.name);
                    const fileIcon = getFileIcon(item.name, isFolder);
                    if (currentView === 'grid') {
                      return (
                        <div key={item.id} className={`file-card ${isFolder ? 'folder-card' : ''}`}
                          data-id={item.id} data-type={isFolder ? 'folder' : 'file'} data-name={item.name} data-trash="true"
                          onContextMenu={e => { e.preventDefault(); setTrashContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id, isFolder }); }}>
                          <button className="file-card-menu" onClick={e => { e.stopPropagation(); setTrashContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id, isFolder }); }}>
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                          <div className={`file-icon-wrapper ${fileType}`} style={{ opacity: 0.6 }}>
                            <i className={`fas ${fileIcon}`}></i>
                          </div>
                          <div className="file-name" style={{ opacity: 0.7 }}>{truncateName(item.name, 22)}</div>
                          <div className="file-meta">
                            <span className="lang-en">Deleted {formatDate(item.trashedAt, 'en')}</span>
                            <span className="lang-bn">মুছা হয়েছে {formatDate(item.trashedAt, 'bn')}</span>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={item.id} className={`file-card ${isFolder ? 'folder-card' : ''}`}
                          data-id={item.id} data-type={isFolder ? 'folder' : 'file'} data-name={item.name} data-trash="true"
                          onContextMenu={e => { e.preventDefault(); setTrashContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id, isFolder }); }}>
                          <div className={`file-icon-wrapper ${fileType}`} style={{ opacity: 0.6 }}>
                            <i className={`fas ${fileIcon}`}></i>
                          </div>
                          <div className="file-info">
                            <div className="file-name" style={{ opacity: 0.7 }}>{item.name}</div>
                            <div className="file-date">
                              <span className="lang-en">Deleted {formatDate(item.trashedAt, 'en')}</span>
                              <span className="lang-bn">মুছা হয়েছে {formatDate(item.trashedAt, 'bn')}</span>
                            </div>
                            <div className="file-size">{isFolder ? '—' : formatSize(item.size)}</div>
                          </div>
                          <button className="file-card-menu" onClick={e => { e.stopPropagation(); setTrashContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id, isFolder }); }}>
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </>
          )}

          {/* Files Container - Normal */}
          {!loading && currentPage !== 'trash' && (
            <>
              {totalCount === 0 ? (
                <div className="empty-state" id="emptyState">
                  <div className="empty-state-icon">
                    <i className={`fas ${currentPage === 'starred' ? 'fa-star' : currentPage === 'recent' ? 'fa-clock' : 'fa-cloud-upload-alt'}`}></i>
                  </div>
                  <h3>
                    <span className="lang-en">{currentPage === 'starred' ? 'No starred files' : currentPage === 'recent' ? 'No recent files' : 'No files yet'}</span>
                    <span className="lang-bn">{currentPage === 'starred' ? 'কোনো তারকাচিহ্নিত ফাইল নেই' : currentPage === 'recent' ? 'সাম্প্রতিক কোনো ফাইল নেই' : 'এখনো কোনো ফাইল নেই'}</span>
                  </h3>
                  {currentPage === 'home' || currentPage === 'my-files' ? (
                    <p>
                      <span className="lang-en">Upload your first file to get started</span>
                      <span className="lang-bn">শুরু করতে আপনার প্রথম ফাইল আপলোড করুন</span>
                    </p>
                  ) : null}
                  {(currentPage === 'home' || currentPage === 'my-files') && (
                    <button className="btn btn-primary" id="emptyUploadBtn" onClick={() => fileInputRef.current?.click()}>
                      <i className="fas fa-upload"></i>
                      <span className="lang-en">Upload Files</span><span className="lang-bn">ফাইল আপলোড করুন</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className={`files-container ${currentView === 'list' ? 'list-view' : ''}`} id="filesContainer">
                  {displayFolders.map(folder => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      isSelected={selectedItems.includes(folder.id)}
                      view={currentView}
                      onSelect={handleSelect}
                      onContextMenu={handleContextMenu}
                      onDoubleClick={(id, type, name) => handleDoubleClick(id, type, folder.name)}
                    />
                  ))}
                  {displayFiles.map(file => (
                    <FileCard
                      key={file.id}
                      file={file}
                      isSelected={selectedItems.includes(file.id)}
                      view={currentView}
                      onSelect={handleSelect}
                      onContextMenu={handleContextMenu}
                      onDoubleClick={handleDoubleClick}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input type="file" id="fileInput" ref={fileInputRef} multiple style={{ display: 'none' }}
        onChange={async e => {
          const files = Array.from(e.target.files);
          if (files.length) await handleFileUpload(files, currentPath);
          e.target.value = '';
        }} />
      <input type="file" id="folderInput" ref={folderInputRef} multiple webkitdirectory="" style={{ display: 'none' }}
        onChange={async e => {
          const files = Array.from(e.target.files);
          if (files.length) await handleFileUpload(files, currentPath);
          e.target.value = '';
        }} />

      {/* Context Menus */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          itemId={contextMenu.itemId} itemType={contextMenu.itemType} isStarred={contextMenu.isStarred}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}
      {trashContextMenu && (
        <TrashContextMenu
          x={trashContextMenu.x} y={trashContextMenu.y}
          itemId={trashContextMenu.itemId} isFolder={trashContextMenu.isFolder}
          onAction={handleTrashContextAction}
          onClose={() => setTrashContextMenu(null)}
        />
      )}

      {/* New Menu */}
      {newMenuOpen && (
        <NewMenu
          position={newMenuPos}
          onUploadFiles={() => fileInputRef.current?.click()}
          onUploadFolder={() => folderInputRef.current?.click()}
          onNewFolder={() => setShowCreateFolder(true)}
          onClose={() => setNewMenuOpen(false)}
        />
      )}

      {/* Upload Panel */}
      <UploadPanel />

      {/* Modals */}
      {showCreateFolder && (
        <CreateFolderModal
          onConfirm={handleCreateFolder}
          onClose={() => setShowCreateFolder(false)}
          language={language}
        />
      )}
      {renameModal && (
        <RenameModal
          itemId={renameModal.itemId}
          itemType={renameModal.itemType}
          item={renameModal.item}
          onConfirm={handleRename}
          onClose={() => setRenameModal(null)}
          language={language}
        />
      )}
      {deleteModal && (
        <DeleteModal
          itemId={deleteModal.itemId}
          itemType={deleteModal.itemType}
          itemName={deleteModal.itemName}
          isPermanent={deleteModal.isPermanent}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteModal(null)}
          language={language}
        />
      )}
      {detailsModal && (
        <FileDetailsModal
          item={detailsModal.item}
          itemType={detailsModal.itemType}
          locationPath={currentPathArray.map(p => language === 'en' ? p.name : (p.nameBn || p.name)).join(' / ')}
          onClose={() => setDetailsModal(null)}
          onDownload={() => { if (detailsModal.item) { downloadFile(detailsModal.item.id, detailsModal.item.name); setDetailsModal(null); } }}
          language={language}
        />
      )}
      {previewModal && (
        <MediaPreviewModal
          fileId={previewModal}
          onClose={() => setPreviewModal(null)}
          onDownload={() => {
            const file = userFiles.find(f => f.id === previewModal);
            if (file) downloadFile(previewModal, file.name);
          }}
        />
      )}
      {moveModal && (
        <MoveToFolderModal
          itemId={moveModal.itemId}
          itemType={moveModal.itemType}
          onConfirm={handleMove}
          onClose={() => setMoveModal(null)}
          language={language}
        />
      )}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      {showSettings && (
        <AccountSettingsModal
          onClose={() => setShowSettings(false)}
          onChangePin={() => { setShowSettings(false); setShowChangePin(true); }}
          onChangePassword={() => { setShowSettings(false); setShowResetPassword(true); }}
        />
      )}
      {showChangePin && <ChangePinModal onClose={() => setShowChangePin(false)} />}
      {showResetPassword && <ResetPasswordModal initialEmail={currentUser?.email || ''} onClose={() => setShowResetPassword(false)} />}
      {showTos && <TosModal onClose={() => setShowTos(false)} />}
    </div>
  );
}
