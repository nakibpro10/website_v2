import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PAYMENT_NUMBERS, PAYMENT_COLORS } from '../config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const PLANS = [
  { storage: '1024', label: '1 TB', labelBn: '১ টিবি', price: '1500', subtitle: 'Starter', subtitleBn: 'স্টার্টার', icon: 'fa-database', features: ['1024 GB Storage', 'End-to-end encryption', 'Unlimited devices', 'Priority support'], featuresBn: ['১০২৪ জিবি স্টোরেজ', 'এন্ড-টু-এন্ড এনক্রিপশন', 'আনলিমিটেড ডিভাইস', 'প্রায়োরিটি সাপোর্ট'] },
  { storage: '2048', label: '2 TB', labelBn: '২ টিবি', price: '2200', subtitle: 'Best Value', subtitleBn: 'সেরা মূল্য', icon: 'fa-hdd', features: ['2048 GB Storage', 'End-to-end encryption', 'Unlimited devices', 'Premium support'], featuresBn: ['২০৪৮ জিবি স্টোরেজ', 'এন্ড-টু-এন্ড এনক্রিপশন', 'আনলিমিটেড ডিভাইস', 'প্রিমিয়াম সাপোর্ট'], popular: true },
  { storage: '3072', label: '3 TB', labelBn: '৩ টিবি', price: '3000', subtitle: 'Professional', subtitleBn: 'প্রফেশনাল', icon: 'fa-server', features: ['3072 GB Storage', 'End-to-end encryption', 'Unlimited everything', '24/7 Support'], featuresBn: ['৩০৭২ জিবি স্টোরেজ', 'এন্ড-টু-এন্ড এনক্রিপশন', 'সবকিছু আনলিমিটেড', '২৪/৭ সাপোর্ট'] },
  { storage: '5120', label: '5 TB', labelBn: '৫ টিবি', price: '3700', subtitle: 'Ultimate', subtitleBn: 'আলটিমেট', icon: 'fa-cloud', features: ['5120 GB Storage', 'End-to-end encryption', 'Maximum capacity', 'VIP Support'], featuresBn: ['৫১২০ জিবি স্টোরেজ', 'এন্ড-টু-এন্ড এনক্রিপশন', 'সর্বোচ্চ ক্যাপাসিটি', 'ভিআইপি সাপোর্ট'] },
];

