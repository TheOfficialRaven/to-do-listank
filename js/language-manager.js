// Language Manager Module
console.log('🌐 Language Manager module loading...');

let currentLanguage = 'hu';
let languageData = {};

// Default Hungarian translations
const defaultTranslations = {
  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.overview': 'Áttekintés', 
  'nav.lists': 'Listák',
  'nav.notes': 'Jegyzetek',
  'nav.calendar': 'Naptár',
  
  // Notes
  'notes.title': 'Jegyzetek',
  'notes.new_note': 'Új jegyzet',
  'notes.protected_content': 'Védett tartalom',
  'notes.password_required_view': 'Jelszó szükséges a megtekintéshez',
  'notes.unlock_note': 'Jegyzet feloldása',
  'notes.enter_password': 'Add meg a jelszót',
  'notes.unlock': 'Feloldás',
  'notes.cancel': 'Mégse',
  
  // Calendar
  'calendar.title': 'Naptár',
  'calendar.months.january': 'Január',
  'calendar.months.february': 'Február', 
  'calendar.months.march': 'Március',
  'calendar.months.april': 'Április',
  'calendar.months.may': 'Május',
  'calendar.months.june': 'Június',
  'calendar.months.july': 'Július',
  'calendar.months.august': 'Augusztus',
  'calendar.months.september': 'Szeptember',
  'calendar.months.october': 'Október',
  'calendar.months.november': 'November',
  'calendar.months.december': 'December',
  'calendar.days.monday': 'Hétfő',
  'calendar.days.tuesday': 'Kedd',
  'calendar.days.wednesday': 'Szerda', 
  'calendar.days.thursday': 'Csütörtök',
  'calendar.days.friday': 'Péntek',
  'calendar.days.saturday': 'Szombat',
  'calendar.days.sunday': 'Vasárnap',
  
  // Overview
  'overview.title': 'Áttekintés',
  'overview.achievements.explorer': 'Felfedező',
  'overview.achievements.explorer_desc': 'Próbáld ki az összes funkciót',
  'overview.achievements.available': 'Elérhető!',
  'overview.productivity_insights': 'Produktivitási betekintés',
  'overview.productivity_insights.completion': 'Befejezési ráta elemzése',
  'overview.productivity_insights.managing_lists': 'Listák kezelésének optimalizálása',
  'overview.productivity_insights.streak_active': 'Aktív sorozat fenntartása',
  'overview.productivity_insights.level_progress': 'Szint előrehaladás nyomon követése',
  
  // Common
  'common.save': 'Mentés',
  'common.cancel': 'Mégse',
  'common.delete': 'Törlés',
  'common.edit': 'Szerkesztés',
  'common.close': 'Bezárás',
  'common.yes': 'Igen',
  'common.no': 'Nem',
  'common.loading': 'Betöltés...'
};

// Initialize language system
async function initLanguageSystem() {
  console.log('🌐 Initializing language system...');
  
  // Load saved language preference
  const savedLanguage = localStorage.getItem('app-language') || 'hu';
  await loadLanguage(savedLanguage);
  
  // Update UI with translations
  updateUITexts();
  
  console.log('✅ Language system initialized');
}

// Load language data
async function loadLanguage(languageCode) {
  console.log(`🌐 Loading language: ${languageCode}`);
  
  currentLanguage = languageCode;
  
  try {
    // Try to load from languages folder
    const response = await fetch(`./languages/${languageCode}.json`);
    if (response.ok) {
      languageData = await response.json();
      console.log(`✅ Loaded language data for ${languageCode}`);
    } else {
      throw new Error('Language file not found');
    }
  } catch (error) {
    console.warn(`⚠️ Could not load language file for ${languageCode}, using defaults`);
    languageData = defaultTranslations;
  }
  
  // Save language preference
  localStorage.setItem('app-language', languageCode);
}

// Get translated text
function getText(key, placeholders = {}) {
  let text = languageData[key] || defaultTranslations[key] || key;
  
  // Replace placeholders
  Object.keys(placeholders).forEach(placeholder => {
    text = text.replace(`{${placeholder}}`, placeholders[placeholder]);
  });
  
  return text;
}

