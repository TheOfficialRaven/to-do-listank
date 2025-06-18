// Authentication Management
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from './firebase.js';

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✅ User is signed in:', user.uid);
    // Update UI for signed in user
    document.body.classList.add('user-signed-in');
    document.body.classList.remove('user-signed-out');
    
    // Load user data
    loadUserData(user.uid);
  } else {
    console.log('👋 User is signed out');
    // Update UI for signed out user
    document.body.classList.add('user-signed-out');
    document.body.classList.remove('user-signed-in');
    
    // Clear user data
    clearUserData();
  }
});

// Sign up function
export async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ User signed up successfully:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Error signing up:', error);
    throw error;
  }
}

// Sign in function
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ User signed in successfully:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Error signing in:', error);
    throw error;
  }
}

// Sign out function
export async function signOutUser() {
  try {
    await signOut(auth);
    console.log('✅ User signed out successfully');
  } catch (error) {
    console.error('❌ Error signing out:', error);
    throw error;
  }
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser;
}

// Check if user is signed in
export function isUserSignedIn() {
  return !!auth.currentUser;
}

// Load user data
async function loadUserData(uid) {
  try {
    // Load user preferences
    const preferences = await loadUserPreferences(uid);
    if (preferences) {
      applyUserPreferences(preferences);
    }
    
    // Load user lists
    await loadUserLists(uid);
    
    // Load user notes
    await loadNotes();
    
    // Load user events
    await loadEvents();
    
    // Update dashboard
    await updateDashboard();
  } catch (error) {
    console.error('❌ Error loading user data:', error);
  }
}

// Clear user data
function clearUserData() {
  // Clear lists
  const listsContainer = document.querySelector('.lists-container');
  if (listsContainer) {
    listsContainer.innerHTML = '';
  }
  
  // Clear notes
  const notesContainer = document.querySelector('.notes-grid');
  if (notesContainer) {
    notesContainer.innerHTML = '';
  }
  
  // Clear events
  const eventsContainer = document.querySelector('.events-container');
  if (eventsContainer) {
    eventsContainer.innerHTML = '';
  }
  
  // Reset dashboard
  resetDashboard();
}

// Make auth functions globally available
window.signUp = signUp;
window.signIn = signIn;
window.signOutUser = signOutUser;
window.getCurrentUser = getCurrentUser;
window.isUserSignedIn = isUserSignedIn; 