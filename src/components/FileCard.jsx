import { getFileType, getFileIcon, formatSize, formatDate, truncateName, escapeHtml } from '../utils';
import { useApp } from '../context/AppContext';

export default function FileCard({ file, isSelected, view = 'grid', onSelect, onContextMenu, onDoubleClick }) {
  const { language } = useApp();
  const fileType = getFileType(file.name);
  const fileIcon = getFileIcon(file.name);

  function handleClick(e) {
    if (e.target.closest('.file-card-menu') || e.target.closest('.file-card-checkbox')) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      onSelect(file.id, true);
    } else {
      onSelect(file.id, false);
    }
  }

  function handleContextMenu(e) {
    e.preventDefault();
    onContextMenu(e, file.id, 'file');
  }

  if (view === 'list') {
    return (
      <div
        className={`file-card ${isSelected ? 'selected' : ''}`}
        data-id={file.id} data-type="file" data-name={file.name} data-filetype={fileType}
        onClick={handleClick}
        onDoubleClick={() => onDoubleClick(file.id, 'file')}
        onContextMenu={handleContextMenu}
      >
        <div className="file-card-checkbox" onClick={e => { e.stopPropagation(); onSelect(file.id, true); }}>
          {isSelected && <i className="fas fa-check"></i>}
        </div>
        <div className={`file-icon-wrapper ${fileType}`}>
          <i className={`fas ${fileIcon}`}></i>
        </div>
        <div className="file-info">
          <div className="file-name">{file.name}</div>
          <div className="file-date">{formatDate(file.uploadDate, language)}</div>
          <div className="file-size">{formatSize(file.size)}</div>
        </div>
        <button className="file-card-menu" onClick={e => { e.stopPropagation(); onContextMenu(e, file.id, 'file'); }}>
          <i className="fas fa-ellipsis-v"></i>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`file-card ${isSelected ? 'selected' : ''}`}
      data-id={file.id} data-type="file" data-name={file.name} data-filetype={fileType}
      onClick={handleClick}
      onDoubleClick={() => onDoubleClick(file.id, 'file')}
      onContextMenu={handleContextMenu}
    >
      <div className="file-card-checkbox" onClick={e => { e.stopPropagation(); onSelect(file.id, true); }}>
        {isSelected && <i className="fas fa-check"></i>}
      </div>
      <button className="file-card-menu" onClick={e => { e.stopPropagation(); onContextMenu(e, file.id, 'file'); }}>
        <i className="fas fa-ellipsis-v"></i>
      </button>
      <div className={`file-icon-wrapper ${fileType}`}>
        <i className={`fas ${fileIcon}`}></i>
      </div>
      <div className="file-name">{truncateName(file.name, 22)}</div>
      <div className="file-meta">
        <span>{formatSize(file.size)}</span>
        <span className="dot"></span>
        <span>{formatDate(file.uploadDate, language)}</span>
      </div>
      {file.isStarred && <i className="fas fa-star file-starred"></i>}
    </div>
  );
}
