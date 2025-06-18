/* ===================================
   NOTES-MANAGER.JS - Notes Management
   =================================== */

import { db, ref, push, onValue, remove, set, get, update } from './firebase-config.js';
import { showNotification, getCurrentUser } from './app-core.js';

// Note modal elements
let noteModal = null;
let saveNoteBtn = null;
let cancelNoteBtn = null;
let noteModalClose = null;

/**
 * Initialize notes manager
 */
export function initializeNotesManager() {
  console.log('🗒️ Initializing Notes Manager...');
  
  // Get DOM elements
  noteModal = document.getElementById("note-modal");
  saveNoteBtn = document.getElementById("save-note");
  cancelNoteBtn = document.getElementById("cancel-note");
  noteModalClose = document.getElementById("note-modal-close");
  
  // Set up event listeners
  setupNoteEventListeners();
  
  // Load existing notes
  loadNotes();
  
  console.log('✅ Notes Manager initialized');
}

/**
 * Set up note event listeners
 */
function setupNoteEventListeners() {
  const newNoteBtn = document.getElementById("new-note-btn");
  
  if (newNoteBtn) {
    newNoteBtn.addEventListener('click', () => openNoteModal());
  }
  
  if (saveNoteBtn) {
    saveNoteBtn.addEventListener('click', saveNote);
  }
  
  if (cancelNoteBtn) {
    cancelNoteBtn.addEventListener('click', closeNoteModal);
  }
  
  if (noteModalClose) {
    noteModalClose.addEventListener('click', closeNoteModal);
  }
  
  // Password toggle functionality
  setupPasswordToggle();
}

/**
 * Open note modal for creating or editing
 */
export function openNoteModal(noteId = null) {
  if (!noteModal) return;
  
  clearNoteModal();
  
  if (noteId) {
    // Load existing note for editing
    loadNoteForEdit(noteId);
  }
  
  noteModal.style.display = 'flex';
  
  // Focus on title input
  const titleInput = document.getElementById('note-title');
  if (titleInput) {
    titleInput.focus();
  }
}

/**
 * Close note modal
 */
export function closeNoteModal() {
  if (noteModal) {
    noteModal.style.display = 'none';
  }
  clearNoteModal();
}

/**
 * Clear note modal inputs
 */
function clearNoteModal() {
  const titleInput = document.getElementById('note-title');
  const contentInput = document.getElementById('note-content');
  const categorySelect = document.getElementById('note-category');
  const passwordInput = document.getElementById('note-password');
  const isPrivateCheckbox = document.getElementById('note-private');
  
  if (titleInput) titleInput.value = '';
  if (contentInput) contentInput.value = '';
  if (categorySelect) categorySelect.value = 'personal';
  if (passwordInput) passwordInput.value = '';
  if (isPrivateCheckbox) isPrivateCheckbox.checked = false;
  
  // Hide password section
  const passwordSection = document.getElementById('note-password-section');
  if (passwordSection) {
    passwordSection.style.display = 'none';
  }
}

/**
 * Setup password toggle functionality
 */
function setupPasswordToggle() {
  const isPrivateCheckbox = document.getElementById('note-private');
  const passwordSection = document.getElementById('note-password-section');
  
  if (isPrivateCheckbox && passwordSection) {
    isPrivateCheckbox.addEventListener('change', function() {
      passwordSection.style.display = this.checked ? 'block' : 'none';
    });
  }
}

/**
 * Save note to Firebase
 */
async function saveNote() {
  const user = getCurrentUser();
  if (!user) {
    showNotification('❌ You must be logged in to save notes', 'error');
    return;
  }
  
  const titleInput = document.getElementById('note-title');
  const contentInput = document.getElementById('note-content');
  const categorySelect = document.getElementById('note-category');
  const passwordInput = document.getElementById('note-password');
  const isPrivateCheckbox = document.getElementById('note-private');
  
  const title = titleInput?.value?.trim();
  const content = contentInput?.value?.trim();
  const category = categorySelect?.value || 'personal';
  const password = passwordInput?.value?.trim();
  const isPrivate = isPrivateCheckbox?.checked || false;
  
  if (!title) {
    showNotification('❌ Please enter a title', 'error');
    return;
  }
  
  if (!content) {
    showNotification('❌ Please enter content', 'error');
    return;
  }
  
  if (isPrivate && !password) {
    showNotification('❌ Please enter a password for private notes', 'error');
    return;
  }
  
  try {
    const noteData = {
      title,
      content: isPrivate ? await encryptContent(content, password) : content,
      category,
      isPrivate,
      passwordHash: isPrivate ? await hashPassword(password) : null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false
    };
    
    const notesRef = ref(db, `users/${user.uid}/notes`);
    await push(notesRef, noteData);
    
    showNotification('✅ Note saved successfully!', 'success');
    closeNoteModal();
    
    // Refresh notes display
    loadNotes();
    
  } catch (error) {
    console.error('Error saving note:', error);
    showNotification('❌ Failed to save note', 'error');
  }
}

/**
 * Load notes from Firebase
 */
