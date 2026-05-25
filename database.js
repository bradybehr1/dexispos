// ==========================================
// CENTRAL POS DATABASE STORAGE SCHEMA
// ==========================================

// 1. Core Staff Registry (Add your team profiles and secret PIN entries here)
export const initialEmployees = [
    { id: "e1", name: "Brady Behrendt", pin: "9091237", role: "Admin", wage: 35.00 },
    { id: "e2", name: "Eduardo Sanchez", pin: "1111", role: "Manager", wage: 25.00 }
];

// 2. Main Live Inventory Catalog (Add your actual retail offerings right here)
export const initialProducts = [
    // To add items later, follow this exact structure:
    // { id: "p1", name: "Actual Product Name", sku: "12345678", price: 20.00, cost: 8.00, stock: 50, category: "Skincare" }
];

// 3. Registered Customer Accounts
export const initialCustomers = [
    // { id: "c1", name: "Jane Doe", phone: "3205550100", email: "jane@gmail.com", spend: 0, points: 0 }
];
