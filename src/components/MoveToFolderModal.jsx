import { useState } from 'react';
import { useFiles } from '../context/FileContext';

export default function MoveToFolderModal({ itemId, itemType, onConfirm, onClose, language }) {
  const { userFolders } = useFiles();
  const t = (en, bn) => language === 'en' ? en : bn;
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(false);

  const availableFolders = userFolders.filter(f => !f.trashed && f.id !== itemId);

  async function handleConfirm() {
    const destination = selectedFolder || 'root';
    setLoading(true);
    try { await onConfirm(destination); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay active" id="moveModal">
      <div className="modal">
        <div className="modal-header">
          <h3><i className="fas fa-folder-open"></i> <span className="lang-en">Move To</span><span className="lang-bn">সরান</span></h3>
          <button className="modal-close" id="closeMoveModal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="move-folder-list" id="moveFolderList">
            <div
              className={`move-folder-item ${selectedFolder === null ? 'selected' : ''}`}
              onClick={() => setSelectedFolder(null)}
              data-folder-id="root"
            >
              <i className="fas fa-home"></i>
              <span className="lang-en">My Files (Root)</span>
              <span className="lang-bn">আমার ফাইল (মূল)</span>
              {selectedFolder === null && <i className="fas fa-check ml-auto"></i>}
            </div>
            {availableFolders.map(folder => (
              <div
                key={folder.id}
                className={`move-folder-item ${selectedFolder === folder.id ? 'selected' : ''}`}
                onClick={() => setSelectedFolder(folder.id)}
                data-folder-id={folder.id}
              >
                <i className="fas fa-folder"></i>
                <span>{folder.name}</span>
                {selectedFolder === folder.id && <i className="fas fa-check ml-auto"></i>}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" id="cancelMoveBtn" onClick={onClose}>
            <span className="lang-en">Cancel</span><span className="lang-bn">বাতিল</span>
          </button>
          <button className="btn btn-primary" id="confirmMoveBtn" onClick={handleConfirm} disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-check"></i> <span className="lang-en">Move Here</span><span className="lang-bn">এখানে সরান</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
