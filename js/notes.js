// Note Management
import {
  db,
  ref,
  push,
  onValue,
  remove,
  set,
  get,
  query,
  orderByChild,
  update
} from './firebase.js';
import { getCurrentUser } from './auth.js';

// Open note modal
export function openNoteModal(noteId = null) {
  const modal = document.getElementById('note-modal');
  if (!modal) return;
  
  modal.style.display = 'block';
  
  if (noteId) {
    // Edit existing note
    const noteRef = ref(db, `users/${getCurrentUser().uid}/notes/${noteId}`);
    get(noteRef).then((snapshot) => {
      const note = snapshot.val();
      if (note) {
        document.getElementById('note-title').value = note.title;
        document.getElementById('note-content').value = note.content;
        document.getElementById('note-category').value = note.category;
        document.getElementById('note-modal').dataset.noteId = noteId;
      }
    });
  } else {
    // New note
    clearNoteModal();
  }
}

// Close note modal
export function closeNoteModal() {
  const modal = document.getElementById('note-modal');
  if (!modal) return;
  
  modal.style.display = 'none';
  clearNoteModal();
}

// Clear note modal
export function clearNoteModal() {
  document.getElementById('note-title').value = '';
  document.getElementById('note-content').value = '';
  document.getElementById('note-category').value = 'personal';
  document.getElementById('note-modal').dataset.noteId = '';
}

// Save note
export async function saveNote() {
  const user = getCurrentUser();
  if (!user) return;
  
  const title = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  const category = document.getElementById('note-category').value;
  const noteId = document.getElementById('note-modal').dataset.noteId;
  
  if (!title || !content) {
    showNotification('❌ A cím és tartalom megadása kötelező!');
    return;
  }
  
  try {
    const noteData = {
      title,
      content,
      category,
      updatedAt: Date.now()
    };
    
    if (noteId) {
      // Update existing note
      await update(ref(db, `users/${user.uid}/notes/${noteId}`), noteData);
    } else {
      // Create new note
      noteData.createdAt = Date.now();
      noteData.pinned = false;
      await push(ref(db, `users/${user.uid}/notes`), noteData);
    }
    
    closeNoteModal();
    showNotification('✅ Jegyzet sikeresen mentve!');
  } catch (error) {
    console.error('❌ Error saving note:', error);
    showNotification('❌ Hiba történt a mentés során!');
  }
}

// Load notes
export function loadNotes() {
  const user = getCurrentUser();
  if (!user) return;
  
  const notesRef = ref(db, `users/${user.uid}/notes`);
  const notesQuery = query(notesRef, orderByChild('updatedAt'));
  
  onValue(notesQuery, (snapshot) => {
    const notes = [];
    snapshot.forEach((childSnapshot) => {
      notes.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    // Sort notes: pinned first, then by update time
    notes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
    
    // Update notes grid
    updateNotesGrid(notes);
  });
}

// Update notes grid
function updateNotesGrid(notes) {
  const grid = document.querySelector('.notes-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  notes.forEach(note => {
    const noteElement = createNoteElement(note);
    grid.appendChild(noteElement);
  });
}

// Create note element
export function createNoteElement(note) {
  const div = document.createElement('div');
  div.className = 'note-card';
  div.dataset.noteId = note.id;
  
  if (note.pinned) {
    div.classList.add('pinned');
  }
  
  div.innerHTML = `
    <div class="note-header">
      <h3 class="note-title">${note.title}</h3>
      <div class="note-actions">
        <button class="btn-icon pin-note" title="Rögzítés">
          <span class="material-icons">push_pin</span>
        </button>
        <button class="btn-icon edit-note" title="Szerkesztés">
          <span class="material-icons">edit</span>
        </button>
        <button class="btn-icon delete-note" title="Törlés">
          <span class="material-icons">delete</span>
        </button>
      </div>
    </div>
    <div class="note-content">${note.content}</div>
    <div class="note-footer">
      <span class="note-category">${note.category}</span>
      <span class="note-date">${new Date(note.updatedAt).toLocaleDateString()}</span>
    </div>
  `;
  
  // Add event listeners
  setupNoteEventListeners(div, note);
  
  return div;
}

// Setup note event listeners
function setupNoteEventListeners(noteElement, note) {
  // Pin note
  const pinButton = noteElement.querySelector('.pin-note');
  pinButton?.addEventListener('click', () => togglePinNote(note.id));
  
  // Edit note
  const editButton = noteElement.querySelector('.edit-note');
  editButton?.addEventListener('click', () => openNoteModal(note.id));
  
  // Delete note
  const deleteButton = noteElement.querySelector('.delete-note');
  deleteButton?.addEventListener('click', () => {
    showConfirmModal('deleteNote', () => {
      deleteNote(note.id);
    });
  });
}

// Toggle pin note
export async function togglePinNote(noteId) {
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    const noteRef = ref(db, `users/${user.uid}/notes/${noteId}`);
    const snapshot = await get(noteRef);
    const note = snapshot.val();
    
    await update(noteRef, {
      pinned: !note.pinned
    });
  } catch (error) {
    console.error('❌ Error toggling pin note:', error);
    throw error;
  }
}

// Delete note
export async function deleteNote(noteId) {
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    await remove(ref(db, `users/${user.uid}/notes/${noteId}`));
    showNotification('✅ Jegyzet sikeresen törölve!');
  } catch (error) {
    console.error('❌ Error deleting note:', error);
    showNotification('❌ Hiba történt a törlés során!');
  }
}

// Make note functions globally available
window.openNoteModal = openNoteModal;
window.closeNoteModal = closeNoteModal;
window.clearNoteModal = clearNoteModal;
window.saveNote = saveNote;
window.loadNotes = loadNotes;
window.createNoteElement = createNoteElement;
window.togglePinNote = togglePinNote;
window.deleteNote = deleteNote; 