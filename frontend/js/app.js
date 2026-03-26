class App {
    constructor() {
        this.appEL = document.getElementById('app');
        this.mainContent = document.getElementById('main-content');
        this.sidebar = document.getElementById('sidebar');
        this.toastContainer = document.getElementById('toast-container');
        
        this.setupEventListeners();
        this.init();
    }

    async init() {
        // Check Auth
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
            this.currentUser = JSON.parse(userStr);
            this.showSidebar();
            
            // Set up sidebar user profile
            const userNameEl = document.getElementById('sidebar-user-name');
            if(userNameEl) userNameEl.textContent = this.currentUser.username;
            
            const userRoleEl = document.getElementById('sidebar-user-role');
            if(userRoleEl) userRoleEl.textContent = (this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1)) + ' • All Nodes';
            
            // Global Logout Binding
            const logoutBtn = document.getElementById('global-logout-btn');
            if (logoutBtn) {
                logoutBtn.onclick = (e) => {
                    e.preventDefault();
                    if(this.pingInterval) clearInterval(this.pingInterval);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    this.navigate('login');
                };
            }
            this.startSidebarPing();

            await this.navigate(window.location.hash.slice(1) || 'dashboard');
        } else {
            this.hideSidebar();
            await this.navigate('login');
        }
    }

    setupEventListeners() {
        window.addEventListener('hashchange', () => {
            if (localStorage.getItem('token')) {
                this.navigate(window.location.hash.slice(1) || 'dashboard');
            } else {
                this.navigate('login');
            }
        });

        // Logout logic is now attached dynamically per view since the button is in the view header
        // Navigation Highlight
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                navItems.forEach(n => n.classList.remove('active'));
                
                // Add active to closest anchor
                const link = e.target.closest('a');
                if (link) link.classList.add('active');
            });
        });
    }

    showSidebar() {
        this.sidebar.classList.remove('hidden');
    }

    hideSidebar() {
        this.sidebar.classList.add('hidden');
        if(this.pingInterval) clearInterval(this.pingInterval);
    }

    startSidebarPing() {
        if(this.pingInterval) clearInterval(this.pingInterval);
        const fetchStatus = async () => {
             try {
                 const token = localStorage.getItem('token');
                 if(!token) return;
                 const res = await fetch('/api/system/status', { headers: { 'Authorization': `Bearer ${token}` }});
                 if(res.ok) {
                     const {nodes} = await res.json();
                     let online = 0;
                     const indicatorHtml = ['HYD','CHE','BLR'].map(n => {
                         const isDown = !!nodes[n];
                         if(!isDown) online++;
                         return `<div style="display: flex; align-items: center; gap: 4px; color: ${isDown ? '#ef4444' : '#94a3b8'}">
                             <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${isDown ? '#ef4444' : '#10b981'};"></span> ${n}
                         </div>`;
                     }).join('');
                     
                     const countEl = document.getElementById('sidebar-nodes-count');
                     if(countEl) countEl.textContent = `${online}/3 Online`;
                     
                     const indEl = document.getElementById('sidebar-node-indicators');
                     if(indEl) indEl.innerHTML = indicatorHtml;
                 }
             } catch(e){}
        };
        fetchStatus();
        this.pingInterval = setInterval(fetchStatus, 5000);
    }

    async navigate(route) {
        if (!route) route = 'dashboard';
        const validRoutes = ['login', 'dashboard', 'products', 'suppliers', 'purchases', 'sales', 'reports', 'stock', 'system', 'logs'];
        if (!validRoutes.includes(route)) route = 'dashboard';

        try {
            const response = await fetch(`/views/${route}.html`);
            const html = await response.text();
            this.mainContent.innerHTML = html;
            
            // Execute route specific scripts injected via innerHTML
            const scripts = this.mainContent.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                if (oldScript.src) newScript.src = oldScript.src;
                else newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript);
                document.body.removeChild(newScript); // Clean up
            });
            
            // Execute route specific init function
            if (window[`init${route.charAt(0).toUpperCase() + route.slice(1)}`]) {
                window[`init${route.charAt(0).toUpperCase() + route.slice(1)}`]();
            }
        } catch (error) {
            console.error('Failed to load view', error);
            this.showToast('Failed to load view. Are you running a server?', 'error');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        this.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize App globally so views can use it
window.app = new App();
