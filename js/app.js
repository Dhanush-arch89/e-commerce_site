/**
 * Core Application Logic & Database Connectors
 * Shared across all MPA pages
 */

const API_BASE = 'backend/api';

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.protocol === 'file:') {
        document.body.innerHTML = `
            <div style="display:flex; height:100vh; width:100vw; align-items:center; justify-content:center; background:#0f1117; color:#f8fafc; font-family:sans-serif; text-align:center; padding:2rem; box-sizing:border-box;">
                <div style="max-width:650px; background:#1e212b; padding:3rem; border-radius:1rem; border:1px solid #334155;">
                    <h2 style="color:#ef4444; margin-bottom:1.5rem; font-size:2rem;">⚠️ Server Required</h2>
                    <p style="font-size:1.1rem; line-height:1.6; color:#94a3b8; text-align:left;">You are opening this html file directly from your system.</p>
                    <p style="font-size:1.1rem; line-height:1.6; color:#94a3b8; text-align:left; margin-top:1rem;">Because this ecommerce project uses a <strong>PHP API</strong> and <strong>MySQL Database</strong>, it absolutely must be run through a web server (like Apache in XAMPP) to function correctly.</p>
                    <div style="background:rgba(255,255,255,0.05); padding:1.5rem; border-radius:0.5rem; margin-top:2rem; text-align:left;">
                        <h4 style="color:#f8fafc; margin-bottom:0.5rem;">How to fix:</h4>
                        <ol style="color:#94a3b8; margin-left:1.5rem; line-height:1.8;">
                            <li>Start <strong>Apache</strong> and <strong>MySQL</strong> in your XAMPP Control Panel.</li>
                            <li>Copy this entire <code>ecommerce</code> folder.</li>
                            <li>Paste it into your <code>C:\\xampp\\htdocs\\</code> folder.</li>
                            <li>Open your browser to <a href="http://localhost/ecommerce/index.html" style="color:#0ea5e9;">http://localhost/ecommerce/index.html</a>.</li>
                        </ol>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    initApp();
});

function initApp() {
    // --- Admin Route Guard ---
    // If the logged-in user is an admin and they are NOT on admin.html or auth.html,
    // redirect them to admin.html. Admins should only see the admin dashboard.
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const adminAllowedPages = ['admin.html', 'auth.html'];
    const sessionUser = JSON.parse(localStorage.getItem('aura_user'));
    
    if (sessionUser && sessionUser.role === 'admin' && !adminAllowedPages.includes(currentPage)) {
        window.location.href = 'admin.html';
        return; // Stop further initialization on the user page
    }

    updateCartBadge();
    checkUserSession();
    
    // Add scroll effect to navbar
    const navbar = document.getElementById('main-nav');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.style.boxShadow = 'var(--shadow-md)';
                navbar.style.background = 'rgba(20, 23, 31, 0.9)';
            } else {
                navbar.style.boxShadow = 'none';
                navbar.style.background = 'var(--glass-bg)';
            }
        });
    }
}

// Database-backed cart global badge refresh
async function updateCartBadge() {
    const user = JSON.parse(localStorage.getItem('aura_user'));
    const cartBadge = document.getElementById('cart-count');
    if (!cartBadge) return;
    
    if (!user) {
        cartBadge.style.display = 'none';
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/cart.php?action=get&user_id=${user.id}`);
        const data = await res.json();
        
        if (data.success) {
            const count = data.cart.reduce((sum, item) => sum + parseInt(item.quantity), 0);
            cartBadge.textContent = count;
            cartBadge.style.display = count === 0 ? 'none' : 'flex';
        }
    } catch (e) {
        console.error("Error fetching cart API:", e);
    }
}

function checkUserSession() {
    const authBtn = document.getElementById('auth-btn');
    let user = JSON.parse(localStorage.getItem('aura_user'));
    
    // Invalidate mock tokens from Phase 1
    if (user && !user.id) {
        localStorage.removeItem('aura_user');
        user = null;
        if (authBtn) authBtn.innerHTML = 'Sign In';
    }
    
    if (user && authBtn) {
        const safeName = user.name || 'User';
        const safeEmail = user.email || 'user@aura.com';
        
        const userMenu = document.createElement('div');
        userMenu.className = 'user-dropdown-container';
        userMenu.style.position = 'relative';
        
        userMenu.innerHTML = `
            <button class="btn btn-outline user-menu-btn" style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem 1rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                ${safeName.split(' ')[0]}
            </button>
            <div class="user-dropdown-menu" style="display:none; position:absolute; top:115%; right:0; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); box-shadow:0 10px 25px rgba(0,0,0,0.5); padding:0.5rem; min-width:220px; z-index:200; animation:fadeIn 0.2s ease;">
                <div style="padding:0.75rem 1rem; border-bottom:1px solid var(--glass-border); margin-bottom:0.5rem;">
                    <strong style="color:var(--text-main); display:block; font-size:1.05rem;">${safeName}</strong>
                    <span style="color:var(--text-muted); font-size:0.85rem;">${safeEmail}</span>
                </div>
                ${user.role === 'admin' ? '<a href="admin.html" class="dropdown-item">Admin Dashboard</a>' : ''}
                <a href="tracking.html" class="dropdown-item">My Orders</a>
                <button id="logout-btn" class="dropdown-item" style="width:100%; text-align:left; color:#ef4444; margin-top:0.5rem; border-top:1px solid var(--glass-border); padding-top:0.75rem;">
                    <svg style="display:inline-block; vertical-align:middle; margin-right:0.5rem;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Sign Out / Switch
                </button>
            </div>
        `;
        
        if (!document.getElementById('dropdown-styles')) {
            const style = document.createElement('style');
            style.id = 'dropdown-styles';
            style.innerHTML = `
                .dropdown-item { display: block; padding: 0.6rem 1rem; color: var(--text-main); text-decoration: none; border-radius: var(--radius-sm); transition: var(--transition); cursor: pointer; font-size: 0.95rem; font-family: inherit; background: transparent; border: none; }
                .dropdown-item:hover { background: var(--surface-hover); color: var(--primary); }
            `;
            document.head.appendChild(style);
        }
        
        authBtn.replaceWith(userMenu);
        
        const menuBtn = userMenu.querySelector('.user-menu-btn');
        const menuDropdown = userMenu.querySelector('.user-dropdown-menu');
        
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.style.display = menuDropdown.style.display === 'none' ? 'block' : 'none';
        });
        
        document.addEventListener('click', () => { menuDropdown.style.display = 'none'; });
        
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('aura_user');
            window.location.href = 'auth.html';
        });

        if (user.role === 'admin') {
            const adminNavLink = document.getElementById('admin-nav-link');
            if (adminNavLink) adminNavLink.style.display = '';
        }
    }
}
