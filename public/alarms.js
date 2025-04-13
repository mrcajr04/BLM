// Alarm sound
const alarmSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// Get DOM elements
const alarmForm = document.getElementById('alarm-form');
const leadNameInput = document.getElementById('lead-name');
const clientNameInput = document.getElementById('client-name');
const alarmTimeInput = document.getElementById('alarm-time');
const alarmsList = document.getElementById('alarms-list');

// Load alarms from localStorage
let alarms = JSON.parse(localStorage.getItem('alarms')) || [];

// Clean up expired alarms (older than 8 hours)
function cleanupExpiredAlarms() {
    const now = new Date();
    const eightHoursAgo = new Date(now - 8 * 60 * 60 * 1000);
    alarms = alarms.filter(alarm => new Date(alarm.createdAt) > eightHoursAgo);
    saveAlarms();
}

// Save alarms to localStorage
function saveAlarms() {
    localStorage.setItem('alarms', JSON.stringify(alarms));
}

// Format time for display
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Calculate time remaining
function getTimeRemaining(targetTime) {
    const now = new Date();
    const target = new Date(targetTime);
    const diff = target - now;
    
    if (diff <= 0) return null;
    
    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const hours = Math.floor((diff / 1000 / 60 / 60) % 24);
    
    return { hours, minutes, seconds };
}

// Update alarm status
function updateAlarmStatus() {
    const now = new Date();
    
    alarms.forEach(alarm => {
        const alarmTime = new Date(alarm.time);
        if (alarmTime <= now && !alarm.triggered) {
            alarm.triggered = true;
            alarmSound.play();
            saveAlarms();
            renderAlarms();
        }
    });
}

// Render alarms list
function renderAlarms() {
    alarmsList.innerHTML = '';
    
    alarms.forEach((alarm, index) => {
        const alarmTime = new Date(alarm.time);
        const timeRemaining = getTimeRemaining(alarm.time);
        const isExpired = !timeRemaining;
        
        const alarmElement = document.createElement('div');
        alarmElement.className = `flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 ${isExpired ? 'border-red-500' : 'border-blue-500'}`;
        
        const contentHtml = `
            <div class="flex-1">
                <div class="font-medium flex items-center">
                    ${alarm.leadName} / ${alarm.clientName}
                    <button class="ml-2 text-blue-600 hover:text-blue-900 copy-names-btn" title="Copy names">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div class="text-sm text-gray-500">Set for ${formatTime(alarmTime)}</div>
            </div>
            <div class="flex items-center gap-6">
                ${!isExpired ? `
                    <span class="text-gray-500 text-sm">
                        ${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s
                    </span>
                ` : ''}
                <span class="${isExpired ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} font-medium px-3 py-1 rounded-full text-sm">
                    ${isExpired ? 'Expired' : 'Active'}
                </span>
            </div>
        `;
        
        alarmElement.innerHTML = contentHtml;

        // Add copy functionality
        const copyBtn = alarmElement.querySelector('.copy-names-btn');
        copyBtn.addEventListener('click', (e) => {
            const textToCopy = `${alarm.leadName} / ${alarm.clientName}`;
            navigator.clipboard.writeText(textToCopy);
            
            // Visual feedback
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
            }, 1000);
        });

        alarmsList.appendChild(alarmElement);
    });
}

// Handle form submission
alarmForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const now = new Date();
    const [hours, minutes] = alarmTimeInput.value.split(':');
    const alarmTime = new Date();
    alarmTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // If the time has already passed today, set it for tomorrow
    if (alarmTime < now) {
        alarmTime.setDate(alarmTime.getDate() + 1);
    }
    
    const newAlarm = {
        leadName: leadNameInput.value,
        clientName: clientNameInput.value,
        time: alarmTime.toISOString(),
        createdAt: new Date().toISOString(),
        triggered: false
    };
    
    alarms.push(newAlarm);
    saveAlarms();
    renderAlarms();
    
    // Reset form
    alarmForm.reset();
});

// Initialize
cleanupExpiredAlarms();
renderAlarms();

// Update alarms every minute
setInterval(() => {
    updateAlarmStatus();
    renderAlarms();
}, 60000);

// Update display every second for countdown
setInterval(() => {
    renderAlarms();
}, 1000); 