const METHODS = [
  { id: 'bkash', name: 'bKash' },
  { id: 'nagad', name: 'Nagad' },
  { id: 'rocket', name: 'Rocket' },
  { id: 'upay', name: 'Upay' },
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const onBack = () => navigate('/dashboard');
  const { showToast, language } = useApp();
  const { currentUser, userData, updateUserData } = useAuth();
  const t = (en, bn) => language === 'en' ? en : bn;

  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const merchantNumber = selectedMethod ? PAYMENT_NUMBERS[selectedMethod] : '';

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(merchantNumber);
      setCopied(true);
      showToast(t('Number copied!', 'নম্বর কপি হয়েছে!'), 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch { showToast(t('Failed to copy', 'কপি করতে ব্যর্থ'), 'error'); }
  }

  async function handleSubmit() {
    if (!trxId || trxId.length < 8) {
      showToast(t('Please enter a valid Transaction ID', 'সঠিক ট্রানজেকশন আইডি দিন'), 'error');
      return;
    }
    setSubmitting(true);
    try {
      const paymentData = {
        userId: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || 'User',
        storageGB: selectedPlan.storage,
        amount: selectedPlan.price,
        method: selectedMethod,
        trxId,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      await addDoc(collection(db, 'payments'), {
        ...paymentData,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      await updateUserData({
        status: 'pending',
        subscriptionStatus: 'pending',
        pendingPlan: selectedPlan.storage,
        pendingPrice: selectedPlan.price,
        pendingTransactionId: trxId,
        pendingPaymentMethod: selectedMethod,
        pendingTimestamp: new Date().toISOString(),
        pendingStartDate: new Date().toISOString(),
      });

      showToast(t('Payment submitted! We will verify within 24 hours.', 'পেমেন্ট সাবমিট হয়েছে! আমরা ২৪ ঘণ্টার মধ্যে যাচাই করব।'), 'success', 6000);
      setTimeout(() => onBack(), 2000);
    } catch (err) {
      showToast(t('Failed to submit payment. Try again.', 'পেমেন্ট সাবমিট করতে ব্যর্থ। আবার চেষ্টা করুন।'), 'error');
    } finally { setSubmitting(false); }
  }

  const progressSteps = [
    { label: t('Select Plan', 'প্ল্যান নির্বাচন') },
    { label: t('Payment Method', 'পেমেন্ট পদ্ধতি') },
    { label: t('Complete Payment', 'পেমেন্ট সম্পন্ন') },
  ];

  return (
    <div className="subscription-full-page" id="subscriptionPage">
      <div className="subscription-page-wrapper">
        {/* Header with Back Button */}
        <div className="sub-page-header">
          <button className="back-to-dash-btn" id="backToDashboardBtn" onClick={onBack}>
            <i className="fas fa-arrow-left"></i>
            <span className="lang-en">Back to Dashboard</span>
            <span className="lang-bn">ড্যাশবোর্ডে ফিরুন</span>
          </button>
        </div>

        {/* Page Title */}
        <div className="sub-page-title">
          <div className="title-icon">
            <i className="fas fa-crown"></i>
          </div>
          <h1>
            <span className="lang-en">Upgrade to Premium</span>
            <span className="lang-bn">প্রিমিয়ামে আপগ্রেড করুন</span>
          </h1>
          <p className="subtitle">
            <span className="lang-en">Choose your storage plan - Lifetime access!</span>
            <span className="lang-bn">আপনার স্টোরেজ প্ল্যান বেছে নিন - লাইফটাইম অ্যাক্সেস!</span>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="sub-progress-steps">
          {progressSteps.map((s, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <div className={`progress-step ${step > i + 1 ? 'completed' : step === i + 1 ? 'active' : ''}`}>
                <div className="step-circle">
                  {step > i + 1 ? <i className="fas fa-check"></i> : i + 1}
                </div>
                <span className="step-label">{s.label}</span>
              </div>
              {i < progressSteps.length - 1 && <div className="progress-line"></div>}
            </div>
          ))}
        </div>

        {/* Content Container */}
        <div className="sub-content-container">
          {/* Step 1: Plan Selection */}
          <div className={`sub-step-content ${step === 1 ? 'active' : ''}`} id="subStep1">
            <div className="plans-selection-grid">
              {PLANS.map(plan => (
                <div key={plan.storage} className={`plan-selection-card ${plan.popular ? 'popular-plan' : ''}`}
                  data-plan={plan.storage} data-price={plan.price}>
                  {plan.popular && (
                    <div className="popular-badge">
                      <i className="fas fa-star"></i>
                      <span className="lang-en">Popular</span>
                      <span className="lang-bn">জনপ্রিয়</span>
                    </div>
                  )}
                  <div className="plan-card-header">
                    <div className="plan-icon">
                      <i className={`fas ${plan.icon}`}></i>
                    </div>
                    <h3>
                      <span className="lang-en">{plan.label}</span>
                      <span className="lang-bn">{plan.labelBn}</span>
                    </h3>
                    <p className="plan-subtitle">
                      <span className="lang-en">{plan.subtitle}</span>
                      <span className="lang-bn">{plan.subtitleBn}</span>
                    </p>
                  </div>
                  <div className="plan-card-price">
                    <span className="price-currency">৳</span>
                    <span className="price-amount">{plan.price}</span>
                    <span className="price-period">
                      <span className="lang-en">Lifetime</span>
                      <span className="lang-bn">লাইফটাইম</span>
                    </span>
                  </div>
                  <ul className="plan-card-features">
                    {plan.features.map((f, fi) => (
                      <li key={fi}>
                        <i className="fas fa-check"></i>
                        <span className="lang-en">{f}</span>
                        <span className="lang-bn">{plan.featuresBn[fi]}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="plan-select-btn" onClick={() => { setSelectedPlan(plan); setStep(2); }}>
                    <span className="lang-en">Select This Plan</span>
                    <span className="lang-bn">এই প্ল্যান নির্বাচন করুন</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Payment Method */}
          <div className={`sub-step-content ${step === 2 ? 'active' : ''}`} id="subStep2">
            <div className="selected-plan-info">
              <h3>
                <span className="lang-en">Selected Plan: </span>
                <span className="lang-bn">নির্বাচিত প্ল্যান: </span>
                <strong id="selectedPlanDisplay">{selectedPlan ? (language === 'en' ? selectedPlan.label : selectedPlan.labelBn) : ''}</strong>
              </h3>
              <h2 className="selected-price" id="selectedPriceDisplay">৳{selectedPlan?.price}</h2>
            </div>

            <h3 className="payment-methods-title">
              <span className="lang-en">Choose Payment Method</span>
              <span className="lang-bn">পেমেন্ট পদ্ধতি নির্বাচন করুন</span>
            </h3>

            <div className="payment-methods-selection">
              {METHODS.map(method => (
                <button key={method.id} className="payment-method-option" data-method={method.id}
                  onClick={() => { setSelectedMethod(method.id); setStep(3); }}>
                  <div className="payment-method-logo">
                    <img src={`https://dfcl.com.bd/images/logo/payment/${method.id}.svg`} alt={method.name}
                      onError={e => { e.target.style.display = 'none'; }} />
                  </div>
                  <span>{method.name}</span>
                </button>
              ))}
            </div>

            <div className="step-actions">
              <button className="btn-secondary" id="backToPlansBtn" onClick={() => setStep(1)}>
                <i className="fas fa-arrow-left"></i>
                <span className="lang-en">Back to Plans</span>
                <span className="lang-bn">প্ল্যানে ফিরুন</span>
              </button>
            </div>
          </div>

          {/* Step 3: Payment Instructions */}
          <div className={`sub-step-content ${step === 3 ? 'active' : ''}`} id="subStep3">
            <div className="payment-instructions-container">
              <div className="payment-method-header">
                <div className="method-logo-display">
                  <img id="paymentMethodLogo"
                    src={selectedMethod ? `https://dfcl.com.bd/images/logo/payment/${selectedMethod}.svg` : ''}
                    alt={selectedMethod || ''} />
                </div>
                <h2 id="paymentMethodName">{METHODS.find(m => m.id === selectedMethod)?.name}</h2>
                <p className="instructions-subtitle">
                  <span className="lang-en">Send Money Instructions</span>
                  <span className="lang-bn">সেন্ড মানি নির্দেশনা</span>
                </p>
              </div>

              <div className="payment-details-box">
                <div className="detail-row">
                  <label>
                    <span className="lang-en">Send Money To:</span>
                    <span className="lang-bn">টাকা পাঠান:</span>
                  </label>
                  <div className="merchant-number-display">
                    <strong id="merchantNumberDisplay">{merchantNumber}</strong>
                    <button className="copy-number-btn" id="copyMerchantBtn" onClick={copyNumber}>
                      <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                      {copied ? (<><span className="lang-en">Copied!</span><span className="lang-bn">কপি হয়েছে!</span></>) : (<><span className="lang-en">Copy</span><span className="lang-bn">কপি</span></>)}
                    </button>
                  </div>
                </div>
                <div className="detail-row">
                  <label>
                    <span className="lang-en">Amount:</span>
                    <span className="lang-bn">পরিমাণ:</span>
                  </label>
                  <div className="amount-display" id="paymentAmountFinal">৳{selectedPlan?.price}</div>
                </div>
              </div>

              <div className="instructions-steps-box">
                <h4>
                  <span className="lang-en">Follow These Steps:</span>
                  <span className="lang-bn">এই ধাপগুলো অনুসরণ করুন:</span>
                </h4>
                <ol className="instruction-list">
                  <li>
                    <span className="lang-en">Open your <strong>{METHODS.find(m => m.id === selectedMethod)?.name}</strong> app</span>
                    <span className="lang-bn">আপনার <strong>{METHODS.find(m => m.id === selectedMethod)?.name}</strong> অ্যাপ খুলুন</span>
                  </li>
                  <li>
                    <span className="lang-en">Select <strong>"Send Money"</strong></span>
                    <span className="lang-bn"><strong>"সেন্ড মানি"</strong> সিলেক্ট করুন</span>
                  </li>
                  <li>
                    <span className="lang-en">Enter the merchant number and amount shown above</span>
                    <span className="lang-bn">উপরের মার্চেন্ট নম্বর এবং পরিমাণ দিন</span>
                  </li>
                  <li>
                    <span className="lang-en">Enter your PIN and confirm the transaction</span>
                    <span className="lang-bn">আপনার পিন দিন এবং ট্রানজেকশন কনফার্ম করুন</span>
                  </li>
                  <li>
                    <span className="lang-en">You'll receive a <strong>Transaction ID (TrxID)</strong> via SMS</span>
                    <span className="lang-bn">আপনি SMS এ একটি <strong>Transaction ID (TrxID)</strong> পাবেন</span>
                  </li>
                  <li>
                    <span className="lang-en">Copy the TrxID and paste it below, then submit</span>
                    <span className="lang-bn">TrxID কপি করে নিচে পেস্ট করুন এবং সাবমিট করুন</span>
                  </li>
                </ol>
              </div>

              <div className="trxid-input-box">
                <label htmlFor="transactionIdInput">
                  <i className="fas fa-receipt"></i>
                  <span className="lang-en">Transaction ID (TrxID)</span>
                  <span className="lang-bn">ট্রানজেকশন আইডি</span>
                </label>
                <input
                  type="text"
                  id="transactionIdInput"
                  placeholder={t('Enter TrxID', 'TrxID লিখুন')}
                  maxLength="20"
                  autoComplete="off"
                  value={trxId}
                  onChange={e => setTrxId(e.target.value)}
                />
                <p className="input-help">
                  <i className="fas fa-info-circle"></i>
                  <span className="lang-en">Example: AB12CD34EF56</span>
                  <span className="lang-bn">উদাহরণ: AB12CD34EF56</span>
                </p>
              </div>

              <div className="step-actions">
                <button className="btn-secondary" id="backToPaymentMethodBtn" onClick={() => setStep(2)}>
                  <i className="fas fa-arrow-left"></i>
                  <span className="lang-en">Change Method</span>
                  <span className="lang-bn">পদ্ধতি পরিবর্তন</span>
                </button>
                <button className="btn-primary" id="submitPaymentBtn" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <><i className="fas fa-spinner fa-spin"></i> <span className="lang-en">Processing...</span><span className="lang-bn">প্রসেস হচ্ছে...</span></>
                  ) : (
                    <><i className="fas fa-paper-plane"></i> <span className="lang-en">Submit Payment</span><span className="lang-bn">পেমেন্ট সাবমিট করুন</span></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
