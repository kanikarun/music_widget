// ===============================
// CLOCK MODULE
// ===============================
(function() {
  const clockTime = document.getElementById('clock-time');
  const clockDate = document.getElementById('clock-date');

  function updateClock() {
    const now = new Date();
    
    // 12-hour format with AM/PM
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12; // convert 0-23 to 0-11
    hours = hours ? hours : 12; // if hour = 0, make it 12
    
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    clockTime.textContent = `${hh}:${mm}:${ss} ${ampm}`;
    
    // Format date (Day, Month Date)
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    clockDate.textContent = now.toLocaleDateString('en-US', options);
  }

  // Update immediately and then every second
  updateClock();
  setInterval(updateClock, 1000);
})();
