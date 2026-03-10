export default function PrivacyModal({ onClose }) {
  return (
    <div className="modal-overlay tos-modal active" id="privacyModal">
      <div className="modal">
        <div className="modal-header">
          <h3><i className="fas fa-shield-alt"></i> <span className="lang-en">Privacy Policy</span><span className="lang-bn">গোপনীয়তা নীতি</span></h3>
          <button className="modal-close" id="closePrivacyModal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="tos-header">
            <div className="tos-header-icon"><i className="fas fa-user-shield"></i></div>
            <h2>Nakib Cloud</h2>
            <p><span className="lang-en">Privacy Policy</span><span className="lang-bn">গোপনীয়তা নীতি</span></p>
          </div>
          <div className="tos-content">
            <div className="tos-section">
              <h4 className="tos-section-title"><i className="fas fa-database"></i> <span className="lang-en">1. Information We Collect</span><span className="lang-bn">১. আমরা যে তথ্য সংগ্রহ করি</span></h4>
              <ul>
                <li><strong className="lang-en">Account Information:</strong><strong className="lang-bn">অ্যাকাউন্ট তথ্য:</strong> <span className="lang-en">Name, email address, and authentication details.</span><span className="lang-bn">নাম, ইমেইল ঠিকানা এবং প্রমাণীকরণ বিবরণ।</span></li>
                <li><strong className="lang-en">File Metadata:</strong><strong className="lang-bn">ফাইল মেটাডেটা:</strong> <span className="lang-en">File names, sizes, types, and upload timestamps.</span><span className="lang-bn">ফাইলের নাম, আকার, ধরন এবং আপলোডের সময়।</span></li>
              </ul>
            </div>
            <div className="tos-section">
              <h4 className="tos-section-title"><i className="fas fa-lock"></i> <span className="lang-en">2. Data Security</span><span className="lang-bn">২. ডেটা নিরাপত্তা</span></h4>
              <div className="tos-info-box">
                <i className="fas fa-shield-alt"></i>
                <p><span className="lang-en"><strong>End-to-End Encryption:</strong> All your files are encrypted with your personal PIN. We cannot access your encrypted files without your PIN.</span><span className="lang-bn"><strong>এন্ড-টু-এন্ড এনক্রিপশন:</strong> আপনার সমস্ত ফাইল আপনার ব্যক্তিগত পিন দিয়ে এনক্রিপ্ট করা।</span></p>
              </div>
            </div>
            <div className="tos-section">
              <h4 className="tos-section-title"><i className="fas fa-ban"></i> <span className="lang-en">3. We Do NOT</span><span className="lang-bn">৩. আমরা করি না</span></h4>
              <ul>
                <li><span className="lang-en">Sell your personal data to third parties</span><span className="lang-bn">তৃতীয় পক্ষের কাছে আপনার ব্যক্তিগত তথ্য বিক্রি করি</span></li>
                <li><span className="lang-en">Share your encrypted files with anyone</span><span className="lang-bn">আপনার এনক্রিপ্টেড ফাইল কারও সাথে শেয়ার করি</span></li>
                <li><span className="lang-en">Access your files without legal authorization</span><span className="lang-bn">আইনি অনুমোদন ছাড়া আপনার ফাইল অ্যাক্সেস করি</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" id="acceptPrivacyBtn" onClick={onClose}>
            <i className="fas fa-check"></i>
            <span className="lang-en">I Understand</span><span className="lang-bn">আমি বুঝেছি</span>
          </button>
        </div>
      </div>
    </div>
  );
}
