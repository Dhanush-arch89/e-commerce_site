document.addEventListener('DOMContentLoaded', () => {
    // Role Authorization
    const user = JSON.parse(localStorage.getItem('aura_user'));
    if (!user || user.role !== 'admin') {
        alert("Restricted Access: Admins only.");
        window.location.href = "index.html";
        return;
    }
    
    // Inject auth name into the Header
    const titleStatus = document.querySelector('.admin-header p');
    if (titleStatus) titleStatus.textContent = `Welcome back, ${user.name}. Here's what's happening today.`;
    
    // Wire up sidebar navigation
    initSidebar();

    // Wire up Add Product button
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', openProductModal);
    }

    // Wire up modal close buttons
    const modalOverlay = document.getElementById('product-modal-overlay');
    const modalCancel = document.getElementById('modal-cancel-btn');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeProductModal();
        });
    }
    if (modalCancel) modalCancel.addEventListener('click', closeProductModal);

    // Wire up product form submission
    const productForm = document.getElementById('add-product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleAddProduct);
    }

    // Load default view
    renderDashboard();
});

// ============================================================
// Sidebar Navigation
// ============================================================
let currentView = 'dashboard';

function initSidebar() {
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.dataset.view;
            if (!view || view === currentView) return;

            // Update active state
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentView = view;

            // Show/hide the add product button based on view
            const addBtn = document.getElementById('add-product-btn');
            if (addBtn) {
                addBtn.style.display = (view === 'products') ? '' : 'none';
            }

            // Update header title
            const headerTitle = document.querySelector('.admin-header h2');
            const headerSub = document.querySelector('.admin-header p');
            const user = JSON.parse(localStorage.getItem('aura_user'));

            switch(view) {
                case 'dashboard':
                    if (headerTitle) headerTitle.innerHTML = 'Overview';
                    if (headerSub) headerSub.textContent = `Welcome back, ${user?.name || 'Admin'}. Here's what's happening today.`;
                    renderDashboard();
                    break;
                case 'orders':
                    if (headerTitle) headerTitle.innerHTML = 'All <span class="text-gradient">Orders</span>';
                    if (headerSub) headerSub.textContent = 'Manage and update all customer orders.';
                    renderOrdersView();
                    break;
                case 'products':
                    if (headerTitle) headerTitle.innerHTML = 'Product <span class="text-gradient">Inventory</span>';
                    if (headerSub) headerSub.textContent = 'View and manage your product catalogue.';
                    renderProductsView();
                    break;
                case 'customers':
                    if (headerTitle) headerTitle.innerHTML = 'Customer <span class="text-gradient">Base</span>';
                    if (headerSub) headerSub.textContent = 'Registered users on the platform.';
                    renderCustomersView();
                    break;
                case 'settings':
                    if (headerTitle) headerTitle.innerHTML = 'Settings';
                    if (headerSub) headerSub.textContent = 'System configuration and preferences.';
                    renderSettingsView();
                    break;
            }
        });
    });
}

// ============================================================
// Dashboard View (Default)
// ============================================================
async function renderDashboard() {
    const statsContainer = document.getElementById('admin-stats');
    const workspace = document.getElementById('admin-workspace');
    
    const iconRevenue = '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>';
    const iconOrders = '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path>';
    const iconCustomers = '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>';

    try {
        const res = await fetch(`backend/api/orders.php?action=admin_all`);
        const data = await res.json();
        
        if (data.success) {
            const dbOrders = data.orders;
            
            let totalRevenue = 0;
            dbOrders.forEach(o => totalRevenue += parseFloat(o.total_amount));
            
            const stats = [
                { title: 'Gross DB Revenue', value: '₹' + totalRevenue.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2}), icon: iconRevenue },
                { title: 'Total DB Orders', value: dbOrders.length.toString(), icon: iconOrders },
                { title: 'Customer Base', value: 'Live Metrics', icon: iconCustomers } 
            ];
            
            // Render Stats
            if (statsContainer) {
                statsContainer.innerHTML = '';
                statsContainer.style.display = '';
                stats.forEach((stat, index) => {
                    const delay = index * 0.1;
                    statsContainer.innerHTML += `
                        <div class="stat-card" style="animation: fadeIn 0.5s ease forwards; animation-delay: ${delay}s; opacity: 0;">
                            <div class="stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${stat.icon}</svg></div>
                            <div class="stat-info"><h3>${stat.value}</h3><p>${stat.title}</p></div>
                        </div>
                    `;
                });
            }

            // Render Recent Orders (limited to 5, read-only for dashboard)
            if (workspace) {
                const recentOrders = dbOrders.slice(0, 5);
                workspace.innerHTML = buildOrdersTable(recentOrders, false);
            }
        }
    } catch(e) {
        console.error("Failed to load admin dashboard:", e);
        if (workspace) workspace.innerHTML = `<div class="admin-table-container"><p style="text-align:center; padding:2rem; color:#ef4444;">Failed to connect to MySQL Database. Ensure XAMPP is running.</p></div>`;
    }
}

