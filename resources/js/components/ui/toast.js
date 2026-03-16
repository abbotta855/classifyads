// Lightweight toast utility for demo purposes
export function showToast(message, type = 'info') {
  const existing = document.getElementById('toast-container');
  let container = existing;
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.top = '60px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.padding = '10px 14px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  toast.style.color = '#0f172a';
  toast.style.background = type === 'success' ? '#dcfce7' : type === 'error' ? '#fee2e2' : '#e2e8f0';
  toast.style.border = type === 'success' ? '1px solid #22c55e' : type === 'error' ? '1px solid #ef4444' : '1px solid #cbd5e1';
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      toast.remove();
      if (container.childElementCount === 0) {
        container.remove();
      }
    }, 300);
  }, 2000);
}

