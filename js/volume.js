// ==========================
// Volume Control Module (Cross-Platform)
// ==========================
const volumeSlider = document.getElementById('volume-slider');
const volumeBtn = document.getElementById('volume-btn');
const volumeSliderContainer = document.getElementById('volume-slider-container');
const playBtn = document.getElementById('play-inline');

let previousVolume = 0.7; // Default 70%
let isVolumeVisible = false;
let isVolumeEnabled = false; // Slider works only after user interaction

// Detect iOS devices
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

function getAudio() {
  return document.getElementById('audio');
}

// --------------------------
// Initialize volume
// --------------------------
function initVolume() {
  const audio = getAudio();
  if (!audio) return;

  if (!isIOS) {
    audio.volume = previousVolume; // Only works on non-iOS
  }
  audio.muted = false;

  updateVolumeSliderFill();
  updateVolumeIcon(previousVolume);

  // Hide slider initially
  if (volumeSliderContainer) volumeSliderContainer.classList.remove('show');
  isVolumeVisible = false;
}

// --------------------------
// Toggle volume slider visibility
// --------------------------
function toggleVolumeSlider() {
  isVolumeVisible = !isVolumeVisible;
  if (volumeSliderContainer) {
    volumeSliderContainer.classList.toggle('show', isVolumeVisible);
  }
}

// --------------------------
// Hide slider if clicking outside
// --------------------------
function handleClickOutside(e) {
  if (!isVolumeVisible || !volumeSliderContainer || !volumeBtn) return;

  if (!volumeSliderContainer.contains(e.target) && !volumeBtn.contains(e.target)) {
    isVolumeVisible = false;
    volumeSliderContainer.classList.remove('show');
  }
}

// --------------------------
// Update volume icon
// --------------------------
function updateVolumeIcon(volume) {
  if (!volumeBtn) return;

  const audio = getAudio();
  if (volume === 0 || (isIOS && audio.muted)) {
    volumeBtn.textContent = '🔇';
    volumeBtn.title = 'Unmute';
  } else if (volume < 0.3) {
    volumeBtn.textContent = '🔈';
    volumeBtn.title = 'Low volume';
  } else if (volume < 0.7) {
    volumeBtn.textContent = '🔉';
    volumeBtn.title = 'Medium volume';
  } else {
    volumeBtn.textContent = '🔊';
    volumeBtn.title = 'High volume';
  }
}

// --------------------------
// Update slider fill (gradient)
// --------------------------
function updateVolumeSliderFill() {
  const audio = getAudio();
  if (!volumeSlider || !audio) return;

  let volumePercent = isIOS ? (audio.muted ? 0 : previousVolume * 100) : audio.volume * 100;

  volumeSlider.style.background = `linear-gradient(90deg, rgba(125,95,255,0.95) 0%, rgba(0,210,255,0.95) ${volumePercent}%, rgba(255,255,255,0.02) ${volumePercent}%, rgba(255,255,255,0.01) 100%)`;
  volumeSlider.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.02)`;
  volumeSlider.style.border = `1px solid rgba(255,255,255,0.04)`;
}

// --------------------------
// Set volume (handles iOS fallback)
// --------------------------
function setVolume(value) {
  const audio = getAudio();
  if (!audio) return;

  if (isIOS) {
    audio.muted = value === 0;
    if (value > 0) previousVolume = value;
  } else {
    audio.volume = value;
    if (value > 0) previousVolume = value;
  }

  updateVolumeIcon(value);
  updateVolumeSliderFill();
}

// --------------------------
// Enable volume control after user interaction
// --------------------------
function enableVolumeControl() {
  if (isVolumeEnabled || !volumeSlider) return;
  const audio = getAudio();
  if (!audio) return;

  isVolumeEnabled = true;

  const updateFromSlider = (value) => {
    setVolume(value);
  };

  // Desktop/mobile input
  volumeSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value) / 100;
    updateFromSlider(value);
  });

  // Touch devices: smooth dragging
  volumeSlider.addEventListener('touchmove', (e) => {
    e.preventDefault(); // prevent page scroll
    const rect = volumeSlider.getBoundingClientRect();
    const touch = e.touches[0];
    let value = (touch.clientX - rect.left) / rect.width;
    value = Math.max(0, Math.min(1, value));
    updateFromSlider(value);
    volumeSlider.value = value * 100;
  });

  volumeSlider.addEventListener('touchend', (e) => {
    const rect = volumeSlider.getBoundingClientRect();
    const touch = e.changedTouches[0];
    let value = (touch.clientX - rect.left) / rect.width;
    value = Math.max(0, Math.min(1, value));
    updateFromSlider(value);
    volumeSlider.value = value * 100;
  });
}

// --------------------------
// Event listeners
// --------------------------
if (volumeBtn) {
  volumeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleVolumeSlider();
  });
}

document.addEventListener('click', handleClickOutside);

// Initialize volume on page load
window.addEventListener('DOMContentLoaded', initVolume);
document.addEventListener('trackLoaded', initVolume);

// Enable slider after first play (mobile-friendly)
if (playBtn) {
  playBtn.addEventListener('click', () => {
    const audio = getAudio();
    if (!audio) return;

    audio.play().then(() => {
      enableVolumeControl(); // slider now functional
    }).catch((err) => {
      console.log('Audio play prevented:', err);
    });
  });
}