// Update all UI texts
function updateUITexts() {
  console.log('🌐 Updating UI texts...');
  
  // Update elements with data-text attribute
  document.querySelectorAll('[data-text]').forEach(element => {
    const key = element.getAttribute('data-text');
    element.textContent = getText(key);
  });
  
  // Update placeholders
  document.querySelectorAll('[data-placeholder]').forEach(element => {
    const key = element.getAttribute('data-placeholder');
    element.placeholder = getText(key);
  });
  
  // Update titles
  document.querySelectorAll('[data-title]').forEach(element => {
    const key = element.getAttribute('data-title');
    element.title = getText(key);
  });
  
  // Special handling for specific elements
  updateCalendarTexts();
  updateNotesTexts();
  updateOverviewTexts();
}

// Update calendar-specific texts
function updateCalendarTexts() {
  // Update calendar month display
  const monthElement = document.querySelector('.calendar-month');
  if (monthElement) {
    const currentDate = new Date();
    const monthKey = `calendar.months.${getMonthName(currentDate.getMonth()).toLowerCase()}`;
    monthElement.textContent = `${getText(monthKey)} ${currentDate.getFullYear()}`;
  }
  
  // Update day headers
  document.querySelectorAll('.calendar-day-header').forEach((header, index) => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    header.textContent = getText(`calendar.days.${dayNames[index]}`);
  });
}

// Update notes-specific texts
function updateNotesTexts() {
  // Update protected note overlays
  document.querySelectorAll('.note-content-overlay').forEach(overlay => {
    const protectedText = overlay.querySelector('.protected-text');
    const requiresText = overlay.querySelector('.password-required-text');
    
    if (protectedText) {
      protectedText.textContent = getText('notes.protected_content');
    }
    if (requiresText) {
      requiresText.textContent = getText('notes.password_required_view');
    }
  });
  
  // Update unlock buttons
  document.querySelectorAll('.unlock-btn').forEach(btn => {
    btn.textContent = getText('notes.unlock_note');
  });
}

// Update overview-specific texts
function updateOverviewTexts() {
  // Update achievement texts
  document.querySelectorAll('.achievement-badge').forEach(badge => {
    const titleElement = badge.querySelector('.badge-title');
    const descElement = badge.querySelector('.badge-description');
    
    if (titleElement && titleElement.textContent.includes('explorer')) {
      titleElement.textContent = getText('overview.achievements.explorer');
    }
    if (descElement && descElement.textContent.includes('Próbáld')) {
      descElement.textContent = getText('overview.achievements.explorer_desc');
    }
  });
  
  // Update productivity insights
  document.querySelectorAll('.insight-item').forEach(item => {
    const textElement = item.querySelector('.insight-text');
    if (textElement) {
      const text = textElement.textContent;
      if (text.includes('completion')) {
        textElement.textContent = getText('overview.productivity_insights.completion');
      } else if (text.includes('managing')) {
        textElement.textContent = getText('overview.productivity_insights.managing_lists');
      } else if (text.includes('streak')) {
        textElement.textContent = getText('overview.productivity_insights.streak_active');
      } else if (text.includes('level')) {
        textElement.textContent = getText('overview.productivity_insights.level_progress');
      }
    }
  });
}

// Helper function to get month name
function getMonthName(monthIndex) {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  return months[monthIndex];
}

// Language dropdown initialization
function initLanguageDropdown() {
  const languageBtn = document.getElementById('language-btn');
  const languageDropdown = document.getElementById('language-dropdown');
  
  if (languageBtn && languageDropdown) {
    languageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      languageDropdown.classList.toggle('show');
    });
    
    // Language selection
    languageDropdown.addEventListener('click', async (e) => {
      if (e.target.tagName === 'A') {
        e.preventDefault();
        const newLanguage = e.target.getAttribute('data-lang');
        if (newLanguage && newLanguage !== currentLanguage) {
          await loadLanguage(newLanguage);
          updateUITexts();
          markCurrentLanguage();
        }
        languageDropdown.classList.remove('show');
      }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      languageDropdown.classList.remove('show');
    });
    
    // Mark current language
    markCurrentLanguage();
  }
}

// Mark current language in dropdown
function markCurrentLanguage() {
  document.querySelectorAll('#language-dropdown a').forEach(link => {
    link.classList.remove('current');
    if (link.getAttribute('data-lang') === currentLanguage) {
      link.classList.add('current');
    }
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initLanguageDropdown();
  });
} else {
  initLanguageDropdown();
}

console.log('✅ Language Manager module loaded successfully');

export { 
  initLanguageSystem, 
  loadLanguage, 
  getText, 
  updateUITexts, 
  currentLanguage,
  initLanguageDropdown,
  markCurrentLanguage
}; 