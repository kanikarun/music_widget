// Volume control functionality
const volumeSlider = document.getElementById('volume-slider');
const volumeBtn = document.getElementById('volume-btn');
const volumeSliderContainer = document.getElementById('volume-slider-container');

let previousVolume = 0.7; // Default volume 70%
let isVolumeVisible = false;

// Get audio element (wait for it to be available)
function getAudio() {
  return document.getElementById('audio');
}

// Initialize volume when DOM is ready
function initVolume() {
  const audio = getAudio();
  if (audio && volumeSlider) {
    audio.volume = 0.7;
    updateVolumeSliderFill();
    updateVolumeIcon(0.7);
  }
  
  // Make sure slider is hidden on load
  if (volumeSliderContainer) {
    volumeSliderContainer.classList.remove('show');
    isVolumeVisible = false;
  }
}

// Toggle volume slider visibility
function toggleVolumeSlider() {
  isVolumeVisible = !isVolumeVisible;
  
  if (volumeSliderContainer) {
    if (isVolumeVisible) {
      volumeSliderContainer.classList.add('show');
    } else {
      volumeSliderContainer.classList.remove('show');
    }
  }
}

// Hide volume slider when clicking outside
function handleClickOutside(e) {
  if (isVolumeVisible && volumeSliderContainer && volumeBtn) {
    const isClickInsideSlider = volumeSliderContainer.contains(e.target);
    const isClickOnButton = volumeBtn.contains(e.target);
    
    if (!isClickInsideSlider && !isClickOnButton) {
      isVolumeVisible = false;
      volumeSliderContainer.classList.remove('show');
    }
  }
}

// Update volume icon based on current volume
function updateVolumeIcon(volume) {
  if (!volumeBtn) return;
  
  if (volume === 0) {
    volumeBtn.textContent = '🔇';
    volumeBtn.title = 'Unmute';
  } else if (volume < 0.3) {
    volumeBtn.textContent = '🔈';
    volumeBtn.title = 'Toggle mute';
  } else if (volume < 0.7) {
    volumeBtn.textContent = '🔉';
    volumeBtn.title = 'Toggle mute';
  } else {
    volumeBtn.textContent = '🔊';
    volumeBtn.title = 'Toggle mute';
  }
}

// Update volume slider visual fill
function updateVolumeSliderFill() {
  const audio = getAudio();
  if (!volumeSlider || !audio) return;
  
  const percentage = audio.volume * 100;
  
  // Create gradient fill effect that matches your progress bar style
  const gradient = `linear-gradient(90deg, 
    rgba(125,95,255,0.95) 0%, 
    rgba(0,210,255,0.95) ${percentage}%, 
    rgba(255,255,255,0.02) ${percentage}%, 
    rgba(255,255,255,0.01) 100%)`;
  
  volumeSlider.style.background = gradient;
  volumeSlider.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.02)`;
  volumeSlider.style.border = `1px solid rgba(255,255,255,0.04)`;
}

// Volume slider change - handles both click and drag
if (volumeSlider) {
  // Input event fires continuously while dragging
  volumeSlider.addEventListener('input', (e) => {
    const audio = getAudio();
    if (!audio) return;
    
    const value = parseFloat(e.target.value) / 100;
    audio.volume = value;
    
    if (value > 0) {
      previousVolume = value;
    }
    
    updateVolumeIcon(value);
    updateVolumeSliderFill();
  });

  // Change event fires when releasing the slider
  volumeSlider.addEventListener('change', (e) => {
    const audio = getAudio();
    if (!audio) return;
    
    const value = parseFloat(e.target.value) / 100;
    audio.volume = value;
    
    if (value > 0) {
      previousVolume = value;
    }
    
    updateVolumeIcon(value);
    updateVolumeSliderFill();
  });

  // Click directly on track
  volumeSlider.addEventListener('click', (e) => {
    const audio = getAudio();
    if (!audio) return;
    
    const value = parseFloat(e.target.value) / 100;
    audio.volume = value;
    
    if (value > 0) {
      previousVolume = value;
    }
    
    updateVolumeIcon(value);
    updateVolumeSliderFill();
  });
}

// Volume button (toggle slider visibility)
if (volumeBtn) {
  volumeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleVolumeSlider();
  });
}

// Click outside to hide slider
document.addEventListener('click', handleClickOutside);

// Initialize on page load
window.addEventListener('DOMContentLoaded', initVolume);

// Also re-initialize when a track loads
document.addEventListener('trackLoaded', initVolume);