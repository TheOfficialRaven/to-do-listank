// =================================
// SIMPLE TARGET GROUP SYSTEM
// =================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log('🎯 Loading simple target group system...');

// Firebase konfiguráció - ugyanaz mint az index.js-ben
const firebaseConfig = {
  apiKey: "AIzaSyBLrDOTSC_bA1mxQpaIfyAz-Eyan26TVT0",
  authDomain: "leads-tracker-app-78b83.firebaseapp.com",
  databaseURL: "https://leads-tracker-app-78b83-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "leads-tracker-app-78b83",
  storageBucket: "leads-tracker-app-78b83.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "1:907489703312:web:c4138807d8a7aa96512f15"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Biztonságos showNotification függvény
function showNotificationSafe(message) {
  if (typeof window.showNotification === 'function') {
    window.showNotification(message);
  } else if (typeof showNotification === 'function') {
    showNotification(message);
  } else {
    console.log('Notification:', message);
    alert(message);
  }
}

// Target Groups adatai
const TARGET_GROUPS = {
  student: { id: 'student', icon: '🎓', color: '#3498db', name: 'Diák' },
  young_professional: { id: 'young_professional', icon: '💼', color: '#e74c3c', name: 'Fiatal Szakember' },
  self_developer: { id: 'self_developer', icon: '🌱', color: '#27ae60', name: 'Önfejlesztő' },
  organizer: { id: 'organizer', icon: '📋', color: '#f39c12', name: 'Szervező' }
};

// Profil dropdown bővítése
function addTargetGroupToProfile() {
  console.log('🎯 Adding target group to profile...');
  
  const profileDropdown = document.getElementById('profile-dropdown');
  if (!profileDropdown) {
    console.warn('❌ Profile dropdown not found');
    return;
  }
  
  // Ellenőrizzük, hogy már hozzá van-e adva
  if (document.getElementById('target-group-item')) {
    console.log('✅ Target group already in profile');
    return;
  }
  
  // Új elem létrehozása
  const targetGroupItem = document.createElement('div');
  targetGroupItem.id = 'target-group-item';
  targetGroupItem.className = 'privacy-menu-btn';
  targetGroupItem.style.cursor = 'pointer';
  targetGroupItem.innerHTML = '🎯 Célcsoport';
  
  // Event listener hozzáadása
  targetGroupItem.addEventListener('click', () => {
    profileDropdown.classList.remove('show');
    showTargetGroupModal();
  });
  
  // Hozzáadás a privacy gomb elé
  const privacyBtn = document.getElementById('privacy-btn');
  if (privacyBtn && privacyBtn.parentNode) {
    privacyBtn.parentNode.insertBefore(targetGroupItem, privacyBtn);
  } else {
    profileDropdown.appendChild(targetGroupItem);
  }
  
  console.log('✅ Target group added to profile dropdown');
}

// Target group modal megjelenítése
function showTargetGroupModal() {
  console.log('🎯 Showing target group modal...');
  
  // Ha már létezik, távolítsuk el
  const existingModal = document.getElementById('target-group-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Modal létrehozása
  const modal = document.createElement('div');
  modal.id = 'target-group-modal';
  modal.className = 'modal';
  modal.style.display = 'flex';
  
  const cardsHtml = Object.values(TARGET_GROUPS).map(group => `
    <div class="target-group-card" data-group="${group.id}" 
         style="border: 2px solid ${group.color}; border-radius: 10px; padding: 15px; text-align: center; cursor: pointer; transition: all 0.3s ease; background: white;">
      <div style="font-size: 2rem; margin-bottom: 10px;">${group.icon}</div>
      <div style="font-weight: bold; color: ${group.color}; font-size: 14px;">${group.name}</div>
    </div>
  `).join('');
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3>🎯 Célcsoport választása</h3>
        <button class="close-btn" onclick="closeTargetGroupModal()">×</button>
      </div>
      <div class="modal-body" style="padding: 20px;">
        <p style="margin-bottom: 20px; text-align: center;">Válaszd ki a célcsoportodat sablon feladatok generálásához:</p>
        <div id="target-group-options" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px;">
          ${cardsHtml}
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="closeTargetGroupModal()" class="secondary-btn">Bezárás</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Kártya kattintás event és hover effektek
  document.querySelectorAll('.target-group-card').forEach(card => {
    card.addEventListener('click', () => {
      const groupId = card.dataset.group;
      selectTargetGroup(groupId);
    });
    
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.05)';
      card.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1)';
      card.style.boxShadow = 'none';
    });
  });
}

