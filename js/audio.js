// Audio Management
import { getCurrentUser } from './auth.js';

// Audio context
let audioContext = null;

// Initialize audio context
export function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

// Play sound
export function playSound(soundName) {
  const user = getCurrentUser();
  if (!user) return;
  
  // Get user preferences
  const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
  if (!preferences.soundEnabled) return;
  
  // Initialize audio context if needed
  if (!audioContext) {
    initAudioContext();
  }
  
  // Create audio element
  const audio = new Audio(`/sounds/${soundName}.mp3`);
  
  // Set volume
  audio.volume = preferences.soundVolume || 0.5;
  
  // Play sound
  audio.play().catch(error => {
    console.error('❌ Error playing sound:', error);
  });
}

// Play success sound
export function playSuccessSound() {
  playSound('success');
}

// Play error sound
export function playErrorSound() {
  playSound('error');
}

// Play notification sound
export function playNotificationSound() {
  playSound('notification');
}

// Play click sound
export function playClickSound() {
  playSound('click');
}

// Play hover sound
export function playHoverSound() {
  playSound('hover');
}

// Play complete sound
export function playCompleteSound() {
  playSound('complete');
}

// Play delete sound
export function playDeleteSound() {
  playSound('delete');
}

// Play add sound
export function playAddSound() {
  playSound('add');
}

// Play edit sound
export function playEditSound() {
  playSound('edit');
}

// Play move sound
export function playMoveSound() {
  playSound('move');
}

// Play drag sound
export function playDragSound() {
  playSound('drag');
}

// Play drop sound
export function playDropSound() {
  playSound('drop');
}

// Play open sound
export function playOpenSound() {
  playSound('open');
}

// Play close sound
export function playCloseSound() {
  playSound('close');
}

// Play toggle sound
export function playToggleSound() {
  playSound('toggle');
}

// Play select sound
export function playSelectSound() {
  playSound('select');
}

// Play unselect sound
export function playUnselectSound() {
  playSound('unselect');
}

// Play check sound
export function playCheckSound() {
  playSound('check');
}

// Play uncheck sound
export function playUncheckSound() {
  playSound('uncheck');
}

// Play pin sound
export function playPinSound() {
  playSound('pin');
}

// Play unpin sound
export function playUnpinSound() {
  playSound('unpin');
}

// Play sort sound
export function playSortSound() {
  playSound('sort');
}

// Play filter sound
export function playFilterSound() {
  playSound('filter');
}

// Play search sound
export function playSearchSound() {
  playSound('search');
}

// Play clear sound
export function playClearSound() {
  playSound('clear');
}

// Play save sound
export function playSaveSound() {
  playSound('save');
}

// Play cancel sound
export function playCancelSound() {
  playSound('cancel');
}

// Play confirm sound
export function playConfirmSound() {
  playSound('confirm');
}

// Play deny sound
export function playDenySound() {
  playSound('deny');
}

// Play warning sound
export function playWarningSound() {
  playSound('warning');
}

// Play info sound
export function playInfoSound() {
  playSound('info');
}

// Play debug sound
export function playDebugSound() {
  playSound('debug');
}

// Play test sound
export function playTestSound() {
  playSound('test');
}

// Play demo sound
export function playDemoSound() {
  playSound('demo');
}

// Play preview sound
export function playPreviewSound() {
  playSound('preview');
}

// Play sample sound
export function playSampleSound() {
  playSound('sample');
}

// Play example sound
export function playExampleSound() {
  playSound('example');
}

// Play default sound
export function playDefaultSound() {
  playSound('default');
}

// Play custom sound
export function playCustomSound(soundName) {
  playSound(soundName);
}

// Make audio functions globally available
window.initAudioContext = initAudioContext;
window.playSound = playSound;
window.playSuccessSound = playSuccessSound;
window.playErrorSound = playErrorSound;
window.playNotificationSound = playNotificationSound;
window.playClickSound = playClickSound;
window.playHoverSound = playHoverSound;
window.playCompleteSound = playCompleteSound;
window.playDeleteSound = playDeleteSound;
window.playAddSound = playAddSound;
window.playEditSound = playEditSound;
window.playMoveSound = playMoveSound;
window.playDragSound = playDragSound;
window.playDropSound = playDropSound;
window.playOpenSound = playOpenSound;
window.playCloseSound = playCloseSound;
window.playToggleSound = playToggleSound;
window.playSelectSound = playSelectSound;
window.playUnselectSound = playUnselectSound;
window.playCheckSound = playCheckSound;
window.playUncheckSound = playUncheckSound;
window.playPinSound = playPinSound;
window.playUnpinSound = playUnpinSound;
window.playSortSound = playSortSound;
window.playFilterSound = playFilterSound;
window.playSearchSound = playSearchSound;
window.playClearSound = playClearSound;
window.playSaveSound = playSaveSound;
window.playCancelSound = playCancelSound;
window.playConfirmSound = playConfirmSound;
window.playDenySound = playDenySound;
window.playWarningSound = playWarningSound;
window.playInfoSound = playInfoSound;
window.playDebugSound = playDebugSound;
window.playTestSound = playTestSound;
window.playDemoSound = playDemoSound;
window.playPreviewSound = playPreviewSound;
window.playSampleSound = playSampleSound;
window.playExampleSound = playExampleSound;
window.playDefaultSound = playDefaultSound;
window.playCustomSound = playCustomSound; 