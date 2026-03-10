export default function LoadingScreen() {
  return (
    <div className="loading-screen" id="loadingScreen">
      <div className="loading-content">
        <div className="loading-logo">
          <div className="loading-logo-icon">
            <i className="fas fa-cloud"></i>
          </div>
          <span className="loading-logo-text">Nakib Cloud</span>
        </div>
        <div className="loading-spinner">
          <div className="ios-spinner">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="ios-blade" style={{ '--blade-index': i }} />
            ))}
          </div>
        </div>
        <p className="loading-text">
          <span className="lang-en">Loading your files…</span>
          <span className="lang-bn">ফাইল লোড হচ্ছে…</span>
        </p>
      </div>
    </div>
  );
}
