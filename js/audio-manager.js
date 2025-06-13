// Audio Manager Module
console.log('🔧 Audio Manager module loading...');

let audioContext = null;
let audioEnabled = false;
let currentNotificationLoop = null;
let workingLoop = null;
let soundLoop = null;

function enableAudio() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioEnabled = true;
      console.log('🔊 Audio context created successfully');
    } catch (error) {
      console.error('❌ Failed to create audio context:', error);
      audioEnabled = false;
    }
  }
  
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('🔊 Audio context resumed');
      audioEnabled = true;
    }).catch(error => {
      console.error('❌ Failed to resume audio context:', error);
      audioEnabled = false;
    });
  }
}

function prepareAudioForNotifications() {
  console.log('🔊 Preparing audio for notifications...');
  
  if (!audioEnabled) {
    enableAudio();
  }
  
  // Test if audio is working
  if (audioEnabled && audioContext) {
    console.log('✅ Audio is ready for notifications');
    return true;
  } else {
    console.warn('⚠️ Audio is not available');
    return false;
  }
}

function enableAudioOnUserInteraction() {
  function audioHandler() {
    enableAudio();
    prepareAudioForNotifications();
    
    // Remove listeners after first successful interaction
    if (audioEnabled) {
      document.removeEventListener('click', audioHandler);
      document.removeEventListener('touchstart', audioHandler);
      document.removeEventListener('keydown', audioHandler);
      console.log('🔊 Audio enabled through user interaction');
    }
  }
  
  // Add listeners for user interactions
  document.addEventListener('click', audioHandler, { once: false });
  document.addEventListener('touchstart', audioHandler, { once: false });
  document.addEventListener('keydown', audioHandler, { once: false });
}

function enableAudioOnImportantElements() {
  // Add specific listeners to important buttons
  const buttons = document.querySelectorAll('button, .nav-tab, .list-box');
  buttons.forEach(button => {
    button.addEventListener('click', enableAudio, { once: true });
  });
}

function playNotificationSound() {
  console.log('🔊 Playing notification sound...');
  
  if (!audioEnabled || !audioContext) {
    console.warn('⚠️ Audio not available, enabling on demand...');
    enableAudio();
    if (!audioEnabled) {
      console.error('❌ Cannot play sound - audio not available');
      return;
    }
  }
  
  try {
    // Stop any existing sound
    stopNotificationSound();
    
    // Start simple loop
    startSimpleLoop();
    
    // Auto-stop after 30 seconds to prevent indefinite playing
    setTimeout(() => {
      stopNotificationSound();
      console.log('🔇 Auto-stopped notification sound after 30 seconds');
    }, 30000);
    
  } catch (error) {
    console.error('❌ Error playing notification sound:', error);
  }
}

function startSimpleLoop() {
  if (!audioContext || currentNotificationLoop) return;
  
  console.log('🎵 Starting simple notification loop');
  
  function playBeep() {
    if (!audioContext || !audioEnabled) return;
    
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('❌ Error in playBeep:', error);
    }
  }
  
  playBeep(); // Play immediately
  currentNotificationLoop = setInterval(playBeep, 3000); // Then every 3 seconds
}

function startWorkingAudioLoop() {
  startContinuousLoop();
}

function startContinuousLoop() {
  console.log('🎵 Starting continuous notification loop');
  
  if (!audioContext) {
    console.error('❌ No audio context available');
    return;
  }
  
  function createTone() {
    if (!audioContext || !audioEnabled) return;
    
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Pleasant notification tone (C major chord)
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.type = 'sine';
      
      // Gentle envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.3);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('❌ Error creating tone:', error);
    }
  }
  
  // Stop any existing loops
  stopNotificationSound();
  
  // Play initial tone
  createTone();
  
  // Set up repeating loop every 3 seconds
  soundLoop = setInterval(() => {
    createTone();
  }, 3000);
}

function playSingleBeep() {
  if (!audioEnabled || !audioContext) {
    console.warn('⚠️ Audio not available for single beep');
    return;
  }
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
    
    console.log('🔊 Single beep played');
  } catch (error) {
    console.error('❌ Error playing single beep:', error);
  }
}

function stopNotificationSound() {
  console.log('🔇 Stopping notification sound');
  
  // Clear all loops
  if (currentNotificationLoop) {
    clearInterval(currentNotificationLoop);
    currentNotificationLoop = null;
  }
  
  if (workingLoop) {
    clearInterval(workingLoop);
    workingLoop = null;
  }
  
  if (soundLoop) {
    clearInterval(soundLoop);
    soundLoop = null;
  }
  
  console.log('🔇 All notification sounds stopped');
}

// Initialize audio on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    enableAudioOnUserInteraction();
    enableAudioOnImportantElements();
  });
} else {
  enableAudioOnUserInteraction();
  enableAudioOnImportantElements();
}

console.log('✅ Audio Manager module loaded successfully');

export { 
  enableAudio, 
  prepareAudioForNotifications, 
  playNotificationSound, 
  playSingleBeep, 
  stopNotificationSound, 
  startWorkingAudioLoop, 
  audioEnabled,
  audioContext
}; 