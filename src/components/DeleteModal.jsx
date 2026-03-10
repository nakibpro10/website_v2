import { useState } from 'react';
import { getFileIcon } from '../utils';

export default function DeleteModal({ itemId, itemType, itemName, isPermanent, onConfirm, onClose, language }) {
  const t = (en, bn) => language === 'en' ? en : bn;
  const [loading, setLoading] = useState(false);
  const icon = getFileIcon(itemName, itemType === 'folder');
  const fileType = itemType === 'folder' ? 'folder' : 'file';

  async function handleConfirm() {
    setLoading(true);
    try { await onConfirm(); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay active" id="deleteModal">
      <div className="modal modal-sm">
        <div className="modal-header">
          <h3 id="deleteTitle">
            {isPermanent ? (
              <><span className="lang-en">Delete Permanently?</span><span className="lang-bn">স্থায়ীভাবে মুছবেন?</span></>
            ) : (
              <><span className="lang-en">Move to Trash?</span><span className="lang-bn">ট্র্যাশে দেবেন?</span></>
            )}
          </h3>
          <button className="modal-close" id="closeDeleteModal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="delete-preview">
            <div className={`file-icon-wrapper ${fileType}`}>
              <i className={`fas ${icon}`}></i>
            </div>
            <div className="delete-filename" id="deleteFilename">{itemName}</div>
          </div>
          <p className="delete-warning" id="deleteWarning">
            {isPermanent ? (
              <><span className="lang-en">This action cannot be undone. The item will be permanently deleted.</span><span className="lang-bn">এই ক্রিয়া পূর্বাবস্থায় ফেরানো যাবে না। আইটেমটি স্থায়ীভাবে মুছে যাবে।</span></>
            ) : (
              <><span className="lang-en">The item will be moved to Trash and can be recovered later.</span><span className="lang-bn">আইটেমটি ট্র্যাশে যাবে এবং পরে পুনরুদ্ধার করা যাবে।</span></>
            )}
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" id="cancelDeleteBtn" onClick={onClose}>
            <span className="lang-en">Cancel</span><span className="lang-bn">বাতিল</span>
          </button>
          <button className="btn btn-danger" id="confirmDeleteBtn" onClick={handleConfirm} disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : (
              isPermanent ? (
                <><i className="fas fa-trash"></i> <span className="lang-en">Delete Permanently</span><span className="lang-bn">স্থায়ীভাবে মুছুন</span></>
              ) : (
                <><i className="fas fa-trash-alt"></i> <span className="lang-en">Move to Trash</span><span className="lang-bn">ট্র্যাশে দিন</span></>
              )
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
