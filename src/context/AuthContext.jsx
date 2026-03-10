import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged, signOut, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup, updateProfile,
  updatePassword, sendPasswordResetEmail, setPersistence,
  browserLocalPersistence, browserSessionPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { deriveKeyFromPin, hashPin, generateId, getDeviceFingerprint } from '../utils';
import { TRIAL_DAYS, MAX_FREE_DEVICES } from '../config';
import { useApp } from './AppContext';

const AuthContext = createContext(null);

const SESSION_TOKEN_KEY = 'nakib-cloud-session-token';
const PIN_VERIFY_KEY = 'nakib-cloud-last-pin-verify';
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

export function AuthProvider({ children }) {
  const { showToast, language } = useApp();
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [authState, setAuthState] = useState('loading'); // loading, unauthenticated, pin-setup, pin-verify, authenticated
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [pinLockInfo, setPinLockInfo] = useState(null); // { attemptsRemaining, lockedUntil, permanentlyLocked }

  const t = (en, bn) => language === 'en' ? en : bn;

  // Check if session is still valid (within 24h)
  function isSessionValid() {
    const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
    const lastVerify = sessionStorage.getItem(PIN_VERIFY_KEY);
    if (!sessionToken || !lastVerify) return false;
    const elapsed = Date.now() - parseInt(lastVerify, 10);
    return elapsed < SESSION_TIMEOUT_MS;
  }

  // Mark session as verified
  function markSessionVerified() {
    const token = generateId() + '-' + Date.now();
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(PIN_VERIFY_KEY, Date.now().toString());
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const loaded = await loadUserData(user.uid);
          if (!loaded) {
            setIsFirstTimeUser(true);
            if (user.providerData[0]?.providerId === 'google.com') {
              setAuthState('google-setup');
            } else {
              setAuthState('pin-setup');
            }
          } else {
            setIsFirstTimeUser(false);
            // Check session validity - if valid, skip PIN
            if (isSessionValid()) {
              // Re-derive key is not possible without PIN, so require re-verify
              // But we can check if encryptionKey is already set (it won't be on fresh load)
              setAuthState('pin-verify');
            } else {
              setAuthState('pin-verify');
            }
          }
        } catch (err) {
          console.error(err);
          setAuthState('unauthenticated');
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        setEncryptionKey(null);
        setIsFirstTimeUser(false);
        setAuthState('unauthenticated');
        setPinLockInfo(null);
      }
    });
    return unsubscribe;
  }, []);

  async function loadUserData(userId) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      setUserData(data);
      // Update pin lock info for UI
      updatePinLockInfo(data);
      return data;
    }
    return null;
  }

  function updatePinLockInfo(ud) {
    if (!ud) { setPinLockInfo(null); return; }
    const pinAttempts = ud.pinAttempts || 0;
    const pinLockedUntil = ud.pinLockedUntil || null;
    const pinLockCount = ud.pinLockCount || 0;

    const info = {
      attemptsRemaining: 5 - pinAttempts,
      lockedUntil: pinLockedUntil,
      permanentlyLocked: pinLockCount >= 3,
      lockCount: pinLockCount,
    };
    setPinLockInfo(info);
  }

  async function reloadUserData() {
    if (!currentUser) return;
    return await loadUserData(currentUser.uid);
  }

  async function createUserData(userId, data) {
    const deviceId = getDeviceFingerprint();
    const newUserData = {
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName || 'User',
      photoURL: auth.currentUser.photoURL || null,
      createdAt: new Date().toISOString(),
      status: 'trial',
      trialStartDate: new Date().toISOString(),
      storageLimit: null,
      storageUsed: 0,
      pinHash: data.pinHash,
      pinSalt: data.pinSalt,
      devices: [deviceId],
      deviceCount: 1,
      paymentHistory: [],
      currentPayment: null,
      isPremiumGift: false,
      showPremiumMessage: false,
      showGiftMessage: false,
      lastLogin: new Date().toISOString(),
      lastPinVerify: new Date().toISOString(),
      pinAttempts: 0,
      pinLockedUntil: null,
      pinLockCount: 0,
      ...data,
    };
    await setDoc(doc(db, 'users', userId), newUserData);
    setUserData(newUserData);
    return newUserData;
  }

  async function updateUserData(updates) {
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), {
      ...updates,
      lastUpdated: new Date().toISOString(),
    });
    setUserData(prev => ({ ...prev, ...updates }));
  }

  async function checkAndRegisterDevice(ud) {
    const deviceId = getDeviceFingerprint();
    const devices = ud?.devices || [];
    if (devices.includes(deviceId)) return true;
    if (ud?.status === 'premium') {
      await updateUserData({ devices: [...devices, deviceId], deviceCount: devices.length + 1 });
      return true;
    }
    if (devices.length >= MAX_FREE_DEVICES) return false;
    await updateUserData({ devices: [...devices, deviceId], deviceCount: devices.length + 1 });
    return true;
  }

  // Check brute force lock status, returns error message or null if OK
  function checkPinLockStatus(ud) {
    const pinLockCount = ud?.pinLockCount || 0;
    const pinLockedUntil = ud?.pinLockedUntil || null;

    // Permanent lock
    if (pinLockCount >= 3) {
      return t(
        'Account permanently locked. Contact admin.',
        'অ্যাকাউন্ট স্থায়ীভাবে লক। অ্যাডমিনের সাথে যোগাযোগ করুন'
      );
    }

    // Temporary lock
    if (pinLockedUntil) {
      const lockTime = new Date(pinLockedUntil).getTime();
      const now = Date.now();
      if (lockTime > now) {
        const remainingMin = Math.ceil((lockTime - now) / 60000);
        return t(
          `Account locked. Try again in ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.`,
          `অ্যাকাউন্ট লক। ${remainingMin} মিনিট পর চেষ্টা করুন`
        );
      }
    }

    return null;
  }

  // Record a wrong PIN attempt
  async function recordWrongPinAttempt(ud) {
    const currentAttempts = (ud?.pinAttempts || 0) + 1;
    const currentLockCount = ud?.pinLockCount || 0;

    if (currentAttempts >= 5) {
      // Lock the account for 30 minutes
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await updateDoc(doc(db, 'users', currentUser.uid), {
        pinAttempts: 0,
        pinLockedUntil: lockUntil,
        pinLockCount: currentLockCount + 1,
      });
      const newUd = { ...ud, pinAttempts: 0, pinLockedUntil: lockUntil, pinLockCount: currentLockCount + 1 };
      setUserData(newUd);
      updatePinLockInfo(newUd);
      throw new Error(t(
        'Too many wrong attempts. Account locked for 30 minutes.',
        'অনেক ভুল চেষ্টা। অ্যাকাউন্ট ৩০ মিনিটের জন্য লক।'
      ));
    } else {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        pinAttempts: currentAttempts,
      });
      const remaining = 5 - currentAttempts;
      const newUd = { ...ud, pinAttempts: currentAttempts };
      setUserData(newUd);
      updatePinLockInfo(newUd);
      throw new Error(t(
        `Incorrect PIN. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining`,
        `ভুল পিন। আর ${remaining} বার চেষ্টা বাকি`
      ));
    }
  }

  // Reset PIN attempts on success
  async function resetPinAttempts() {
    await updateDoc(doc(db, 'users', currentUser.uid), {
      pinAttempts: 0,
      lastPinVerify: new Date().toISOString(),
    });
    const newUd = { ...userData, pinAttempts: 0 };
    setUserData(newUd);
    updatePinLockInfo(newUd);
  }

  // PIN submit handler
  async function handlePinSubmit(pin, confirmPin = null) {
    if (isFirstTimeUser) {
      // Setup mode - enforce 6 digits
      if (pin.length !== 6) throw new Error(t('PIN must be exactly 6 digits', 'পিন অবশ্যই ৬ সংখ্যার হতে হবে'));
      if (pin !== confirmPin) throw new Error(t('PINs do not match', 'পিন মেলেনি'));
      const pinSalt = generateId();
      const pinHash = await hashPin(pin, pinSalt);
      const key = await deriveKeyFromPin(pin, currentUser.uid);
      await createUserData(currentUser.uid, { pinHash, pinSalt });
      setEncryptionKey(key);
      markSessionVerified();
      setAuthState('authenticated');
      return true;
    } else {
      // Verify mode
      const ud = userData;

      // Check lock status
      const lockError = checkPinLockStatus(ud);
      if (lockError) throw new Error(lockError);

      // Verify PIN - for backwards compatibility, accept whatever length matches the stored hash
      const pinHash = await hashPin(pin, ud.pinSalt);
      if (pinHash !== ud.pinHash) {
        await recordWrongPinAttempt(ud);
        // recordWrongPinAttempt always throws, so this line won't be reached
        return false;
      }

      // Correct PIN
      await resetPinAttempts();
      const deviceAllowed = await checkAndRegisterDevice(ud);
      if (!deviceAllowed) return 'device-limit';
      const key = await deriveKeyFromPin(pin, currentUser.uid);
      setEncryptionKey(key);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        lastLogin: new Date().toISOString(),
        lastPinVerify: new Date().toISOString(),
      });
      markSessionVerified();
      setAuthState('authenticated');
      return true;
    }
  }

  async function handleGoogleSetup(password = null) {
    if (password && password.length >= 6) {
      await updatePassword(currentUser, password);
    }
    setIsFirstTimeUser(true);
    setAuthState('pin-setup');
  }

  async function changePin(currentPin, newPin) {
    const ud = userData;

    // Check lock status before verifying current PIN
    const lockError = checkPinLockStatus(ud);
    if (lockError) throw new Error(lockError);

    const currentPinHash = await hashPin(currentPin, ud.pinSalt);
    if (currentPinHash !== ud.pinHash) {
      // Apply brute force protection to PIN change too
      await recordWrongPinAttempt(ud);
      return; // recordWrongPinAttempt throws
    }

    // Reset attempts on successful verify
    await resetPinAttempts();

    // Enforce 6 digits for new PIN
    if (newPin.length !== 6) throw new Error(t('New PIN must be exactly 6 digits', 'নতুন পিন অবশ্যই ৬ সংখ্যার হতে হবে'));

    const newPinSalt = generateId();
    const newPinHash = await hashPin(newPin, newPinSalt);
    await updateUserData({ pinHash: newPinHash, pinSalt: newPinSalt });
    const key = await deriveKeyFromPin(newPin, currentUser.uid);
    setEncryptionKey(key);
    markSessionVerified();
  }

  async function logout() {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(PIN_VERIFY_KEY);
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{
      currentUser, userData, encryptionKey, authState, isFirstTimeUser, pinLockInfo,
      setAuthState, loadUserData, reloadUserData, createUserData, updateUserData,
      handlePinSubmit, handleGoogleSetup, changePin, logout,
      signInWithEmailAndPassword: (email, password, remember) => {
        return setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
          .then(() => signInWithEmailAndPassword(auth, email, password));
      },
      signUpWithEmail: async (name, email, password) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        return cred;
      },
      signInWithGoogle: () => signInWithPopup(auth, googleProvider),
      sendPasswordReset: (email) => sendPasswordResetEmail(auth, email),
      updateUserProfile: async (updates) => {
        if (updates.displayName) await updateProfile(currentUser, { displayName: updates.displayName });
        await updateUserData(updates);
      },
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
