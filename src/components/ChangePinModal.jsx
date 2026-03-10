import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function ChangePinModal({ onClose }) {
  const { changePin } = useAuth();
  const { showToast, language } = useApp();
  const t = (en, bn) => language === 'en' ? en : bn;
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (newPin.length !== 6) {
      showToast(t('New PIN must be exactly 6 digits', 'নতুন পিন অবশ্যই ৬ সংখ্যার হতে হবে'), 'error');
      return;
    }
    if (!/^\d+$/.test(newPin)) {
      showToast(t('PIN must contain only numbers', 'পিনে শুধু সংখ্যা থাকতে হবে'), 'error');
      return;
    }
    if (newPin !== confirmPin) {
      showToast(t('New PINs do not match', 'নতুন পিন মেলেনি'), 'error');
      return;
    }
    setLoading(true);
    try {
      await changePin(currentPin, newPin);
      showToast(t('PIN changed successfully!', 'পিন পরিবর্তন সফল!'), 'success');
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay active" id="changePinModal">
      <div className="modal modal-sm">
        <div className="modal-header">
          <h3><i className="fas fa-key"></i> <span className="lang-en">Change PIN</span><span className="lang-bn">পিন পরিবর্তন</span></h3>
          <button className="modal-close" id="closeChangePinModal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label><span className="lang-en">Current PIN</span><span className="lang-bn">বর্তমান পিন</span></label>
            <input type="password" className="form-control" id="currentPinInput" value={currentPin} onChange={e => setCurrentPin(e.target.value)} maxLength={6} autoFocus />
          </div>
          <div className="form-group">
            <label><span className="lang-en">New PIN (6 digits)</span><span className="lang-bn">নতুন পিন (৬ সংখ্যা)</span></label>
            <input type="password" className="form-control" id="newPinInput" value={newPin} onChange={e => setNewPin(e.target.value)} maxLength={6} inputMode="numeric" />
          </div>
          <div className="form-group">
            <label><span className="lang-en">Confirm New PIN</span><span className="lang-bn">নতুন পিন নিশ্চিত করুন</span></label>
            <input type="password" className="form-control" id="confirmNewPinInput" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} maxLength={6} inputMode="numeric" onKeyPress={e => e.key === 'Enter' && handleConfirm()} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" id="cancelChangePinBtn" onClick={onClose}>
            <span className="lang-en">Cancel</span><span className="lang-bn">বাতিল</span>
          </button>
          <button className="btn btn-primary" id="confirmChangePinBtn" onClick={handleConfirm} disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-check"></i> <span className="lang-en">Change PIN</span><span className="lang-bn">পিন পরিবর্তন</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
