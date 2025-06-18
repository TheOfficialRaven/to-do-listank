// Theme Management
class ThemeManager {
  constructor() {
    this.themeModal = document.getElementById('theme-modal');
    this.themeModalClose = document.getElementById('theme-modal-close');
    this.themeCards = document.querySelectorAll('.modern-theme-card');
    this.themeModeButtons = document.querySelectorAll('.theme-mode-btn');
    this.currentTheme = localStorage.getItem('theme') || 'default';
    this.currentMode = localStorage.getItem('themeMode') || 'light';
    
    this.init();
  }

  init() {
    // Apply saved theme and mode
    this.applyTheme(this.currentTheme);
    this.applyMode(this.currentMode);

    // Event listeners
    this.themeModalClose?.addEventListener('click', () => this.closeThemeModal());
    this.themeCards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.theme-mode-btn')) {
          const theme = card.dataset.theme;
          this.applyTheme(theme);
        }
      });
    });

    this.themeModeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = btn.dataset.mode;
        this.applyMode(mode);
      });
    });

    // Update theme card checkmarks
    this.updateThemeCheckmarks();
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.currentTheme = theme;
    this.updateThemeCheckmarks();
  }

  applyMode(mode) {
    document.documentElement.setAttribute('data-theme-mode', mode);
    localStorage.setItem('themeMode', mode);
    this.currentMode = mode;
  }

  updateThemeCheckmarks() {
    this.themeCards.forEach(card => {
      const checkIcon = card.querySelector('.theme-check-icon');
      if (card.dataset.theme === this.currentTheme) {
        checkIcon.style.display = 'flex';
      } else {
        checkIcon.style.display = 'none';
      }
    });
  }

  openThemeModal() {
    this.themeModal.style.display = 'block';
  }

  closeThemeModal() {
    this.themeModal.style.display = 'none';
  }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other modules
export default themeManager; 