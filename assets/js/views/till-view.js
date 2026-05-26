// =========================================================================
// INTERFACE VIEW LAYER: TILL & DRAWER RECONCILIATION
// =========================================================================
const TillView = {
    buildWorkspace() {
        let pane = document.getElementById("till-flow-workspace");
        if(!state.activeTillSession.isOpen) {
            pane.innerHTML = `
                <div class="space-y-4">
                    <input type="number" step="0.01" id="till-open-amt" value="${state.corporateProfile.cashFloat.toFixed(2)}" class="w-full p-3 border text-center text-lg font-bold rounded-xl">
                    <button onclick="TillView.openTill()" class="w-full py-3 bg-iosBlue text-white font-bold rounded-xl">Open Drawer Session</button>
                </div>`;
        } else {
            pane.innerHTML = `
                <div class="space-y-4">
                    <div class="p-3 bg-gray-50 border rounded-xl text-xs">Expected Balance: <b>${RegisterView.formatCurrency(state.activeTillSession.expectedCashBalance)}</b></div>
                    <input type="number" step="0.01" id="till-close-amt" placeholder="Counted Cash" class="w-full p-3 border text-center text-lg font-bold rounded-xl">
                    <button onclick="TillView.closeTill()" class="w-full py-3 bg-gray-900 text-white font-bold rounded-xl">EOD Close Store</button>
                </div>`;
        }
    },

    async openTill() {
        let val = parseFloat(document.getElementById("till-open-amt").value);
        state.activeTillSession = { isOpen: true, businessDate: new Date().toLocaleDateString(), openingAmount: val, expectedCashBalance: val, isClosed: false };
        await TillDB.saveSession(state.activeTillSession);
        updateGlobalHeaderTillStatusBarIndicators();
        TillView.buildWorkspace();
    },

    async closeTill() {
        let count = parseFloat(document.getElementById("till-close-amt").value);
        let variance = count - state.activeTillSession.expectedCashBalance;
        await writeAuditTrailLogEntry(state.activeEmployee.employeeNum, `EOD Till Close. Variance: ${variance}`);
        state.activeTillSession = { isOpen: false, businessDate: "", openingAmount: 0, expectedCashBalance: 0, isClosed: true };
        await TillDB.saveSession(state.activeTillSession);
        updateGlobalHeaderTillStatusBarIndicators();
        alert("Store Session Closed.");
        AppRouter.navigateTo('view-home');
    }
};
