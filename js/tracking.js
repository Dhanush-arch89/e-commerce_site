document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('tracking-form');
    const input = document.getElementById('tracking-input');
    
    // Auto-fill from recent checkout
    const lastTracking = localStorage.getItem('aura_last_tracking');
    if (lastTracking && input) {
        input.value = lastTracking;
    }
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = input.value.trim().toUpperCase();
            if (id) renderTracking(id);
        });
    }
});

async function renderTracking(trackingId) {
    const resultDiv = document.getElementById('tracking-result');
    const emptyState = document.getElementById('empty-state');
    const btn = document.querySelector('#tracking-form button');
    
    // UI Feedback
    const originalText = btn.textContent;
    btn.innerHTML = `
        <svg style="animation: spin 1s linear infinite; margin-right: 0.5rem;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg> Searching Securely...
    `;
    btn.disabled = true;
    
    // Add keyframes if missing
    if (!document.getElementById('spin-anim')) {
        const style = document.createElement('style');
        style.id = 'spin-anim';
        style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }
    
    try {
        const res = await fetch(`backend/api/orders.php?action=track&tracking_id=${trackingId}`);
        const data = await res.json();
        
        btn.textContent = originalText;
        btn.disabled = false;
        
        if (data.success && data.order) {
            emptyState.style.display = 'none';
            
            const order = data.order;
            const statusClass = order.status === 'Completed' ? 'status-completed' : (order.status === 'Cancelled' ? 'status-cancelled' : 'status-badge');
            
            // Map fake timeline relative to DB creation time
            const orderDate = new Date(order.created_at);
            const yest = new Date(orderDate); yest.setDate(yest.getDate() + 1);
            const today = new Date(orderDate); today.setDate(today.getDate() + 2);
            
            const formatTime = (d) => d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const formatDate = (d) => d.toLocaleDateString([], {month: 'short', day: 'numeric'});
            
            resultDiv.innerHTML = `
                <div class="order-info">
                    <div>
                        <h3 style="margin-bottom: 0.25rem;">Order #${order.tracking_id}</h3>
                        <p style="color: var(--text-muted); font-size: 0.95rem;">Ordered by ${order.customer_name} on ${formatDate(orderDate)}</p>
                    </div>
                    <div class="status-badge">${order.status}</div>
                </div>
                
                <div class="timeline">
                    <!-- Step 1 -->
                    <div class="timeline-item completed">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <div class="timeline-date">${formatDate(orderDate)} • ${formatTime(orderDate)}</div>
                            <h4>Order Placed</h4>
                            <p>We received your secure order in our database.</p>
                        </div>
                    </div>
                    <!-- Step 2 -->
                    <div class="timeline-item ${order.status !== 'Pending' ? 'completed' : ''}">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <div class="timeline-date">${formatDate(yest)} • 14:30 PM</div>
                            <h4>Package Scanned</h4>
                            <p>Package departed from our central sorting facility.</p>
                        </div>
                    </div>
                    <!-- Step 3 -->
                    <div class="timeline-item ${order.status !== 'Pending' ? 'completed' : ''}">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <div class="timeline-date">${formatDate(today)} • 08:15 AM</div>
                            <h4>Out for Delivery</h4>
                            <p>Your package is with the courier and headed your way.</p>
                        </div>
                    </div>
                    <!-- Step 4 -->
                    <div class="timeline-item ${order.status === 'Completed' ? 'completed' : ''}">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <div class="timeline-date" style="opacity: ${order.status === 'Completed' ? 1 : 0.5};">Estimated Arrival</div>
                            <h4 style="opacity: ${order.status === 'Completed' ? 1 : 0.5};">Delivered</h4>
                            <p style="opacity: ${order.status === 'Completed' ? 1 : 0.5};">Package safely delivered to your address.</p>
                        </div>
                    </div>
                </div>
            `;
            
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
