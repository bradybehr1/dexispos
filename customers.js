export class CustomersModule {
    constructor(db, router) {
        this.db = db;
        this.router = router;
        this.modalOpen = false;
    }

    render() {
        const customers = this.db.get("customers");
        window.customersModuleRef = this;

        return `
            <div class="h-full flex flex-col p-4 space-y-3 overflow-hidden select-none">
                <div class="flex justify-between items-center bg-[#141619] p-3 border border-[#2a2e35] rounded">
                    <div><h3 class="text-xs font-mono font-bold uppercase text-slate-300 tracking-wider">CRM Accounts Profile Matrix</h3></div>
                    <button onclick="window.customersModuleRef.openModal()" class="px-3 py-1.5 bg-blue-600 text-white border border-blue-500 rounded text-xs font-mono font-bold uppercase tracking-wider">Add Profile</button>
                </div>
                <div class="flex-1 overflow-auto border border-[#2a2e35] bg-[#141619]/20 rounded">
                    <table class="w-full border-collapse text-left text-xs text-slate-300 font-mono">
                        <thead class="bg-[#141619] border-b border-[#2a2e35] text-slate-400 font-bold uppercase tracking-wider sticky top-0">
                            <tr><th class="px-4 py-2.5">Consumer ID</th><th class="px-4 py-2.5">Phone Mapping</th><th class="px-4 py-2.5 text-right">Aggregate Spend</th><th class="px-4 py-2.5 text-center">Reward Bal</th></tr>
                        </thead>
                        <tbody class="divide-y divide-[#2a2e35]/60">
                            ${customers.map(c => `
                                <tr class="hover:bg-[#1c1f24] transition">
                                    <td class="px-4 py-2.5 font-bold uppercase text-slate-200">${c.name}</td>
                                    <td class="px-4 py-2.5 text-slate-400">${c.phone}</td>
                                    <td class="px-4 py-2.5 text-right text-slate-300">${this.router.globalSettings.currencySymbol}${c.spend.toFixed(2)}</td>
                                    <td class="px-4 py-2.5 text-center text-blue-400">${c.points} PTS</td>
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

    submitForm() {
        const name = document.getElementById("c-name-in").value;
        const phone = document.getElementById("c-phone-in").value;
        const custs = this.db.get("customers");
        custs.push({ id: "c-" + Date.now(), name, phone, email: "crm@pos.local", spend: 0, points: 0 });
        this.db.set("customers", custs);
        this.closeModal();
    }

    templateModal() {
        return `
            <div class="fixed inset-0 bg-[#0c0d0e]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div class="bg-[#141619] border border-[#2a2e35] p-5 rounded w-full max-w-sm text-xs font-mono">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Provision CRM Profile Token</h3>
                    <form onsubmit="event.preventDefault(); window.customersModuleRef.submitForm();" class="space-y-3">
                        <div class="space-y-1"><label class="text-slate-500 font-bold uppercase block text-[10px]">Client Identity Name:</label><input type="text" id="c-name-in" required class="w-full bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 outline-none text-slate-200 focus:border-blue-500 uppercase"></div>
                        <div class="space-y-1"><label class="text-slate-500 font-bold uppercase block text-[10px]">Mobile Phone String:</label><input type="tel" id="c-phone-in" required class="w-full bg-[#0c0d0e] border border-[#2a2e35] rounded p-2 outline-none text-slate-200 focus:border-blue-500"></div>
                        <div class="flex justify-end gap-2 pt-3 border-t border-[#2a2e35] mt-4">
                            <button type="button" onclick="window.customersModuleRef.closeModal()" class="px-3 py-1.5 bg-[#1c1f24] border border-[#2a2e35] rounded font-bold text-slate-300 uppercase">Cancel</button>
                            <button type="submit" class="px-3 py-1.5 bg-blue-600 border border-blue-500 text-white rounded font-bold uppercase">Lock Token</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
}
