import { formatDate, truncateName } from '../utils';
import { useApp } from '../context/AppContext';

export default function FolderCard({ folder, isSelected, view = 'grid', onSelect, onContextMenu, onDoubleClick }) {
  const { language } = useApp();

  function handleClick(e) {
    if (e.target.closest('.file-card-menu') || e.target.closest('.file-card-checkbox')) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      onSelect(folder.id, true);
    } else {
      onSelect(folder.id, false);
    }
  }

  if (view === 'list') {
    return (
      <div
        className={`file-card folder-card ${isSelected ? 'selected' : ''}`}
        data-id={folder.id} data-type="folder" data-name={folder.name}
        onClick={handleClick}
        onDoubleClick={() => onDoubleClick(folder.id, 'folder', folder.name)}
        onContextMenu={e => { e.preventDefault(); onContextMenu(e, folder.id, 'folder'); }}
      >
        <div className="file-card-checkbox" onClick={e => { e.stopPropagation(); onSelect(folder.id, true); }}>
          {isSelected && <i className="fas fa-check"></i>}
        </div>
        <div className="file-icon-wrapper folder">
          <i className="fas fa-folder"></i>
        </div>
        <div className="file-info">
          <div className="file-name">{folder.name}</div>
          <div className="file-date">{formatDate(folder.createdAt, language)}</div>
          <div className="file-size">—</div>
        </div>
        <button className="file-card-menu" onClick={e => { e.stopPropagation(); onContextMenu(e, folder.id, 'folder'); }}>
          <i className="fas fa-ellipsis-v"></i>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`file-card folder-card ${isSelected ? 'selected' : ''}`}
      data-id={folder.id} data-type="folder" data-name={folder.name}
      onClick={handleClick}
      onDoubleClick={() => onDoubleClick(folder.id, 'folder', folder.name)}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e, folder.id, 'folder'); }}
    >
      <div className="file-card-checkbox" onClick={e => { e.stopPropagation(); onSelect(folder.id, true); }}>
        {isSelected && <i className="fas fa-check"></i>}
      </div>
      <button className="file-card-menu" onClick={e => { e.stopPropagation(); onContextMenu(e, folder.id, 'folder'); }}>
        <i className="fas fa-ellipsis-v"></i>
      </button>
      <div className="file-icon-wrapper folder">
        <i className="fas fa-folder"></i>
      </div>
      <div className="file-name">{truncateName(folder.name, 22)}</div>
      <div className="file-meta">
        <span>{formatDate(folder.createdAt, language)}</span>
      </div>
      {folder.starred && <i className="fas fa-star file-starred"></i>}
    </div>
  );
}
