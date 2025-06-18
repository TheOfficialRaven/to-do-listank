// List Management
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

// Create default lists for new user
export async function createDefaultLists(uid) {
  try {
    const defaultLists = [
      { name: 'Teendők', category: 'personal' },
      { name: 'Bevásárlás', category: 'shopping' },
      { name: 'Projektek', category: 'work' }
    ];

    for (const list of defaultLists) {
      await push(ref(db, `users/${uid}/lists`), {
        name: list.name,
        category: list.category,
        createdAt: Date.now(),
        pinned: false
      });
    }

    console.log('✅ Default lists created successfully');
  } catch (error) {
    console.error('❌ Error creating default lists:', error);
    throw error;
  }
}

// Load user lists
export async function loadUserLists(uid) {
  try {
    const listsRef = ref(db, `users/${uid}/lists`);
    const listsQuery = query(listsRef, orderByChild('createdAt'));
    
    onValue(listsQuery, (snapshot) => {
      const lists = [];
      snapshot.forEach((childSnapshot) => {
        lists.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      // Update lists container
      updateListsContainer(lists);
      
      // Update filter options
      updateFilterOptions(lists);
      
      // Update quick add list select
      populateQuickAddListSelect();
    });
  } catch (error) {
    console.error('❌ Error loading user lists:', error);
    throw error;
  }
}

// Update lists container
function updateListsContainer(lists) {
  const container = document.querySelector('.lists-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  lists.forEach(list => {
    const listBox = renderListBox(list.id, list.name, list.category, getCurrentUser().uid);
    container.appendChild(listBox);
  });
}

// Render list box
export function renderListBox(listId, listName, category, uid) {
  const listBox = document.createElement('div');
  listBox.className = 'list-box';
  listBox.dataset.listId = listId;
  
  listBox.innerHTML = `
    <div class="list-box-header">
      <h3 class="list-box-title">${listName}</h3>
      <div class="list-box-actions">
        <button class="btn-icon pin-list" title="Rögzítés">
          <span class="material-icons">push_pin</span>
        </button>
        <button class="btn-icon delete-list" title="Törlés">
          <span class="material-icons">delete</span>
        </button>
      </div>
    </div>
    <ul class="list-items" data-list-id="${listId}"></ul>
    <div class="list-box-footer">
      <input type="text" class="item-input" placeholder="Új elem hozzáadása...">
      <button class="btn-icon add-item" title="Hozzáadás">
        <span class="material-icons">add</span>
      </button>
    </div>
  `;
  
  // Load list items
  loadListItems(uid, listId, listBox.querySelector('.list-items'));
  
  // Add event listeners
  setupListBoxEventListeners(listBox, listId, uid);
  
  return listBox;
}

// Load list items
export function loadListItems(uid, listId, ulElement) {
  const itemsRef = ref(db, `users/${uid}/lists/${listId}/items`);
  const itemsQuery = query(itemsRef, orderByChild('createdAt'));
  
  onValue(itemsQuery, (snapshot) => {
    ulElement.innerHTML = '';
    
    snapshot.forEach((childSnapshot) => {
      const item = childSnapshot.val();
      const li = renderListItem(childSnapshot.key, item.text, item.done, ulElement, listId, uid);
      ulElement.appendChild(li);
    });
  });
}

// Render list item
export function renderListItem(itemId, text, done, ulElement, listId, uid) {
  const li = document.createElement('li');
  li.className = 'list-item';
  li.dataset.itemId = itemId;
  
  if (done) {
    li.classList.add('done');
  }
  
  li.innerHTML = `
    <div class="checkbox">
      <input type="checkbox" ${done ? 'checked' : ''}>
      <span class="checkbox-box"></span>
    </div>
    <span class="item-text">${text}</span>
    <button class="btn-icon delete-item" title="Törlés">
      <span class="material-icons">delete</span>
    </button>
  `;
  
  // Add event listeners
  setupListItemEventListeners(li, itemId, listId, uid);
  
  return li;
}

// Setup list box event listeners
function setupListBoxEventListeners(listBox, listId, uid) {
  // Pin list
  const pinButton = listBox.querySelector('.pin-list');
  pinButton?.addEventListener('click', () => togglePinList(listId));
  
  // Delete list
  const deleteButton = listBox.querySelector('.delete-list');
  deleteButton?.addEventListener('click', () => {
    showConfirmModal('deleteList', () => {
      remove(ref(db, `users/${uid}/lists/${listId}`));
    });
  });
  
  // Add item
  const addButton = listBox.querySelector('.add-item');
  const input = listBox.querySelector('.item-input');
  
  addButton?.addEventListener('click', () => {
    const text = input.value.trim();
    if (text) {
      addListItem(uid, listId, text);
      input.value = '';
    }
  });
  
  input?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const text = input.value.trim();
      if (text) {
        addListItem(uid, listId, text);
        input.value = '';
      }
    }
  });
}

// Setup list item event listeners
function setupListItemEventListeners(li, itemId, listId, uid) {
  // Toggle done
  const checkbox = li.querySelector('input[type="checkbox"]');
  checkbox?.addEventListener('change', () => {
    update(ref(db, `users/${uid}/lists/${listId}/items/${itemId}`), {
      done: checkbox.checked
    });
  });
  
  // Delete item
  const deleteButton = li.querySelector('.delete-item');
  deleteButton?.addEventListener('click', () => {
    remove(ref(db, `users/${uid}/lists/${listId}/items/${itemId}`));
  });
}

// Add list item
async function addListItem(uid, listId, text) {
  try {
    await push(ref(db, `users/${uid}/lists/${listId}/items`), {
      text,
      done: false,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error('❌ Error adding list item:', error);
    throw error;
  }
}

// Toggle pin list
export async function togglePinList(listId) {
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    const listRef = ref(db, `users/${user.uid}/lists/${listId}`);
    const snapshot = await get(listRef);
    const list = snapshot.val();
    
    await update(listRef, {
      pinned: !list.pinned
    });
  } catch (error) {
    console.error('❌ Error toggling pin list:', error);
    throw error;
  }
}

// Update filter options
export function updateFilterOptions(listsArray) {
  const filterSelect = document.querySelector('.filter-select');
  if (!filterSelect) return;
  
  // Clear existing options
  filterSelect.innerHTML = '<option value="all">Minden lista</option>';
  
  // Add list options
  listsArray.forEach(list => {
    const option = document.createElement('option');
    option.value = list.id;
    option.textContent = list.name;
    filterSelect.appendChild(option);
  });
}

// Populate quick add list select
export function populateQuickAddListSelect() {
  const select = document.querySelector('.quick-add-list-select');
  if (!select) return;
  
  const user = getCurrentUser();
  if (!user) return;
  
  const listsRef = ref(db, `users/${user.uid}/lists`);
  const listsQuery = query(listsRef, orderByChild('createdAt'));
  
  onValue(listsQuery, (snapshot) => {
    select.innerHTML = '<option value="">Válassz listát...</option>';
    
    snapshot.forEach((childSnapshot) => {
      const list = childSnapshot.val();
      const option = document.createElement('option');
      option.value = childSnapshot.key;
      option.textContent = list.name;
      select.appendChild(option);
    });
  });
}

// Make list functions globally available
window.createDefaultLists = createDefaultLists;
window.loadUserLists = loadUserLists;
window.renderListBox = renderListBox;
window.loadListItems = loadListItems;
window.renderListItem = renderListItem;
window.togglePinList = togglePinList;
window.updateFilterOptions = updateFilterOptions;
window.populateQuickAddListSelect = populateQuickAddListSelect; 