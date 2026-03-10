import { useApp } from '../context/AppContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };

  return (
    <div className="toast-container" id="toastContainer">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type} show`} onClick={() => removeToast(toast.id)}>
          <i className={`fas ${icons[toast.type] || icons.info}`}></i>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
