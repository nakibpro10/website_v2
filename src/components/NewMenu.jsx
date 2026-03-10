import { useEffect, useRef } from 'react';

export default function NewMenu({ position, onUploadFiles, onUploadFolder, onNewFolder, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    }
    setTimeout(() => document.addEventListener('click', handleClick), 10);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div className="new-menu active" id="newMenu" ref={menuRef}
      style={{ left: position?.x || 16, top: position?.y || 120 }}>
      <button className="new-menu-item" id="uploadFilesBtn" onClick={() => { onClose(); onUploadFiles(); }}>
        <i className="fas fa-file-upload"></i>
        <span className="lang-en">Upload Files</span>
        <span className="lang-bn">ফাইল আপলোড করুন</span>
      </button>
      <button className="new-menu-item" id="uploadFolderBtn" onClick={() => { onClose(); onUploadFolder(); }}>
        <i className="fas fa-folder-plus"></i>
        <span className="lang-en">Upload Folder</span>
        <span className="lang-bn">ফোল্ডার আপলোড করুন</span>
      </button>
      <div className="new-menu-divider"></div>
      <button className="new-menu-item" id="newFolderBtn" onClick={() => { onClose(); onNewFolder(); }}>
        <i className="fas fa-folder-plus"></i>
        <span className="lang-en">New Folder</span>
        <span className="lang-bn">নতুন ফোল্ডার</span>
      </button>
    </div>
  );
}
