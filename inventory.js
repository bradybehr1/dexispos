export class InventoryModule {
    constructor(db, router) {
        this.db = db;
        this.router = router;
        this.modalOpen = false;
    }

    render() {
        const products = this.db.get("products");
        window.inventoryModuleRef = this;

        return `
            <div class="h-full flex flex-col p-4 space-y-3 overflow-hidden select-none">
                <div class="flex justify-between items-center bg-[#141619] p-3 border border-[#2a2e35] rounded">
                    <div><h3 class="text-xs font-mono font-bold uppercase text-slate-300 tracking-wider">Item Allocation Matrix</h3></div>
                    <button onclick="window.inventoryModuleRef.openModal()" class="px-3 py-1.5 bg-blue-600 text-white border border-blue-500 rounded text-xs font-mono font-bold uppercase tracking-wider">Add Item</button>
                </div>
                <div class="flex-1 overflow-auto border border-[#2a2e35] bg-[#141619]/20 rounded">
                    <table class="w-full border-collapse text-left text-xs text-slate-300 font-mono">
                        <thead class="bg-[#141619] border-b border-[#2a2e35] text-slate-400 font-bold uppercase tracking-wider sticky top-0">
                            <tr><th class="px-4 py-2.5">Product Configuration Matrix</th><th class="px-4 py-2.5">SKU Parameter</th><th class="px-4 py-2.5 text-right">Price Matrix</th><th class="px-4 py-2.5 text-center">Allocated Stock</th><th class="px-4 py-2.5 text-right">Ops</th></tr>
                        </thead>
                        <tbody class="divide-y divide-[#2a2e35]/60 font-medium">
                            ${products.map(p => `
                                <tr class="hover:bg-[#1c1f24] transition">
                                    <td class="px-4 py-2.5 font-bold uppercase text-slate-200">${p.name}</td>
                                    <td class="px-4 py-2.5 text-slate-400">${p.sku}</td>
                                    <td class="px-4 py-2.5 text-right font-bold text-blue-400">${this.router.globalSettings.currencySymbol}${p.price.toFixed(2)}</td>
                                    <td class="px-4 py-2.5 text-center text-slate-300">${p.stock} units</td>
                                    <td class="px-4 py-2.5 text-right"><button onclick="window.inventoryModuleRef.deleteItem('${p.id}')" class="text-orange-400 px-2"><i class="fas fa-trash-can"></i></button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ${this.modalOpen ? this.templateModal() : ''}
        `;
    }

    openModal() { this.modalOpen = true; window.state.render(); }
    closeModal() { this.modalOpen = false; window.state.render(); }

    deleteItem(id) {
        let prods = this.db.get("products");
        prods = prods.filter(p => p.id !== id);
        this.db.set("products", prods);
        window.state.render();
    }

    submitForm() {
        const name = document.getElementById("p-name-in").value;
        const sku = document.getElementById("p-sku-in").value;
        const price = parseFloat(document.getElementById("p-price-in").value);
        const stock = parseInt(document.getElementById("p-stock-in").value);

        const prods = this.db.get("products");
        prods.push({ id: "p-" + Date.now(), name, sku, price, cost: price * 0.4, stock, category: "General" });
        this.db.set("products", prods);
        this.closeModal();
    }

    templateModal() {
        return `
            <div class="fixed inset-0 bg-[#0c0d0e]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div class="bg-[#141619] border border-[#2a2e35] p-5 rounded w-full max-w-sm text-xs font-mono">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Create Product Schema</h3>
                    <form onsubmit="event.preventDefault(); window.inventoryModuleRef.submitForm();" class="space-y-3">
                        <div class="space-y-1"><label class="text-slate-500 font-bold uppercase block text-[10px]">Product Title:</label><input type="text" id="p-name-in" required class="w-full bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 outline-none text-slate-200 focus:border-blue-500 uppercase"></div>
                        <div class="space-y-1"><label class="text-slate-500 font-bold uppercase block text-[10px]">SKU String Target:</label><input type="text" id="p-sku-in" required class="w-full bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 outline-none text-slate-200 focus:border-blue-500 font-mono"></div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-1"><label class="text-slate-500 font-bold uppercase block text-[10px]">Price standard:</label><input type="number" step="0.01" id="p-price-in" required class="w-full bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 outline-none text-slate-200 focus:border-blue-500 font-mono"></div>
                            <div class="space-y-1"><label class="text-slate-500 font-bold uppercase block text-[10px]">Stock Count:</label><input type="number" id="p-stock-in" required class="w-full bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 outline-none text-slate-200 focus:border-blue-500 font-mono"></div>
                        </div>
                        <div class="flex justify-end gap-2 pt-3 border-t border-[#2a2e35] mt-4">
                            <button type="button" onclick="window.inventoryModuleRef.closeModal()" class="px-3 py-1.5 bg-[#1c1f24] border border-[#2a2e35] rounded font-bold text-slate-300 uppercase">Cancel</button>
                            <button type="submit" class="px-3 py-1.5 bg-blue-600 border border-blue-500 text-white rounded font-bold uppercase">Save Node</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
}
