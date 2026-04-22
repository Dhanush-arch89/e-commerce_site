document.addEventListener('DOMContentLoaded', () => {
    renderCheckoutSummary();
    
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateCheckoutForm()) {
                processPayment();
            }
        });
    }
});

// Payment method selection + toggle card/UPI fields
window.selectPayment = function(el) {
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
    el.classList.add('selected');

    const method = el.dataset.method;
    const cardFields = document.getElementById('card-fields');
    const upiFields = document.getElementById('upi-fields');

    if (method === 'card') {
        cardFields.style.display = '';
        upiFields.style.display = 'none';
    } else {
        cardFields.style.display = 'none';
        upiFields.style.display = '';
    }
};

// ============================================================
// Checkout Form Validation
// ============================================================
function validateCheckoutForm() {
    clearCheckoutErrors();
    let valid = true;

    // Shipping validation
    const fname = document.getElementById('ship-fname');
    const lname = document.getElementById('ship-lname');
    const address = document.getElementById('ship-address');
    const city = document.getElementById('ship-city');
    const pin = document.getElementById('ship-pin');

    if (!fname.value.trim()) { markError(fname, 'First name is required'); valid = false; }
    if (!lname.value.trim()) { markError(lname, 'Last name is required'); valid = false; }
    if (!address.value.trim() || address.value.trim().length < 5) { markError(address, 'Enter a valid address (min 5 chars)'); valid = false; }
    if (!city.value.trim()) { markError(city, 'City is required'); valid = false; }
    if (!pin.value.trim() || !/^[0-9]{6}$/.test(pin.value.trim())) { markError(pin, 'Enter a valid 6-digit PIN code'); valid = false; }

    // Payment validation based on selected method
    const selectedMethod = document.querySelector('.payment-method.selected')?.dataset.method || 'card';

    if (selectedMethod === 'card') {
        const cardNum = document.getElementById('card-number');
        const expiry = document.getElementById('card-expiry');
        const cvv = document.getElementById('card-cvv');

        const cleanNum = cardNum.value.replace(/\s/g, '');
        if (!cleanNum || cleanNum.length < 13 || cleanNum.length > 19 || !/^\d+$/.test(cleanNum)) {
            markError(cardNum, 'Enter a valid card number');
            valid = false;
        }
        if (!expiry.value.trim() || !/^\d{2}\/\d{2}$/.test(expiry.value.trim())) {
            markError(expiry, 'Enter expiry as MM/YY');
            valid = false;
        }
        if (!cvv.value.trim() || !/^\d{3,4}$/.test(cvv.value.trim())) {
            markError(cvv, 'Enter a valid 3-4 digit CVV');
            valid = false;
        }
    } else {
        // UPI validation
        const upiId = document.getElementById('upi-id');
        if (!upiId.value.trim() || !upiId.value.includes('@')) {
            markError(upiId, 'Enter a valid UPI ID (e.g. name@upi)');
            valid = false;
        }
    }

    return valid;
}

function markError(input, message) {
    input.style.borderColor = '#ef4444';
    input.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.3)';
    const err = document.createElement('div');
    err.className = 'chk-field-error';
    err.textContent = message;
    err.style.cssText = 'color:#ef4444; font-size:0.8rem; margin-top:0.3rem; font-weight:500;';
    input.parentNode.appendChild(err);
}

function clearCheckoutErrors() {
    document.querySelectorAll('.chk-field-error').forEach(el => el.remove());
    document.querySelectorAll('#checkout-form .form-input').forEach(input => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
    });
}

// ============================================================
// Render Checkout Summary (₹ currency)
// ============================================================
async function renderCheckoutSummary() {
    const user = JSON.parse(localStorage.getItem('aura_user'));
    if (!user) {
        window.location.href = "auth.html";
        return;
    }
    
    const itemsContainer = document.getElementById('checkout-items');
    
    try {
        const res = await fetch(`backend/api/cart.php?action=get&user_id=${user.id}`);
        const data = await res.json();
        
        if (!data.success || !data.cart || data.cart.length === 0) {
            window.location.href = 'cart.html';
            return;
        }
        
        window.checkoutItems = data.cart;
        
        let subtotal = 0;
        itemsContainer.innerHTML = '';
        
        data.cart.forEach(item => {
            const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
            subtotal += itemTotal;
            
            itemsContainer.innerHTML += `
                <div class="summary-item">
                    <span class="summary-item-title">${item.quantity}x ${item.title}</span>
                    <span>₹${itemTotal.toFixed(2)}</span>
                </div>
            `;
        });
        
        const shipping = 99.00;
        const tax = subtotal * 0.18; // 18% GST
        const total = subtotal + shipping + tax;
        
        window.checkoutTotals = { subtotal, shipping, tax, total };
        
        document.getElementById('chk-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById('chk-shipping').textContent = `₹${shipping.toFixed(2)}`;
        document.getElementById('chk-tax').textContent = `₹${tax.toFixed(2)}`;
        document.getElementById('chk-total').textContent = `₹${total.toFixed(2)}`;
        
    } catch (e) {
        console.error("Cart retrieval on checkout failed", e);
        alert("Failed to load cart data from database.");
    }
}

// ============================================================
// Process Payment
// ============================================================
async function processPayment() {
    const btn = document.getElementById('submit-order-btn');
    const user = JSON.parse(localStorage.getItem('aura_user'));
    
    btn.innerHTML = `
        <svg style="animation: spin 1s linear infinite; margin-right: 0.5rem;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
        Processing Secure Payment...
    `;
    btn.disabled = true;
    
    if (!document.getElementById('spin-anim')) {
        const style = document.createElement('style');
        style.id = 'spin-anim';
        style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }
    
    try {
        const payload = {
            user_id: user.id,
            subtotal: window.checkoutTotals.subtotal,
            shipping: window.checkoutTotals.shipping,
            tax: window.checkoutTotals.tax,
            total: window.checkoutTotals.total,
            items: window.checkoutItems
        };
        
        const res = await fetch(`backend/api/orders.php?action=create`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (data.success) {
            localStorage.setItem('aura_last_tracking', data.tracking_id); 
            document.getElementById('mock-tracking').textContent = data.tracking_id;
            document.getElementById('success-modal').style.display = 'flex';
            if (typeof updateCartBadge === 'function') updateCartBadge();
        } else {
            alert(data.error);
            btn.innerHTML = 'Pay Now';
            btn.disabled = false;
        }
    } catch(e) {
        console.error(e);
        alert("Order submission network failed.");
        btn.innerHTML = 'Pay Now';
        btn.disabled = false;
    }
}
