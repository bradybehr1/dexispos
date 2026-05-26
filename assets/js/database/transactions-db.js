// =========================================================================
// DATABASE LAYER: INVOICES, SUSPENSIONS, AND STORE CREDIT CARDS
// =========================================================================
const TransactionsDB = {
    // Pull historical transactions log rows maps
    async getAllTransactions() {
        try {
            let snap = await db.collection("transactions").get();
            let arr = [];
            if (snap && !snap.empty) {
                snap.forEach(doc => arr.push(doc.data()));
            }
            return arr;
        } catch(e) {
            console.error("Failed to query transactions archive tables: ", e);
            return [];
        }
    },

    // Pull currently frozen suspended transactions layout states
    async getAllSuspended() {
        try {
            let snap = await db.collection("suspended").get();
            let arr = [];
            if (snap && !snap.empty) {
                snap.forEach(doc => arr.push(doc.data()));
            }
            return arr;
        } catch(e) {
            console.error("Failed to pull suspended registers memory frames: ", e);
            return [];
        }
    },

    // Pull full registered active corporate gift cards registry
    async getAllGiftCards() {
        try {
            let snap = await db.collection("giftcards").get();
            let arr = [];
            if (snap && !snap.empty) {
                snap.forEach(doc => arr.push(doc.data()));
            }
            return arr;
        } catch(e) {
            console.error("Failed to query stored value card registries: ", e);
            return [];
        }
    },

    // Archive an invoice artifact log into cloud databases tables
    async saveTransaction(txObj) {
        try {
            await db.collection("transactions").doc(txObj.invoiceId).set(txObj);
            return true;
        } catch(e) {
            console.error(`Cloud write exception on invoice ${txObj.invoiceId}: `, e);
            throw e;
        }
    },

    // Freeze a running active checkout state down to background memory queues
    async saveSuspended(suspObj) {
        try {
            await db.collection("suspended").doc(suspObj.suspendId).set(suspObj);
            return true;
        } catch(e) {
            console.error(`Cloud queue save error for suspended trace ${suspObj.suspendId}: `, e);
            throw e;
        }
    },

    // Purge a background suspension reference once thawed and moved back to cart lines
    async deleteSuspended(suspendId) {
        try {
            await db.collection("suspended").doc(suspendId).delete();
            return true;
        } catch(e) {
            console.error(`Cloud queue release error on suspended placeholder ${suspendId}: `, e);
            throw e;
        }
    },

    // Save or modulate remaining live tracking metrics balances parameters on credit cards
    async saveGiftCard(cardObj) {
        try {
            await db.collection("giftcards").doc(cardObj.cardNum).set(cardObj);
            return true;
        } catch(e) {
            console.error(`Cloud value pool sync failure for gift card ${cardObj.cardNum}: `, e);
            throw e;
        }
    }
};