// ============================================================
// Orders View (Full with status update dropdowns)
// ============================================================
async function renderOrdersView() {
    const statsContainer = document.getElementById('admin-stats');
    const workspace = document.getElementById('admin-workspace');
    if (statsContainer) statsContainer.style.display = 'none';

    try {
        const res = await fetch('backend/api/orders.php?action=admin_all');
        const data = await res.json();
        if (data.success) {
            workspace.innerHTML = buildOrdersTable(data.orders, true);
        }
    } catch(e) {
        workspace.innerHTML = `<p style="color:#ef4444; text-align:center; padding:2rem;">Database error.</p>`;
    }
}

function buildOrdersTable(orders, editable) {
    if (orders.length === 0) {
        return `<div class="admin-table-container"><p style="text-align:center; padding:3rem; color:var(--text-muted);">No orders found in the database.</p></div>`;
    }

    const statuses = ['Pending', 'Processing', 'In Transit', 'Delivered', 'Completed', 'Cancelled'];

    let rows = '';
    orders.forEach(order => {
        const d = new Date(order.created_at);
        const formattedDate = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        let statusCell;
        if (editable) {
            const options = statuses.map(s => 
                `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`
            ).join('');
            statusCell = `
                <select class="status-select status-color-${slugify(order.status)}" data-order-id="${order.id}" onchange="handleStatusChange(this)">
                    ${options}
                </select>`;
        } else {
            const statusClass = getStatusClass(order.status);
            statusCell = `<span class="status-pill ${statusClass}">${order.status}</span>`;
        }

        rows += `
            <tr>
                <td style="font-weight: 500; font-family: monospace; font-size: 1.05rem;">#${order.tracking_id}</td>
                <td style="color: var(--text-main); font-weight: 500;">${order.customer_name}</td>
                <td style="color: var(--text-muted);">${formattedDate}</td>
                <td style="font-weight: 600; color: var(--primary);">₹${parseFloat(order.total_amount).toFixed(2)}</td>
                <td>${statusCell}</td>
            </tr>
        `;
    });

    return `
        <div class="admin-table-container">
            <div class="admin-table-header">
                <h3 style="font-size: 1.15rem;">${editable ? 'All Orders' : 'Recent Orders'}</h3>
                <span style="color: var(--text-muted); font-size: 0.9rem;">${orders.length} order(s)</span>
            </div>
            <div style="overflow-x: auto;">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
    `;
}

function getStatusClass(status) {
    switch(status) {
        case 'Completed': case 'Delivered': return 'status-completed';
        case 'Cancelled': return 'status-cancelled';
        case 'Processing': case 'In Transit': return 'status-transit';
        default: return 'status-pending';
    }
}

function slugify(str) {
    return str.toLowerCase().replace(/\s+/g, '-');
}

