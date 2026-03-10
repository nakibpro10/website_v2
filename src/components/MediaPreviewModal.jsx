import { useState, useEffect } from 'react';
import { getFileType, getFileIcon, escapeHtml } from '../utils';
import { useFiles } from '../context/FileContext';
import { useApp } from '../context/AppContext';

export default function MediaPreviewModal({ fileId, onClose, onDownload }) {
  const { getFilePreviewData } = useFiles();
  const { language } = useApp();
  const t = (en, bn) => language === 'en' ? en : bn;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [fileName, setFileName] = useState('');
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    loadPreview();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  async function loadPreview() {
    setLoading(true);
    setError(null);
    try {
      const { blob, file, fileInfo } = await getFilePreviewData(fileId);
      const name = fileInfo?.name || file?.name || 'file';
      setFileName(name);
      const url = URL.createObjectURL(blob);
      setObjectUrl(url);
      const fileType = getFileType(name);
      setPreviewContent({ type: fileType, url, blob, mimeType: file?.mimeType, name });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    onClose();
  }

  function renderPreview() {
    if (!previewContent) return null;
    const { type, url, blob, mimeType, name } = previewContent;
    switch (type) {
      case 'image':
        return <img src={url} className="preview-image" alt={name} />;
      case 'video':
        return <video className="preview-video" controls autoPlay><source src={url} type={mimeType || 'video/mp4'} /></video>;
      case 'audio':
        return (
          <div className="preview-audio">
            <div className="preview-audio-info">
              <div className="preview-audio-icon"><i className="fas fa-music"></i></div>
              <div className="preview-audio-name">{name}</div>
            </div>
            <audio controls autoPlay style={{ width: '100%' }}><source src={url} type={mimeType || 'audio/mpeg'} /></audio>
          </div>
        );
      case 'pdf':
        return <iframe src={url} className="preview-document" title={name}></iframe>;
      case 'code':
      case 'document':
        // Text preview will be set via TextDecoder
        return <TextPreview blob={blob} />;
      default:
        return (
          <div className="preview-unsupported">
            <div className="preview-unsupported-icon"><i className={`fas ${getFileIcon(name)}`}></i></div>
            <h3><span className="lang-en">Preview not available</span><span className="lang-bn">প্রিভিউ উপলব্ধ নয়</span></h3>
            <p><span className="lang-en">This file type cannot be previewed.</span><span className="lang-bn">এই ফাইল টাইপ প্রিভিউ করা যায় না।</span></p>
            <button className="btn btn-primary" onClick={onDownload}><i className="fas fa-download"></i> <span className="lang-en">Download</span><span className="lang-bn">ডাউনলোড</span></button>
          </div>
        );
    }
  }

  return (
    <div className="modal-overlay active preview-modal-overlay" id="previewModal">
      <div className="modal preview-modal">
        <div className="modal-header preview-header">
          <div className="preview-filename" id="previewFilename">
            <i className={`fas ${getFileIcon(fileName)}`}></i>
            <span>{fileName}</span>
          </div>
          <div className="preview-actions">
            <button className="btn btn-ghost btn-icon" id="previewDownloadBtn" onClick={onDownload} title={t('Download', 'ডাউনলোড')}>
              <i className="fas fa-download"></i>
            </button>
            <button className="modal-close" id="closePreviewModal" onClick={handleClose}>&times;</button>
          </div>
        </div>
        <div className="preview-body modal-body" id="previewBody">
          {loading && (
            <div className="preview-loading" id="previewLoading">
              <div className="spinner"></div>
              <p><span className="lang-en">Decrypting file...</span><span className="lang-bn">ফাইল ডিক্রিপ্ট হচ্ছে...</span></p>
            </div>
          )}
          {!loading && error && (
            <div className="preview-unsupported">
              <div className="preview-unsupported-icon"><i className="fas fa-exclamation-triangle"></i></div>
              <h3><span className="lang-en">Failed to load preview</span><span className="lang-bn">প্রিভিউ লোড করতে ব্যর্থ</span></h3>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={onDownload}><i className="fas fa-download"></i> <span className="lang-en">Download Instead</span><span className="lang-bn">ডাউনলোড করুন</span></button>
            </div>
          )}
          {!loading && !error && renderPreview()}
        </div>
      </div>
    </div>
  );
}

function TextPreview({ blob }) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (blob) blob.text().then(setText);
  }, [blob]);
  return <pre className="preview-text">{text}</pre>;
}
