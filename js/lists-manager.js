/* ===================================
   LISTS-MANAGER.JS - Lists Management
   =================================== */

import { db, ref, push, onValue, remove, set, get, update } from './firebase-config.js';
import { showNotification, getCurrentUser } from './app-core.js';
import { awardTaskCompletionXP, awardListCreationXP } from './gamification-manager.js';

// Lists state
let userLists = {};
let isReorderingEnabled = false;
let sortableInstance = null;

/**
 * Initialize lists manager
 */
export function initializeListsManager() {
  console.log('📝 Initializing Lists Manager...');
  
  // Set up event listeners
  setupListEventListeners();
  
  // Initialize reordering system
  initializeReordering();
  
  console.log('✅ Lists Manager initialized');
}

/**
 * Set up list event listeners
 */
function setupListEventListeners() {
  // New list creation
  const customNewListBtn = document.getElementById('custom-new-list-btn');
  if (customNewListBtn) {
    customNewListBtn.addEventListener('click', createNewList);
  }
  
  // Filter functionality
  const filterCategorySelect = document.getElementById('filter-category');
  if (filterCategorySelect) {
    filterCategorySelect.addEventListener('change', handleCategoryFilter);
  }
  
  // Search functionality
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
  
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', clearSearch);
  }
  
  // Toggle reorder button
  const toggleReorderBtn = document.getElementById('toggle-reorder-btn');
  if (toggleReorderBtn) {
    toggleReorderBtn.addEventListener('click', toggleReordering);
  }
  
  // Quick add functionality
  setupQuickAddListeners();
}

/**
 * Set up quick add listeners
 */
function setupQuickAddListeners() {
  const quickAddFab = document.getElementById('quick-add-fab');
  const quickAddModal = document.getElementById('quick-add-modal');
  const quickAddSubmit = document.getElementById('quick-add-submit');
  const quickAddCancel = document.getElementById('quick-add-cancel');
  
  if (quickAddFab && quickAddModal) {
    quickAddFab.addEventListener('click', () => {
      quickAddModal.style.display = 'flex';
      populateQuickAddListSelect();
      
      const quickAddText = document.getElementById('quick-add-text');
      if (quickAddText) {
        quickAddText.focus();
      }
    });
  }
  
  if (quickAddSubmit) {
    quickAddSubmit.addEventListener('click', submitQuickAdd);
  }
  
  if (quickAddCancel) {
    quickAddCancel.addEventListener('click', () => {
      if (quickAddModal) {
        quickAddModal.style.display = 'none';
        clearQuickAddForm();
      }
    });
  }
  
  // Quick task modal
  const quickTaskModal = document.getElementById('quick-task-modal');
  const quickTaskSubmit = document.getElementById('quick-task-submit');
  const quickTaskCancel = document.getElementById('quick-task-cancel');
  
  if (quickTaskSubmit) {
    quickTaskSubmit.addEventListener('click', submitQuickTask);
  }
  
  if (quickTaskCancel) {
    quickTaskCancel.addEventListener('click', closeQuickTaskModal);
  }
}

/**
 * Create new list
 */
function createNewList() {
  const user = getCurrentUser();
  if (!user) {
    showNotification('❌ You must be logged in to create lists', 'error');
    return;
  }
  
  const nameInput = document.getElementById('custom-list-name-input');
  const categoryInput = document.getElementById('custom-list-category-input');
  
  const name = nameInput?.value?.trim();
  const category = categoryInput?.value?.trim() || 'personal';
  
  if (!name) {
    showNotification('❌ Please enter a list name', 'error');
    return;
  }
  
  // Check if list already exists
  const existingList = Object.values(userLists).find(list => 
    list.name.toLowerCase() === name.toLowerCase()
  );
  
  if (existingList) {
    showNotification('❌ A list with this name already exists', 'error');
    return;
  }
  
  const listData = {
    name,
    category,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    itemCount: 0,
    isPinned: false
  };
  
  const listsRef = ref(db, `users/${user.uid}/lists`);
  push(listsRef, listData).then(() => {
    showNotification('✅ List created successfully!', 'success');
    
    // Clear form
    if (nameInput) nameInput.value = '';
    if (categoryInput) categoryInput.value = '';
    
    // Award XP
    awardListCreationXP();
  }).catch((error) => {
    console.error('Error creating list:', error);
    showNotification('❌ Failed to create list', 'error');
  });
}

/**
 * Load user lists
 */
