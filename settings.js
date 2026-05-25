export class SettingsModule {
    constructor(db, router) {
        this.db = db;
        this.router = router;
        // Tracking active expansion tabs inside the settings layout matrix
        this.activeSubSection = 'company'; 
    }

    setSubSection(sec) {
        this.activeSubSection = sec;
        this.router.render();
    }

    // ==========================================
    // COMMIT ACTIONS & STATE MUTATIONS
    // ==========================================
    saveCorporateDetails() {
        const current = this.db.get("settings");
        const updated = {
            ...current,
            companyName: document.getElementById("set-company-name").value,
            taxId: document.getElementById("set-tax-id").value,
            storeAddress: document.getElementById("set-store-address").value,
            storeName: document.getElementById("set-store-name").value
        };
        this.db.set("settings", updated);
        this.router.globalSettings = updated;
        this.router.showToast("Corporate Metadata Committed.");
    }

    saveFiscalSettings() {
        const current = this.db.get("settings");
        const updated = {
            ...current,
            taxRate: parseFloat(document.getElementById("set-tax-rate").value) || 0,
            currencySymbol: document.getElementById("set-currency").value
        };
        this.db.set("settings", updated);
        this.router.globalSettings = updated;
        this.router.showToast("Fiscal System Rules Locked.");
    }

    saveReceiptOptions() {
        const current = this.db.get("settings");
        const updated = {
            ...current,
            receiptFooter: document.getElementById("set-footer").value
        };
        this.db.set("settings", updated);
        this.router.globalSettings = updated;
        this.router.showToast("Receipt Template Mask Saved.");
    }

    // --- QUICK CRUD INJECTIONS INSIDE SETTINGS ENGINE ---
    addEmployeeNode() {
        const name = document.getElementById("set-emp-name").value;
        const pin = document.getElementById("set-emp-pin").value;
        const role = document.getElementById("set-emp-role").value;
        const wage = parseFloat(document.getElementById("set-emp-wage").value) || 0;

        if (!name || !pin) {
            this.router.showToast("Missing Parameters", "danger");
            return;
        }

        const emps = this.db.get("employees");
        emps.push({ id: "e-" + Date.now(), name, pin, role, wage });
        this.db.set("employees", emps);
        this.router.showToast(`Staff Asset Onboarded: ${name}`);
        this.router.render();
    }

    addCustomerNode() {
        const name = document.getElementById("set-cust-name").value;
        const phone = document.getElementById("set-cust-phone").value;
        const email = document.getElementById("set-cust-email").value || "walkin@pos.local";

        if (!name || !phone) {
            this.router.showToast("Identity Token Missing", "danger");
            return;
        }

        const custs = this.db.get("customers");
        custs.push({ id: "c-" + Date.now(), name, phone, email, spend: 0, points: 0 });
        this.db.set("customers", custs);
        this.router.showToast(`CRM Node Committed: ${name}`);
        this.router.render();
    }

    addProductNode() {
        const name = document.getElementById("set-prod-name").value;
        const sku = document.getElementById("set-prod-sku").value;
        const price = parseFloat(document.getElementById("set-prod-price").value) || 0;
        const stock = parseInt(document.getElementById("set-prod-stock").value) || 0;

        if (!name || !sku) {
            this.router.showToast("Catalog Mapping Denied", "danger");
            return;
        }

        const prods = this.db.get("products");
        prods.push({ id: "p-" + Date.now(), name, sku, price, cost: price * 0.4, stock, category: "General" });
        this.db.set("products", prods);
        this.router.showToast(`Product Asset Locked: ${name}`);
        this.router.render();
    }

    clearLocalStorageCache() {
        localStorage.clear();
        this.router.showToast("Purging Station Registers...", "danger");
        setTimeout(() => window.location.reload(), 800);
    }

    // ==========================================
    // RENDER DISPATCH VIEWS
    // ==========================================
    render() {
        window.settingsModuleRef = this;
        const s = this.router.globalSettings;
        const emps = this.db.get("employees");
        const custs = this.db.get("customers");
        const prods = this.db.get("products");

        return `
            <div class="h-full flex flex-col md:flex-row overflow-hidden font-mono text-xs select-none p-4 gap-4">
                
                <div class="w-full md:w-48 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible bg-[#141619] border border-[#2a2e35] p-2 rounded flex-shrink-0">
                    ${this.subNavItem('company', 'Corporate Profile')}
                    ${this.subNavItem('fiscal', 'Fiscal & Taxes')}
                    ${this.subNavItem('receipt', 'Receipt Options')}
                    ${this.subNavItem('employees', 'Staff Roster')}
                    ${this.subNavItem('customers', 'CRM Registry')}
                    ${this.subNavItem('inventory', 'Product Sheets')}
                    ${this.subNavItem('system', 'System Controls')}
                </div>

                <div class="flex-1 bg-[#141619] border border-[#2a2e35] p-5 rounded overflow-y-auto space-y-4 shadow-2xl relative">
                    ${this.renderActiveSection(s, emps, custs, prods)}
                </div>
            </div>
        `;
    }

    subNavItem(id, label) {
        const active = this.activeSubSection === id;
        return `
            <button onclick="window.settingsModuleRef.setSubSection('${id}')" class="px-3 py-2 text-left rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition ${active ? 'bg-blue-600 text-white font-black border border-blue-500' : 'text-slate-400 hover:bg-[#1c1f24] hover:text-slate-200'}">
                ${label}
            </button>
        `;
    }

    renderActiveSection(s, emps, custs, prods) {
        switch(this.activeSubSection) {
            case 'company':
                return `
                    <h3 class="text-[11px] font-bold text-white border-b border-[#2a2e35] pb-2 uppercase tracking-wider">Enterprise Identity Properties</h3>
                    <div class="space-y-3 max-w-md pt-2">
                        <div class="space-y-1"><label class="text-slate-500 font-bold uppercase text-[9px]">Legal Corporate Title:</label><input type="text" id="set-company-name" value="${s.companyName || ''}" class="w-full bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 text-slate-200 outline-none focus:border-blue-500 uppercase"></div>
                        <div class="space-y-1"><label class="text-slate-500 font-bold uppercase text-[9px]">Node Facility Name:</label><input type="text" id="set-store-name" value="${s.storeName || ''}" class="w-full bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 text-slate-200 outline-none focus:border-blue-500 uppercase"></div>
                        <div class="space-y-1"><label class="text-slate-500 font-bold uppercase text-[9px]">Corporate Tax Identifier (EIN):</label><input type="text" id="set-tax-id" value="${s.taxId || ''}" class="w-full bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 text-slate-200 outline-none focus:border-blue-500 font-mono"></div>
                        <div class="space-y-1"><label class="text-slate-500 font-bold uppercase text-[9px]">Physical Store Geo Address:</label><input type="text" id="set-store-address" value="${s.storeAddress || ''}" class="w-full bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 text-slate-200 outline-none focus:border-blue-500 uppercase"></div>
                        <button onclick="window.settingsModuleRef.saveCorporateDetails()" class="mt-2 px-4 py-2 bg-blue-600 border border-blue-500 text-white font-bold rounded uppercase tracking-wider jmd-action-active">Commit Profile Details</button>
                    </div>
                `;
            case 'fiscal':
                return `
                    <h3 class="text-[11px] font-bold text-white border-b border-[#2a2e35] pb-2 uppercase tracking-wider">Fiscal Processing Framework</h3>
                    <div class="space-y-3 max-w-md pt-2">
                        <div class="space-y-1"><label class="text-slate-500 font-bold uppercase text-[9px]">Tax Matrix Rate Percentage (%):</label><input type="number" step="0.001" id="set-tax-rate" value="${s.taxRate || ''}" class="w-full bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 text-slate-200 outline-none focus:border-blue-500 font-mono"></div>
                        <div class="space-y-1"><label class="text-slate-500 font-bold uppercase text-[9px]">Localization Currency Signifier:</label><input type="text" id="set-currency" value="${s.currencySymbol || ''}" class="w-full bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 text-slate-200 outline-none focus:border-blue-500 font-mono"></div>
                        
                        <div class="space-y-1"><label class="text-slate-500 font-bold uppercase text-[9px]">Active Payment Gateways:</label>
                            <div class="bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 space-y-1.5 text-slate-400 text-[10px]">
                                <div class="flex items-center gap-2"><i class="fas fa-check-square text-blue-500"></i><span>CARD LOGIC (INTEGRATED EFT TERMINAL)</span></div>
                                <div class="flex items-center gap-2"><i class="fas fa-check-square text-blue-500"></i><span>CASH TENDER (HARDWARE DRAWER RELAY)</span></div>
                            </div>
                        </div>
                        <button onclick="window.settingsModuleRef.saveFiscalSettings()" class="mt-2 px-4 py-2 bg-blue-600 border border-blue-500 text-white font-bold rounded uppercase tracking-wider jmd-action-active">Commit Accounting Logic</button>
                    </div>
                `;
            case 'receipt':
                return `
                    <h3 class="text-[11px] font-bold text-white border-b border-[#2a2e35] pb-2 uppercase tracking-wider">Receipt Template Customizer</h3>
                    <div class="space-y-3 max-w-md pt-2">
                        <div class="space-y-1"><label class="text-slate-500 font-bold uppercase text-[9px]">Slat Document Footer Messaging String:</label><input type="text" id="set-footer" value="${s.receiptFooter || ''}" class="w-full bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 text-slate-200 outline-none focus:border-blue-500"></div>
                        <div class="space-y-1"><label class="text-slate-500 font-bold uppercase text-[9px]">Cryptographic Signatures:</label>
                            <div class="p-2 bg-[#0c0d0e] border border-[#2a2e35] text-[10px] text-slate-500 rounded font-mono">
                                System locks default cryptographic hashes: [AEGIS-OS-SHA256] onto physical output slates.
                            </div>
                        </div>
                        <button onclick="window.settingsModuleRef.saveReceiptOptions()" class="mt-2 px-4 py-2 bg-blue-600 border border-blue-500 text-white font-bold rounded uppercase tracking-wider jmd-action-active">Commit Template Options</button>
                    </div>
                `;
            case 'employees':
                return `
                    <h3 class="text-[11px] font-bold text-white border-b border-[#2a2e35] pb-2 uppercase tracking-wider">Staff Credential Registry</h3>
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-2">
                        <div class="space-y-2.5 p-3 bg-[#0c0d0e] border border-[#2a2e35] rounded self-start">
                            <span class="text-slate-400 font-bold text-[10px] block uppercase tracking-wider">Onboard Staff Asset</span>
                            <div class="space-y-1.5">
                                <input type="text" id="set-emp-name" placeholder="LEGAL FIRST & LAST NAME" class="w-full bg-[#141619] border border-[#2a2e35] p-2 text-slate-200 rounded uppercase outline-none focus:border-blue-500">
                                <input type="password" id="set-emp-pin" placeholder="SECURITY KEYPAD PIN ACCESS" class="w-full bg-[#141619] border border-[#2a2e35] p-2 text-slate-200 rounded outline-none focus:border-blue-500 tracking-widest font-mono">
                                <select id="set-emp-role" class="w-full bg-[#141619] border border-[#2a2e35] p-2 text-slate-400 rounded outline-none">
                                    <option value="Cashier">Cashier Access Level</option>
                                    <option value="Manager">Manager Override Level</option>
                                    <option value="Admin">Admin System Root Level</option>
                                </select>
                                <input type="number" step="0.01" id="set-emp-wage" placeholder="HOURLY WAGE SCALE ($/HR)" class="w-full bg-[#141619] border border-[#2a2e35] p-2 text-slate-200 rounded font-mono outline-none">
                            </div>
                            <button onclick="window.settingsModuleRef.addEmployeeNode()" class="w-full py-2 bg-blue-600 border border-blue-500 text-white font-bold rounded uppercase tracking-wider">Inject Staff Matrix</button>
                        </div>
                        <div class="space-y-1 overflow-y-auto max-h-60">
                            <span class="text-slate-500 font-bold text-[9px] block uppercase tracking-wider mb-1">Active Credentials Registry</span>
                            ${emps.map(e => `
                                <div class="p-2 bg-[#0c0d0e] border border-[#2a2e35] rounded flex justify-between items-center text-[11px]">
                                    <div><strong class="text-slate-300 uppercase block">${e.name}</strong><span class="text-slate-500 text-[10px] uppercase font-bold">${e.role} • ${s.currencySymbol}${e.wage.toFixed(2)}/hr</span></div>
                                    <span class="font-mono text-slate-600 tracking-widest text-[9px] bg-[#141619] px-2 py-0.5 rounded border border-[#2a2e35]">PIN LOCKED</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            case 'customers':
                return `
                    <h3 class="text-[11px] font-bold text-white border-b border-[#2a2e35] pb-2 uppercase tracking-wider">CRM Loyalty Index</h3>
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-2">
                        <div class="space-y-2.5 p-3 bg-[#0c0d0e] border border-[#2a2e35] rounded self-start">
                            <span class="text-slate-400 font-bold text-[10px] block uppercase tracking-wider">Provision Consumer Account</span>
                            <div class="space-y-1.5">
                                <input type="text" id="set-cust-name" placeholder="CLIENT IDENTITY TITLE" class="w-full bg-[#141619] border border-[#2a2e35] p-2 text-slate-200 rounded uppercase outline-none focus:border-blue-500">
                                <input type="tel" id="set-cust-phone" placeholder="MOBILE COMMUNICATION STRING" class="w-full bg-[#141619] border border-[#2a2e35] p-2 text-slate-200 rounded font-mono outline-none focus:border-blue-500">
                                <input type="email" id="set-cust-email" placeholder="ELECTRONIC MAILING DESK" class="w-full bg-[#141619] border border-[#2a2e35] p-2 text-slate-200 rounded outline-none focus:border-blue-500">
                            </div>
                            <button onclick="window.settingsModuleRef.addCustomerNode()" class="w-full py-2 bg-blue-600 border border-blue-500 text-white font-bold rounded uppercase tracking-wider">Inject Account Token</button>
                        </div>
                        <div class="space-y-1 overflow-y-auto max-h-60">
                            <span class="text-slate-500 font-bold text-[9px] block uppercase tracking-wider mb-1">CRM Target Indexes</span>
                            ${custs.map(c => `
                                <div class="p-2 bg-[#0c0d0e] border border-[#2a2e35] rounded flex justify-between items-center text-[11px]">
                                    <div><strong class="text-slate-300 uppercase block">${c.name}</strong><span class="text-slate-500 font-mono text-[10px]">${c.phone}</span></div>
                                    <span class="font-mono text-blue-400 font-bold">${c.points} PTS</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            case 'inventory':
                return `
                    <h3 class="text-[11px] font-bold text-white border-b border-[#2a2e35] pb-2 uppercase tracking-wider">Catalog Inventory Schema Control</h3>
                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-2">
                        <div class="space-y-2.5 p-3 bg-[#0c0d0e] border border-[#2a2e35] rounded self-start">
                            <span class="text-slate-400 font-bold text-[10px] block uppercase tracking-wider">Map Stock Manifest Entry</span>
                            <div class="space-y-1.5">
                                <input type="text" id="set-prod-name" placeholder="PRODUCT MASTER TITLE" class="w-full bg-[#141619] border border-[#2a2e35] p-2 text-slate-200 rounded uppercase outline-none focus:border-blue-500">
                                <input type="text" id="set-prod-sku" placeholder="SKU SPECIFICATION TAG" class="w-full bg-[#141619] border border-[#2a2e35] p-2 text-slate-200 font-mono rounded outline-none focus:border-blue-500">
                                <div class="grid grid-cols-2 gap-2">
                                    <input type="number" step="0.01" id="set-prod-price" placeholder="RETAIL DEBIT ($)" class="w-full bg-[#141619] border border-[#2a2e35] p-2 text-slate-200 font-mono rounded outline-none">
                                    <input type="number" id="set-prod-stock" placeholder="BATCH STOCK UNIT COUNT" class="w-full bg-[#141619] border border-[#2a2e35] p-2 text-slate-200 font-mono rounded outline-none">
                                </div>
                            </div>
                            <button onclick="window.settingsModuleRef.addProductNode()" class="w-full py-2 bg-blue-600 border border-blue-500 text-white font-bold rounded uppercase tracking-wider">Inject SKU Record</button>
                        </div>
                        <div class="space-y-1 overflow-y-auto max-h-60">
                            <span class="text-slate-500 font-bold text-[9px] block uppercase tracking-wider mb-1">Catalog Item Arrays</span>
                            ${prods.map(p => `
                                <div class="p-2 bg-[#0c0d0e] border border-[#2a2e35] rounded flex justify-between items-center text-[11px]">
                                    <div class="max-w-[160px]"><strong class="text-slate-300 uppercase block truncate">${p.name}</strong><span class="text-slate-500 font-mono text-[9px]">${p.sku}</span></div>
                                    <span class="font-mono font-bold text-blue-400">${s.currencySymbol}${p.price.toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            case 'system':
                return `
                    <h3 class="text-[11px] font-bold text-orange-400 border-b border-orange-950/60 pb-2 uppercase tracking-wider"><i class="fas fa-warning mr-1"></i>Hardware Vault Flush Routines</h3>
                    <div class="space-y-3 pt-2">
                        <p class="text-slate-500 text-[11px] leading-relaxed max-w-md">Executing data clearance modules will immediately purge all transaction logs, payroll shift timecards, item arrays, and consumer metrics stored inside this iPad hardware container namespace cache.</p>
                        <div class="pt-2">
                            <button onclick="window.settingsModuleRef.clearLocalStorageCache()" class="px-4 py-2.5 bg-orange-950/20 border border-orange-900 text-orange-400 font-bold rounded uppercase tracking-wider transition jmd-action-active">Flush Local Cache Registries</button>
                        </div>
                    </div>
                `;
            default:
                return ``;
        }
    }
}
