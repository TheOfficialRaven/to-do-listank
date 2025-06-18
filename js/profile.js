// Profile Management
class ProfileManager {
  constructor() {
    this.profileButton = document.querySelector('.profile-button');
    this.profileDropdown = document.querySelector('.profile-dropdown');
    this.isDropdownOpen = false;
    
    this.init();
  }

  init() {
    // Event listeners
    this.profileButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.profileDropdown?.contains(e.target) && !this.profileButton?.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Handle dropdown menu items
    const menuItems = this.profileDropdown?.querySelectorAll('.dropdown-item');
    menuItems?.forEach(item => {
      item.addEventListener('click', (e) => {
        const action = item.dataset.action;
        this.handleMenuItemAction(action);
      });
    });
  }

  toggleDropdown() {
    if (this.isDropdownOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    this.profileDropdown?.classList.add('active');
    this.isDropdownOpen = true;
  }

  closeDropdown() {
    this.profileDropdown?.classList.remove('active');
    this.isDropdownOpen = false;
  }

  handleMenuItemAction(action) {
    switch (action) {
      case 'profile':
        this.openProfilePage();
        break;
      case 'settings':
        this.openSettings();
        break;
      case 'logout':
        this.handleLogout();
        break;
      default:
        console.warn('Unknown menu item action:', action);
    }
    this.closeDropdown();
  }

  openProfilePage() {
    // Navigate to profile page
    window.location.href = '/profile';
  }

  openSettings() {
    // Open settings modal or navigate to settings page
    console.log('Opening settings...');
  }

  handleLogout() {
    // Handle logout logic
    console.log('Logging out...');
    // Clear user data and redirect to login
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

// Initialize profile manager
const profileManager = new ProfileManager();

// Export for use in other modules
export default profileManager; 