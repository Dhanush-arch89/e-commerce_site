document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('aura_user'));
    const myOrdersSection = document.getElementById('my-orders-section');
    const trackByIdSection = document.getElementById('track-by-id-section');

    if (user && user.id) {
        // Logged in: show My Orders
        myOrdersSection.style.display = 'block';
        trackByIdSection.style.display = 'none';
        loadUserOrders(user.id);
    } else {
        // Not logged in: show search-by-tracking-ID
        myOrdersSection.style.display = 'none';
        trackByIdSection.style.display = 'block';
    }

    // Track by ID form (for guests)
    const form = document.getElementById('tracking-form');
    const input = document.getElementById('tracking-input');
    
    const lastTracking = localStorage.getItem('aura_last_tracking');
    if (lastTracking && input) input.value = lastTracking;
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = input.value.trim().toUpperCase();
            if (id) renderTracking(id);
        });
    }

    // Detail modal close
    const closeBtn = document.getElementById('detail-close-btn');
    const overlay = document.getElementById('order-detail-overlay');
    if (closeBtn) closeBtn.addEventListener('click', closeDetailModal);
    if (overlay) overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDetailModal();
    });
});

// ============================================================
// My Orders — Logged-in user view
// ============================================================
async function loadUserOrders(userId) {
    const container = document.getElementById('my-orders-list');
    
    container.innerHTML = `
        <div style="text-align:center; padding:3rem;">
            <svg style="animation: spin 1s linear infinite;" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            <p style="color:var(--text-muted); margin-top:1rem;">Loading your orders...</p>
        </div>
    `;

    addSpinAnimation();

    try {
        const res = await fetch(`backend/api/orders.php?action=user_orders&user_id=${userId}`);
        const data = await res.json();
        
        if (data.success) {
            if (data.orders.length === 0) {
                container.innerHTML = `
                    <div class="empty-orders">
                        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.2" style="margin-bottom:1.5rem; opacity:0.4;">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                        <h3>No orders yet</h3>
                        <p>When you place an order, it will appear here with real-time status updates.</p>
                        <a href="index.html" class="btn btn-primary" style="margin-top:1.5rem;">Start Shopping</a>
                    </div>
                `;
                return;
            }
            
            renderOrderCards(data.orders);
        } else {
            container.innerHTML = `<p style="color:#ef4444; text-align:center; padding:2rem;">${data.error}</p>`;
        }
    } catch(e) {
        container.innerHTML = `<p style="color:#ef4444; text-align:center; padding:2rem;">Failed to load orders. Is XAMPP running?</p>`;
    }
}

