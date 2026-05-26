// =========================================================================
// INTERFACE VIEW LAYER: STAFF MANAGEMENT & LABOR TRACKING
// =========================================================================
const EmployeeView = {
    // -------------------------------------------------------------------------
    // ROSTER & DIRECTORY MANAGEMENT
    // -------------------------------------------------------------------------
    renderDirectory() {
        let container = document.getElementById("emp-roster-list");
        if (!container) return;
        container.innerHTML = "";
        
        state.dbCache.employees.forEach(e => {
            let btn = document.createElement("button");
            btn.className = "w-full text-left p-3 hover:bg-gray-50 border-b flex justify-between items-center text-xs font-semibold rounded-xl transition";
            btn.onclick = () => EmployeeView.inspectAssociateProfile(e.employeeNum);
            btn.innerHTML = `
                <div>
                    <span class="font-bold text-gray-900 block">${e.fullName}</span>
                    <span class="text-[10px] text-gray-400 font-mono block mt-0.5">ID: ${e.employeeNum} &bull; ${e.positionTitle.toUpperCase()}</span>
                </div>
                <span class="w-2 h-2 rounded-full ${e.status === 'active' ? 'bg-iosGreen' : 'bg-iosRed'}"></span>`;
            container.appendChild(btn);
        });
    },

    inspectAssociateProfile(num) {
        let e = state.dbCache.employees.find(x => x.employeeNum === num);
        let pane = document.getElementById("emp-inspection-sheet");
        let history = state.dbCache.transactions.filter(t => t.associateId === e.employeeNum && t.financials.discountTotal > 0);
        let logsHtml = "";
        
        history.forEach(t => {
            logsHtml += `
                <div onclick="CustomerView.viewReceiptDetails('${t.invoiceId}')" class="p-2.5 bg-gray-50 border rounded-xl text-[11px] font-semibold flex justify-between cursor-pointer hover:border-purple-500 transition">
                    <span class="font-mono">${t.invoiceId}</span>
                    <span class="text-iosRed">-${RegisterView.formatCurrency(t.financials.discountTotal)} Markdown</span>
                </div>`;
        });
        
        pane.innerHTML = `
            <div class="space-y-6 text-xs font-semibold animate-in fade-in duration-200">
                <div class="flex justify-between items-start border-b pb-4">
                    <div>
                        <span class="text-[10px] font-black uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">Staff Credentials</span>
                        <h2 class="text-xl font-bold text-gray-900 mt-2">${e.fullName}</h2>
                        <p class="text-xs text-gray-400 font-mono">ID: ${e.employeeNum}</p>
                    </div>
                    <select onchange="EmployeeView.updateStatus('${e.employeeNum}', this.value)" class="p-2 border rounded-xl font-bold shadow-sm">
                        <option value="active" ${e.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${e.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="suspended" ${e.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-gray-50 border p-4 rounded-2xl space-y-2">
                        <p>Position: <b>${e.positionTitle.toUpperCase()}</b></p>
                        <p>Authority Tier: <b>${e.managerAuthority.toUpperCase()}</b></p>
                    </div>
                    <div class="bg-gray-50 border p-4 rounded-2xl space-y-2">
                        <p>Pay Type: <b>${e.payType.toUpperCase()}</b></p>
                        <p>Pay Rate: <b>${RegisterView.formatCurrency(e.payAmount)}</b></p>
                    </div>
                </div>
                <div class="space-y-2">
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Discount Usage Audit</h4>
                    <div class="space-y-1 max-h-44 overflow-y-auto ios-scroll border rounded-2xl p-2 bg-white">
                        ${logsHtml || '<p class="text-[11px] text-center text-gray-400 py-4">No audit logs found.</p>'}
                    </div>
                </div>
            </div>`;
        lucide.createIcons();
    },

    // -------------------------------------------------------------------------
    // ENROLLMENT & LABOR CLOCK
    // -------------------------------------------------------------------------
    openEmployeeEnrollmentModal() {
        ModalEngine.open(`
            <div class="space-y-4">
                <h3 class="text-lg font-bold">Recruit New Associate</h3>
                <div class="grid grid-cols-2 gap-3 text-xs font-semibold">
                    <div class="col-span-2"><input type="text" id="new-emp-name" placeholder="Full Legal Name" class="w-full p-2 border rounded-xl"></div>
                    <input type="text" id="new-emp-phone" placeholder="Phone" class="w-full p-2 border rounded-xl">
                    <input type="email" id="new-emp-email" placeholder="Email" class="w-full p-2 border rounded-xl">
                    <select id="new-emp-title" class="w-full p-2 border rounded-xl"><option value="sales associate">Sales Associate</option><option value="lead">Lead</option><option value="store director">Store Director</option></select>
                    <input type="number" step="0.01" id="new-emp-pay" placeholder="Pay Rate" class="w-full p-2 border rounded-xl">
                </div>
                <button onclick="EmployeeView.submitEnrollment()" class="w-full py-2 bg-iosBlue text-white rounded-xl font-bold">Vault Profile</button>
            </div>`);
    },

    async submitEnrollment() {
        let empObj = {
            employeeNum: generateCryptographicNumericalIdString(7),
            fullName: document.getElementById("new-emp-name").value,
            phone: document.getElementById("new-emp-phone").value,
            email: document.getElementById("new-emp-email").value,
            positionTitle: document.getElementById("new-emp-title").value,
            payAmount: parseFloat(document.getElementById("new-emp-pay").value),
            password: "password123", // Default for onboarding
            status: "active",
            managerAuthority: "no"
        };
        await EmployeesDB.save(empObj);
        state.dbCache.employees.push(empObj);
        ModalEngine.close();
        EmployeeView.renderDirectory();
    },

    openTimeClockModal() {
        ModalEngine.open(`
            <div class="space-y-4">
                <h3 class="text-lg font-bold">Time Clock Terminal</h3>
                <input type="text" id="tc-id" placeholder="Associate ID" class="w-full p-3 border rounded-xl text-center text-lg font-mono">
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="EmployeeView.handlePunch('in')" class="bg-iosGreen text-white py-2 rounded-xl font-bold">Punch In</button>
                    <button onclick="EmployeeView.handlePunch('out')" class="bg-iosRed text-white py-2 rounded-xl font-bold">Punch Out</button>
                </div>
            </div>`);
    },

    async handlePunch(type) {
        let id = document.getElementById("tc-id").value.trim();
        let emp = state.dbCache.employees.find(e => e.employeeNum === id);
        if (!emp) return;

        if (type === 'in') {
            let punch = { punchId: "PUNCH_" + Date.now(), employeeNum: id, employeeName: emp.fullName, clockIn: new Date().toISOString(), clockOut: null, hoursLogged: 0 };
            await EmployeesDB.saveTimecard(punch);
            state.dbCache.timeCards.push(punch);
            alert("Punch In Successful.");
        } else {
            let open = state.dbCache.timeCards.find(t => t.employeeNum === id && !t.clockOut);
            if (!open) { alert("No active shift found."); return; }
            
            ModalEngine.open(`
                <div class="space-y-4 text-center">
                    <p class="text-xs font-semibold">Did you take all mandatory breaks?</p>
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="EmployeeView.closeShift('${open.punchId}', 'yes')" class="bg-iosGreen text-white py-2 rounded-xl font-bold">YES</button>
                        <button onclick="EmployeeView.closeShift('${open.punchId}', 'no')" class="bg-iosRed text-white py-2 rounded-xl font-bold">NO</button>
                    </div>
                </div>`);
        }
    },

    async closeShift(id, attestation) {
        let punch = state.dbCache.timeCards.find(t => t.punchId === id);
        punch.clockOut = new Date().toISOString();
        punch.breakAttestation = attestation;
        punch.hoursLogged = parseFloat(((new Date(punch.clockOut) - new Date(punch.clockIn)) / 3600000).toFixed(2));
        await EmployeesDB.saveTimecard(punch);
        ModalEngine.close();
        alert("Punch Out Successful.");
    }
};
