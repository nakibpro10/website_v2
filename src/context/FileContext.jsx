import { createContext, useContext, useState, useRef } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where
} from 'firebase/firestore';
import { db } from '../firebase';
import { WORKER_URL, CHUNK_SIZE, MAX_CONCURRENT_UPLOADS, MAX_RETRY_ATTEMPTS } from '../config';
import { encryptData, decryptData, generateId, sleep, getMimeType } from '../utils';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

const FileContext = createContext(null);

export function FileProvider({ children }) {
  const { currentUser, encryptionKey, updateUserData } = useAuth();
  const { showToast, language } = useApp();
  const t = (en, bn) => language === 'en' ? en : bn;

  const [userFiles, setUserFiles] = useState([]);
  const [userFolders, setUserFolders] = useState([]);
  const [trashFiles, setTrashFiles] = useState([]);
  const [trashFolders, setTrashFolders] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPanelActive, setUploadPanelActive] = useState(false);
  const uploadQueueRef = useRef([]);

  async function loadFilesAndFolders() {
    if (!currentUser) return;
    try {
      // Load folders from Firestore
      const foldersRef = collection(db, 'users', currentUser.uid, 'folders');
      const foldersSnapshot = await getDocs(foldersRef);
      const folders = foldersSnapshot.docs.map(d => ({ id: d.id, ...d.data(), isFolder: true }));
      setUserFolders(folders);

      // Load files from Worker
      const response = await fetch(`${WORKER_URL}/files?userId=${currentUser.uid}`);
      const data = await response.json();
      if (data.success) {
        setUserFiles(data.files || []);
      }

      // Load trash
      await loadTrash();
    } catch (error) {
      console.error('Error loading files:', error);
      showToast(t('Failed to load files', 'ফাইল লোড করতে ব্যর্থ'), 'error');
    }
  }

  async function loadTrash() {
    if (!currentUser) return;
    try {
      const response = await fetch(`${WORKER_URL}/trash?userId=${currentUser.uid}`);
      const data = await response.json();
      if (data.success) setTrashFiles(data.files || []);

      const trashFoldersRef = collection(db, 'users', currentUser.uid, 'trash_folders');
      const trashFoldersSnapshot = await getDocs(trashFoldersRef);
      setTrashFolders(trashFoldersSnapshot.docs.map(d => ({ id: d.id, ...d.data(), isFolder: true })));
    } catch (error) {
      console.error('Error loading trash:', error);
    }
  }

  // ==================== FOLDER OPERATIONS ====================

  async function createFolder(name, parentId) {
    const folderData = {
      name, parentId, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), starred: false, trashed: false,
    };
    const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'folders'), folderData);
    const newFolder = { id: docRef.id, ...folderData, isFolder: true };
    setUserFolders(prev => [...prev, newFolder]);
    return newFolder;
  }

  async function renameFolder(folderId, newName) {
    await updateDoc(doc(db, 'users', currentUser.uid, 'folders', folderId), {
      name: newName, updatedAt: new Date().toISOString(),
    });
    setUserFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: newName } : f));
  }

  async function renameFile(fileId, newName) {
    const response = await fetch(`${WORKER_URL}/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, userId: currentUser.uid, newName }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Rename failed');
    setUserFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: newName } : f));
  }

  async function trashFolder(folderId) {
    const folder = userFolders.find(f => f.id === folderId);
    if (!folder) return;
    const trashedData = { ...folder, trashed: true, trashedAt: new Date().toISOString() };
    await updateDoc(doc(db, 'users', currentUser.uid, 'folders', folderId), { trashed: true, trashedAt: new Date().toISOString() });
    await addDoc(collection(db, 'users', currentUser.uid, 'trash_folders'), trashedData);
    setUserFolders(prev => prev.filter(f => f.id !== folderId));
    setTrashFolders(prev => [...prev, { ...trashedData, isFolder: true }]);
  }

  async function trashFile(fileId) {
    const response = await fetch(`${WORKER_URL}/trash-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, userId: currentUser.uid }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Trash failed');
    const file = userFiles.find(f => f.id === fileId);
    if (file) {
      setUserFiles(prev => prev.filter(f => f.id !== fileId));
      setTrashFiles(prev => [...prev, { ...file, trashedAt: new Date().toISOString() }]);
    }
  }

  async function restoreFolder(folderId) {
    const folder = trashFolders.find(f => f.id === folderId);
    if (!folder) return;
    const { trashedAt, trashed, ...restoredData } = folder;
    await addDoc(collection(db, 'users', currentUser.uid, 'folders'), { ...restoredData, trashed: false });
    // Delete from trash_folders collection  
    const trashFoldersRef = collection(db, 'users', currentUser.uid, 'trash_folders');
    const q = query(trashFoldersRef, where('name', '==', folder.name));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(d => deleteDoc(d.ref));
    setTrashFolders(prev => prev.filter(f => f.id !== folderId));
    setUserFolders(prev => [...prev, { ...restoredData, trashed: false, isFolder: true }]);
  }

  async function restoreFile(fileId) {
    const response = await fetch(`${WORKER_URL}/restore-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, userId: currentUser.uid }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Restore failed');
    const file = trashFiles.find(f => f.id === fileId);
    if (file) {
      setTrashFiles(prev => prev.filter(f => f.id !== fileId));
      setUserFiles(prev => [...prev, { ...file, trashedAt: undefined }]);
    }
  }

  async function deleteFilePermanent(fileId) {
    const response = await fetch(`${WORKER_URL}/delete-permanent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, userId: currentUser.uid }),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Delete failed');
    setTrashFiles(prev => prev.filter(f => f.id !== fileId));
  }

  async function deleteFolderPermanent(folderId) {
    const trashFoldersRef = collection(db, 'users', currentUser.uid, 'trash_folders');
    const q = query(trashFoldersRef, where('id', '==', folderId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      snapshot.docs.forEach(d => deleteDoc(d.ref));
    }
    setTrashFolders(prev => prev.filter(f => f.id !== folderId));
  }

  async function toggleStar(itemId, itemType) {
    if (itemType === 'folder') {
      const folder = userFolders.find(f => f.id === itemId);
      if (!folder) return;
      const newStarred = !folder.starred;
      await updateDoc(doc(db, 'users', currentUser.uid, 'folders', itemId), { starred: newStarred });
      setUserFolders(prev => prev.map(f => f.id === itemId ? { ...f, starred: newStarred } : f));
    } else {
      const response = await fetch(`${WORKER_URL}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: itemId, userId: currentUser.uid }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Star failed');
      setUserFiles(prev => prev.map(f => f.id === itemId ? { ...f, isStarred: !f.isStarred } : f));
    }
  }

  async function moveItem(itemId, itemType, destinationId) {
    if (itemType === 'folder') {
      await updateDoc(doc(db, 'users', currentUser.uid, 'folders', itemId), {
        parentId: destinationId, updatedAt: new Date().toISOString(),
      });
      setUserFolders(prev => prev.map(f => f.id === itemId ? { ...f, parentId: destinationId } : f));
    } else {
      const response = await fetch(`${WORKER_URL}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: itemId, userId: currentUser.uid, targetFolderId: destinationId === 'root' ? null : destinationId }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Move failed');
      if (data.file) {
        setUserFiles(prev => prev.map(f => f.id === itemId ? { ...f, folderId: data.file.folderId } : f));
      }
    }
  }

  // ==================== UPLOAD ====================

  async function handleFileUpload(files, folderId = 'root') {
    setUploadPanelActive(true);
    const newItems = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadId = `upload_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
      const item = { id: uploadId, file, folderId, status: 'pending', progress: 0, cancelled: false, retryCount: 0 };
      newItems.push(item);
    }
    uploadQueueRef.current = [...uploadQueueRef.current, ...newItems];
    setUploadQueue([...uploadQueueRef.current]);
    if (!isUploading) {
      processUploadQueue();
    }
  }

  async function processUploadQueue() {
    setIsUploading(true);
    const getQueue = () => uploadQueueRef.current;

    while (getQueue().some(i => i.status === 'pending' && !i.cancelled)) {
      const toProcess = getQueue().filter(i => i.status === 'pending' && !i.cancelled).slice(0, MAX_CONCURRENT_UPLOADS);
      if (toProcess.length === 0) { await sleep(100); continue; }
      await Promise.all(toProcess.map(item => uploadSingleFile(item)));
      await sleep(500);
    }

    setIsUploading(false);
    setTimeout(() => {
      const hasActive = uploadQueueRef.current.some(i => i.status === 'pending' || i.status === 'uploading');
      if (!hasActive) {
        uploadQueueRef.current = [];
        setUploadQueue([]);
        setUploadPanelActive(false);
      }
    }, 2000);
  }

  function updateQueueItem(id, updates) {
    uploadQueueRef.current = uploadQueueRef.current.map(i => i.id === id ? { ...i, ...updates } : i);
    setUploadQueue([...uploadQueueRef.current]);
  }

  async function uploadSingleFile(item) {
    const { id, file, folderId } = item;
    updateQueueItem(id, { status: 'uploading' });

    try {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      updateQueueItem(id, { statusText: 'Encrypting...' });

      if (totalChunks <= 1) {
        await uploadSmallFile(item);
      } else {
        await uploadLargeFile(item, totalChunks);
      }
    } catch (error) {
      const retryCount = item.retryCount + 1;
      if (retryCount < MAX_RETRY_ATTEMPTS && !item.cancelled) {
        updateQueueItem(id, { status: 'pending', retryCount, statusText: `Retrying ${retryCount}/${MAX_RETRY_ATTEMPTS}...` });
        await sleep(2000 * retryCount);
        return;
      }
      updateQueueItem(id, { status: 'error', statusText: 'Failed' });
      showToast(t(`Failed: ${file.name}`, `ব্যর্থ: ${file.name}`), 'error');
    }
  }

  async function uploadSmallFile(item) {
    const { id, file, folderId } = item;
    const encryptedBlob = await encryptData(file, encryptionKey);
    updateQueueItem(id, { statusText: 'Uploading...', progress: 30 });

    const formData = new FormData();
    formData.append('file', encryptedBlob, file.name);
    formData.append('userId', currentUser.uid);
    formData.append('fileName', file.name);
    formData.append('folderId', folderId);
    formData.append('originalSize', file.size);
    formData.append('mimeType', file.type);

    updateQueueItem(id, { progress: 70 });
    const response = await fetch(`${WORKER_URL}/upload`, { method: 'POST', body: formData });
    const data = await response.json();

    if (data.success) {
      const newFile = { ...data.file, folderId, size: file.size, uploadDate: new Date().toISOString() };
      setUserFiles(prev => [...prev, newFile]);
      updateQueueItem(id, { status: 'completed', progress: 100, statusText: 'Complete' });
      showToast(t(`Uploaded: ${file.name}`, `আপলোড: ${file.name}`), 'success');
    } else {
      throw new Error(data.error || 'Upload failed');
    }
  }

  async function uploadLargeFile(item, totalChunks) {
    const { id, file, folderId } = item;
    const fileId = `chunked_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uploadStartTime = Date.now();
    let totalUploadedBytes = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (item.cancelled) { await cleanupPartialUpload(fileId); return; }
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const encryptedChunk = await encryptData(chunk, encryptionKey);

      let chunkUploaded = false;
      let chunkRetries = 0;
      while (!chunkUploaded && chunkRetries < MAX_RETRY_ATTEMPTS) {
        try {
          const formData = new FormData();
          formData.append('chunk', encryptedChunk, `${file.name}.part${chunkIndex}`);
          formData.append('chunkIndex', chunkIndex);
          formData.append('totalChunks', totalChunks);
          formData.append('fileId', fileId);
          formData.append('fileName', file.name);
          formData.append('userId', currentUser.uid);

          const response = await fetch(`${WORKER_URL}/upload-chunk`, { method: 'POST', body: formData });
          const data = await response.json();

          if (data.success) {
            chunkUploaded = true;
            totalUploadedBytes += chunk.size;
            const totalDuration = (Date.now() - uploadStartTime) / 1000;
            const avgSpeedMBps = (totalUploadedBytes / totalDuration) / (1024 * 1024);
            const speedText = avgSpeedMBps >= 1 ? `${avgSpeedMBps.toFixed(1)} MB/s` : `${(avgSpeedMBps * 1024).toFixed(0)} KB/s`;
            const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
            updateQueueItem(id, { progress, statusText: `Uploading ${progress}% (${speedText})` });
          } else { throw new Error(data.error || 'Chunk upload failed'); }
        } catch (err) {
          chunkRetries++;
          if (chunkRetries >= MAX_RETRY_ATTEMPTS) throw new Error(`Failed to upload chunk ${chunkIndex + 1}`);
          await sleep(2000 * chunkRetries);
        }
      }
    }

    updateQueueItem(id, { statusText: 'Finalizing...' });
    const completeResponse = await fetch(`${WORKER_URL}/complete-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, fileName: file.name, fileSize: file.size, mimeType: file.type, userId: currentUser.uid, totalChunks, folderId }),
    });
    const completeData = await completeResponse.json();

    if (completeData.success) {
      const newFile = { ...completeData.file, folderId, size: file.size, uploadDate: new Date().toISOString() };
      setUserFiles(prev => [...prev, newFile]);
      updateQueueItem(id, { status: 'completed', progress: 100, statusText: 'Complete' });
      showToast(t(`Uploaded: ${file.name}`, `আপলোড: ${file.name}`), 'success');
    } else { throw new Error(completeData.error || 'Failed to complete upload'); }
  }

  async function cleanupPartialUpload(fileId) {
    try {
      await fetch(`${WORKER_URL}/cleanup-chunks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, userId: currentUser.uid }),
      });
    } catch (err) { console.error(err); }
  }

  function cancelUpload(uploadId) {
    uploadQueueRef.current = uploadQueueRef.current.map(i =>
      i.id === uploadId ? { ...i, cancelled: true, status: 'cancelled' } : i
    );
    setUploadQueue([...uploadQueueRef.current]);
    setTimeout(() => {
      uploadQueueRef.current = uploadQueueRef.current.filter(i => i.id !== uploadId);
      setUploadQueue([...uploadQueueRef.current]);
    }, 1000);
  }

  // ==================== DOWNLOAD ====================

  async function downloadFile(fileId, fileName) {
    showToast(t('Preparing download...', 'ডাউনলোড প্রস্তুত হচ্ছে...'), 'info');
    try {
      const infoResponse = await fetch(`${WORKER_URL}/download-info/${fileId}`);
      const infoData = await infoResponse.json();
      if (!infoData.success) throw new Error('File not found on server');

      const fileInfo = infoData.file;
      const chunks = (fileInfo.chunks || []).sort((a, b) => a.index - b.index);

      const decryptedParts = [];
      for (let i = 0; i < chunks.length; i++) {
        const progress = Math.round(((i + 1) / chunks.length) * 100);
        showToast(t(`Downloading ${progress}%`, `ডাউনলোড হচ্ছে ${progress}%`), 'info', 1500);
        const chunkResponse = await fetch(`${WORKER_URL}/download-chunk/${chunks[i].fileId}`);
        const encryptedBlob = await chunkResponse.blob();
        const decryptedBlob = await decryptData(encryptedBlob, encryptionKey);
        decryptedParts.push(decryptedBlob);
      }

      const combinedBlob = new Blob(decryptedParts);
      const url = URL.createObjectURL(combinedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo.name || fileName || 'download';
      a.click();
      URL.revokeObjectURL(url);
      showToast(t('Download complete!', 'ডাউনলোড সম্পন্ন!'), 'success');
    } catch (error) {
      showToast(t(`Download failed: ${error.message}`, `ডাউনলোড ব্যর্থ`), 'error');
    }
  }

  // ==================== PREVIEW ====================

  async function getFilePreviewData(fileId) {
    const infoResponse = await fetch(`${WORKER_URL}/download-info/${fileId}`);
    const infoData = await infoResponse.json();
    if (!infoData.success) throw new Error('File not found');

    const fileInfo = infoData.file;
    const chunks = (fileInfo.chunks || []).sort((a, b) => a.index - b.index);
    const decryptedParts = [];

    for (const chunk of chunks) {
      const chunkResponse = await fetch(`${WORKER_URL}/download-chunk/${chunk.fileId}`);
      const encryptedBlob = await chunkResponse.blob();
      const decryptedBlob = await decryptData(encryptedBlob, encryptionKey);
      decryptedParts.push(decryptedBlob);
    }

    const file = userFiles.find(f => f.id === fileId);
    const combinedBlob = new Blob(decryptedParts, { type: file?.mimeType || getMimeType(fileInfo.name || '') });
    return { blob: combinedBlob, file, fileInfo };
  }

  return (
    <FileContext.Provider value={{
      userFiles, userFolders, trashFiles, trashFolders,
      uploadQueue, uploadPanelActive, isUploading,
      setUserFiles, setUserFolders,
      loadFilesAndFolders, loadTrash,
      createFolder, renameFolder, renameFile,
      trashFolder, trashFile, restoreFolder, restoreFile,
      deleteFilePermanent, deleteFolderPermanent,
      toggleStar, moveItem,
      handleFileUpload, cancelUpload, downloadFile, getFilePreviewData,
    }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  return useContext(FileContext);
}
