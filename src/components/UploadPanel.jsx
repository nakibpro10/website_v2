import { useState } from 'react';
import { useFiles } from '../context/FileContext';
import { getFileIcon, truncateName } from '../utils';

export default function UploadPanel() {
  const { uploadQueue, cancelUpload, uploadPanelActive } = useFiles();
  const [minimized, setMinimized] = useState(false);

  if (!uploadPanelActive) return null;

  const pendingCount = uploadQueue.filter(i => i.status === 'pending' || i.status === 'uploading').length;

  return (
    <div className={`upload-panel active ${minimized ? 'minimized' : ''}`} id="uploadPanel">
      <div className="upload-panel-header">
        <div className="upload-panel-title-wrapper">
          <span id="uploadPanelTitle">
            {pendingCount > 0 ? (
              <><span className="lang-en">Uploading</span><span className="lang-bn">আপলোড হচ্ছে</span></>
            ) : (
              <><span className="lang-en">Complete</span><span className="lang-bn">সম্পন্ন</span></>
            )}
          </span>
          <span id="uploadPanelCount">({pendingCount})</span>
        </div>
        <div className="upload-panel-actions">
          <button id="uploadPanelMinimize" onClick={() => setMinimized(!minimized)}>
            <i className={`fas ${minimized ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
          </button>
          <button id="uploadPanelClose" onClick={() => {
            uploadQueue.forEach(i => cancelUpload(i.id));
          }}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      {!minimized && (
        <div className="upload-panel-body" id="uploadPanelBody">
          {uploadQueue.map(item => (
            <div className="upload-item" key={item.id} id={item.id}>
              <div className={`upload-item-icon ${item.status === 'uploading' ? 'uploading' : item.status === 'completed' ? 'success' : item.status === 'error' ? 'error' : ''}`}>
                <i className={`fas ${getFileIcon(item.file?.name || '')}`}></i>
              </div>
              <div className="upload-item-info">
                <div className="upload-item-name">{truncateName(item.file?.name || '', 35)}</div>
                <div className="upload-item-progress">
                  <div
                    className="upload-item-progress-bar"
                    id={`${item.id}_progress`}
                    style={{
                      width: `${item.progress || 0}%`,
                      background: item.status === 'error' ? 'var(--danger)' : undefined
                    }}
                  ></div>
                </div>
                <div className={`upload-item-status ${item.status === 'completed' ? 'success' : item.status === 'error' ? 'error' : ''}`} id={`${item.id}_status`}>
                  {item.statusText || (item.status === 'pending' ? (
                    <><span className="lang-en">Waiting...</span><span className="lang-bn">অপেক্ষা করছে...</span></>
                  ) : item.status === 'completed' ? (
                    <><span className="lang-en">Complete</span><span className="lang-bn">সম্পন্ন</span></>
                  ) : item.status === 'error' ? (
                    <><span className="lang-en">Failed</span><span className="lang-bn">ব্যর্থ</span></>
                  ) : item.status === 'cancelled' ? (
                    <><span className="lang-en">Cancelled</span><span className="lang-bn">বাতিল</span></>
                  ) : (
                    <><span className="lang-en">Uploading...</span><span className="lang-bn">আপলোড হচ্ছে...</span></>
                  ))}
                </div>
              </div>
              <button className="upload-item-action" title="Cancel" onClick={() => cancelUpload(item.id)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
