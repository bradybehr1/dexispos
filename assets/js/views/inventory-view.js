// =========================================================================
// INTERFACE VIEW LAYER: INVENTORY MANAGEMENT & VARIANT CATALOGS
// =========================================================================
const InventoryView = {
    renderInventoryCatalogTable() {
        let query = document.getElementById("inv-search-box").value.trim().toLowerCase();
        let rows = document.getElementById("inv-catalog-rows");
        if (!rows) return;
        rows.innerHTML = "";
        
        let filtered = state.dbCache.inventory.filter(p => p.sku.includes(query) || p.nameDescription.toLowerCase().includes(query));
        filtered.forEach(p => {
            let div = document.createElement("div");
            div.className = "px-4 py-3 grid grid-cols-12 text-xs font-semibold items-center hover:bg-gray-50 cursor-pointer";
            div.onclick = () => InventoryView.inspectProduct(p.sku);
            div.innerHTML = `<span class="col-span-3 truncate">${p.nameDescription}</span><span class="col-span-3 font-mono">${p.sku}</span><span class="col-span-2">${p.categoryId}</span><span class="col-span-2 text-right">${RegisterView.formatCurrency(p.price)}</span><span class="col-span-2 text-right">${p.stockOnHand}</span>`;
            rows.appendChild(div);
        });
    },

    inspectProduct(sku) {
        let p = state.dbCache.inventory.find(x => x.sku === sku);
        let pane = document.getElementById("inv-inspect-pane");
        let vHtml = "";
        if(p.variants) p.variants.forEach((v, idx) => vHtml += `<div class="p-2 bg-white border rounded-xl text-xs flex justify-between"><span>${v.color}/${v.size}</span><b>${v.stock} units</b></div>`);
        
        pane.innerHTML = `
            <div class="space-y-4 text-xs font-bold">
                <h3 class="text-base">${p.nameDescription}</h3>
                <div class="bg-gray-50 p-3 rounded-xl">Stock: <b>${p.stockOnHand} Units</b></div>
                <div class="space-y-1">${vHtml || 'No variants.'}</div>
                <button onclick="InventoryView.triggerAdjustment('${p.sku}')" class="w-full py-2 bg-iosBlue text-white rounded-xl">Adjust Count</button>
            </div>`;
    },

    clearInspectionPane() {
        document.getElementById("inv-inspect-pane").innerHTML = `<p class="text-center text-gray-400 py-20 text-xs">Select SKU to inspect</p>`;
    },

    triggerAdjustment(sku) {
        ModalEngine.open(`
            <div class="space-y-4">
                <h3>Adjust Inventory Count</h3>
                <input type="number" id="adj-qty" placeholder="Change +/-" class="w-full p-2 border rounded-xl">
                <input type="text" id="adj-reason" placeholder="Reason" class="w-full p-2 border rounded-xl">
                <button onclick="InventoryView.commitAdjustment('${sku}')" class="w-full py-2 bg-iosBlue text-white rounded-xl">Commit</button>
            </div>`);
    },

    async commitAdjustment(sku) {
        let qty = parseInt(document.getElementById("adj-qty").value);
        let reason = document.getElementById("adj-reason").value;
        let p = state.dbCache.inventory.find(i => i.sku === sku);
        p.stockOnHand += qty;
        await InventoryDB.saveProduct(p);
        await writeAuditTrailLogEntry(state.activeEmployee.employeeNum, `Adjusted SKU ${sku} by ${qty}. Reason: ${reason}`);
        ModalEngine.close();
        InventoryView.renderInventoryCatalogTable();
        InventoryView.inspectProduct(sku);
    }
};
