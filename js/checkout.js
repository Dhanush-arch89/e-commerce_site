document.addEventListener('DOMContentLoaded', () => {
    // Render the summary automatically if returning from cart
    renderCheckoutSummary();
    
    // Attach form handler
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            processPayment();
        });
    }
});

// Used via inline handler in HTML
window.selectPayment = function(el) {
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
    el.classList.add('selected');
};

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
        
        // Save items inside window context for the pay function
        window.checkoutItems = data.cart;
        
        let subtotal = 0;
        itemsContainer.innerHTML = '';
        
        data.cart.forEach(item => {
            const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
            subtotal += itemTotal;
            
            itemsContainer.innerHTML += `
                <div class="summary-item">
                    <span class="summary-item-title">${item.quantity}x ${item.title}</span>
                    <span>$${itemTotal.toFixed(2)}</span>
                </div>
            `;
        });
        
        const shipping = 15.00; // Flat mock rate
        const tax = subtotal * 0.08; // 8% mock tax
        const total = subtotal + shipping + tax;
        
        // Save localized values context for PHP API consumption later
        window.checkoutTotals = { subtotal, shipping, tax, total };
        
        document.getElementById('chk-subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('chk-shipping').textContent = `$${shipping.toFixed(2)}`;
        document.getElementById('chk-tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('chk-total').textContent = `$${total.toFixed(2)}`;
        
    } catch (e) {
        console.error("Cart retrieval on checkout failed", e);
        alert("Failed to load cart data from database.");
    }
}

async function processPayment() {
    const btn = document.getElementById('submit-order-btn');
    const user = JSON.parse(localStorage.getItem('aura_user'));
    
    // Interactive feedback
    btn.innerHTML = `
        <svg style="animation: spin 1s linear infinite; margin-right: 0.5rem;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
        Processing Secure Payment...
    `;
    btn.disabled = true;
    
    // Spinner Animation Keyframes injection
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
            items: window.checkoutItems // already matched format
        };
        
        const res = await fetch(`backend/api/orders.php?action=create`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (data.success) {
            // Store for tracking module tracking persistence
            localStorage.setItem('aura_last_tracking', data.tracking_id); 
            
            // Update UI modal
            document.getElementById('mock-tracking').textContent = data.tracking_id;
            document.getElementById('success-modal').style.display = 'flex';
            
            // Re-sync nav cart
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
