export default function LoadingScreen() {
  return (
    <div className="loading-screen" id="loadingScreen">
      <div className="loading-logo">
        <i className="fas fa-cloud loading-icon"></i>
        <span>Nakib Cloud</span>
      </div>
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
      <p className="loading-text">
        <span className="lang-en">Loading your files...</span>
        <span className="lang-bn">ফাইল লোড হচ্ছে...</span>
      </p>
    </div>
  );
}
