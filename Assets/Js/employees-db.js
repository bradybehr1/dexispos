// =========================================================================
// DATABASE LAYER: EMPLOYEES & ACCOUNT CREDENTIALS
// =========================================================================
const EmployeesDB = {
    // Pull full associate roster tracking arrays
    async getAll() {
        try {
            let snap = await db.collection("employees").get();
            let arr = [];
            if (snap && !snap.empty) {
                snap.forEach(doc => arr.push(doc.data()));
            }
            return arr;
        } catch(e) {
            console.error("Failed to query employees table: ", e);
            return [];
        }
    },

    // Pull full historical shift time cards ledger lines
    async getAllTimecards() {
        try {
            let snap = await db.collection("timecards").get();
            let arr = [];
            if (snap && !snap.empty) {
                snap.forEach(doc => arr.push(doc.data()));
            }
            return arr;
        } catch(e) {
            console.error("Failed to query timecards table: ", e);
            return [];
        }
    },

    // Save or overwrite a worker profile metadata block
    async save(employeeObj) {
        try {
            await db.collection("employees").doc(employeeObj.employeeNum).set(employeeObj);
            return true;
        } catch(e) {
            console.error(`Cloud save error for employee ${employeeObj.employeeNum}: `, e);
            throw e;
        }
    },

    // Save or close an active labor punch-in record line
    async saveTimecard(punchObj) {
        try {
            await db.collection("timecards").doc(punchObj.punchId).set(punchObj);
            return true;
        } catch(e) {
            console.error(`Cloud save error for timecard punch ${punchObj.punchId}: `, e);
            throw e;
        }
    },

    // Administrative override purge function for bad shift lines
    async deleteTimecard(punchId) {
        try {
            await db.collection("timecards").doc(punchId).delete();
            return true;
        } catch(e) {
            console.error(`Cloud deletion fault inside timecards on ${punchId}: `, e);
            throw e;
        }
    }
};