export function loadUserLists(uid) {
  const listsRef = ref(db, `users/${uid}/lists`);
  
  onValue(listsRef, (snapshot) => {
    const listsContainer = document.getElementById('lists-container');
    if (!listsContainer) return;
    
    userLists = {};
    listsContainer.innerHTML = '';
    
    if (snapshot.exists()) {
      const lists = snapshot.val();
      userLists = lists;
      
      // Convert to array and sort
      const listsArray = Object.entries(lists).map(([id, list]) => ({
        id,
        ...list
      }));
      
      // Sort: pinned first, then by creation date
      listsArray.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt - a.createdAt;
      });
      
      // Render lists
      listsArray.forEach(list => {
        renderListBox(list.id, list.name, list.category, uid);
      });
      
      // Update filter options
      updateFilterOptions(listsArray);
      
      // Populate quick add select
      populateQuickAddListSelect();
    } else {
      // Create default lists if none exist
      createDefaultLists(uid);
    }
  });
}

/**
 * Create default lists for new users
 */
function createDefaultLists(uid) {
  const defaultLists = [
    { name: 'To Do', category: 'personal' },
    { name: 'Shopping', category: 'shopping' },
    { name: 'Work Tasks', category: 'work' }
  ];
  
  const listsRef = ref(db, `users/${uid}/lists`);
  
  defaultLists.forEach(listData => {
    const fullListData = {
      ...listData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      itemCount: 0,
      isPinned: false
    };
    
    push(listsRef, fullListData);
  });
}

/**
 * Render list box
 */
function renderListBox(listId, listName, category, uid) {
  const listsContainer = document.getElementById('lists-container');
  if (!listsContainer) return;
  
  const listBox = document.createElement('div');
  listBox.className = `list-box ${userLists[listId]?.isPinned ? 'pinned' : ''}`;
  listBox.dataset.listId = listId;
  listBox.dataset.category = category;
  
  // Get category icon
  const categoryIcon = getCategoryIcon(category);
  
  listBox.innerHTML = `
    <div class="list-header">
      <div class="list-title">
        <span class="category-icon">${categoryIcon}</span>
        <h3>${listName}</h3>
        ${userLists[listId]?.isPinned ? '<span class="pin-indicator">📌</span>' : ''}
      </div>
      <div class="list-actions">
        <button class="pin-btn" onclick="togglePinList('${listId}')" title="${userLists[listId]?.isPinned ? 'Unpin' : 'Pin'}">
          ${userLists[listId]?.isPinned ? '📌' : '📍'}
        </button>
        <button class="delete-list-btn" onclick="deleteList('${listId}')" title="Delete List">🗑️</button>
      </div>
    </div>
    <div class="list-items">
      <ul id="list-${listId}" class="items-list" data-list-id="${listId}"></ul>
      <div class="add-item-section">
        <input type="text" id="input-${listId}" placeholder="Add new item..." class="item-input">
        <button onclick="addItem('${listId}', '${uid}')" class="add-item-btn">+</button>
      </div>
    </div>
    <div class="list-stats">
      <span class="item-count">0 items</span>
      <span class="category-badge ${category}">${category}</span>
    </div>
  `;
  
  listsContainer.appendChild(listBox);
  
  // Load items for this list
  loadListItems(uid, listId, document.getElementById(`list-${listId}`));
  
  // Add enter key listener for quick add
  const input = document.getElementById(`input-${listId}`);
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addItem(listId, uid);
      }
    });
  }
}

/**
 * Load list items
 */
function loadListItems(uid, listId, ulElement) {
  if (!ulElement) return;
  
  const itemsRef = ref(db, `users/${uid}/lists/${listId}/items`);
  
  onValue(itemsRef, (snapshot) => {
    ulElement.innerHTML = '';
    let itemCount = 0;
    let completedCount = 0;
    
    if (snapshot.exists()) {
      const items = snapshot.val();
      itemCount = Object.keys(items).length;
      
      // Sort items: incomplete first, then by creation date
      const itemsArray = Object.entries(items).map(([id, item]) => ({
        id,
        ...item
      }));
      
      itemsArray.sort((a, b) => {
        if (a.done && !b.done) return 1;
        if (!a.done && b.done) return -1;
        return a.createdAt - b.createdAt;
      });
      
      itemsArray.forEach(item => {
        if (item.done) completedCount++;
        renderListItem(item.id, item.text, item.done, ulElement, listId, uid);
      });
    }
    
    // Update list stats
    const listBox = ulElement.closest('.list-box');
    if (listBox) {
      const itemCountElement = listBox.querySelector('.item-count');
      if (itemCountElement) {
        itemCountElement.textContent = `${itemCount} items`;
        
        if (completedCount > 0) {
          itemCountElement.textContent += ` (${completedCount} done)`;
        }
      }
      
      // Update progress bar if exists
      const progressBar = listBox.querySelector('.list-progress');
      if (progressBar && itemCount > 0) {
        const percentage = (completedCount / itemCount) * 100;
        progressBar.style.width = percentage + '%';
      }
    }
    
    // Update list item count in database
    if (userLists[listId]) {
      userLists[listId].itemCount = itemCount;
      const listRef = ref(db, `users/${uid}/lists/${listId}`);
      update(listRef, { itemCount, updatedAt: Date.now() });
    }
  });
}

