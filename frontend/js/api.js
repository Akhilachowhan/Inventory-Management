// API Layer
const API_BASE = '/api';

class ApiService {
    static async request(endpoint, method = 'GET', data = null) {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const config = { method, headers };
        if (data && method !== 'GET') config.body = JSON.stringify(data);

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, config);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'API Error');
            return result;
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    }

    static login(username, password) { return this.request('/auth/login', 'POST', { username, password }); }
    
    // Dashboard
    static getMetrics() { return this.request('/dashboard/metrics'); }
    static getLowStock() { return this.request('/dashboard/low-stock'); }

    // Products
    static getProducts() { return this.request('/products'); }
    static createProduct(data) { return this.request('/products', 'POST', data); }
    static updateProduct(id, data) { return this.request(`/products/${id}`, 'PUT', data); }
    static deleteProduct(id) { return this.request(`/products/${id}`, 'DELETE'); }

    // Suppliers
    static getSuppliers() { return this.request('/suppliers'); }
    static createSupplier(data) { return this.request('/suppliers', 'POST', data); }
    static updateSupplier(id, data) { return this.request(`/suppliers/${id}`, 'PUT', data); }

    // Categories
    static getCategories() { return this.request('/categories'); }

    // Purchases (Stock-In)
    static getPurchases() { return this.request('/purchases'); }
    static recordPurchase(data) { return this.request('/purchases', 'POST', data); }

    // Sales (Stock-Out)
    static getSales() { return this.request('/sales'); }
    static recordSale(data) { return this.request('/sales', 'POST', data); }

    // Stock Management
    static getStock(location) { return this.request(`/stock/${location}`); }
    static getTotalStock(productId) { return this.request(`/stock/total/${productId}`); }

    // Reports
    static getReports(type) { return this.request(`/reports/${type}`); }

    // System (Fault Tolerance)
    static getSystemStatus() { return this.request('/system/status'); }
    static toggleNode(location, status) { return this.request('/system/toggle-node', 'POST', { location, status }); }
}
