document.addEventListener('DOMContentLoaded', () => {
    initCatalogue();
});

async function initCatalogue() {
    try {
        // Fetch Main Catalogue from MySQL
        const res = await fetch('backend/api/products.php?action=all');
        const data = await res.json();
        if (data.success) {
            renderGrid('main-catalogue-grid', data.products);
        } else {
            renderErrorMessage('main-catalogue-grid', data.error);
        }

        // Fetch Collaborative Filtering (Trending)
        const cRes = await fetch('backend/api/products.php?action=trending');
        const cData = await cRes.json();
        if (cData.success) {
            renderGrid('collaborative-grid', cData.products);
        }
        
        // Fetch Content-Based Filtering (Similar)
        const cbRes = await fetch('backend/api/products.php?action=similar');
        const cbData = await cbRes.json();
        if (cbData.success) {
            renderGrid('content-grid', cbData.products);
        }
    } catch (e) {
        console.error("Failed to load products from database:", e);
        document.getElementById('main-catalogue-grid').innerHTML = '<p style="color:red">Failed to connect to database. Is XAMPP running?</p>';
    }

    // Server-Side Filter Logic
    const filterSelect = document.getElementById('category-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', async (e) => {
            const category = e.target.value;
            const res = await fetch(`backend/api/products.php?action=all&category=${category}`);
            const data = await res.json();
            if (data.success) {
                renderGrid('main-catalogue-grid', data.products);
            }
        });
    }
}

function renderErrorMessage(containerId, errorStr) {
    const container = document.getElementById(containerId);
    if(container) {
        container.innerHTML = `<div style="grid-column: 1/-1; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 2rem; border-radius: var(--radius-md); text-align: center; color: #f8fafc;">
            <svg style="color: #ef4444; width: 48px; height: 48px; margin-bottom: 1rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <h3 style="margin-bottom: 0.5rem;">Database Connection Error</h3>
            <p style="color: #94a3b8;">${errorStr || 'Failed to communicate with MySQL backend.'}</p>
            <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 1rem;">Make sure you have imported <code>database.sql</code> into phpMyAdmin.</p>
        </div>`;
    }
}

function renderGrid(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<p class="text-muted">No products found in this category.</p>';
        return;
    }
    
    products.forEach((product, index) => {
        const delay = index * 0.1;
        const card = document.createElement('div');
        card.className = 'product-card animate-fade-in';
        card.style.animationDelay = `${delay}s`;
        card.style.opacity = '0';
        card.style.animationFillMode = 'forwards';
        
        const badgeHtml = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
        const price = parseFloat(product.price).toFixed(2);
        
        card.innerHTML = `
            ${badgeHtml}
            <div class="product-image-container">
                <img src="${product.image_url}" alt="${product.title}" class="product-image" loading="lazy">
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-title">${product.title}</h3>
                <div class="product-price">₹${price}</div>
                <button class="add-to-cart-btn" onclick="addToCart(${product.id}, event)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    Add to Cart
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Database-Driven Add To Cart
window.addToCart = async function(productId, event) {
    const user = JSON.parse(localStorage.getItem('aura_user'));
    
    if (!user) {
        alert("Please sign in to add items to your cart!");
        window.location.href = "auth.html";
        return;
    }
    
    const btn = event.currentTarget;
    const originalContent = btn.innerHTML;
    btn.innerHTML = 'Working...';
    btn.disabled = true;

    try {
        const res = await fetch('backend/api/cart.php?action=add', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: user.id, product_id: productId })
        });
        const data = await res.json();
        
        if (data.success) {
            btn.innerHTML = 'Added! ✓';
            btn.style.background = 'var(--primary)';
            btn.style.color = '#fff';
            
            if (typeof updateCartBadge === 'function') {
                updateCartBadge(); // Fetches new DB count
            }
        } else {
            alert(data.error);
        }
    } catch (e) {
        alert("Database connection failed.");
    }
    
    setTimeout(() => {
        btn.innerHTML = originalContent;
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
    }, 1500);
};