/**
 * Render list item
 */
function renderListItem(itemId, text, done, ulElement, listId, uid) {
  const li = document.createElement('li');
  li.className = `list-item ${done ? 'done' : ''}`;
  li.dataset.itemId = itemId;
  
  li.innerHTML = `
    <div class="item-content">
      <input type="checkbox" ${done ? 'checked' : ''} 
             onchange="toggleItem('${listId}', '${itemId}', '${uid}')" 
             class="item-checkbox">
      <span class="item-text" ${done ? 'style="text-decoration: line-through; opacity: 0.6;"' : ''}>
        ${text}
      </span>
    </div>
    <div class="item-actions">
      <button onclick="editItem('${listId}', '${itemId}', '${uid}')" class="edit-item-btn" title="Edit">✏️</button>
      <button onclick="deleteItem('${listId}', '${itemId}', '${uid}')" class="delete-item-btn" title="Delete">🗑️</button>
    </div>
  `;
  
  ulElement.appendChild(li);
  
  // Enable drag and drop if reordering is enabled
  if (isReorderingEnabled) {
    li.draggable = true;
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
  }
}

/**
 * Add new item to list
 */
export function addItem(listId, uid) {
  const input = document.getElementById(`input-${listId}`);
  if (!input) return;
  
  const text = input.value.trim();
  if (!text) {
    showNotification('❌ Please enter item text', 'error');
    return;
  }
  
  const itemData = {
    text,
    done: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  const itemsRef = ref(db, `users/${uid}/lists/${listId}/items`);
  push(itemsRef, itemData).then(() => {
    input.value = '';
    showNotification('✅ Item added', 'success');
  }).catch((error) => {
    console.error('Error adding item:', error);
    showNotification('❌ Failed to add item', 'error');
  });
}

/**
 * Toggle item completion
 */
export function toggleItem(listId, itemId, uid) {
  const itemRef = ref(db, `users/${uid}/lists/${listId}/items/${itemId}`);
  
  get(itemRef).then((snapshot) => {
    if (snapshot.exists()) {
      const item = snapshot.val();
      const newDoneStatus = !item.done;
      
      update(itemRef, {
        done: newDoneStatus,
        updatedAt: Date.now()
      }).then(() => {
        if (newDoneStatus) {
          showNotification('✅ Task completed!', 'success');
          awardTaskCompletionXP();
        } else {
          showNotification('↩️ Task reopened', 'info');
        }
      });
    }
  });
}

/**
 * Edit item
 */
export function editItem(listId, itemId, uid) {
  const itemRef = ref(db, `users/${uid}/lists/${listId}/items/${itemId}`);
  
  get(itemRef).then((snapshot) => {
    if (snapshot.exists()) {
      const item = snapshot.val();
      const newText = prompt('Edit item:', item.text);
      
      if (newText !== null && newText.trim() !== '') {
        update(itemRef, {
          text: newText.trim(),
          updatedAt: Date.now()
        }).then(() => {
          showNotification('✅ Item updated', 'success');
        });
      }
    }
  });
}

/**
 * Delete item
 */
export function deleteItem(listId, itemId, uid) {
  if (confirm('Are you sure you want to delete this item?')) {
    const itemRef = ref(db, `users/${uid}/lists/${listId}/items/${itemId}`);
    
    remove(itemRef).then(() => {
      showNotification('✅ Item deleted', 'success');
    }).catch((error) => {
      console.error('Error deleting item:', error);
      showNotification('❌ Failed to delete item', 'error');
    });
  }
}

/**
 * Delete entire list
 */
export function deleteList(listId) {
  const user = getCurrentUser();
  if (!user) return;
  
  if (confirm('Are you sure you want to delete this entire list? This action cannot be undone.')) {
    const listRef = ref(db, `users/${user.uid}/lists/${listId}`);
    
    remove(listRef).then(() => {
      showNotification('✅ List deleted', 'success');
    }).catch((error) => {
      console.error('Error deleting list:', error);
      showNotification('❌ Failed to delete list', 'error');
    });
  }
}

/**
 * Toggle pin status of list
 */
export function togglePinList(listId) {
  const user = getCurrentUser();
  if (!user) return;
  
  const listRef = ref(db, `users/${user.uid}/lists/${listId}`);
  
  get(listRef).then((snapshot) => {
    if (snapshot.exists()) {
      const listData = snapshot.val();
      const newPinnedStatus = !listData.isPinned;
      
      update(listRef, {
        isPinned: newPinnedStatus,
        updatedAt: Date.now()
      }).then(() => {
        showNotification(newPinnedStatus ? '📌 List pinned' : '📌 List unpinned', 'success');
      });
    }
  });
}

/**
 * Handle category filter
 */
function handleCategoryFilter(event) {
  const selectedCategory = event.target.value;
  const listBoxes = document.querySelectorAll('.list-box');
  
  listBoxes.forEach(box => {
    if (selectedCategory === 'all' || box.dataset.category === selectedCategory) {
      box.style.display = 'block';
    } else {
      box.style.display = 'none';
    }
  });
}

/**
 * Handle search
 */
function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase();
  filterListsBySearch(searchTerm);
}

