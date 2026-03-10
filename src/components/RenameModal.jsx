import { useState } from 'react';
import { getFileIcon, getFileTypeLabel, formatSize, getFileType } from '../utils';

export default function RenameModal({ itemId, itemType, item, onConfirm, onClose, language }) {
  const t = (en, bn) => language === 'en' ? en : bn;
  const [name, setName] = useState(item?.name || '');
  const [loading, setLoading] = useState(false);

  const fileType = itemType === 'folder' ? 'folder' : (item?.name ? getFileType(item.name) : 'other');
  const fileIcon = getFileIcon(item?.name || '', itemType === 'folder');

  async function handleRename() {
    if (!name.trim()) return;
    setLoading(true);
    try { await onConfirm(name.trim()); }
    finally { setLoading(false); }
  }

  function handleInputRef(el) {
    if (el && item?.name) {
      setTimeout(() => {
        el.focus();
        if (itemType === 'file' && item.name.includes('.')) {
          const extIndex = item.name.lastIndexOf('.');
          el.setSelectionRange(0, extIndex);
        } else {
          el.select();
        }
      }, 100);
    }
  }

  return (
    <div className="modal-overlay active" id="renameModal">
      <div className="modal">
        <div className="modal-header">
          <h3><i className="fas fa-pencil-alt"></i> <span className="lang-en">Rename</span><span className="lang-bn">নাম পরিবর্তন</span></h3>
          <button className="modal-close" id="closeRenameModal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="rename-file-info" id="renameFileInfo" style={{ display: 'flex' }}>
            <div className={`rename-file-icon file-icon-wrapper ${fileType}`} id="renameFileIcon">
              <i className={`fas ${fileIcon}`}></i>
            </div>
            <div className="rename-file-details">
              <div id="renameFileType">{getFileTypeLabel(item?.name || '', itemType === 'folder', language)}</div>
              <div id="renameFileSize">{itemType === 'folder' ? '—' : formatSize(item?.size || 0)}</div>
            </div>
          </div>
          <div className="form-group">
            <label><span className="lang-en">Name</span><span className="lang-bn">নাম</span></label>
            <input type="text" className="form-control" id="renameInput" value={name}
              onChange={e => setName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleRename()}
              ref={handleInputRef} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" id="cancelRenameBtn" onClick={onClose}>
            <span className="lang-en">Cancel</span><span className="lang-bn">বাতিল</span>
          </button>
          <button className="btn btn-primary" id="confirmRenameBtn" onClick={handleRename} disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-check"></i> <span className="lang-en">Rename</span><span className="lang-bn">নাম পরিবর্তন</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
