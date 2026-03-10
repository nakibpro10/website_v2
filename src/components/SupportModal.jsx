import { SUPPORT_WHATSAPP } from '../config';

export default function SupportModal({ onClose }) {
  return (
    <div className="modal-overlay active" id="supportModal">
      <div className="modal">
        <div className="modal-header">
          <h3><i className="fas fa-headset"></i> <span className="lang-en">Help &amp; Support</span><span className="lang-bn">সাহায্য ও সাপোর্ট</span></h3>
          <button className="modal-close" id="closeSupportModal" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="support-content">
            <div className="support-icon"><i className="fas fa-life-ring"></i></div>
            <h3><span className="lang-en">Contact Support</span><span className="lang-bn">সাপোর্টে যোগাযোগ করুন</span></h3>
            <p><span className="lang-en">Need help? Reach out to us on WhatsApp for quick assistance.</span><span className="lang-bn">সাহায্য দরকার? দ্রুত সহায়তার জন্য WhatsApp-এ আমাদের সাথে যোগাযোগ করুন।</span></p>
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-success btn-lg whatsapp-btn"
            >
              <i className="fab fa-whatsapp"></i>
              <span className="lang-en">Chat on WhatsApp</span>
              <span className="lang-bn">WhatsApp-এ চ্যাট করুন</span>
            </a>
            <div className="support-info-boxes">
              <div className="support-info-box">
                <i className="fas fa-clock"></i>
                <div>
                  <strong><span className="lang-en">Response Time</span><span className="lang-bn">সাড়া দেওয়ার সময়</span></strong>
                  <p><span className="lang-en">Within 24 hours</span><span className="lang-bn">২৪ ঘণ্টার মধ্যে</span></p>
                </div>
              </div>
              <div className="support-info-box">
                <i className="fas fa-language"></i>
                <div>
                  <strong><span className="lang-en">Languages</span><span className="lang-bn">ভাষা</span></strong>
                  <p><span className="lang-en">English & Bengali</span><span className="lang-bn">ইংরেজি ও বাংলা</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            <span className="lang-en">Close</span><span className="lang-bn">বন্ধ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
}
