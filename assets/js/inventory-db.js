// =========================================================================
// DATABASE LAYER: SKU MATRIX & INVENTORY CATALOGS
// =========================================================================
const InventoryDB = {
    // Fetch all core items catalog rows
    async getAll() {
        try {
            let snap = await db.collection("inventory").get();
            let arr = [];
            if (snap && !snap.empty) {
                snap.forEach(doc => arr.push(doc.data()));
            }
            return arr;
        } catch(e) {
            console.error("Failed to pull core item matrix: ", e);
            return [];
        }
    },

    // Fetch all custom defined departments or sections rows
    async getAllCategories() {
        try {
            let snap = await db.collection("categories").get();
            let arr = [];
            if (snap && !snap.empty) {
                snap.forEach(doc => arr.push(doc.data()));
            }
            return arr;
        } catch(e) {
            console.error("Failed to pull departments table data: ", e);
            return [];
        }
    },

    // Save or rewrite a core asset item tracking line
    async saveProduct(prodObj) {
        try {
            await db.collection("inventory").doc(prodObj.sku).set(prodObj);
            return true;
        } catch(e) {
            console.error(`Cloud write exception on product SKU ${prodObj.sku}: `, e);
            throw e;
        }
    },

    // Permanent structural disconnect of a product line from active store matrices
    async deleteProduct(sku) {
        try {
            await db.collection("inventory").doc(sku).delete();
            return true;
        } catch(e) {
            console.error(`Master inventory matrix deletion error on SKU ${sku}: `, e);
            throw e;
        }
    },

    // Save newly formulated product class parameters labels
    async saveCategory(catObj) {
        try {
            await db.collection("categories").doc(catObj.id).set(catObj);
            return true;
        } catch(e) {
            console.error(`Cloud write fault on merchandising category ${catObj.id}: `, e);
            throw e;
        }
    }
};