function renderOrderCards(orders) {
    const container = document.getElementById('my-orders-list');
    container.innerHTML = '';

    orders.forEach((order, index) => {
        const d = new Date(order.created_at);
        const formattedDate = d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
        const statusInfo = getStatusInfo(order.status);

        const card = document.createElement('div');
        card.className = 'order-card animate-fade-in';
        card.style.animationDelay = `${index * 0.08}s`;
        card.style.opacity = '0';
        card.style.animationFillMode = 'forwards';

        card.innerHTML = `
            <div class="order-card-top">
                <div class="order-card-id">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                    <span>#${order.tracking_id}</span>
                </div>
                <span class="order-status-pill ${statusInfo.class}">${order.status}</span>
            </div>
            <div class="order-card-body">
                <div class="order-card-detail">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="order-card-detail">
                    <span class="detail-label">Total</span>
                    <span class="detail-value" style="color:var(--primary); font-weight:700;">₹${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
                <div class="order-card-detail">
                    <span class="detail-label">Progress</span>
                    <div class="order-progress-bar">
                        <div class="order-progress-fill ${statusInfo.class}" style="width: ${statusInfo.progress}%;"></div>
                    </div>
                </div>
            </div>
            <div class="order-card-footer">
                <button class="btn btn-outline btn-sm" onclick="openOrderDetail('${order.tracking_id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    View Timeline
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function getStatusInfo(status) {
    switch(status) {
        case 'Pending':     return { class: 'st-pending',    progress: 15 };
        case 'Processing':  return { class: 'st-processing', progress: 35 };
        case 'In Transit':  return { class: 'st-transit',    progress: 60 };
        case 'Delivered':   return { class: 'st-delivered',  progress: 100 };
        case 'Completed':   return { class: 'st-delivered',  progress: 100 };
        case 'Cancelled':   return { class: 'st-cancelled',  progress: 100 };
        default:            return { class: 'st-pending',    progress: 10 };
    }
}

// ============================================================
// Order Detail Modal (Timeline)
// ============================================================
window.openOrderDetail = async function(trackingId) {
    const overlay = document.getElementById('order-detail-overlay');
    const content = document.getElementById('detail-content');
    const title = document.getElementById('detail-title');

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('active'));

    title.textContent = `Order #${trackingId}`;
    content.innerHTML = `<div style="text-align:center; padding:2rem;"><p style="color:var(--text-muted);">Loading...</p></div>`;

    try {
        const res = await fetch(`backend/api/orders.php?action=track&tracking_id=${trackingId}`);
        const data = await res.json();

        if (data.success && data.order) {
            const order = data.order;
            content.innerHTML = buildTimeline(order);
        } else {
            content.innerHTML = `<p style="color:#ef4444; text-align:center; padding:2rem;">Order not found.</p>`;
        }
    } catch(e) {
        content.innerHTML = `<p style="color:#ef4444; text-align:center; padding:2rem;">Failed to load order details.</p>`;
    }
};

function closeDetailModal() {
    const overlay = document.getElementById('order-detail-overlay');
    overlay.classList.remove('active');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

function buildTimeline(order) {
    const orderDate = new Date(order.created_at);
    const day2 = new Date(orderDate); day2.setDate(day2.getDate() + 1);
    const day3 = new Date(orderDate); day3.setDate(day3.getDate() + 2);
    const day4 = new Date(orderDate); day4.setDate(day4.getDate() + 3);

    const fmt = (d) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const fmtTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const statusIndex = getStatusIndex(order.status);
    const isCancelled = order.status === 'Cancelled';

    const steps = [
        { label: 'Order Placed', desc: 'Your order was received and confirmed.', date: `${fmt(orderDate)} • ${fmtTime(orderDate)}`, done: statusIndex >= 0 },
        { label: 'Processing', desc: 'Your items are being prepared for shipment.', date: `${fmt(day2)} • 10:30 AM`, done: statusIndex >= 1 },
        { label: 'In Transit', desc: 'Package is on its way to your address.', date: `${fmt(day3)} • 02:45 PM`, done: statusIndex >= 2 },
        { label: 'Delivered', desc: 'Package successfully delivered.', date: `${fmt(day4)} • 11:00 AM`, done: statusIndex >= 3 },
    ];

    const statusInfo = getStatusInfo(order.status);

    let html = `
        <div class="detail-summary">
            <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="order-status-pill ${statusInfo.class}">${order.status}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Customer</span>
                <span class="detail-value">${order.customer_name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Paid</span>
                <span class="detail-value" style="color:var(--primary); font-weight:700;">₹${parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
        </div>
    `;

    if (isCancelled) {
        html += `
            <div style="text-align:center; padding:2rem 0;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5" style="margin-bottom:1rem;">
                    <circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <h4 style="color:#ef4444; margin-bottom:0.5rem;">Order Cancelled</h4>
                <p style="color:var(--text-muted);">This order has been cancelled. Contact support for assistance.</p>
            </div>
        `;
    } else {
        html += `<div class="timeline">`;
        steps.forEach((step, i) => {
            const isLast = i === steps.length - 1;
            html += `
                <div class="timeline-item ${step.done ? 'completed' : ''}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-date" style="opacity:${step.done ? 1 : 0.4};">${step.done ? step.date : 'Pending'}</div>
                        <h4 style="opacity:${step.done ? 1 : 0.5};">${step.label}</h4>
                        <p style="opacity:${step.done ? 1 : 0.4};">${step.desc}</p>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    return html;
}

function getStatusIndex(status) {
    switch(status) {
        case 'Pending':     return 0;
        case 'Processing':  return 1;
        case 'In Transit':  return 2;
        case 'Delivered':   return 3;
        case 'Completed':   return 3;
        case 'Cancelled':   return -1;
        default:            return 0;
    }
}

// ============================================================
// Guest Tracking (search by ID)
// ============================================================
async function renderTracking(trackingId) {
    const resultDiv = document.getElementById('tracking-result');
    const emptyState = document.getElementById('empty-state');
    const btn = document.querySelector('#tracking-form button');
    
    const originalText = btn.textContent;
    btn.innerHTML = `
        <svg style="animation: spin 1s linear infinite; margin-right: 0.5rem;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg> Searching...
    `;
    btn.disabled = true;
    addSpinAnimation();
    
    try {
        const res = await fetch(`backend/api/orders.php?action=track&tracking_id=${trackingId}`);
        const data = await res.json();
        
        btn.textContent = originalText;
        btn.disabled = false;
        
        if (data.success && data.order) {
            emptyState.style.display = 'none';
            resultDiv.innerHTML = buildTimeline(data.order);
            resultDiv.style.display = 'block';
        } else {
            alert(data.error || "Order not found in database.");
            resultDiv.style.display = 'none';
            emptyState.style.display = 'block';
        }
    } catch(e) {
        alert("Database connection failed. Is XAMPP running?");
        btn.textContent = originalText;
        btn.disabled = false;
        resultDiv.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

// ============================================================
// Utility
// ============================================================
function addSpinAnimation() {
    if (!document.getElementById('spin-anim')) {
        const style = document.createElement('style');
        style.id = 'spin-anim';
        style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }
}
