// Notification Management
import { getCurrentUser } from './auth.js';

// Show notification
export function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="btn-icon close-notification" title="Bezárás">
        <span class="material-icons">close</span>
      </button>
    </div>
  `;
  
  // Add to container
  const container = document.querySelector('.notifications-container');
  if (!container) {
    const newContainer = document.createElement('div');
    newContainer.className = 'notifications-container';
    document.body.appendChild(newContainer);
    container = newContainer;
  }
  
  container.appendChild(notification);
  
  // Add close button event listener
  const closeButton = notification.querySelector('.close-notification');
  closeButton?.addEventListener('click', () => {
    removeNotification(notification);
  });
  
  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(notification);
    }, duration);
  }
  
  // Add animation
  requestAnimationFrame(() => {
    notification.classList.add('show');
  });
  
  return notification;
}

// Remove notification
export function removeNotification(notification) {
  notification.classList.remove('show');
  notification.classList.add('hide');
  
  // Remove from DOM after animation
  notification.addEventListener('animationend', () => {
    notification.remove();
    
    // Remove container if empty
    const container = document.querySelector('.notifications-container');
    if (container && container.children.length === 0) {
      container.remove();
    }
  });
}

// Show success notification
export function showSuccess(message, duration = 3000) {
  return showNotification(message, 'success', duration);
}

// Show error notification
export function showError(message, duration = 5000) {
  return showNotification(message, 'error', duration);
}

// Show warning notification
export function showWarning(message, duration = 4000) {
  return showNotification(message, 'warning', duration);
}

// Show info notification
export function showInfo(message, duration = 3000) {
  return showNotification(message, 'info', duration);
}

// Show loading notification
export function showLoading(message) {
  const notification = showNotification(message, 'loading', 0);
  notification.classList.add('loading');
  return notification;
}

// Update loading notification
export function updateLoading(notification, message) {
  if (!notification) return;
  
  const messageElement = notification.querySelector('.notification-message');
  if (messageElement) {
    messageElement.textContent = message;
  }
}

// Hide loading notification
export function hideLoading(notification) {
  if (!notification) return;
  removeNotification(notification);
}

// Show confirmation dialog
export function showConfirmation(message, onConfirm, onCancel) {
  const dialog = document.createElement('div');
  dialog.className = 'confirmation-dialog';
  dialog.innerHTML = `
    <div class="confirmation-content">
      <p class="confirmation-message">${message}</p>
      <div class="confirmation-actions">
        <button class="btn btn-secondary cancel-btn">Mégse</button>
        <button class="btn btn-primary confirm-btn">Igen</button>
      </div>
    </div>
  `;
  
  // Add to container
  const container = document.querySelector('.notifications-container');
  if (!container) {
    const newContainer = document.createElement('div');
    newContainer.className = 'notifications-container';
    document.body.appendChild(newContainer);
    container = newContainer;
  }
  
  container.appendChild(dialog);
  
  // Add event listeners
  const confirmButton = dialog.querySelector('.confirm-btn');
  const cancelButton = dialog.querySelector('.cancel-btn');
  
  confirmButton?.addEventListener('click', () => {
    removeDialog(dialog);
    onConfirm?.();
  });
  
  cancelButton?.addEventListener('click', () => {
    removeDialog(dialog);
    onCancel?.();
  });
  
  // Add animation
  requestAnimationFrame(() => {
    dialog.classList.add('show');
  });
  
  return dialog;
}

// Remove dialog
function removeDialog(dialog) {
  dialog.classList.remove('show');
  dialog.classList.add('hide');
  
  // Remove from DOM after animation
  dialog.addEventListener('animationend', () => {
    dialog.remove();
    
    // Remove container if empty
    const container = document.querySelector('.notifications-container');
    if (container && container.children.length === 0) {
      container.remove();
    }
  });
}

// Show toast notification
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  // Add to container
  const container = document.querySelector('.toast-container');
  if (!container) {
    const newContainer = document.createElement('div');
    newContainer.className = 'toast-container';
    document.body.appendChild(newContainer);
    container = newContainer;
  }
  
  container.appendChild(toast);
  
  // Add animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }
  
  return toast;
}

// Remove toast
function removeToast(toast) {
  toast.classList.remove('show');
  toast.classList.add('hide');
  
  // Remove from DOM after animation
  toast.addEventListener('animationend', () => {
    toast.remove();
    
    // Remove container if empty
    const container = document.querySelector('.toast-container');
    if (container && container.children.length === 0) {
      container.remove();
    }
  });
}

// Show success toast
export function showSuccessToast(message, duration = 3000) {
  return showToast(message, 'success', duration);
}

// Show error toast
export function showErrorToast(message, duration = 5000) {
  return showToast(message, 'error', duration);
}

// Show warning toast
export function showWarningToast(message, duration = 4000) {
  return showToast(message, 'warning', duration);
}

// Show info toast
export function showInfoToast(message, duration = 3000) {
  return showToast(message, 'info', duration);
}

// Make notification functions globally available
window.showNotification = showNotification;
window.removeNotification = removeNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.showLoading = showLoading;
window.updateLoading = updateLoading;
window.hideLoading = hideLoading;
window.showConfirmation = showConfirmation;
window.showToast = showToast;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;
window.showWarningToast = showWarningToast;
window.showInfoToast = showInfoToast; 