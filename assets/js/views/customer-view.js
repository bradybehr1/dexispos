// =========================================================================
// INTERFACE VIEW LAYER: CUSTOMER RELATIONSHIPS & LOYALTY LEDGERS
// =========================================================================
const CustomerView = {
    // -------------------------------------------------------------------------
    // ENROLLMENT WORKFLOWS
    // -------------------------------------------------------------------------
    openCustomerEnrollmentModal() {
        ModalEngine.open(`
            <div class="space-y-4">
                <h3 class="text-lg font-bold">Enroll New Loyalty Member</h3>
                <div class="grid grid-cols-2 gap-3 text-xs font-semibold">
                    <div class="col-span-2">
                        <label class="block text-gray-400 mb-0.5">Full Legal Name *</label>
                        <input type="text" id="nc-name" class="w-full p-2 border bg-gray-50 rounded-xl focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-gray-400 mb-0.5">Phone Line Identity *</label>
                        <input type="text" id="nc-phone" class="w-full p-2 border bg-gray-50 rounded-xl focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-gray-400 mb-0.5">Email Parameters *</label>
                        <input type="email" id="nc-email" class="w-full p-2 border bg-gray-50 rounded-xl focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-gray-400 mb-0.5">Postal Zip Code *</label>
                        <input type="text" id="nc-zip" class="w-full p-2 border bg-gray-50 rounded-xl focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-gray-400 mb-0.5">Home Address (Optional)</label>
                        <input type="text" id="nc-address" class="w-full p-2 border bg-gray-50 rounded-xl focus:outline-none">
                    </div>
                </div>
                <button onclick="CustomerView.submitEnrollment()" class="w-full bg-iosBlue text-white py-3 rounded-xl font-bold text-sm shadow-md mt-2">Generate Registry Ledger Card</button>
            </div>`);
    },

    async submitEnrollment() {
        const name = document.getElementById("nc-name").value.trim();
        const phone = document.getElementById("nc-phone").value.trim();
        const email = document.getElementById("nc-email").value.trim();
        const zip = document.getElementById("nc-zip").value.trim();
        const address = document.getElementById("nc-address").value.trim() || "Not Provided";

        if (!name || !phone || !email || !zip) {
            alert("Mandatory Registry Error: All asterisk-mapped fields must be structured.");
            return;
        }

        // Enforce Unique Communication Channel Constraints
        const duplicate = state.dbCache.customers.find(c => c.phone === phone || c.email.toLowerCase() === email.toLowerCase());
        if (duplicate) {
            alert("Registry Conflict: A ledger account already exists with those communication markers.");
            return;
        }

        // Automatic 10-Digit Numerical ID Generation
        let customerId = "";
        for(let i=0; i<10; i++) { customerId += Math.floor(Math.random() * 10).toString(); }

        const customerObj = {
            customerId: customerId,
            fullName: name,
            phone: phone,
            email: email,
            zip: zip,
            homeAddress: address,
            status: "active",
            pointsAccumulated: 0,
            rewardsAvailable: 0,
            lifetimePreTaxSpend: 0.00
        };

        try {
            await CustomersDB.save(customerObj);
            state.dbCache.customers.push(customerObj);
            await writeAuditTrailLogEntry(state.activeEmployee ? state.activeEmployee.employeeNum : "SYSTEM", `Registered new loyalty consumer profile: [${customerId}]`);
            
            ModalEngine.close();
            alert(`Account Provisioned. Generated ID: ${customerId}`);
            
            // Auto-load into search if on management screen
            document.getElementById("cust-search-input").value = phone;
            CustomerView.executeCustomerSearchRegistry();
        } catch(e) {
            alert("Cloud Sync Failure: Customer profile could not be vaulted.");
        }
    },

    // -------------------------------------------------------------------------
    // ACCOUNT LEDGER SEARCH & INSPECTION
    // -------------------------------------------------------------------------
    executeCustomerSearchRegistry() {
        const input = document.getElementById("cust-search-input").value.trim().toLowerCase();
        const pane = document.getElementById("cust-mgmt-results-pane");
        if (!pane) return;
        
        pane.innerHTML = "";
        if (!input) {
            alert("Input Required: Provide phone or email search parameters.");
            return;
        }

        const matched = state.dbCache.customers.filter(c => c.phone.includes(input) || c.email.toLowerCase().includes(input));

        if (matched.length === 0) {
            pane.innerHTML = `
                <div class="text-center text-gray-400 py-20 flex flex-col items-center">
                    <i data-lucide="user-x" class="w-16 h-16 stroke-[1] mb-2"></i>
                    <p class="font-semibold text-sm">No Registry Matches Found</p>
                </div>`;
            lucide.createIcons();
            return;
        }

        matched.forEach(c => {
            const div = document.createElement("div");
            div.className = "bg-gray-50 border border-gray-200 rounded-3xl p-6 space-y-6 animate-in fade-in-50 duration-200";
            
            // Filter historical transaction artifacts
            const history = state.dbCache.transactions.filter(t => t.customerSnapshot && t.customerSnapshot.customerId === c.customerId);
            let historyHtml = "";
            
            history.forEach(tx => {
                historyHtml += `
                    <div onclick="CustomerView.viewReceiptDetails('${tx.invoiceId}')" class="bg-white border p-3 rounded-xl flex justify-between items-center cursor-pointer hover:border-iosBlue transition">
                        <div class="text-xs font-bold">
                            <span class="block text-gray-900 font-mono">${tx.invoiceId}</span>
                            <span class="block text-gray-400 text-[10px] mt-0.5">${new Date(tx.timestamp).toLocaleDateString()}</span>
                        </div>
                        <span class="text-sm font-black text-black">${RegisterView.formatCurrency(tx.financials.grandTotal)}</span>
                    </div>`;
            });

            div.innerHTML = `
                <div class="flex justify-between items-start border-b pb-4">
                    <div>
                        <span class="text-[10px] font-black uppercase bg-iosBlue/10 text-iosBlue px-2 py-0.5 rounded">Ledger Account</span>
                        <h2 class="text-2xl font-bold text-gray-900 mt-2">${c.fullName}</h2>
                        <p class="text-xs text-gray-400 font-mono">Registry ID: ${c.customerId}</p>
                    </div>
                    <select onchange="CustomerView.updateStatus('${c.customerId}', this.value)" class="p-2 bg-white border rounded-xl text-xs font-bold shadow-sm">
                        <option value="active" ${c.status === 'active' ? 'selected' : ''}>Status: ACTIVE</option>
                        <option value="inactive" ${c.status === 'inactive' ? 'selected' : ''}>Status: INACTIVE</option>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div class="space-y-3 bg-white border p-4 rounded-2xl shadow-sm">
                        <h4 class="text-[10px] text-gray-400 uppercase tracking-widest border-b pb-1">Communication Lines</h4>
                        <p class="flex justify-between"><span>Phone:</span><span class="text-black font-mono">${c.phone}</span></p>
                        <p class="flex justify-between"><span>Email:</span><span class="text-black">${c.email}</span></p>
                        <p class="flex justify-between"><span>Address:</span><span class="text-black text-right max-w-[150px]">${c.homeAddress}</span></p>
                    </div>
                    <div class="space-y-3 bg-white border p-4 rounded-2xl shadow-sm">
                        <h4 class="text-[10px] text-gray-400 uppercase tracking-widest border-b pb-1 text-iosGreen">Loyalty Metrics</h4>
                        <p class="flex justify-between"><span>Point Credits:</span><b class="text-purple-600 font-mono">${c.pointsAccumulated} Pts</b></p>
                        <p class="flex justify-between"><span>Available $20 Rewards:</span><b class="text-iosGreen text-sm">${c.rewardsAvailable} Vouchers</b></p>
                        <p class="flex justify-between"><span>Total Pre-Tax Spend:</span><b class="text-black font-mono">${RegisterView.formatCurrency(c.lifetimePreTaxSpend)}</b></p>
                    </div>
                </div>

                <div class="space-y-3">
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Historical Invoice Registry</h4>
                    <div class="space-y-2 max-h-48 overflow-y-auto ios-scroll">
                        ${historyHtml || '<p class="text-xs text-gray-400 text-center py-4 bg-white border rounded-2xl border-dashed">No transactional history logged against this profile.</p>'}
                    </div>
                </div>`;
            pane.appendChild(div);
        });
        lucide.createIcons();
    },

    async updateStatus(id, newStatus) {
        const cust = state.dbCache.customers.find(c => c.customerId === id);
        if(!cust) return;
        cust.status = newStatus;
        await CustomersDB.save(cust);
        await writeAuditTrailLogEntry(state.activeEmployee.employeeNum, `Changed customer [${id}] status configuration to: ${newStatus.toUpperCase()}`);
        alert("Status Synchronized.");
    },

    viewReceiptDetails(invoiceId) {
        const inv = state.dbCache.transactions.find(t => t.invoiceId === invoiceId);
        if (!inv) return;
        
        let itemsHtml = "";
        inv.itemsSnapshot.forEach(it => {
            itemsHtml += `
                <div class="flex justify-between py-1 border-b border-gray-50 text-[11px] font-medium">
                    <span class="text-gray-600 truncate max-w-[200px]">${it.inventoryRef.nameDescription}</span>
                    <span class="font-mono text-black">${RegisterView.formatCurrency(it.computedPrice)}</span>
                </div>`;
        });

        ModalEngine.open(`
            <div class="space-y-4">
                <div class="flex justify-between items-center border-b pb-2">
                    <h3 class="font-mono font-bold text-sm">${inv.invoiceId}</h3>
                    <span class="text-[10px] text-gray-400 font-bold">${new Date(inv.timestamp).toLocaleString()}</span>
                </div>
                <div class="bg-gray-50 p-3 rounded-xl space-y-1.5 text-xs font-semibold">
                    <p class="flex justify-between"><span>Associate Terminal:</span><span>${inv.associateId}</span></p>
                    <p class="flex justify-between"><span>Store Number:</span><span>#${inv.storeNum}</span></p>
                    <p class="flex justify-between text-iosBlue font-black text-sm border-t pt-1.5 mt-1.5"><span>Net Invoice Gross:</span><span>${RegisterView.formatCurrency(inv.financials.grandTotal)}</span></p>
                </div>
                <div class="space-y-1">
                    <span class="block text-[10px] uppercase font-bold text-gray-400">Basket Snapshot</span>
                    <div class="max-h-32 overflow-y-auto ios-scroll px-1">${itemsHtml}</div>
                </div>
                <button onclick="ModalEngine.close()" class="w-full py-2 bg-gray-900 text-white rounded-xl text-xs font-bold">Dismiss Artifact</button>
            </div>`);
    }
};
