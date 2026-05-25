export class EmployeesModule {
    constructor(db, router) {
        this.db = db;
        this.router = router;
    }

    approveShift(id) {
        const tcs = this.db.get("timecards");
        const idx = tcs.findIndex(t => t.id === id);
        if (idx !== -1) { tcs[idx].approved = true; this.db.set("timecards", tcs); }
        window.state.render();
    }

    render() {
        const employees = this.db.get("employees");
        const timecards = this.db.get("timecards");
        window.employeesModuleRef = this;

        return `
            <div class="h-full flex flex-col p-4 space-y-4 overflow-hidden select-none font-mono">
                <div class="bg-[#141619] border border-[#2a2e35] p-3 rounded">
                    <h3 class="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">Staff Node Arrays</h3>
                    <div class="grid grid-cols-2 gap-2">
                        ${employees.map(e => `
                            <div class="p-2.5 bg-[#1c1f24] border border-[#2a2e35] rounded flex justify-between items-center text-xs">
                                <h4 class="font-bold text-slate-200 uppercase">${e.name}</h4>
                                <span class="text-[10px] font-bold text-blue-400 bg-[#0c0d0e] border border-[#2a2e35] px-2 py-0.5 rounded uppercase">${e.role}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="flex-1 flex flex-col overflow-hidden bg-[#141619] border border-[#2a2e35] rounded">
                    <div class="p-3 border-b border-[#2a2e35]"><h4 class="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Shift Verification Channels</h4></div>
                    <div class="flex-1 overflow-auto">
                        <table class="w-full border-collapse text-left text-xs text-slate-400">
                            <tbody class="divide-y divide-[#2a2e35]/60">
                                ${timecards.map(t => `
                                    <tr class="hover:bg-[#1c1f24] transition">
                                        <td class="px-4 py-2.5 font-sans font-bold uppercase text-slate-200">${t.employeeName}</td>
                                        <td class="px-4 py-2.5">IN: ${new Date(t.clockIn).toLocaleTimeString()}</td>
                                        <td class="px-4 py-2.5">${t.clockOut ? 'OUT: ' + new Date(t.clockOut).toLocaleTimeString() : '<span class="text-blue-400 font-bold">ONGOING LOOP</span>'}</td>
                                        <td class="px-4 py-2.5 text-right">
                                            ${!t.approved && t.clockOut ? `<button onclick="window.employeesModuleRef.approveShift('${t.id}')" class="px-2 py-1 bg-[#1c1f24] border border-[#2a2e35] hover:bg-[#2a2e35] text-blue-400 rounded text-[10px] uppercase font-bold transition">Verify</button>` : '<i class="fas fa-check-double text-slate-600 px-3 text-xs"></i>'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
}