// Global: called from inline onchange
window.handleStatusChange = async function(selectEl) {
    const orderId = selectEl.dataset.orderId;
    const newStatus = selectEl.value;
    
    // Update visual color class
    selectEl.className = `status-select status-color-${slugify(newStatus)}`;

    try {
        const res = await fetch('backend/api/orders.php?action=update_status', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ order_id: orderId, status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Order status updated to "${newStatus}"`);
        } else {
            showToast('Failed to update: ' + (data.error || 'Unknown error'), true);
        }
    } catch(e) {
        showToast('Database connection failed.', true);
    }
};

// ============================================================
// Products View
// ============================================================
async function renderProductsView() {
    const statsContainer = document.getElementById('admin-stats');
    const workspace = document.getElementById('admin-workspace');
    if (statsContainer) statsContainer.style.display = 'none';

    try {
        const res = await fetch('backend/api/products.php?action=all');
        const data = await res.json();
        if (data.success) {
            const products = data.products;
            let rows = '';
            products.forEach(p => {
                rows += `
                    <tr>
                        <td>
                            <div style="display:flex; align-items:center; gap:1rem;">
                                <img src="${p.image_url}" alt="${p.title}" style="width:48px; height:48px; object-fit:cover; border-radius:var(--radius-sm); border:1px solid var(--border);">
                                <span style="font-weight:500;">${p.title}</span>
                            </div>
                        </td>
                        <td><span class="product-cat-pill">${p.category}</span></td>
                        <td style="font-weight:600; color:var(--primary);">₹${parseFloat(p.price).toFixed(2)}</td>
                        <td>${p.badge ? `<span class="status-pill status-transit">${p.badge}</span>` : '<span style="color:var(--text-muted);">—</span>'}</td>
                    </tr>
                `;
            });
            workspace.innerHTML = `
                <div class="admin-table-container">
                    <div class="admin-table-header">
                        <h3 style="font-size: 1.15rem;">All Products</h3>
                        <span style="color: var(--text-muted); font-size: 0.9rem;">${products.length} product(s)</span>
                    </div>
                    <div style="overflow-x: auto;">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Badge</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            `;
        }
    } catch(e) {
        workspace.innerHTML = `<p style="color:#ef4444; text-align:center; padding:2rem;">Failed to load products.</p>`;
    }
}

// ============================================================
// Customers View — Fetches all registered users
// ============================================================
async function renderCustomersView() {
    const statsContainer = document.getElementById('admin-stats');
    const workspace = document.getElementById('admin-workspace');
    if (statsContainer) statsContainer.style.display = 'none';

    workspace.innerHTML = `
        <div style="text-align:center; padding:3rem;">
            <svg style="animation: spin 1s linear infinite;" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
            <p style="color:var(--text-muted); margin-top:1rem;">Loading customers...</p>
        </div>
    `;

    try {
        const res = await fetch('backend/api/auth.php?action=list_users');
        const data = await res.json();

        if (data.success && data.users) {
            const users = data.users;
            const totalCustomers = users.filter(u => u.role === 'customer').length;
            const totalAdmins = users.filter(u => u.role === 'admin').length;

            let rows = '';
            users.forEach((user, i) => {
                const joinDate = new Date(user.created_at).toLocaleDateString([], { year:'numeric', month:'short', day:'numeric' });
                const rolePill = user.role === 'admin'
                    ? '<span style="background:rgba(167,139,250,0.12); color:#a78bfa; padding:0.25rem 0.7rem; border-radius:var(--radius-full); font-size:0.75rem; font-weight:600; text-transform:uppercase; border:1px solid rgba(167,139,250,0.25);">Admin</span>'
                    : '<span style="background:rgba(14,165,233,0.12); color:#0ea5e9; padding:0.25rem 0.7rem; border-radius:var(--radius-full); font-size:0.75rem; font-weight:600; text-transform:uppercase; border:1px solid rgba(14,165,233,0.25);">Customer</span>';

                rows += `
                    <tr>
                        <td>
                            <div style="display:flex; align-items:center; gap:0.75rem;">
                                <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, var(--primary), #a78bfa); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.9rem; color:#fff; flex-shrink:0;">
                                    ${user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style="font-weight:600; color:var(--text-main);">${user.name}</div>
                                    <div style="font-size:0.8rem; color:var(--text-muted);">${user.email}</div>
                                </div>
                            </div>
                        </td>
                        <td>${rolePill}</td>
                        <td style="color:var(--text-muted);">${joinDate}</td>
                        <td style="text-align:center; font-weight:600;">${user.total_orders}</td>
                        <td style="font-weight:600; color:var(--primary);">₹${parseFloat(user.total_spent).toFixed(2)}</td>
                    </tr>
                `;
            });

            workspace.innerHTML = `
                <div class="admin-table-container">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
                        <div>
                            <h3 style="font-size:1.3rem; margin-bottom:0.25rem;">Customer Base</h3>
                            <p style="color:var(--text-muted); font-size:0.9rem;">${totalCustomers} customer(s) · ${totalAdmins} admin(s) · ${users.length} total</p>
                        </div>
                    </div>
                    <div style="overflow-x: auto;">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th style="text-align:center;">Orders</th>
                                    <th>Total Spent</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            `;
        } else {
            workspace.innerHTML = `<p style="color:#ef4444; text-align:center; padding:2rem;">${data.error || 'Failed to load customers.'}</p>`;
        }
    } catch(e) {
        workspace.innerHTML = `<p style="color:#ef4444; text-align:center; padding:2rem;">Failed to connect to database.</p>`;
    }
}

// ============================================================
// Add Product Modal
// ============================================================
function openProductModal() {
    const overlay = document.getElementById('product-modal-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        // Small delay for animation
        requestAnimationFrame(() => overlay.classList.add('active'));
    }
}

function closeProductModal() {
    const overlay = document.getElementById('product-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => { overlay.style.display = 'none'; }, 300);
    }
    // Reset form
    const form = document.getElementById('add-product-form');
    if (form) form.reset();
}

async function handleAddProduct(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const origText = btn.textContent;
    btn.textContent = 'Adding...';
    btn.disabled = true;

    const payload = {
        title: form.querySelector('#prod-title').value.trim(),
        price: parseFloat(form.querySelector('#prod-price').value),
        category: form.querySelector('#prod-category').value,
        image_url: form.querySelector('#prod-image').value.trim(),
        badge: form.querySelector('#prod-badge').value.trim() || null
    };

    try {
        const res = await fetch('backend/api/products.php?action=create', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            showToast('Product added successfully!');
            closeProductModal();
            // Refresh if on products view
            if (currentView === 'products') renderProductsView();
        } else {
            showToast(data.error || 'Failed to add product.', true);
        }
    } catch(e) {
        showToast('Database connection failed.', true);
    }

    btn.textContent = origText;
    btn.disabled = false;
}

// ============================================================
// Toast Notification
// ============================================================
function showToast(message, isError = false) {
    // Remove existing toast
    const existing = document.getElementById('admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.className = `admin-toast ${isError ? 'toast-error' : 'toast-success'}`;
    toast.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${isError 
                ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
                : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
            }
        </svg>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
