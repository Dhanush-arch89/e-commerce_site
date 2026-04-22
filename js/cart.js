document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

async function renderCart() {
    const user = JSON.parse(localStorage.getItem('aura_user'));
    
    // Redirect if not logged in
    if (!user) {
        window.location.href = "auth.html";
        return;
    }
    
    const container = document.getElementById('cart-items-container');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    try {
        const res = await fetch(`backend/api/cart.php?action=get&user_id=${user.id}`);
        const data = await res.json();
        
        if (!data.success || !data.cart || data.cart.length === 0) {
            container.innerHTML = `
                <div class="glass-panel empty-cart-message animate-fade-in">
                    <svg style="color: var(--text-muted); width: 64px; height: 64px; margin-bottom: 1.5rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <h3 style="margin-bottom: 1rem; font-size: 1.75rem;">Your cart is empty</h3>
                    <p style="margin-bottom: 2rem; color: var(--text-muted);">Looks like you haven't added anything yet.</p>
                    <a href="index.html" class="btn btn-primary">Start Shopping</a>
                </div>
            `;
            if (checkoutBtn) checkoutBtn.disabled = true;
            updateSummary(0);
            return;
        }

        if (checkoutBtn) checkoutBtn.disabled = false;
        container.innerHTML = '';
        let subtotal = 0;
        
        data.cart.forEach((item, index) => {
            const price = parseFloat(item.price);
            const quantity = parseInt(item.quantity);
            const itemTotal = price * quantity;
            subtotal += itemTotal;
            
            const div = document.createElement('div');
            div.className = 'glass-panel cart-item animate-fade-in';
            div.style.animationDelay = `${index * 0.1}s`;
            div.style.animationFillMode = 'forwards';
            div.style.opacity = '0';
            
            div.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">₹${price.toFixed(2)}</div>
                    <div class="cart-item-actions">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                            <span class="quantity-display">${quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                        <button class="remove-btn" onclick="removeItem(${item.id})">Remove</button>
                    </div>
                </div>
                <div class="cart-item-total text-gradient">
                    ₹${itemTotal.toFixed(2)}
                </div>
            `;
            container.appendChild(div);
        });
        
        updateSummary(subtotal);
        // Refresh upper navbar badge from database
        if (typeof updateCartBadge === 'function') updateCartBadge();
        
    } catch (e) {
        console.error("Database cart fetch error:", e);
        container.innerHTML = '<p class="text-muted">Error loading cart from database. Is XAMPP running?</p>';
    }
}

window.updateQuantity = async function(productId, delta) {
    const user = JSON.parse(localStorage.getItem('aura_user'));
    if (!user) return;

    try {
        await fetch(`backend/api/cart.php?action=update`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: user.id, product_id: productId, delta })
        });
        renderCart(); // DB updated, refresh screen globally
    } catch (e) { console.error(e); }
};

window.removeItem = async function(productId) {
    const user = JSON.parse(localStorage.getItem('aura_user'));
    if (!user) return;

    try {
        await fetch(`backend/api/cart.php?action=remove`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: user.id, product_id: productId })
        });
        renderCart(); // DB updated, refresh screen globally
    } catch (e) { console.error(e); }
};

function updateSummary(subtotal) {
    const shipping = subtotal > 0 ? 99.00 : 0;
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + shipping + tax;
    
    // Store localized totals for checkout summary
    if (subtotal > 0) {
        localStorage.setItem('aura_checkout_totals', JSON.stringify({ subtotal, shipping, tax, total }));
    }
    
    const elements = {
        'summary-subtotal': subtotal,
        'summary-shipping': shipping,
        'summary-tax': tax,
        'summary-total': total
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = `₹${value.toFixed(2)}`;
        }
    }
}
