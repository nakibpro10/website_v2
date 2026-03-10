import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const PIN_LENGTH = 6;

export default function PinModal({ isSetup }) {
  const { handlePinSubmit, pinLockInfo } = useAuth();
  const { showToast, language } = useApp();
  const t = (en, bn) => language === 'en' ? en : bn;

  const [digits, setDigits] = useState(Array(PIN_LENGTH).fill(''));
  const [confirmDigits, setConfirmDigits] = useState(Array(PIN_LENGTH).fill(''));
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConfirmMode, setIsConfirmMode] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(null);

  const inputRefs = useRef([]);
  const confirmInputRefs = useRef([]);

  // Lock countdown timer
  useEffect(() => {
    if (!pinLockInfo?.lockedUntil) { setLockCountdown(null); return; }
    const lockTime = new Date(pinLockInfo.lockedUntil).getTime();

    function tick() {
      const remaining = lockTime - Date.now();
      if (remaining <= 0) { setLockCountdown(null); return; }
      const min = Math.floor(remaining / 60000);
      const sec = Math.floor((remaining % 60000) / 1000);
      setLockCountdown(`${min}:${sec.toString().padStart(2, '0')}`);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pinLockInfo?.lockedUntil]);

  // Auto focus first input
  useEffect(() => {
    if (!pinLockInfo?.permanentlyLocked && !lockCountdown) {
      inputRefs.current[0]?.focus();
    }
  }, [pinLockInfo, lockCountdown]);

  const handleDigitChange = useCallback((index, value, isConfirm = false) => {
    const refs = isConfirm ? confirmInputRefs : inputRefs;
    const setter = isConfirm ? setConfirmDigits : setDigits;

    if (!/^\d*$/.test(value)) return;

    setter(prev => {
      const newDigits = [...prev];
      newDigits[index] = value.slice(-1);
      return newDigits;
    });

    if (value && index < PIN_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index, e, isConfirm = false) => {
    const refs = isConfirm ? confirmInputRefs : inputRefs;
    const setter = isConfirm ? setConfirmDigits : setDigits;

    if (e.key === 'Backspace') {
      setter(prev => {
        const newDigits = [...prev];
        if (!newDigits[index] && index > 0) {
          refs.current[index - 1]?.focus();
          newDigits[index - 1] = '';
        } else {
          newDigits[index] = '';
        }
        return newDigits;
      });
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  }, []);

  const handlePaste = useCallback((e, isConfirm = false) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    if (!pasted) return;

    const refs = isConfirm ? confirmInputRefs : inputRefs;
    const setter = isConfirm ? setConfirmDigits : setDigits;

    const newDigits = Array(PIN_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setter(newDigits);

    const focusIndex = Math.min(pasted.length, PIN_LENGTH - 1);
    refs.current[focusIndex]?.focus();
  }, []);

  const getPin = (d) => d.join('');

  async function handleSubmit(e) {
    e.preventDefault();
    const pin = getPin(digits);

    if (isSetup && !isConfirmMode) {
      if (pin.length !== PIN_LENGTH) {
        showToast(t('PIN must be exactly 6 digits', 'পিন অবশ্যই ৬ সংখ্যার হতে হবে'), 'error');
        return;
      }
      if (!/^\d+$/.test(pin)) {
        showToast(t('PIN must contain only numbers', 'পিনে শুধু সংখ্যা থাকতে হবে'), 'error');
        return;
      }
      setIsConfirmMode(true);
      setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
      return;
    }

    const confirmPin = isSetup ? getPin(confirmDigits) : null;

    if (!isSetup) {
      // Verify mode - accept 4-6 digits for backwards compatibility
      if (pin.length < 4 || pin.length > 6) {
        showToast(t('Please enter your PIN', 'আপনার পিন দিন'), 'error');
        return;
      }
    } else {
      if (pin.length !== PIN_LENGTH) {
        showToast(t('PIN must be exactly 6 digits', 'পিন অবশ্যই ৬ সংখ্যার হতে হবে'), 'error');
        return;
      }
    }

    if (!/^\d+$/.test(pin)) {
      showToast(t('PIN must contain only numbers', 'পিনে শুধু সংখ্যা থাকতে হবে'), 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await handlePinSubmit(pin, confirmPin);
      if (result === 'device-limit') {
        showToast(t('Device limit reached', 'ডিভাইস সীমা পার হয়েছে'), 'error');
      } else if (result === true) {
        if (isSetup) showToast(t('PIN set successfully!', 'পিন সফলভাবে সেট হয়েছে!'), 'success');
        else showToast(t('Files unlocked!', 'ফাইল আনলক হয়েছে!'), 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
      setDigits(Array(PIN_LENGTH).fill(''));
      setConfirmDigits(Array(PIN_LENGTH).fill(''));
      if (isSetup && isConfirmMode) {
        setIsConfirmMode(false);
      }
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  }

  const isLocked = pinLockInfo?.permanentlyLocked || !!lockCountdown;
  const attemptsRemaining = pinLockInfo?.attemptsRemaining ?? 5;
  const showWarning = !isSetup && attemptsRemaining <= 3 && attemptsRemaining > 0 && !isLocked;
  const showDangerWarning = !isSetup && attemptsRemaining <= 1 && attemptsRemaining > 0 && !isLocked;

  function renderPinBoxes(currentDigits, isConfirm = false) {
    const refs = isConfirm ? confirmInputRefs : inputRefs;
    return (
      <div className="pin-otp-container">
        {Array(PIN_LENGTH).fill(0).map((_, i) => (
          <input
            key={i}
            ref={el => refs.current[i] = el}
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            className={`pin-otp-box ${currentDigits[i] ? 'filled' : ''}`}
            value={currentDigits[i]}
            onChange={e => handleDigitChange(i, e.target.value, isConfirm)}
            onKeyDown={e => handleKeyDown(i, e, isConfirm)}
            onPaste={e => handlePaste(e, isConfirm)}
            disabled={isLocked || loading}
            autoFocus={i === 0 && !isConfirm}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="pin-modal-overlay active" id="pinModal">
      <div className="pin-modal">
        <div className="pin-logo">
          <i className="fas fa-cloud"></i>
          <span>Nakib Cloud</span>
        </div>
        <div className="pin-lock-icon">
          <i className={`fas ${isLocked ? 'fa-lock' : 'fa-shield-alt'}`}></i>
        </div>
        <h2 className="pin-title" id="pinTitle">
          {isSetup ? (
            isConfirmMode ? (
              <>
                <span className="lang-en">Confirm Your PIN</span>
                <span className="lang-bn">আপনার পিন নিশ্চিত করুন</span>
              </>
            ) : (
              <>
                <span className="lang-en">Set up Security PIN</span>
                <span className="lang-bn">সিকিউরিটি পিন সেট করুন</span>
              </>
            )
          ) : (
            <>
              <span className="lang-en">Enter Security PIN</span>
              <span className="lang-bn">সিকিউরিটি পিন দিন</span>
            </>
          )}
        </h2>
        <p className="pin-subtitle" id="pinSubtitle">
          {isSetup ? (
            isConfirmMode ? (
              <>
                <span className="lang-en">Re-enter your 6-digit PIN to confirm.</span>
                <span className="lang-bn">নিশ্চিত করতে আবার ৬ সংখ্যার পিন দিন।</span>
              </>
            ) : (
              <>
                <span className="lang-en">Create a 6-digit PIN to encrypt your files.</span>
                <span className="lang-bn">আপনার ফাইল এনক্রিপ্ট করতে ৬ সংখ্যার পিন তৈরি করুন।</span>
              </>
            )
          ) : (
            <>
              <span className="lang-en">Enter your PIN to decrypt and access your files.</span>
              <span className="lang-bn">আপনার ফাইল ডিক্রিপ্ট ও অ্যাক্সেস করতে পিন দিন।</span>
            </>
          )}
        </p>

        {/* Permanent lock message */}
        {pinLockInfo?.permanentlyLocked && (
          <div className="pin-lock-banner pin-lock-danger">
            <i className="fas fa-ban"></i>
            <div>
              <strong>
                <span className="lang-en">Account Permanently Locked</span>
                <span className="lang-bn">অ্যাকাউন্ট স্থায়ীভাবে লক</span>
              </strong>
              <p>
                <span className="lang-en">Contact admin to unlock your account.</span>
                <span className="lang-bn">অ্যাকাউন্ট আনলক করতে অ্যাডমিনের সাথে যোগাযোগ করুন।</span>
              </p>
            </div>
          </div>
        )}

        {/* Temporary lock with countdown */}
        {lockCountdown && !pinLockInfo?.permanentlyLocked && (
          <div className="pin-lock-banner pin-lock-warning">
            <i className="fas fa-clock"></i>
            <div>
              <strong>
                <span className="lang-en">Account Temporarily Locked</span>
                <span className="lang-bn">অ্যাকাউন্ট সাময়িকভাবে লক</span>
              </strong>
              <p className="pin-countdown-text">
                <span className="lang-en">Try again in </span>
                <span className="lang-bn">আবার চেষ্টা করুন </span>
                <span className="pin-countdown-timer">{lockCountdown}</span>
              </p>
            </div>
          </div>
        )}

        {/* Attempt warning bar */}
        {showWarning && (
          <div className={`pin-lock-banner ${showDangerWarning ? 'pin-lock-danger' : 'pin-lock-caution'}`}>
            <i className="fas fa-exclamation-triangle"></i>
            <span>
              <span className="lang-en">{attemptsRemaining} attempt{attemptsRemaining > 1 ? 's' : ''} remaining</span>
              <span className="lang-bn">আর {attemptsRemaining} বার চেষ্টা বাকি</span>
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* PIN input */}
          {isSetup && isConfirmMode ? (
            renderPinBoxes(confirmDigits, true)
          ) : (
            renderPinBoxes(digits, false)
          )}

          {/* Dot indicators */}
          <div className="pin-dots-indicator">
            {Array(PIN_LENGTH).fill(0).map((_, i) => {
              const d = (isSetup && isConfirmMode) ? confirmDigits : digits;
              return <span key={i} className={`pin-dot ${d[i] ? 'filled' : ''}`}></span>;
            })}
          </div>

          {/* Eye toggle */}
          <button type="button" className="pin-visibility-toggle" onClick={() => setShowPin(!showPin)} tabIndex={-1}>
            <i className={`fas ${showPin ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            <span className="lang-en">{showPin ? 'Hide' : 'Show'} PIN</span>
            <span className="lang-bn">পিন {showPin ? 'লুকান' : 'দেখান'}</span>
          </button>

          {isSetup && isConfirmMode && (
            <button type="button" className="pin-back-btn" onClick={() => {
              setIsConfirmMode(false);
              setConfirmDigits(Array(PIN_LENGTH).fill(''));
              setTimeout(() => inputRefs.current[0]?.focus(), 100);
            }}>
              <i className="fas fa-arrow-left"></i>
              <span className="lang-en">Change PIN</span>
              <span className="lang-bn">পিন বদলান</span>
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block pin-submit-btn"
            id="pinSubmitBtn"
            disabled={loading || isLocked}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> <span className="lang-en">Processing...</span><span className="lang-bn">প্রসেস হচ্ছে...</span></>
            ) : (
              <><i className="fas fa-unlock"></i> <span className="lang-en" id="pinBtnTextEn">{isSetup ? (isConfirmMode ? 'Confirm & Set PIN' : 'Continue') : 'Unlock Files'}</span><span className="lang-bn" id="pinBtnTextBn">{isSetup ? (isConfirmMode ? 'নিশ্চিত করুন ও পিন সেট করুন' : 'চালিয়ে যান') : 'ফাইল আনলক করুন'}</span></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
