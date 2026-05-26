// =========================================================================
// DATABASE LAYER: DRAWER TILL LIFE STAGES TRACKING
// =========================================================================
const TillDB = {
    // Commit vault status flags sessions changes to memory pools
    async saveSession(sessionObj) {
        try {
            await db.collection("system_state").doc("active_till_session").set(sessionObj);
            return true;
        } catch(e) {
            console.error("Cloud tracking write error on active till session document: ", e);
            throw e;
        }
    }
};
