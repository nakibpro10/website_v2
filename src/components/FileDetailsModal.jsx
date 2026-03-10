import { getFileIcon, getFileTypeLabel, formatSize, formatDate } from '../utils';

export default function FileDetailsModal({ item, itemType, locationPath, onClose, onDownload, language }) {
  const t = (en, bn) => language === 'en' ? en : bn;
  const fileType = itemType === 'folder' ? 'folder' : 'file';
  const icon = getFileIcon(item?.name || '', itemType === 'folder');

  return (
    <div className="modal-overlay active" id="detailsModal">
      <div className="modal">
        <div className="modal-header">
          <h3><i className="fas fa-info-circle"></i> <span className="lang-en">File Details</span><span className="lang-bn">ফাইলের বিবরণ</span></h3>
          <button className="modal-close" id="closeDetailsModal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="details-header">
            <div className={`details-icon file-icon-wrapper ${fileType}`} id="detailsIcon">
              <i className={`fas ${icon}`}></i>
            </div>
            <div className="details-filename" id="detailsFilename">{item?.name}</div>
            <div className="details-type-badge" id="detailsTypeBadge">
              <i className={`fas ${icon}`}></i> {getFileTypeLabel(item?.name || '', itemType === 'folder', language)}
            </div>
          </div>
          <div className="details-info">
            <div className="details-row">
              <span className="details-label"><span className="lang-en">Size</span><span className="lang-bn">আকার</span></span>
              <span className="details-value" id="detailsSize">{itemType === 'folder' ? '—' : formatSize(item?.size || 0)}</span>
            </div>
            <div className="details-row">
              <span className="details-label"><span className="lang-en">Location</span><span className="lang-bn">অবস্থান</span></span>
              <span className="details-value" id="detailsLocation">{locationPath}</span>
            </div>
            <div className="details-row">
              <span className="details-label"><span className="lang-en">Created</span><span className="lang-bn">তৈরি</span></span>
              <span className="details-value" id="detailsCreated">{formatDate(item?.createdAt || item?.uploadDate, language)}</span>
            </div>
            <div className="details-row">
              <span className="details-label"><span className="lang-en">Modified</span><span className="lang-bn">পরিবর্তিত</span></span>
              <span className="details-value" id="detailsModified">{formatDate(item?.updatedAt || item?.uploadDate, language)}</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" id="detailsCloseBtn" onClick={onClose}>
            <span className="lang-en">Close</span><span className="lang-bn">বন্ধ করুন</span>
          </button>
          {itemType === 'file' && (
            <button className="btn btn-primary" id="detailsDownloadBtn" onClick={onDownload}>
              <i className="fas fa-download"></i>
              <span className="lang-en">Download</span><span className="lang-bn">ডাউনলোড</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