// Target group kiválasztása
async function selectTargetGroup(groupId) {
  console.log('🎯 Selected target group:', groupId);
  
  if (!auth.currentUser) {
    console.warn('❌ No authenticated user');
    showNotificationSafe('❌ Nincs bejelentkezett felhasználó');
    return;
  }
  
  try {
    // Mentás Firebase-be
    await set(ref(db, `users/${auth.currentUser.uid}/targetGroup`), groupId);
    
    showNotificationSafe(`✅ Célcsoport beállítva: ${TARGET_GROUPS[groupId].name}`);
    
    closeTargetGroupModal();
    
    // Template feladatok generálása
    generateSimpleTemplateTasks(groupId);
    
  } catch (error) {
    console.error('❌ Error saving target group:', error);
    showNotificationSafe('❌ Hiba történt a célcsoport mentésekor');
  }
}

// Template feladatok generálása
async function generateSimpleTemplateTasks(groupId) {
  console.log('📝 Generating simple template tasks for:', groupId);
  
  const templates = {
    student: ['Tanulás', 'Házi feladat', 'Vizsgára készülés', 'Jegyzetelés', 'Könyvtári kutatás'],
    young_professional: ['Networking esemény', 'LinkedIn frissítés', 'Prezentáció készítés', 'Mentor találkozó', 'Tanfolyam keresés'],
    self_developer: ['Napi meditáció', 'Új készség tanulása', 'Könyv olvasás', 'Önértékelés', 'Napló írás'],
    organizer: ['Esemény tervezés', 'Csapat meeting', 'Projekt koordinálás', 'Vendég meghívás', 'Költségvetés tervezés']
  };
  
  const taskList = templates[groupId] || [];
  if (taskList.length === 0) return;
  
  try {
    // Lista létrehozása
    const listsRef = ref(db, `users/${auth.currentUser.uid}/lists`);
    const newListRef = push(listsRef);
    
    await set(newListRef, {
      name: `${TARGET_GROUPS[groupId].name} feladatok`,
      category: 'template',
      order: Date.now(),
      items: {}
    });
    
    // Feladatok hozzáadása
    const itemsRef = ref(db, `users/${auth.currentUser.uid}/lists/${newListRef.key}/items`);
    
    for (const task of taskList) {
      const taskRef = push(itemsRef);
      await set(taskRef, {
        text: task,
        done: false,
        created: Date.now()
      });
    }
    
    showNotificationSafe(`📝 ${taskList.length} sablon feladat létrehozva!`);
    
    // Listák újratöltése ha a funkció elérhető
    if (typeof window.loadUserLists === 'function' && auth.currentUser) {
      setTimeout(() => {
        window.loadUserLists(auth.currentUser.uid);
      }, 500);
    } else if (typeof loadUserLists === 'function' && auth.currentUser) {
      setTimeout(() => {
        loadUserLists(auth.currentUser.uid);
      }, 500);
    }
    
  } catch (error) {
    console.error('❌ Error generating template tasks:', error);
    showNotificationSafe('❌ Hiba történt a sablon feladatok létrehozásakor');
  }
}

// Modal bezárása
function closeTargetGroupModal() {
  const modal = document.getElementById('target-group-modal');
  if (modal) {
    modal.remove();
  }
}

// Globális függvények
window.closeTargetGroupModal = closeTargetGroupModal;
window.showTargetGroupModal = showTargetGroupModal;
window.selectTargetGroup = selectTargetGroup;
window.addTargetGroupToProfile = addTargetGroupToProfile;

// Auto inicializálás DOM ready után
document.addEventListener('DOMContentLoaded', () => {
  // Várunk egy kicsit, hogy a főoldal inicializálódjon
  setTimeout(() => {
    if (document.getElementById('profile-dropdown')) {
      addTargetGroupToProfile();
      console.log('✅ Target group auto-initialized');
    } else {
      console.log('⏳ Profile dropdown not ready, retrying...');
      setTimeout(() => {
        if (document.getElementById('profile-dropdown')) {
          addTargetGroupToProfile();
          console.log('✅ Target group initialized on retry');
        }
      }, 2000);
    }
  }, 1000);
});

console.log('✅ Simple target group system loaded'); 