// =========================================================================
// SHARED INTERFACE MODAL RENDER ENGINE
// =========================================================================
const ModalEngine = {
    open(htmlContentTemplate) {
        const modalBox = document.getElementById("global-modal-box");
        const modalLayer = document.getElementById("global-modal-layer");
        
        if (modalBox && modalLayer) {
            modalBox.innerHTML = htmlContentTemplate;
            modalLayer.classList.remove("hidden");
            
            // Render Lucide icons configurations cleanly inside newly spawned markup lines
            try {
                lucide.createIcons();
            } catch(e) {
                console.warn("Lucide parsing skip layer engaged: ", e);
            }
        }
    },
    
    close() {
        const modalLayer = document.getElementById("global-modal-layer");
        if (modalLayer) {
            modalLayer.classList.add("hidden");
        }
    }
};
// --- Global Utility Helpers ---
async function writeAuditTrailLogEntry(actorId, messageString) {
    const logObj = {
        logId: "LOG_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        actor: actorId,
        message: messageString
    };
    try {
        await db.collection("audit_logs").doc(logObj.logId).set(logObj);
        state.dbCache.logs.push(logObj);
        // Refresh settings terminal if active
        const terminal = document.getElementById("terminal-audit-stream");
        if(terminal) {
            const div = document.createElement("div");
            div.className = "border-b border-gray-800 pb-1 text-gray-300";
            div.innerHTML = `[${new Date().toLocaleTimeString()}] <span class="text-blue-400 font-bold">OP:${logObj.actor}</span> -- <span class="text-green-400 font-mono">${logObj.message}</span>`;
            terminal.appendChild(div);
        }
    } catch(e) {}
}

function generateCryptographicNumericalIdString(len) {
    let str = "";
    for(let i=0; i<len; i++) { str += Math.floor(Math.random() * 10).toString(); }
    return str;
}