/**
 * Filter lists by search term
 */
function filterListsBySearch(searchTerm) {
  const listBoxes = document.querySelectorAll('.list-box');
  
  listBoxes.forEach(box => {
    const listTitle = box.querySelector('h3').textContent.toLowerCase();
    const listItems = box.querySelectorAll('.item-text');
    
    let hasMatch = listTitle.includes(searchTerm);
    
    // Also search in list items
    if (!hasMatch) {
      listItems.forEach(item => {
        if (item.textContent.toLowerCase().includes(searchTerm)) {
          hasMatch = true;
        }
      });
    }
    
    box.style.display = hasMatch ? 'block' : 'none';
  });
}

/**
 * Clear search
 */
function clearSearch() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.value = '';
    filterListsBySearch('');
  }
}

/**
 * Update filter options
 */
function updateFilterOptions(listsArray) {
  const filterSelect = document.getElementById('filter-category');
  if (!filterSelect) return;
  
  // Get unique categories
  const categories = [...new Set(listsArray.map(list => list.category))];
  
  // Clear existing options except "All"
  const allOption = filterSelect.querySelector('option[value="all"]');
  filterSelect.innerHTML = '';
  if (allOption) {
    filterSelect.appendChild(allOption);
  } else {
    filterSelect.innerHTML = '<option value="all">All Categories</option>';
  }
  
  // Add category options
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    filterSelect.appendChild(option);
  });
}

/**
 * Get category icon
 */
function getCategoryIcon(category) {
  const icons = {
    personal: '👤',
    work: '💼',
    shopping: '🛒',
    health: '🏥',
    education: '📚',
    travel: '✈️',
    home: '🏠',
    finance: '💰',
    hobby: '🎨',
    other: '📝'
  };
  return icons[category] || icons.other;
}

/**
 * Populate quick add list select
 */
function populateQuickAddListSelect() {
  const quickAddListSelect = document.getElementById('quick-add-list-select');
  if (!quickAddListSelect) return;
  
  quickAddListSelect.innerHTML = '';
  
  // Add lists as options
  Object.entries(userLists).forEach(([id, list]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = list.name;
    quickAddListSelect.appendChild(option);
  });
}

/**
 * Submit quick add
 */
