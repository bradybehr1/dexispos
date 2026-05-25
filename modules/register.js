export class RegisterModule {
    constructor(db, router) {
        this.db = db;
        this.router = router;
        this.cart = [];
        this.selectedCustomer = null;
        this.searchQuery = "";
        this.checkoutModalOpen = false;
        this.receiptModalOpen = false;
        this.lastTransaction = null;
    }

    addToCart(productId) {
        const products = this.db.get("products") || [];
        const item = products.find(p => p.id === productId);
        if (!item || item.stock <= 0) return;

        const existing = this.cart.find(c => c.id === productId);
        if (existing) {
            if (existing.quantity >= item.stock) return;
            existing.quantity++;
        } else {
            this.cart.push({ ...item, quantity: 1, discount: 0 });
        }
        this.router.render();
    }

    updateCartQty(productId, qty) {
        const products = this.db.get("products") || [];
        const targetProd = products.find(p => p.id === productId);
        if (qty <= 0) {
            this.cart = this.cart.filter(c => c.id !== productId);
        } else {
            const item = this.cart.find(c => c.id === productId);
            if (qty > targetProd.stock) return;
            item.quantity = qty;
        }
        this.router.render();
    }

    attachCustomer(phoneOrName) {
        const customers = this.db.get("customers") || [];
        const match = customers.find(c => c.phone === phoneOrName || c.name.toLowerCase().includes(phoneOrName.toLowerCase()));
        if (match) { this.selectedCustomer = match; }
        else { this.router.showToast("CRM Lookup Error", "danger"); }
        this.router.render();
    }

    getTotals() {
        let subtotal = 0;
        const config = this.router.globalSettings || { taxRate: 7.00 };
        this.cart.forEach(c => { subtotal += (c.price * c.quantity) - c.discount; });
        const tax = subtotal * (parseFloat(config.taxRate || 7.00) / 100);
        return { subtotal, tax, total: subtotal + tax };
    }

    processCheckout(paymentMethod) {
        const { subtotal, tax, total } = this.getTotals();
        if (this.cart.length === 0) return;

        const products = this.db.get("products") || [];
        this.cart.forEach(c => {
            const p = products.find(prod => prod.id === c.id);
            if (p) p.stock = Math.max(0, p.stock - c.quantity);
        });
        this.db.set("products", products);

        const tx = {
            id: "TX-" + Math.floor(100000 + Math.random() * 900000),
            timestamp: new Date().toISOString(),
            employeeName: this.router.currentUser.name,
            customerName: this.selectedCustomer ? this.selectedCustomer.name : "Walk-in Guest",
            items: [...this.cart], subtotal, tax, total, paymentMethod
        };

        const txs = this.db.get("transactions") || [];
        txs.unshift(tx);
        this.db.set("transactions", txs);

        this.lastTransaction = tx;
        this.cart = [];
        this.checkoutModalOpen = false;
        this.receiptModalOpen = true;
        this.router.render();
    }

    render() {
        const products = this.db.get("products") || [];
        const config = this.router.globalSettings || { currencySymbol: "$" };
        const sym = config.currencySymbol || "$";
        const filtered = products.filter(p => p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || p.sku.includes(this.searchQuery));
        const { subtotal, tax, total } = this.getTotals();

        window.registerModuleRef = this;

        return `
            <div class="h-full flex flex-col lg:flex-row overflow-hidden select-none">
                <div class="flex-1 flex flex-col overflow-hidden border-r border-[#2a2e35]">
                    <div class="p-3 bg-[#141619] border-b border-[#2a2e35] flex items-center gap-2">
                        <i class="fas fa-barcode text-xs text-slate-500 font-mono pl-2"></i>
                        <input type="text" placeholder="BARCODE / MANUAL SKU ENTRY DISPATCHER" value="${this.searchQuery}" oninput="window.registerModuleRef.searchQuery=this.value; window.state.render()" class="w-full bg-[#0c0d0e] border border-[#2a2e35] font-mono text-xs text-slate-200 outline-none p-2 rounded focus:border-blue-500 uppercase">
                    </div>
                    <div class="flex-1 overflow-y-auto p-3 bg-[#0c0d0e]">
                        <div class="grid grid-cols-2 xl:grid-cols-3 gap-2">
                            ${filtered.map(p => `
                                <div onclick="window.registerModuleRef.addToCart('${p.id}')" class="bg-[#141619] border border-[#2a2e35] p-3 rounded flex flex-col justify-between hover:border-slate-500 transition cursor-pointer group min-h-[95px]">
                                    <div><h4 class="font-bold text-xs text-slate-300 font-mono tracking-wide uppercase line-clamp-2">${p.name}</h4></div>
                                    <div class="flex items-end justify-between mt-2 font-mono"><span class="text-xs font-black text-blue-400">${sym}${p.price.toFixed(2)}</span><span class="text-[10px] text-slate-500">QTY: ${p.stock}</span></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="w-full lg:w-[360px] bg-[#141619] flex flex-col justify-between overflow-hidden flex-shrink-0 border-t lg:border-t-0 border-[#2a2e35]">
                    <div class="p-3 border-b border-[#2a2e35] bg-[#0c0d0e]/40">
                        ${this.selectedCustomer ? `
                            <div class="bg-[#1c1f24] border border-[#2a2e35] p-2 rounded flex justify-between items-center font-mono text-[11px]">
                                <div><span class="text-slate-500 block">CUSTOMER PROFILE</span><strong class="text-slate-200 uppercase">${this.selectedCustomer.name}</strong></div>
                                <button onclick="window.registerModuleRef.selectedCustomer=null; window.state.render()" class="text-slate-500 hover:text-orange-400 p-1"><i class="fas fa-times-circle"></i></button>
                            </div>
                        ` : `
                            <div class="flex gap-2">
                                <input type="text" id="cust-in" placeholder="CRM SEARCH MATRIX" class="flex-1 bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 text-xs font-mono text-slate-200 outline-none focus:border-blue-500 uppercase">
                                <button onclick="window.registerModuleRef.attachCustomer(document.getElementById('cust-in').value)" class="px-3 bg-[#1c1f24] border border-[#2a2e35] hover:bg-[#2a2e35] rounded text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">Query</button>
                            </div>
                        `}
                    </div>
                    <div class="flex-1 overflow-y-auto p-3 space-y-1">
                        ${this.cart.map(item => `
                            <div class="bg-[#1c1f24] border border-[#2a2e35] p-2.5 rounded font-mono text-[11px] flex justify-between items-center">
                                <div class="max-w-[180px]"><h5 class="font-bold text-slate-300 uppercase truncate">${item.name}</h5><span class="text-[10px] text-slate-500">${sym}${item.price.toFixed(2)} x ${item.quantity}</span></div>
                                <div class="flex items-center gap-3">
                                    <div class="flex items-center bg-[#0c0d0e] border border-[#2a2e35] rounded p-0.5">
                                        <button onclick="window.registerModuleRef.updateCartQty('${item.id}', ${item.quantity - 1})" class="w-5 h-5 text-[10px] text-slate-500"><i class="fas fa-minus"></i></button>
                                        <span class="w-6 text-center font-bold text-slate-300">${item.quantity}</span>
                                        <button onclick="window.registerModuleRef.updateCartQty('${item.id}', ${item.quantity + 1})" class="w-5 h-5 text-[10px] text-slate-500"><i class="fas fa-plus"></i></button>
                                    </div>
                                    <span class="font-bold text-slate-200 w-16 text-right">${sym}${((item.price * item.quantity) - item.discount).toFixed(2)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="p-3 bg-[#0c0d0e] border-t border-[#2a2e35] space-y-3">
                        <div class="space-y-1 font-mono text-[11px] text-slate-400">
                            <div class="flex justify-between"><span>SUBTOTAL:</span><span class="text-slate-300">${sym}${subtotal.toFixed(2)}</span></div>
                            <div class="flex justify-between border-t border-[#2a2e35] pt-2 text-xs font-black text-slate-200"><span>BAL DUE VALUE:</span><span class="text-blue-400 font-bold">${sym}${total.toFixed(2)}</span></div>
                        </div>
                        <button onclick="window.registerModuleRef.checkoutModalOpen=true; window.state.render()" ${this.cart.length === 0 ? 'disabled' : ''} class="w-full py-3 bg-blue-600 disabled:bg-[#1c1f24] disabled:border-[#2a2e35] disabled:text-slate-600 border border-blue-500 text-white rounded font-mono font-bold text-xs uppercase tracking-widest jmd-action-active transition">Tender Settlement</button>
                    </div>
                </div>
            </div>
            ${this.checkoutModalOpen ? this.templateCheckoutModal(total, sym) : ''}
            ${this.receiptModalOpen ? this.templateReceiptModal(sym) : ''}
        `;
    }

    templateCheckoutModal(total, sym) {
        return `
            <div class="fixed inset-0 bg-[#0c0d0e]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div class="bg-[#141619] border border-[#2a2e35] p-5 rounded w-full max-w-sm text-center space-y-4 shadow-2xl">
                    <h3 class="text-xs font-bold uppercase tracking-wider font-mono text-slate-400">Tender Sub-Gateway</h3>
                    <div class="bg-[#0c0d0e] border border-[#2a2e35] p-3 font-mono text-xl text-blue-400 font-bold">${sym}${total.toFixed(2)}</div>
                    <div class="grid grid-cols-1 gap-2">
                        <button onclick="window.registerModuleRef.processCheckout('Card')" class="py-3 bg-[#1c1f24] hover:bg-[#2a2e35] text-slate-200 border border-[#2a2e35] rounded text-xs font-mono font-bold uppercase tracking-wider transition">Electronic Integrated Credit</button>
                        <button onclick="window.registerModuleRef.processCheckout('Cash')" class="py-3 bg-[#1c1f24] hover:bg-[#2a2e35] text-slate-200 border border-[#2a2e35] rounded text-xs font-mono font-bold uppercase tracking-wider transition">Cash Settlement Vault</button>
                        <button onclick="window.registerModuleRef.checkoutModalOpen=false; window.state.render()" class="py-2 text-slate-500 font-mono text-[10px] uppercase">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }

    templateReceiptModal(sym) {
        return `
            <div class="fixed inset-0 bg-[#0c0d0e]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div class="bg-[#141619] border border-[#2a2e35] p-5 rounded w-full max-w-sm space-y-3 shadow-2xl">
                    <div class="bg-[#e2e4e6] text-[#0c0d0e] p-4 rounded font-mono text-[10px] space-y-2 shadow-inner">
                        <div class="text-center border-b border-slate-400 pb-1 font-black uppercase tracking-tight">${this.router.globalSettings.storeName || 'Terminal Node'}</div>
                        ${this.router.globalSettings.companyName ? `<div class="text-center font-bold text-[9px] uppercase border-b border-slate-300 pb-1 mb-1">${this.router.globalSettings.companyName}</div>` : ''}
                        ${this.router.globalSettings.storeAddress ? `<div class="text-center text-[8px] text-slate-500 uppercase mb-2 leading-tight">${this.router.globalSettings.storeAddress}</div>` : ''}
                        <p>TRANSACTION: ${this.lastTransaction.id}</p><p>OPERATOR: ${this.lastTransaction.employeeName}</p>
                        <div class="border-t border-b border-slate-400 py-1 font-bold flex justify-between text-xs"><span>TOTAL COLLECTED:</span><span>${sym}${this.lastTransaction.total.toFixed(2)}</span></div>
                        <div class="text-center text-[9px] text-slate-500 pt-1">${this.router.globalSettings.receiptFooter || ''}</div>
                    </div>
                    <button onclick="window.registerModuleRef.receiptModalOpen=false; window.state.render()" class="w-full py-2.5 bg-blue-600 text-white border border-blue-500 rounded text-xs font-mono font-bold uppercase tracking-wider transition">Commit Terminal Loop</button>
                </div>
            </div>
        `;
    }
}
