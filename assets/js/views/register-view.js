// =========================================================================
// INTERFACE VIEW LAYER: SALES REGISTER, CART CALCULATIONS, & PAYMENTS
// =========================================================================
const RegisterView = {
    // -------------------------------------------------------------------------
    // SYSTEM CART LINES RENDERING LABELS
    // -------------------------------------------------------------------------
    renderCart() {
        let container = document.getElementById("cart-items-container");
        if (!container) return;
        
        if (state.invoiceContext.items.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-400 py-20 flex flex-col items-center justify-center">
                    <i data-lucide="barcode" class="w-16 h-16 stroke-[1] text-gray-300 mb-2"></i>
                    <p class="text-sm font-medium">No items present in current invoice frame.</p>
                    <p class="text-xs text-gray-400 max-w-xs mt-1">Utilize manual SKU entries or camera scan simulations below.</p>
                </div>`;
            RegisterView.calculateTotals();
            lucide.createIcons();
            return;
        }

        container.innerHTML = "";
        state.invoiceContext.items.forEach((it, index) => {
            let hasMarkdown = it.computedPrice < it.inventoryRef.price;
            let variantText = it.selectedVariant ? ` [${it.selectedVariant.color} / ${it.selectedVariant.size}]` : "";
            let itemDiv = document.createElement("div");
            itemDiv.className = "bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between relative animate-in slide-in-from-bottom-2 duration-100";
            itemDiv.innerHTML = `
                <div class="flex-1 min-w-0 pr-4">
                    <span class="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">${it.inventoryRef.categoryId}</span>
                    <h4 class="font-bold text-sm text-gray-900 truncate mt-1">${it.inventoryRef.nameDescription}${variantText}</h4>
                    <p class="font-mono text-xs text-gray-400 mt-0.5">SKU: ${it.inventoryRef.sku} ${it.inventoryRef.taxEligible !== 'yes' ? '<span class="text-amber-600 font-bold">[NON-TAX]</span>' : ''}</p>
                    ${hasMarkdown ? `<p class="text-xs text-iosRed font-medium mt-1">Adjusted pricing markdown active</p>` : ''}
                </div>
                <div class="text-right flex items-center space-x-4 shrink-0">
                    <div>
                        <div class="font-bold text-base text-black">${RegisterView.formatCurrency(it.computedPrice)}</div>
                        ${hasMarkdown ? `<div class="text-xs text-gray-400 line-through">${RegisterView.formatCurrency(it.inventoryRef.price)}</div>` : ''}
                    </div>
                    <div class="relative">
                        <button onclick="AppRouter.toggleVisibility('cart-item-popover-${index}')" class="bg-gray-100 text-gray-600 p-2 rounded-xl"><i data-lucide="sliders-horizontal" class="w-4 h-4"></i></button>
                        <div id="cart-item-popover-${index}" class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border py-1 hidden z-50 text-xs font-semibold">
                            <button onclick="RegisterView.triggerLinePriceOverride(${index})" class="w-full px-3 py-2 text-left hover:bg-gray-50"><i data-lucide="pencil" class="w-3.5 h-3.5 inline text-iosBlue mr-1"></i> Modify Line Price</button>
                            <button onclick="RegisterView.triggerLineDiscount(${index}, 'percent')" class="w-full px-3 py-2 text-left hover:bg-gray-50"><i data-lucide="percent" class="w-3.5 h-3.5 inline text-iosBlue mr-1"></i> Markdown %</button>
                            <button onclick="RegisterView.triggerLineDiscount(${index}, 'dollar')" class="w-full px-3 py-2 text-left hover:bg-gray-50"><i data-lucide="dollar-sign" class="w-3.5 h-3.5 inline text-iosBlue mr-1"></i> Markdown $</button>
                            <hr class="border-gray-100 my-1">
                            <button onclick="RegisterView.removeCartItem(${index})" class="w-full px-3 py-2 text-left hover:bg-gray-50 text-iosRed"><i data-lucide="trash-2" class="w-3.5 h-3.5 inline mr-1"></i> Purge From Cart</button>
                        </div>
                    </div>
                </div>`;
            container.appendChild(itemDiv);
        });
        RegisterView.calculateTotals();
        lucide.createIcons();
    },

    handleManualSkuScan() {
        if (!verifyRegisterTillSessionIsActive()) return;
        let box = document.getElementById("register-sku-input");
        if (!box) return;
        let inputSku = box.value.trim();
        if (!inputSku) return;
        
        let product = state.dbCache.inventory.find(p => p.sku === inputSku);
        if (!product) {
            alert("SKU code not located inside catalog matrix arrays.");
            return;
        }
        
        if (product.variants && product.variants.length > 0) {
            let htmlOptions = "";
            product.variants.forEach((v, idx) => {
                htmlOptions += `
                    <button onclick="RegisterView.processVariantCartSelection('${product.sku}', ${idx})" class="w-full text-left p-3 bg-gray-50 border rounded-xl hover:border-iosBlue flex justify-between items-center transition font-medium">
                        <div>
                            <span class="block text-sm text-gray-900">${v.color} / ${v.size}</span>
                            <span class="block text-xs text-gray-400">Stock level: ${v.stock} units remain</span>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-gray-400"></i>
                    </button>`;
            });
            ModalEngine.open(`
                <div class="space-y-4">
                    <h3 class="text-lg font-bold">Select Variant Attribute</h3>
                    <div class="space-y-2 max-h-60 overflow-y-auto ios-scroll">${htmlOptions}</div>
                    <button onclick="ModalEngine.close()" class="w-full py-2 bg-gray-100 rounded-xl text-xs font-semibold">Cancel</button>
                </div>`);
        } else {
            RegisterView.injectProductToCart(product, null);
        }
        box.value = "";
    },

    processVariantCartSelection(sku, variantIdx) {
        let prod = state.dbCache.inventory.find(p => p.sku === sku);
        let variant = prod.variants[variantIdx];
        ModalEngine.close();
        RegisterView.injectProductToCart(prod, variant);
    },

    injectProductToCart(product, variant) {
        state.invoiceContext.items.push({
            cartId: "LINE_" + Date.now(),
            inventoryRef: JSON.parse(JSON.stringify(product)),
            selectedVariant: variant,
            computedPrice: product.price
        });
        RegisterView.renderCart();
    },

    removeCartItem(idx) {
        state.invoiceContext.items.splice(idx, 1);
        RegisterView.renderCart();
    },

    // -------------------------------------------------------------------------
    // TAX STRIPPING AND AGGREGATION SYSTEM
    // -------------------------------------------------------------------------
    calculateTotals() {
        let runningRawSubtotal = 0;
        state.invoiceContext.items.forEach(it => { runningRawSubtotal += it.computedPrice; });
        
        let calculatedDiscountsTotal = 0;
        if (state.invoiceContext.globalDiscount.type === 'dollar') {
            calculatedDiscountsTotal = state.invoiceContext.globalDiscount.value;
        } else if (state.invoiceContext.globalDiscount.type === 'percent') {
            calculatedDiscountsTotal = runningRawSubtotal * (state.invoiceContext.globalDiscount.value / 100);
        } else if (state.invoiceContext.employeeDiscount) {
            calculatedDiscountsTotal = runningRawSubtotal * 0.50;
        }
        if (calculatedDiscountsTotal > runningRawSubtotal) calculatedDiscountsTotal = runningRawSubtotal;
        
        let netSubtotal = runningRawSubtotal - calculatedDiscountsTotal;
        let calculatedTax = 0;
        
        if (!state.invoiceContext.isTaxExempt) {
            state.invoiceContext.items.forEach(it => {
                if (it.inventoryRef.taxEligible === "yes") {
                    let itemProportion = runningRawSubtotal > 0 ? (it.computedPrice / runningRawSubtotal) : 0;
                    let proportionateDiscount = calculatedDiscountsTotal * itemProportion;
                    let lineTaxableBasis = it.computedPrice - proportionateDiscount;
                    if (lineTaxableBasis < 0) lineTaxableBasis = 0;
                    calculatedTax += lineTaxableBasis * (state.corporateProfile.taxRate / 100);
                }
            });
        }
        
        let grandTotal = netSubtotal + calculatedTax;
        
        document.getElementById("calc-total-units").innerText = state.invoiceContext.items.length;
        document.getElementById("calc-subtotal").innerText = RegisterView.formatCurrency(runningRawSubtotal);
        
        let discRow = document.getElementById("calc-discount-row");
        if (calculatedDiscountsTotal > 0) {
            discRow.classList.remove("hidden");
            document.getElementById("calc-discount-label").innerText = state.invoiceContext.employeeDiscount ? "Associate Disc (50%)" : "Discount";
            document.getElementById("calc-discount-val").innerText = "-" + RegisterView.formatCurrency(calculatedDiscountsTotal);
        } else {
            discRow.classList.add("hidden");
        }
        
        let taxLabel = document.getElementById("calc-tax-label");
        if (state.invoiceContext.isTaxExempt) {
            taxLabel.innerHTML = `<span class="text-iosGreen font-bold flex items-center gap-1"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Exempt (${state.invoiceContext.taxExemptionNumber})</span>`;
        } else {
            taxLabel.innerText = `Sales Tax (${state.corporateProfile.taxRate}%)`;
        }
        
        document.getElementById("calc-tax-val").innerText = RegisterView.formatCurrency(calculatedTax);
        document.getElementById("calc-grand-total").innerText = RegisterView.formatCurrency(grandTotal);
        
        RegisterView.syncModifierBadgesFrame();
    },

    syncModifierBadgesFrame() {
        let container = document.getElementById("invoice-modifier-badges");
        if (!container) return;
        container.innerHTML = "";
        
        if (state.invoiceContext.employeeDiscount) {
            container.innerHTML += `
                <div class="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center justify-between shadow-sm">
                    <span>Employee Discount Locked: ${state.invoiceContext.employeeDiscount.fullName}</span>
                    <button onclick="RegisterView.removeEmployeeDiscount()" class="font-extrabold text-sm">&times;</button>
                </div>`;
        }
        if (state.invoiceContext.isGiftReceipt) {
            container.innerHTML += `
                <div class="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center justify-between shadow-sm">
                    <span>Gift Receipt Mode Flagged Active</span>
                    <button onclick="RegisterView.toggleGiftReceiptFlag()" class="font-extrabold text-sm">&times;</button>
                </div>`;
        }
    },

    // -------------------------------------------------------------------------
    // REGISTER HAMBURGER POP-OVER WORKFLOWS
    // -------------------------------------------------------------------------
    triggerInvoiceDiscount(type) {
        AppRouter.hideId("register-hamburger-menu");
        ModalEngine.open(`
            <div class="space-y-4">
                <h3 class="text-lg font-bold">Apply Transaction Markdown (${type === 'dollar' ? '$' : '%'})</h3>
                <input type="number" step="0.01" id="inv-discount-val" class="w-full p-3 border text-center text-lg font-bold rounded-xl">
                <div class="flex gap-2 justify-end">
                    <button onclick="ModalEngine.close()" class="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold">Cancel</button>
                    <button onclick="RegisterView.commitInvoiceDiscount('${type}')" class="px-4 py-2 bg-iosBlue text-white rounded-xl text-xs font-bold">Apply Markdown</button>
                </div>
            </div>`);
    },

    commitInvoiceDiscount(type) {
        let val = parseFloat(document.getElementById("inv-discount-val").value);
        if (isNaN(val) || val <= 0) return;
        state.invoiceContext.globalDiscount = { type: type, value: val };
        state.invoiceContext.employeeDiscount = null;
        ModalEngine.close();
        RegisterView.renderCart();
    },

    triggerAssociateDiscount() {
        AppRouter.hideId("register-hamburger-menu");
        ModalEngine.open(`
            <div class="space-y-4">
                <h3 class="text-lg font-bold text-purple-700">Apply Associate Discount (50%)</h3>
                <input type="text" id="emp-discount-id" placeholder="Enter 7-Digit Employee Number" class="w-full p-3 border font-mono text-center tracking-widest text-lg">
                <div class="flex gap-2 justify-end">
                    <button onclick="ModalEngine.close()" class="px-4 py-2 bg-gray-100 rounded-xl text-xs">Cancel</button>
                    <button onclick="RegisterView.verifyAssociateDiscountId()" class="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs">Query Employee Profile</button>
                </div>
            </div>`);
    },

    verifyAssociateDiscountId() {
        let id = document.getElementById("emp-discount-id").value.trim();
        let emp = state.dbCache.employees.find(e => e.employeeNum === id);
        if (!emp || emp.status !== 'active') {
            alert("No active associate profile linked to that structural identity code.");
            return;
        }
        ModalEngine.open(`
            <div class="space-y-4 text-center">
                <h3 class="text-lg font-bold">Confirm Associate Identity</h3>
                <p class="text-base font-black text-purple-700">${emp.fullName}</p>
                <p class="text-xs text-gray-400">Title Position: ${emp.positionTitle.toUpperCase()}</p>
                <div class="flex gap-2 justify-center pt-2">
                    <button onclick="ModalEngine.close()" class="px-4 py-2 bg-gray-100 rounded-xl text-xs">Cancel</button>
                    <button onclick="RegisterView.commitAssociateDiscount('${emp.employeeNum}')" class="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs">Confirm Name & Apply 50%</button>
                </div>
            </div>`);
    },

    commitAssociateDiscount(id) {
        let emp = state.dbCache.employees.find(e => e.employeeNum === id);
        state.invoiceContext.employeeDiscount = emp;
        state.invoiceContext.globalDiscount = { type: 'none', value: 0 };
        ModalEngine.close();
        RegisterView.renderCart();
    },

    removeEmployeeDiscount() {
        state.invoiceContext.employeeDiscount = null;
        RegisterView.renderCart();
    },

    triggerTaxExemption() {
        AppRouter.hideId("register-hamburger-menu");
        ModalEngine.open(`
            <div class="space-y-4">
                <h3 class="text-lg font-bold">Force Tax Exemption</h3>
                <input type="text" id="tax-exempt-id" placeholder="Enter Exemption Certification ID" class="w-full p-3 border font-mono rounded-xl">
                <div class="flex gap-2 justify-end">
                    <button onclick="ModalEngine.close()" class="px-4 py-2 bg-gray-100 rounded-xl text-xs">Cancel</button>
                    <button onclick="RegisterView.commitTaxExemption()" class="px-4 py-2 bg-iosBlue text-white rounded-xl text-xs">Remove Sales Taxes</button>
                </div>
            </div>`);
    },

    commitTaxExemption() {
        let id = document.getElementById("tax-exempt-id").value.trim();
        if (!id) return;
        state.invoiceContext.isTaxExempt = true;
        state.invoiceContext.taxExemptionNumber = id;
        ModalEngine.close();
        RegisterView.renderCart();
    },

    toggleGiftReceiptFlag() {
        AppRouter.hideId("register-hamburger-menu");
        state.invoiceContext.isGiftReceipt = !state.invoiceContext.isGiftReceipt;
        RegisterView.renderCart();
    },

    suspendCurrentInvoice() {
        AppRouter.hideId("register-hamburger-menu");
        if (state.invoiceContext.items.length === 0) return;
        let id = "SUSP_" + Date.now();
        let record = { suspendId: id, timestamp: new Date().toISOString(), cartSnapshot: JSON.parse(JSON.stringify(state.invoiceContext.items)), customerSnapshot: state.invoiceContext.customer ? JSON.parse(JSON.stringify(state.invoiceContext.customer)) : null };
        state.dbCache.suspendedTransactions.push(record);
        db.collection("suspended").doc(id).set(record);
        RegisterView.clearRegisterWorkspaceAndReset();
    },

    openSuspendedListModal() {
        AppRouter.hideId("register-hamburger-menu");
        let htmlRows = "";
        state.dbCache.suspendedTransactions.forEach(s => {
            htmlRows += `<div onclick="RegisterView.resumeSuspendedInvoice('${s.suspendId}')" class="p-3 bg-gray-50 border rounded-xl flex justify-between font-bold cursor-pointer text-xs"><span>ID: ${s.suspendId}</span><span class="text-iosBlue">${s.cartSnapshot.length} Items</span></div>`;
        });
        ModalEngine.open(`<div class="space-y-4"><h3>Resume Suspended Invoice</h3><div class="space-y-2">${htmlRows || '<p class="text-xs text-gray-400 text-center">No suspended invoices.</p>'}</div></div>`);
    },

    async resumeSuspendedInvoice(id) {
        let match = state.dbCache.suspendedTransactions.find(s => s.suspendId === id);
        if (!match) return;
        state.invoiceContext.items = JSON.parse(JSON.stringify(match.cartSnapshot));
        state.invoiceContext.customer = match.customerSnapshot ? JSON.parse(JSON.stringify(match.customerSnapshot)) : null;
        await db.collection("suspended").doc(id).delete();
        state.dbCache.suspendedTransactions = state.dbCache.suspendedTransactions.filter(s => s.suspendId !== id);
        ModalEngine.close();
        RegisterView.syncRegisterCustomerPanelState();
        RegisterView.renderCart();
    },

    // -------------------------------------------------------------------------
    // LOYALTY CONSUMER ENGAGEMENT NODES
    // -------------------------------------------------------------------------
    openCustomerAttachmentModal() {
        ModalEngine.open(`
            <div class="space-y-4">
                <h3 class="text-base font-bold">Attach Consumer Loyalty File</h3>
                <input type="text" id="att-cust-query" placeholder="Enter email or phone line..." class="w-full p-2.5 border rounded-xl">
                <div id="att-cust-results" class="space-y-2 max-h-40 overflow-y-auto ios-scroll"></div>
                <button onclick="RegisterView.searchCustomerAttachment()" class="w-full py-2 bg-iosBlue text-white font-bold rounded-xl text-xs">Search Customer</button>
            </div>`);
    },

    searchCustomerAttachment() {
        let q = document.getElementById("att-cust-query").value.trim().toLowerCase();
        if (!q) return;
        let filtered = state.dbCache.customers.filter(c => c.phone.includes(q) || c.email.toLowerCase().includes(q));
        let res = document.getElementById("att-cust-results");
        res.innerHTML = "";
        if (filtered.length === 0) { res.innerHTML = `<p class="text-xs text-iosRed text-center font-bold">No results found.</p>`; return; }
        
        filtered.forEach(c => {
            let d = document.createElement("div");
            d.className = "p-2 border-b flex justify-between cursor-pointer font-bold text-xs";
            d.onclick = () => { state.invoiceContext.customer = c; ModalEngine.close(); RegisterView.syncRegisterCustomerPanelState(); };
            d.innerHTML = `<span>${c.fullName}</span><span class="text-gray-400 font-mono">${c.phone}</span>`;
            res.appendChild(d);
        });
    },

    syncRegisterCustomerPanelState() {
        let unlinked = document.getElementById("cust-state-unlinked");
        let linked = document.getElementById("cust-state-linked");
        if (state.invoiceContext.customer) {
            unlinked.classList.add("hidden"); linked.classList.remove("hidden");
            document.getElementById("linked-cust-name").innerText = state.invoiceContext.customer.fullName;
            document.getElementById("linked-cust-id").innerText = state.invoiceContext.customer.customerId;
            document.getElementById("linked-cust-status").innerText = state.invoiceContext.customer.status.toUpperCase();
        } else { unlinked.classList.remove("hidden"); linked.classList.add("hidden"); }
    },

    detachCustomerFromActiveRegisterInvoice() { state.invoiceContext.customer = null; RegisterView.syncRegisterCustomerPanelState(); },
    viewLinkedCustomerProfileDetails() { if(state.invoiceContext.customer) { AppRouter.navigateTo('view-customer-mgmt'); document.getElementById("cust-search-input").value = state.invoiceContext.customer.phone; CustomerView.executeCustomerSearchRegistry(); } },

    // -------------------------------------------------------------------------
    // PAYMENTS MODALS AND CHECKOUT DESK
    // -------------------------------------------------------------------------
    openTenderInterfaceStage() {
        if (state.invoiceContext.items.length === 0) return;
        let totals = RegisterView.getFinancialSnapshot();
        let processedSum = 0;
        state.invoiceContext.tenders.forEach(t => processedSum += t.amountApplied);
        let outstandingDue = totals.grandTotal - processedSum;
        if (outstandingDue < 0) outstandingDue = 0;

        ModalEngine.open(`
            <div class="space-y-4">
                <h3 class="text-lg font-bold border-b pb-2">Finalize Checkout Tender</h3>
                <div class="grid grid-cols-2 gap-2 text-xs font-semibold bg-gray-50 p-3 rounded-xl border">
                    <div>Gross Invoice Total Due:</div><div class="text-right text-black">${RegisterView.formatCurrency(totals.grandTotal)}</div>
                    <div class="text-iosBlue font-black">Outstanding Balance Due:</div><div class="text-right font-black text-iosBlue font-mono">${RegisterView.formatCurrency(outstandingDue)}</div>
                </div>
                <input type="number" step="0.01" id="tender-amt-input" value="${outstandingDue.toFixed(2)}" class="w-full p-3 border text-center font-bold font-mono text-xl text-gray-800 bg-gray-50 rounded-xl">
                <div class="grid grid-cols-3 gap-3">
                    <button onclick="RegisterView.processPaymentVector('cash')" class="bg-white border p-4 rounded-2xl flex flex-col items-center"><i data-lucide="banknote" class="text-iosGreen w-6 h-6"></i><span class="text-xs font-bold mt-1">Cash Tender</span></button>
                    <button onclick="RegisterView.processPaymentVector('card')" class="bg-white border p-4 rounded-2xl flex flex-col items-center"><i data-lucide="credit-card" class="text-iosBlue w-6 h-6"></i><span class="text-xs font-bold mt-1">Credit/Debit</span></button>
                    <button onclick="RegisterView.processPaymentVector('giftcard')" class="bg-white border p-4 rounded-2xl flex flex-col items-center"><i data-lucide="gift" class="text-purple-500 w-6 h-6"></i><span class="text-xs font-bold mt-1">Gift Card</span></button>
                </div>
            </div>`);
    },

    processPaymentVector(type) {
        let inputAmt = parseFloat(document.getElementById("tender-amt-input").value);
        if (isNaN(inputAmt) || inputAmt <= 0) return;
        let totals = RegisterView.getFinancialSnapshot();

        if (type === 'cash') {
            state.invoiceContext.tenders.push({ type: 'cash', amountApplied: inputAmt });
            let change = inputAmt - totals.grandTotal;
            if (change < 0) change = 0;

            ModalEngine.open(`
                <div class="space-y-4 text-center">
                    <div class="w-14 h-14 bg-iosGreen/10 text-iosGreen rounded-full flex items-center justify-center mx-auto"><i data-lucide="check-circle" class="w-8 h-8"></i></div>
                    <div class="bg-gray-50 border p-4 rounded-2xl">
                        <span class="text-xs text-gray-400 font-bold block uppercase">Physical Currency Change Due</span>
                        <span class="text-3xl font-black text-iosGreen block mt-1">${RegisterView.formatCurrency(change)}</span>
                    </div>
                    <div class="bg-amber-50 border text-amber-800 font-bold text-xs p-3 rounded-xl">CRITICAL COMPLIANCE REMINDER: FIRMLY SECURE AND CLOSE THE CASH DRAWER.</div>
                    <button onclick="RegisterView.commitInvoiceToCloudStore()" class="w-full py-3 bg-iosBlue text-white font-bold rounded-xl shadow-md">Print Receipt & Finalize</button>
                </div>`);
        } else if (type === 'card') {
            ModalEngine.open(`
                <div class="space-y-4 text-center py-6">
                    <div class="w-12 h-12 border-4 border-iosBlue border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <h3 class="font-bold">Contacting Core Terminal Network Pinpad Gateway...</h3>
                </div>`);
            setTimeout(() => {
                let authCode = "AUTH_" + Math.floor(100000 + Math.random() * 900000);
                state.invoiceContext.tenders.push({ type: 'credit/debit', amountApplied: inputAmt, authCode: authCode });
                RegisterView.commitInvoiceToCloudStore();
            }, 1000);
        }
    },

    async commitInvoiceToCloudStore() {
        let invoiceId = "INV_" + Date.now();
        let totals = RegisterView.getFinancialSnapshot();
        let record = { invoiceId, timestamp: new Date().toISOString(), associateId: state.activeEmployee ? state.activeEmployee.employeeNum : "1000001", storeNum: state.corporateProfile.storeNum, itemsSnapshot: JSON.parse(JSON.stringify(state.invoiceContext.items)), financials: totals, tendersApplied: JSON.parse(JSON.stringify(state.invoiceContext.tenders)), customerSnapshot: state.invoiceContext.customer ? JSON.parse(JSON.stringify(state.invoiceContext.customer)) : null, status: "closed_posted" };

        for (let item of record.itemsSnapshot) {
            let p = state.dbCache.inventory.find(inv => inv.sku === item.inventoryRef.sku);
            if (p) { p.stockOnHand -= 1; await db.collection("inventory").doc(p.sku).set(p); }
        }

        if (state.invoiceContext.customer) {
            let c = state.dbCache.customers.find(cust => cust.customerId === state.invoiceContext.customer.customerId);
            if (c) {
                c.lifetimePreTaxSpend += totals.taxableBasis; c.pointsAccumulated += Math.floor(totals.taxableBasis);
                while (c.pointsAccumulated >= 250) { c.pointsAccumulated -= 250; c.rewardsAvailable += 1; }
                await db.collection("customers").doc(c.customerId).set(c);
            }
        }

        await db.collection("transactions").doc(invoiceId).set(record);
        if(state.activeTillSession.isOpen) { state.activeTillSession.expectedCashBalance += totals.grandTotal; await db.collection("system_state").doc("active_till_session").set(state.activeTillSession); }
        await syncCacheFromFirestoreEngine();
        
        let preloadedEmail = state.invoiceContext.customer ? state.invoiceContext.customer.email : "";
        ModalEngine.open(`
            <div class="text-center p-4 space-y-4">
                <div class="w-12 h-12 bg-iosGreen/10 text-iosGreen rounded-full flex items-center justify-center mx-auto"><i data-lucide="printer" class="w-6 h-6"></i></div>
                <h3>Receipt Options: ${invoiceId}</h3>
                <input type="email" id="receipt-email" value="${preloadedEmail}" placeholder="Enter customer email" class="w-full p-2 border rounded-xl text-center text-xs">
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <button onclick="alert('Physical receipt printed successfully.');" class="bg-gray-100 p-2 rounded-xl font-bold">Print Receipt</button>
                    <button onclick="alert('Digital receipt emailed successfully.');" class="bg-iosBlue text-white p-2 rounded-xl font-bold">Email Receipt</button>
                </div>
                <button onclick="RegisterView.clearRegisterWorkspaceAndReset()" class="w-full bg-gray-900 text-white py-2.5 font-bold rounded-xl text-xs">Complete Transaction Context</button>
            </div>`);
    },

    clearRegisterWorkspaceAndReset() {
        state.invoiceContext = { items: [], customer: null, globalDiscount: { type: 'none', value: 0 }, employeeDiscount: null, isTaxExempt: false, taxExemptionNumber: "", isGiftReceipt: false, tenders: [] };
        ModalEngine.close(); RegisterView.detachCustomerFromActiveRegisterInvoice(); RegisterView.renderCart(); AppRouter.navigateTo('view-home');
    },

    getFinancialSnapshot() {
        let subtotal = 0; state.invoiceContext.items.forEach(it => subtotal += it.computedPrice);
        let discount = 0;
        if (state.invoiceContext.globalDiscount.type === 'dollar') discount = state.invoiceContext.globalDiscount.value;
        else if (state.invoiceContext.globalDiscount.type === 'percent') discount = subtotal * (state.invoiceContext.globalDiscount.value / 100);
        else if (state.invoiceContext.employeeDiscount) discount = subtotal * 0.50;
        let base = subtotal - discount; if(base < 0) base = 0;
        let tax = state.invoiceContext.isTaxExempt ? 0 : base * (state.corporateProfile.taxRate / 100);
        return { rawSubtotal: subtotal, discountTotal: discount, taxableBasis: base, taxTotal: tax, grandTotal: base + tax };
    },

    // -------------------------------------------------------------------------
    // PRICE INQUIRY DESK POPUP MODAL
    // -------------------------------------------------------------------------
    openPriceInquiryModal() {
        ModalEngine.open(`
            <div class="space-y-4">
                <h3 class="text-base font-bold">Price Inquiry Desk</h3>
                <div class="flex gap-2">
                    <input type="text" id="inq-sku-box" placeholder="Scan or enter item SKU code..." class="flex-1 p-2 border font-mono rounded-xl text-xs">
                    <button onclick="RegisterView.executeInquiryLookup()" class="bg-iosBlue text-white px-4 rounded-xl text-xs font-bold">Query</button>
                </div>
                <div id="inq-result-dock"></div>
                <button onclick="ModalEngine.close()" class="w-full py-2 bg-gray-100 rounded-xl text-xs text-gray-500">Dismiss</button>
            </div>`);
    },

    executeInquiryLookup() {
        let sku = document.getElementById("inq-sku-box").value.trim();
        let prod = state.dbCache.inventory.find(p => p.sku === sku);
        let dock = document.getElementById("inq-result-dock");
        if (!prod) { dock.innerHTML = `<p class="text-xs text-iosRed p-2 text-center bg-iosRed/5 rounded-xl border border-dashed">SKU reference missing from storage indexes rows.</p>`; return; }
        
        let vHtml = ""; if(prod.variants && prod.variants.length > 0) { prod.variants.forEach(v => { vHtml += `<div class="flex justify-between text-[11px] border-b pb-0.5"><span>${v.color} / Size: ${v.size}</span><b>${v.stock} units</b></div>`; }); }
        dock.innerHTML = `<div class="bg-gray-50 border p-3 rounded-xl text-xs space-y-2"><div>Description: <b>${prod.nameDescription}</b></div><div class="grid grid-cols-2 gap-1"><div>Price: <b class="text-iosBlue">${RegisterView.formatCurrency(prod.price)}</b></div><div>Stock Hand: <b>${prod.stockOnHand} units</b></div></div><div class="space-y-1 border-t pt-1.5">${vHtml || '<p class="text-[10px] text-gray-400">No alternate variations nodes logged.</p>'}</div></div>`;
    },

    // -------------------------------------------------------------------------
    // DYNAMIC RETROSPECTIVE COMPLIANCE RETURNS ARCHITECTURE
    // -------------------------------------------------------------------------
    openReturnPortalModal() {
        AppRouter.hideId("register-hamburger-menu");
        ModalEngine.open(`
            <div class="space-y-4">
                <h3 class="text-base font-bold text-iosRed">Return Logistics Intake Dashboard</h3>
                <div class="p-3 bg-gray-50 border rounded-xl space-y-2">
                    <label class="block text-[10px] uppercase text-gray-400 font-bold">Vouched Return Query Target</label>
                    <div class="flex gap-2">
                        <input type="text" id="ret-search-invoice" placeholder="Scan or enter Invoice tracking ID number..." class="flex-1 p-2 bg-white border font-mono rounded-lg text-xs">
                        <button onclick="RegisterView.executeReturnInvoiceLookup()" class="bg-iosBlue text-white px-4 rounded-lg text-xs font-bold">Search</button>
                    </div>
                </div>
                <button onclick="RegisterView.triggerUnvouchedReturnOverride()" class="w-full py-2 bg-iosRed/10 hover:bg-iosRed/20 text-iosRed rounded-xl text-xs font-bold">Process Unvouched Anti-Fraud Return Route</button>
            </div>`);
    },

    executeReturnInvoiceLookup() {
        let invId = document.getElementById("ret-search-invoice").value.trim();
        let matched = state.dbCache.transactions.find(t => t.invoiceId === invId);
        if (!matched) { alert("Invoice transaction reference missing from cloud storage tables."); return; }

        let diff = Date.now() - new Date(matched.timestamp).getTime();
        if (diff > (30 * 24 * 60 * 60 * 1000)) {
            ModalEngine.open(`
                <div class="space-y-4 text-center py-4">
                    <div class="w-12 h-12 bg-iosRed/10 text-iosRed rounded-full flex items-center justify-center mx-auto"><i data-lucide="clock-alert" class="w-6 h-6"></i></div>
                    <p class="text-xs text-gray-600 bg-gray-50 p-4 rounded-xl border border-dashed font-bold">"this receipt is past the return policy and cannot be returned"</p>
                    <button onclick="ModalEngine.close()" class="w-full py-2 bg-gray-900 text-white rounded-xl text-xs font-bold">Acknowledge Policy Limits</button>
                </div>`);
            return;
        }

        let linesHtml = "";
        matched.itemsSnapshot.forEach((it, idx) => {
            linesHtml += `<div class="p-2 border-b flex justify-between items-center text-xs"><div><span class="font-bold text-gray-900 block">${it.inventoryRef.nameDescription}</span><span class="text-[10px] text-gray-400 font-mono">Original Net Basis: ${RegisterView.formatCurrency(it.computedPrice)}</span></div><button onclick="RegisterView.triggerLineReturnReasonLog('${matched.invoiceId}', ${idx})" class="bg-iosBlue text-white px-3 py-1 rounded-lg text-[10px]">Return Unit</button></div>`;
        });
        ModalEngine.open(`<div class="space-y-4"><h3>Select Vouched Items Lines Matrix</h3><div class="divide-y max-h-48 overflow-y-auto ios-scroll border rounded-xl p-2 bg-gray-50">${linesHtml}</div></div>`);
    },

    triggerLineReturnReasonLog(invId, idx) {
        ModalEngine.open(`
            <div class="space-y-4">
                <h3>Log Compliance Return Reason Code</h3>
                <select id="ret-reason-select" class="w-full p-2 border rounded-xl text-xs font-bold bg-gray-50"><option value="Defective / Quality Failure">Defective / Quality Failure</option><option value="Buyer Remorse / Size Incompatibility">Buyer Remorse / Size Incompatibility</option></select>
                <button onclick="RegisterView.commitVouchedLineReturn('${invId}', ${idx})" class="w-full py-2.5 bg-iosRed text-white font-bold text-xs rounded-xl shadow-md">Confirm Return Allocation</button>
            </div>`);
    },

    async commitVouchedLineReturn(invId, idx) {
        let r = document.getElementById("ret-reason-select").value;
        let inv = state.dbCache.transactions.find(t => t.invoiceId === invId);
        let item = inv.itemsSnapshot[idx];
        let originalTender = inv.tendersApplied[0] ? inv.tendersApplied[0].type : "cash";

        let p = state.dbCache.inventory.find(i => i.sku === item.inventoryRef.sku);
        if(p) { p.stockOnHand += 1; await db.collection("inventory").doc(p.sku).set(p); }
        if(state.activeTillSession.isOpen && originalTender === 'cash') { state.activeTillSession.expectedCashBalance -= item.computedPrice; await db.collection("system_state").doc("active_till_session").set(state.activeTillSession); }

        await writeAuditTrailLogEntry(state.activeEmployee ? state.activeEmployee.employeeNum : "1000001", `Processed vouched return for SKU [${item.inventoryRef.sku}]. Reason: ${r}`);
        ModalEngine.open(`
            <div class="space-y-4 text-center">
                <div class="w-12 h-12 bg-iosGreen/10 text-iosGreen rounded-full flex items-center justify-center mx-auto"><i data-lucide="badge-dollar-sign" class="w-6 h-6"></i></div>
                <h3>Refund Sequence Discharged</h3>
                <div class="bg-gray-50 border p-4 rounded-2xl text-xs font-semibold text-left">Original Tender Channel Found: <b class="text-iosRed uppercase block text-lg mt-1">${originalTender} Payout: ${RegisterView.formatCurrency(item.computedPrice)}</b></div>
                <button onclick="RegisterView.clearRegisterWorkspaceAndReset()" class="w-full py-2 bg-gray-900 text-white rounded-xl text-xs font-bold">Complete Return Portal Session</button>
            </div>`);
    },

    triggerUnvouchedReturnOverride() {
        ModalEngine.open(`
            <div class="space-y-4">
                <h3 class="text-base font-bold text-iosRed">Unvouched Government Identification Check</h3>
                <p class="text-xs text-gray-500 leading-normal">Lacking verified tracking invoices triggers strict anti-fraud tracking criteria limits rules checks. Capture legal id references:</p>
                <div class="space-y-2 text-xs font-semibold">
                    <div><label class="text-gray-400 block mb-0.5">Full Legal Passenger/Driver Name</label><input type="text" id="ret-id-name" class="w-full p-2 border bg-gray-50 rounded-xl"></div>
                    <div><label class="text-gray-400 block mb-0.5">Government ID Document Serial Number</label><input type="text" id="ret-id-num" class="w-full p-2 border bg-gray-50 font-mono rounded-xl"></div>
                </div>
                <button onclick="RegisterView.verifyUnvouchedIdCheckpoint()" class="w-full py-2.5 bg-iosBlue text-white font-bold text-xs rounded-xl shadow-md">Verify Identity Checkpoint & Open Intake</button>
            </div>`);
    },

    verifyUnvouchedIdCheckpoint() {
        let n = document.getElementById("ret-id-name").value.trim();
        let num = document.getElementById("ret-id-num").value.trim();
        if (!n || !num) { alert("Compliance blocker: Missing required legal identification strings inputs components keys."); return; }
        
        ModalEngine.open(`
            <div class="space-y-4">
                <h3>Unvouched SKU Matrix Entry</h3>
                <input type="text" id="ret-unv-sku" class="w-full p-3 font-mono text-center border bg-gray-50 rounded-xl" placeholder="Scan or enter intake item SKU">
                <button onclick="RegisterView.commitUnvouchedReturnIntake('${n}', '${num}')" class="w-full py-2.5 bg-gray-900 text-white font-bold text-xs rounded-xl">Load Merchandise Store Voucher Card</button>
            </div>`);
    },

    async commitUnvouchedReturnIntake(name, idStr) {
        let sku = document.getElementById("ret-unv-sku").value.trim();
        let prod = state.dbCache.inventory.find(p => p.sku === sku);
        if (!prod) { alert("SKU index selection unidentified inside master arrays configurations."); return; }

        let merchCardId = "MERCH_" + Math.floor(100000 + Math.random() * 900000);
        let cardObj = { cardNum: merchCardId, initialLoad: prod.price, currentBalance: prod.price, history: [{ type: "unvouched_intake", clientDocId: idStr, clientName: name, date: new Date().toISOString() }] };
        
        await db.collection("giftcards").doc(merchCardId).set(cardObj);
        prod.stockOnHand += 1; await db.collection("inventory").doc(prod.sku).set(prod);
        await writeAuditTrailLogEntry(state.activeEmployee ? state.activeEmployee.employeeNum : "1000001", `Processed Unvouched Return to store card asset: ${merchCardId}`);
        
        ModalEngine.open(`
            <div class="space-y-4 text-center">
                <div class="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mx-auto"><i data-lucide="gift" class="w-6 h-6"></i></div>
                <h3 class="text-base font-black">Merchandise Store Credit Loaded</h3>
                <div class="bg-gray-50 border p-4 text-xs font-mono text-left space-y-1">
                    <p>Issued Card Voucher Asset: <b class="text-purple-700 font-bold">${merchCardId}</b></p>
                    <p>Capital Transferred Value: <b class="text-iosGreen font-bold">${RegisterView.formatCurrency(prod.price)}</b></p>
                </div>
                <button onclick="RegisterView.clearRegisterWorkspaceAndReset()" class="w-full py-2.5 bg-gray-900 text-white font-bold text-xs rounded-xl">Complete Return Portal Session</button>
            </div>`);
    },

    initializeCameraScannerMock() {
        if(!verifyRegisterTillSessionIsActive()) return;
        if(state.dbCache.inventory.length === 0) return;
        let randProduct = state.dbCache.inventory[Math.floor(Math.random() * state.dbCache.inventory.length)];
        let variant = (randProduct.variants && randProduct.variants.length > 0) ? randProduct.variants[0] : null;
        RegisterView.injectProductToCart(randProduct, variant);
        alert(`Camera scan frame capture simulated successfully: ${randProduct.nameDescription}`);
    },

    formatCurrency(val) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val); }
};
