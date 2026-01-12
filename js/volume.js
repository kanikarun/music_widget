// ===============================
// VOLUME CONTROL ELEMENTS
// ===============================
const volumeSlider = document.getElementById('volume-slider');
const volumeBtn = document.getElementById('volume-btn');
const volumeSliderContainer = document.getElementById('volume-slider-container');

let previousVolume = 0.7; // Default volume 70%
let isVolumeVisible = false;

// ===============================
// AUDIO ELEMENT HELPER
// ===============================
function getAudio() {
  return document.getElementById('audio');
}

// ===============================
// INITIALIZATION
// ===============================
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

// Initialize on page load
window.addEventListener('DOMContentLoaded', initVolume);

// Also re-initialize when a track loads
document.addEventListener('trackLoaded', initVolume);

// ===============================
// SLIDER VISIBILITY
// ===============================
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

// Volume button (toggle slider visibility)
if (volumeBtn) {
  volumeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleVolumeSlider();
  });
}

// Click outside to hide slider
document.addEventListener('click', handleClickOutside);

// ===============================
// VOLUME ICON UPDATE
// ===============================
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

// ===============================
// SLIDER VISUAL UPDATE
// ===============================
function updateVolumeSliderFill() {
  const audio = getAudio();
  if (!volumeSlider || !audio) return;
  
  const percentage = audio.volume * 100;
  
  const gradient = `linear-gradient(90deg, 
    rgba(125,95,255,0.95) 0%, 
    rgba(0,210,255,0.95) ${percentage}%, 
    rgba(255,255,255,0.02) ${percentage}%, 
    rgba(255,255,255,0.01) 100%)`;
  
  volumeSlider.style.background = gradient;
  volumeSlider.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.02)`;
  volumeSlider.style.border = `1px solid rgba(255,255,255,0.04)`;
}

// ===============================
// VOLUME SLIDER EVENTS
// ===============================
if (volumeSlider) {
  // Input event fires continuously while dragging
  volumeSlider.addEventListener('input', (e) => {
    const audio = getAudio();
    if (!audio) return;
    
    const value = parseFloat(e.target.value) / 100;
    audio.volume = value;
    
    if (value > 0) previousVolume = value;
    
    updateVolumeIcon(value);
    updateVolumeSliderFill();
  });

  // Change event fires when releasing the slider
  volumeSlider.addEventListener('change', (e) => {
    const audio = getAudio();
    if (!audio) return;
    
    const value = parseFloat(e.target.value) / 100;
    audio.volume = value;
    
    if (value > 0) previousVolume = value;
    
    updateVolumeIcon(value);
    updateVolumeSliderFill();
  });

  // Click directly on track
  volumeSlider.addEventListener('click', (e) => {
    const audio = getAudio();
    if (!audio) return;
    
    const value = parseFloat(e.target.value) / 100;
    audio.volume = value;
    
    if (value > 0) previousVolume = value;
    
    updateVolumeIcon(value);
    updateVolumeSliderFill();
  });
}
