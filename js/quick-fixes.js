// Quick Fixes Module for Language Keys and UI Issues
console.log('🔧 Quick Fixes module loading...');

// Import language manager
import { getText, updateUITexts } from './language-manager.js';

// Fix language key display by replacing common keys with actual text
function fixLanguageKeys() {
  console.log('🔧 Fixing language key displays...');
  
  // Replace common language keys with actual text
  const replacements = {
    'notes.protected_content': 'Védett tartalom',
    'notes.password_required_view': 'Jelszó szükséges a megtekintéshez',
    'notes.unlock_note': 'Jegyzet feloldása',
    'calendar.months.june': 'Június',
    'calendar.months.january': 'Január',
    'calendar.months.february': 'Február',
    'calendar.months.march': 'Március',
    'calendar.months.april': 'Április', 
    'calendar.months.may': 'Május',
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
    'overview.productivity_insights.completion': 'Befejezési ráta elemzése',
    'overview.productivity_insights.managing_lists': 'Listák kezelésének optimalizálása',
    'overview.productivity_insights.streak_active': 'Aktív sorozat fenntartása',
    'overview.productivity_insights.level_progress': 'Szint előrehaladás nyomon követése'
  };
  
  // Find and replace all text nodes containing language keys
  function replaceTextInElement(element) {
    if (element.nodeType === Node.TEXT_NODE) {
      let text = element.textContent.trim();
      if (replacements[text]) {
        element.textContent = replacements[text];
      }
    } else {
      for (let child of element.childNodes) {
        replaceTextInElement(child);
      }
    }
  }
  
  // Apply to entire document
  replaceTextInElement(document.body);
  
  // Also check for specific elements that might have been missed
  document.querySelectorAll('*').forEach(element => {
    const text = element.textContent.trim();
    if (replacements[text] && element.children.length === 0) {
      element.textContent = replacements[text];
    }
  });
  
  console.log('✅ Language keys fixed');
}

// Fix calendar display specifically
function fixCalendarDisplay() {
  // Fix calendar month and year display
  const calendarHeaders = document.querySelectorAll('.calendar-header h3, .calendar-month');
  calendarHeaders.forEach(header => {
    if (header.textContent.includes('calendar.months.')) {
      const currentDate = new Date();
      const monthNames = [
        'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
        'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
      ];
      header.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  });
  
  // Fix day headers
  const dayHeaders = document.querySelectorAll('.calendar-day-header');
  const dayNames = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
  dayHeaders.forEach((header, index) => {
    if (header.textContent.includes('calendar.days.') || index < dayNames.length) {
      header.textContent = dayNames[index] || dayNames[0];
    }
  });
}

// Fix notes display
function fixNotesDisplay() {
  // Fix protected content overlays
  document.querySelectorAll('.note-content-overlay').forEach(overlay => {
    const h4 = overlay.querySelector('h4');
    const p = overlay.querySelector('p');
    
    if (h4 && h4.textContent.includes('notes.protected_content')) {
      h4.textContent = 'Védett tartalom';
    }
    if (p && p.textContent.includes('notes.password_required_view')) {
      p.textContent = 'Jelszó szükséges a megtekintéshez';
    }
  });
  
  // Fix unlock buttons
  document.querySelectorAll('.unlock-btn').forEach(btn => {
    if (btn.textContent.includes('notes.unlock_note')) {
      btn.textContent = 'Jegyzet feloldása';
    }
  });
}

// Fix overview display
function fixOverviewDisplay() {
  // Fix productivity insights
  document.querySelectorAll('.insight-text').forEach(element => {
    const text = element.textContent;
    if (text.includes('overview.productivity_insights.completion')) {
      element.textContent = 'Befejezési ráta elemzése';
    } else if (text.includes('overview.productivity_insights.managing_lists')) {
      element.textContent = 'Listák kezelésének optimalizálása';
    } else if (text.includes('overview.productivity_insights.streak_active')) {
      element.textContent = 'Aktív sorozat fenntartása';
    } else if (text.includes('overview.productivity_insights.level_progress')) {
      element.textContent = 'Szint előrehaladás nyomon követése';
    }
  });
}

// Run fixes when DOM changes
function observeAndFix() {
  const observer = new MutationObserver(() => {
    fixLanguageKeys();
    fixCalendarDisplay();
    fixNotesDisplay();
    fixOverviewDisplay();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  
  console.log('🔧 DOM observer started for language fixes');
}

// Initialize fixes
function initQuickFixes() {
  console.log('🔧 Initializing quick fixes...');
  
  // Run immediate fixes
  setTimeout(() => {
    fixLanguageKeys();
    fixCalendarDisplay();
    fixNotesDisplay();
    fixOverviewDisplay();
  }, 500);
  
  // Run fixes after tab changes
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      setTimeout(() => {
        fixLanguageKeys();
        fixCalendarDisplay();
        fixNotesDisplay();
        fixOverviewDisplay();
      }, 100);
    });
  });
  
  // Start observing for dynamic content
  observeAndFix();
  
  // Run fixes periodically
  setInterval(() => {
    fixLanguageKeys();
  }, 5000);
  
  console.log('✅ Quick fixes initialized');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuickFixes);
} else {
  initQuickFixes();
}

// Export for manual usage
window.fixLanguageKeys = fixLanguageKeys;
window.fixCalendarDisplay = fixCalendarDisplay;
window.fixNotesDisplay = fixNotesDisplay;
window.fixOverviewDisplay = fixOverviewDisplay;

console.log('✅ Quick Fixes module loaded successfully');

export { 
  fixLanguageKeys, 
  fixCalendarDisplay, 
  fixNotesDisplay, 
  fixOverviewDisplay,
  initQuickFixes
}; 