function submitQuickAdd() {
  const user = getCurrentUser();
  if (!user) return;
  
  const quickAddText = document.getElementById('quick-add-text');
  const quickAddListSelect = document.getElementById('quick-add-list-select');
  
  const text = quickAddText?.value?.trim();
  const listId = quickAddListSelect?.value;
  
  if (!text) {
    showNotification('❌ Please enter item text', 'error');
    return;
  }
  
  if (!listId) {
    showNotification('❌ Please select a list', 'error');
    return;
  }
  
  const itemData = {
    text,
    done: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  const itemsRef = ref(db, `users/${user.uid}/lists/${listId}/items`);
  push(itemsRef, itemData).then(() => {
    showNotification('✅ Item added', 'success');
    
    // Close modal and clear form
    const quickAddModal = document.getElementById('quick-add-modal');
    if (quickAddModal) {
      quickAddModal.style.display = 'none';
    }
    clearQuickAddForm();
  }).catch((error) => {
    console.error('Error adding item:', error);
    showNotification('❌ Failed to add item', 'error');
  });
}

/**
 * Clear quick add form
 */
function clearQuickAddForm() {
  const quickAddText = document.getElementById('quick-add-text');
  const quickAddListSelect = document.getElementById('quick-add-list-select');
  
  if (quickAddText) quickAddText.value = '';
  if (quickAddListSelect) quickAddListSelect.selectedIndex = 0;
}

/**
 * Quick task modal functions
 */
export function openQuickTaskModal() {
  const quickTaskModal = document.getElementById('quick-task-modal');
  if (quickTaskModal) {
    quickTaskModal.style.display = 'flex';
    populateQuickTaskListSelect();
    
    const quickTaskText = document.getElementById('quick-task-text');
    if (quickTaskText) {
      quickTaskText.focus();
    }
  }
}

function populateQuickTaskListSelect() {
  const quickTaskListSelect = document.getElementById('quick-task-list-select');
  if (!quickTaskListSelect) return;
  
  quickTaskListSelect.innerHTML = '';
  
  Object.entries(userLists).forEach(([id, list]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = list.name;
    quickTaskListSelect.appendChild(option);
  });
}

function submitQuickTask() {
  const user = getCurrentUser();
  if (!user) return;
  
  const quickTaskText = document.getElementById('quick-task-text');
  const quickTaskListSelect = document.getElementById('quick-task-list-select');
  
  const text = quickTaskText?.value?.trim();
  const listId = quickTaskListSelect?.value;
  
  if (!text) {
    showNotification('❌ Please enter task text', 'error');
    return;
  }
  
  if (!listId) {
    showNotification('❌ Please select a list', 'error');
    return;
  }
  
  const itemData = {
    text,
    done: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  const itemsRef = ref(db, `users/${user.uid}/lists/${listId}/items`);
  push(itemsRef, itemData).then(() => {
    showNotification('✅ Task added', 'success');
    closeQuickTaskModal();
  });
}

function closeQuickTaskModal() {
  const quickTaskModal = document.getElementById('quick-task-modal');
  if (quickTaskModal) {
    quickTaskModal.style.display = 'none';
    
    // Clear form
    const quickTaskText = document.getElementById('quick-task-text');
    const quickTaskListSelect = document.getElementById('quick-task-list-select');
    
    if (quickTaskText) quickTaskText.value = '';
    if (quickTaskListSelect) quickTaskListSelect.selectedIndex = 0;
  }
}

/**
 * Reordering functionality
 */
function toggleReordering() {
  isReorderingEnabled = !isReorderingEnabled;
  const toggleBtn = document.getElementById('toggle-reorder-btn');
  
  if (toggleBtn) {
    toggleBtn.textContent = isReorderingEnabled ? 'Disable Reorder' : 'Enable Reorder';
    toggleBtn.classList.toggle('active', isReorderingEnabled);
  }
  
  // Update list items
  document.querySelectorAll('.list-item').forEach(item => {
    item.draggable = isReorderingEnabled;
    
    if (isReorderingEnabled) {
      item.classList.add('draggable');
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('drop', handleDrop);
    } else {
      item.classList.remove('draggable');
      item.removeEventListener('dragstart', handleDragStart);
      item.removeEventListener('dragover', handleDragOver);
      item.removeEventListener('drop', handleDrop);
    }
  });
  
  showNotification(
    isReorderingEnabled ? '↕️ Reordering enabled' : '↕️ Reordering disabled',
    'info'
  );
}

function initializeReordering() {
  // Initialize sortable functionality if library is available
  if (typeof Sortable !== 'undefined') {
    document.querySelectorAll('.items-list').forEach(list => {
      new Sortable(list, {
        disabled: !isReorderingEnabled,
        animation: 150,
        onEnd: function(evt) {
          // Handle reordering
          console.log('Item moved from', evt.oldIndex, 'to', evt.newIndex);
        }
      });
    });
  }
}

// Drag and drop handlers
function handleDragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.dataset.itemId);
  e.target.classList.add('dragging');
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDrop(e) {
  e.preventDefault();
  const draggedId = e.dataTransfer.getData('text/plain');
  const targetId = e.target.closest('.list-item')?.dataset.itemId;
  
  if (draggedId && targetId && draggedId !== targetId) {
    // Handle reordering logic here
    console.log('Reorder:', draggedId, 'to position of', targetId);
  }
  
  // Clean up
  document.querySelectorAll('.list-item').forEach(item => {
    item.classList.remove('dragging');
  });
}

// Make functions globally available
window.addItem = addItem;
window.toggleItem = toggleItem;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.deleteList = deleteList;
window.togglePinList = togglePinList;
window.openQuickTaskModal = openQuickTaskModal;

// Export main functions
export { 
  loadUserLists, 
  createDefaultLists, 
  getCategoryIcon,
  togglePinList,
  openQuickTaskModal
}; 