// ==========================
// Volume Control Module
// ==========================
const volumeSlider = document.getElementById('volume-slider');
const volumeBtn = document.getElementById('volume-btn');
const volumeSliderContainer = document.getElementById('volume-slider-container');
const playBtn = document.getElementById('play-inline');

let previousVolume = 0.7; // default 70%
let isVolumeVisible = false;
let isVolumeEnabled = false; // slider only works after user interaction

function getAudio() {
  return document.getElementById('audio');
}

// --------------------------
// Initialize volume
// --------------------------
function initVolume() {
  const audio = getAudio();
  if (!audio) return;

  audio.volume = previousVolume;
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

  if (volume === 0) {
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

  const percentage = audio.volume * 100;
  volumeSlider.style.background = `linear-gradient(90deg, rgba(125,95,255,0.95) 0%, rgba(0,210,255,0.95) ${percentage}%, rgba(255,255,255,0.02) ${percentage}%, rgba(255,255,255,0.01) 100%)`;
  volumeSlider.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.02)`;
  volumeSlider.style.border = `1px solid rgba(255,255,255,0.04)`;
}

// --------------------------
// Enable volume control after user interaction
// --------------------------
function enableVolumeControl() {
  if (isVolumeEnabled || !volumeSlider) return;
  const audio = getAudio();
  if (!audio) return;

  isVolumeEnabled = true;

  // Function to set volume from slider
  const setVolume = (value) => {
    if (audio.volume !== undefined) {
      audio.volume = value;
      if (value > 0) previousVolume = value;
    } else {
      audio.muted = value === 0; // fallback for strict mobile browsers
    }
    updateVolumeIcon(value);
    updateVolumeSliderFill();
  };

  // Desktop and mobile: input event
  volumeSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value) / 100;
    setVolume(value);
  });

  // For touch devices: touchmove + touchend
  volumeSlider.addEventListener('touchmove', (e) => {
    e.preventDefault(); // prevent page scroll while dragging
    const rect = volumeSlider.getBoundingClientRect();
    const touch = e.touches[0];
    let value = (touch.clientX - rect.left) / rect.width;
    value = Math.max(0, Math.min(1, value));
    setVolume(value);
    volumeSlider.value = value * 100;
  });

  volumeSlider.addEventListener('touchend', (e) => {
    const rect = volumeSlider.getBoundingClientRect();
    const touch = e.changedTouches[0];
    let value = (touch.clientX - rect.left) / rect.width;
    value = Math.max(0, Math.min(1, value));
    setVolume(value);
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

// Mobile friendly: enable slider after first play
if (playBtn) {
  playBtn.addEventListener('click', () => {
    const audio = getAudio();
    if (!audio) return;

    audio.play().then(() => {
      enableVolumeControl(); // now slider works on mobile
    }).catch((err) => {
      console.log('Audio play prevented:', err);
    });
  });
}
