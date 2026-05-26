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