export function loadNotes() {
  const user = getCurrentUser();
  if (!user) return;
  
  const notesRef = ref(db, `users/${user.uid}/notes`);
  
  onValue(notesRef, (snapshot) => {
    const notesContainer = document.getElementById('notes-container');
    if (!notesContainer) return;
    
    notesContainer.innerHTML = '';
    
    if (snapshot.exists()) {
      const notes = snapshot.val();
      
      // Sort notes by pinned status and creation date
      const notesArray = Object.entries(notes).map(([id, note]) => ({
        id,
        ...note
      }));
      
      notesArray.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt - a.createdAt;
      });
      
      notesArray.forEach(note => {
        const noteElement = createNoteElement(note);
        notesContainer.appendChild(noteElement);
      });
    } else {
      notesContainer.innerHTML = '<p class="empty-state">No notes yet. Create your first note!</p>';
    }
  });
}

/**
 * Create note element for display
 */
function createNoteElement(note) {
  const noteDiv = document.createElement('div');
  noteDiv.className = `note-card ${note.isPinned ? 'pinned' : ''}`;
  noteDiv.dataset.noteId = note.id;
  
  const previewContent = note.isPrivate ? 
    '🔒 Private note - click to unlock' : 
    (note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content);
  
  noteDiv.innerHTML = `
    <div class="note-header">
      <h3 class="note-title">${note.title}</h3>
      <div class="note-actions">
        ${note.isPinned ? '<button class="pin-btn pinned" onclick="togglePinNote(\'' + note.id + '\')" title="Unpin">📌</button>' : 
                          '<button class="pin-btn" onclick="togglePinNote(\'' + note.id + '\')" title="Pin">📌</button>'}
        <button class="edit-btn" onclick="editNote('${note.id}')" title="Edit">✏️</button>
        <button class="delete-btn" onclick="deleteNote('${note.id}')" title="Delete">🗑️</button>
      </div>
    </div>
    <div class="note-meta">
      <span class="note-category">${note.category}</span>
      <span class="note-date">${new Date(note.createdAt).toLocaleDateString()}</span>
    </div>
    <div class="note-content" ${note.isPrivate ? 'onclick="requestNotePassword(\'' + note.id + '\')"' : ''}>
      ${previewContent}
    </div>
  `;
  
  return noteDiv;
}

/**
 * Edit note
 */
export function editNote(noteId) {
  const user = getCurrentUser();
  if (!user) return;
  
  const noteRef = ref(db, `users/${user.uid}/notes/${noteId}`);
  
  get(noteRef).then((snapshot) => {
    if (snapshot.exists()) {
      const noteData = snapshot.val();
      
      if (noteData.isPrivate) {
        requestPasswordForEdit(noteId, noteData);
      } else {
        editNoteDirectly(noteId, noteData.title, noteData.content, noteData.category);
      }
    }
  });
}

/**
 * Edit note directly (for non-private notes)
 */
function editNoteDirectly(noteId, title, content, category) {
  openNoteModal();
  
  // Populate form with existing data
  const titleInput = document.getElementById('note-title');
  const contentInput = document.getElementById('note-content');
  const categorySelect = document.getElementById('note-category');
  
  if (titleInput) titleInput.value = title;
  if (contentInput) contentInput.value = content;
  if (categorySelect) categorySelect.value = category;
  
  // Store note ID for updating
  noteModal.dataset.editingNoteId = noteId;
  
  // Change save button text
  if (saveNoteBtn) {
    saveNoteBtn.textContent = 'Update Note';
  }
}

/**
 * Request password for editing private note
 */
function requestPasswordForEdit(noteId, noteData) {
  const modal = document.createElement('div');
  modal.className = 'modal password-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Enter password to edit note</h3>
      <input type="password" id="edit-password-input" placeholder="Password" />
      <div class="modal-actions">
        <button id="edit-unlock-btn">Unlock</button>
        <button id="edit-cancel-btn">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  const passwordInput = modal.querySelector('#edit-password-input');
  const unlockBtn = modal.querySelector('#edit-unlock-btn');
  const cancelBtn = modal.querySelector('#edit-cancel-btn');
  
  passwordInput.focus();
  
  unlockBtn.addEventListener('click', () => attemptEditUnlock(noteId, noteData, passwordInput.value, modal));
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      attemptEditUnlock(noteId, noteData, passwordInput.value, modal);
    }
  });
}

/**
 * Attempt to unlock note for editing
 */
async function attemptEditUnlock(noteId, noteData, password, modal) {
  try {
    const isValid = await verifyPassword(password, noteData.passwordHash);
    
    if (isValid) {
      const decryptedContent = decryptContent(noteData.content, password);
      document.body.removeChild(modal);
      editNoteDirectly(noteId, noteData.title, decryptedContent, noteData.category);
    } else {
      showNotification('❌ Invalid password', 'error');
      modal.querySelector('#edit-password-input').value = '';
      modal.querySelector('#edit-password-input').focus();
    }
  } catch (error) {
    console.error('Error unlocking note:', error);
    showNotification('❌ Failed to unlock note', 'error');
  }
}

/**
 * Toggle pin status of note
 */
