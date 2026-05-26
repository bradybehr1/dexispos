// =========================================================================
// DATABASE LAYER: CUSTOMERS & LOYALTY REGISTRIES
// =========================================================================
const CustomersDB = {
    // Pull all client profiles records cards
    async getAll() {
        try {
            let snap = await db.collection("customers").get();
            let arr = [];
            if (snap && !snap.empty) {
                snap.forEach(doc => arr.push(doc.data()));
            }
            return arr;
        } catch(e) {
            console.error("Failed to query customers ledger maps: ", e);
            return [];
        }
    },

    // Save or update consumer profiles fields variables
    async save(customerObj) {
        try {
            await db.collection("customers").doc(customerObj.customerId).set(customerObj);
            return true;
        } catch(e) {
            console.error(`Cloud write failure on customer account ${customerObj.customerId}: `, e);
            throw e;
        }
    }
};
