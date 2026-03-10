import { useEffect, useRef } from 'react';

export default function ContextMenu({ x, y, itemId, itemType, isStarred, onAction, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick() { onClose(); }
    document.addEventListener('click', handleClick);
    document.addEventListener('contextmenu', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleClick);
    };
  }, [onClose]);

  function action(act) {
    onClose();
    onAction(act, itemId, itemType);
  }

  // Smart positioning
  const menuHeight = 280;
  const menuWidth = 240;
  let posX = x;
  let posY = y;
  if (y + menuHeight > window.innerHeight) posY = Math.max(0, y - menuHeight);
  if (x + menuWidth > window.innerWidth) posX = Math.max(0, x - menuWidth);

  return (
    <div className="context-menu active" id="contextMenu" ref={menuRef}
      style={{ left: posX, top: posY }}
      onClick={e => e.stopPropagation()}
      onContextMenu={e => e.stopPropagation()}>
      {itemType === 'folder' && (
        <div className="context-menu-item" data-action="open" onClick={() => action('open')}>
          <i className="fas fa-folder-open"></i>
          <span className="lang-en">Open</span><span className="lang-bn">খুলুন</span>
        </div>
      )}
      {itemType === 'file' && (
        <div className="context-menu-item" data-action="preview" onClick={() => action('preview')}>
          <i className="fas fa-eye"></i>
          <span className="lang-en">Preview</span><span className="lang-bn">প্রিভিউ</span>
        </div>
      )}
      {itemType === 'file' && (
        <div className="context-menu-item" data-action="download" onClick={() => action('download')}>
          <i className="fas fa-download"></i>
          <span className="lang-en">Download</span><span className="lang-bn">ডাউনলোড</span>
        </div>
      )}
      <div className="context-menu-divider"></div>
      <div className="context-menu-item" data-action="rename" onClick={() => action('rename')}>
        <i className="fas fa-pencil-alt"></i>
        <span className="lang-en">Rename</span><span className="lang-bn">নাম পরিবর্তন</span>
      </div>
      <div className="context-menu-item" data-action="move" onClick={() => action('move')}>
        <i className="fas fa-folder-open"></i>
        <span className="lang-en">Move</span><span className="lang-bn">সরান</span>
      </div>
      <div className="context-menu-item" data-action="star" onClick={() => action('star')}>
        <i className="fas fa-star"></i>
        {isStarred ? (
          <><span className="lang-en">Remove from Starred</span><span className="lang-bn">তারকাচিহ্ন সরান</span></>
        ) : (
          <><span className="lang-en">Add to Starred</span><span className="lang-bn">তারকাচিহ্নিত করুন</span></>
        )}
      </div>
      <div className="context-menu-divider"></div>
      <div className="context-menu-item" data-action="details" onClick={() => action('details')}>
        <i className="fas fa-info-circle"></i>
        <span className="lang-en">Details</span><span className="lang-bn">বিবরণ</span>
      </div>
      <div className="context-menu-item danger" data-action="trash" onClick={() => action('trash')}>
        <i className="fas fa-trash-alt"></i>
        <span className="lang-en">Move to Trash</span><span className="lang-bn">ট্র্যাশে দিন</span>
      </div>
    </div>
  );
}

export function TrashContextMenu({ x, y, itemId, isFolder, onAction, onClose }) {
  useEffect(() => {
    function handleClick() { onClose(); }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  function action(act) {
    onClose();
    onAction(act, itemId, isFolder);
  }

  const menuWidth = 220;
  const menuHeight = 120;
  const posX = Math.min(x, window.innerWidth - menuWidth);
  const posY = Math.min(y, window.innerHeight - menuHeight);

  return (
    <div className="context-menu active" id="trashContextMenu"
      style={{ left: posX, top: posY }}
      onClick={e => e.stopPropagation()}>
      <div className="context-menu-item" data-action="restore" onClick={() => action('restore')}>
        <i className="fas fa-undo"></i>
        <span className="lang-en">Restore</span><span className="lang-bn">পুনরুদ্ধার করুন</span>
      </div>
      <div className="context-menu-item danger" data-action="delete-permanent" onClick={() => action('delete-permanent')}>
        <i className="fas fa-trash"></i>
        <span className="lang-en">Delete Permanently</span><span className="lang-bn">স্থায়ীভাবে মুছুন</span>
      </div>
    </div>
  );
}
