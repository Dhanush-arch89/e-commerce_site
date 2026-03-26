document.addEventListener('DOMContentLoaded', () => {
    // Role Authorization
    const user = JSON.parse(localStorage.getItem('aura_user'));
    // If not logged in, or explicitly not admin role, boot them out
    if (!user || user.role !== 'admin') {
        alert("Restricted Access: Admins only.");
        window.location.href = "index.html";
        return;
    }
    
    // Inject auth name into the Header
    const titleStatus = document.querySelector('.admin-header p');
    if (titleStatus) titleStatus.textContent = `Welcome back, ${user.name}. Here's what's happening today.`;
    
    renderDashboard();
});

async function renderDashboard() {
    const statsContainer = document.getElementById('admin-stats');
    const ordersContainer = document.getElementById('admin-orders');
    
    // Abstracted SVG Icons
    const iconRevenue = '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>';
    const iconOrders = '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path>';
    const iconCustomers = '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>';

    try {
        const res = await fetch(`backend/api/orders.php?action=admin_all`);
        const data = await res.json();
        
        if (data.success) {
            const dbOrders = data.orders;
            
            // Calculate real transactional revenue from db orders
            let totalRevenue = 0;
            dbOrders.forEach(o => totalRevenue += parseFloat(o.total_amount));
            
            const stats = [
                { title: 'Gross DB Revenue', value: '$' + totalRevenue.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}), icon: iconRevenue },
                { title: 'Total DB Orders', value: dbOrders.length.toString(), icon: iconOrders },
                { title: 'Customer Base', value: 'Live Metrics', icon: iconCustomers } 
            ];
            
            // Render Stats
            if (statsContainer) {
                statsContainer.innerHTML = '';
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

            // Render Table Rows
            if (ordersContainer) {
                ordersContainer.innerHTML = '';
                if (dbOrders.length === 0) {
                     ordersContainer.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No orders found in database</td></tr>';
                }
                
                dbOrders.forEach(order => {
                    const statusClass = order.status === 'Completed' ? 'status-completed' : 'status-pending';
                    const d = new Date(order.created_at);
                    const formattedDate = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    
                    ordersContainer.innerHTML += `
                        <tr>
                            <td style="font-weight: 500; font-family: monospace; font-size: 1.05rem;">#${order.tracking_id}</td>
                            <td style="color: var(--text-main); font-weight: 500;">${order.customer_name}</td>
                            <td style="color: var(--text-muted);">${formattedDate}</td>
                            <td style="font-weight: 600; color: var(--primary);">$${parseFloat(order.total_amount).toFixed(2)}</td>
                            <td><span class="status-pill ${statusClass}">${order.status}</span></td>
                        </tr>
                    `;
                });
            }
        }
    } catch(e) {
        console.error("Failed to load admin tables:", e);
        if (ordersContainer) ordersContainer.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #ef4444;">Failed to connect to MySQL Database. Ensure XAMPP is running.</td></tr>';
    }
}
