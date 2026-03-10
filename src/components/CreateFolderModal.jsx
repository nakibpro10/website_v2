import { useState } from 'react';

export default function CreateFolderModal({ onConfirm, onClose, language }) {
  const t = (en, bn) => language === 'en' ? en : bn;
  const [name, setName] = useState(t('Untitled folder', 'নতুন ফোল্ডার'));
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    try { await onConfirm(name.trim()); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay active" id="folderModal">
      <div className="modal">
        <div className="modal-header">
          <h3><i className="fas fa-folder-plus"></i> <span className="lang-en">New Folder</span><span className="lang-bn">নতুন ফোল্ডার</span></h3>
          <button className="modal-close" id="closeFolderModal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label><span className="lang-en">Folder Name</span><span className="lang-bn">ফোল্ডারের নাম</span></label>
            <input type="text" className="form-control" id="folderNameInput" value={name}
              onChange={e => setName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleCreate()}
              autoFocus onFocus={e => e.target.select()} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" id="cancelFolderBtn" onClick={onClose}>
            <span className="lang-en">Cancel</span><span className="lang-bn">বাতিল</span>
          </button>
          <button className="btn btn-primary" id="createFolderBtn" onClick={handleCreate} disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-folder-plus"></i> <span className="lang-en">Create</span><span className="lang-bn">তৈরি করুন</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