export function togglePinNote(noteId) {
  const user = getCurrentUser();
  if (!user) return;
  
  const noteRef = ref(db, `users/${user.uid}/notes/${noteId}`);
  
  get(noteRef).then((snapshot) => {
    if (snapshot.exists()) {
      const noteData = snapshot.val();
      const newPinnedStatus = !noteData.isPinned;
      
      update(noteRef, {
        isPinned: newPinnedStatus,
        updatedAt: Date.now()
      }).then(() => {
        showNotification(newPinnedStatus ? '📌 Note pinned' : '📌 Note unpinned', 'success');
      });
    }
  });
}

/**
 * Request password to view private note
 */
export function requestNotePassword(noteId) {
  const modal = document.createElement('div');
  modal.className = 'modal password-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Enter password to view note</h3>
      <input type="password" id="view-password-input" placeholder="Password" />
      <div class="modal-actions">
        <button id="view-unlock-btn">Unlock</button>
        <button id="view-cancel-btn">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  const passwordInput = modal.querySelector('#view-password-input');
  const unlockBtn = modal.querySelector('#view-unlock-btn');
  const cancelBtn = modal.querySelector('#view-cancel-btn');
  
  passwordInput.focus();
  
  unlockBtn.addEventListener('click', () => attemptUnlockNote(noteId, passwordInput.value, modal));
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      attemptUnlockNote(noteId, passwordInput.value, modal);
    }
  });
}

/**
 * Attempt to unlock private note for viewing
 */
async function attemptUnlockNote(noteId, password, modal) {
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    const noteRef = ref(db, `users/${user.uid}/notes/${noteId}`);
    const snapshot = await get(noteRef);
    
    if (snapshot.exists()) {
      const noteData = snapshot.val();
      const isValid = await verifyPassword(password, noteData.passwordHash);
      
      if (isValid) {
        const decryptedContent = decryptContent(noteData.content, password);
        document.body.removeChild(modal);
        showUnlockedNote(noteId, noteData.title, decryptedContent, noteData.category);
      } else {
        showNotification('❌ Invalid password', 'error');
        modal.querySelector('#view-password-input').value = '';
        modal.querySelector('#view-password-input').focus();
      }
    }
  } catch (error) {
    console.error('Error unlocking note:', error);
    showNotification('❌ Failed to unlock note', 'error');
  }
}

/**
 * Show unlocked private note content
 */
function showUnlockedNote(noteId, title, content, category) {
  const modal = document.createElement('div');
  modal.className = 'modal note-view-modal';
  modal.innerHTML = `
    <div class="modal-content large">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="close-btn" id="close-note-view">×</button>
      </div>
      <div class="note-details">
        <span class="note-category">${category}</span>
      </div>
      <div class="note-content-full">
        ${content.replace(/\n/g, '<br>')}
      </div>
      <div class="modal-actions">
        <button id="edit-unlocked-note">Edit</button>
        <button id="close-unlocked-note">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  // Event listeners
  modal.querySelector('#close-note-view').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.querySelector('#close-unlocked-note').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.querySelector('#edit-unlocked-note').addEventListener('click', () => {
    document.body.removeChild(modal);
    editNote(noteId);
  });
}

/**
 * Delete note
 */
export function deleteNote(noteId) {
  const user = getCurrentUser();
  if (!user) return;

  // Show confirmation modal
  const modal = document.createElement('div');
  modal.className = 'modal confirm-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Delete Note</h3>
      <p>Are you sure you want to delete this note? This action cannot be undone.</p>
      <div class="modal-actions">
        <button id="confirm-delete-note" class="danger-btn">Delete</button>
        <button id="cancel-delete-note">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  modal.querySelector('#confirm-delete-note').addEventListener('click', async () => {
    try {
      const noteRef = ref(db, `users/${user.uid}/notes/${noteId}`);
      await remove(noteRef);
      
      showNotification('✅ Note deleted successfully', 'success');
      document.body.removeChild(modal);
    } catch (error) {
      console.error('Error deleting note:', error);
      showNotification('❌ Failed to delete note', 'error');
    }
  });
  
  modal.querySelector('#cancel-delete-note').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

// Encryption/Decryption utilities
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function encryptContent(content, password) {
  // Simple encryption for demo purposes
  // In production, use proper encryption libraries
  const encoded = btoa(unescape(encodeURIComponent(content + '|' + password.length)));
  return encoded;
}

function decryptContent(encryptedContent, password) {
  try {
    const decoded = decodeURIComponent(escape(atob(encryptedContent)));
    const parts = decoded.split('|');
    if (parts.length >= 2 && parts[parts.length - 1] === password.length.toString()) {
      return parts.slice(0, -1).join('|');
    }
    throw new Error('Invalid password');
  } catch (error) {
    throw new Error('Failed to decrypt content');
  }
}

async function verifyPassword(inputPassword, storedHash) {
  const inputHash = await hashPassword(inputPassword);
  return inputHash === storedHash;
}

// Make global functions available
window.editNote = editNote;
window.deleteNote = deleteNote;
window.togglePinNote = togglePinNote;
window.requestNotePassword = requestNotePassword; 