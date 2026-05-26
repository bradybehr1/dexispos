// =========================================================================
// INTERFACE VIEW LAYER: LOGIN PANEL WORKFLOWS
// =========================================================================
const LoginView = {
    // Start continuous clock daemon loops to keep top header synced
    startClockEngine() {
        setInterval(() => {
            let now = new Date();
            let shortDate = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });
            let timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
            
            let dateLabel = document.getElementById("login-date");
            let timeLabel = document.getElementById("login-time");
            let headerLabel = document.getElementById("header-datetime");
            
            if (dateLabel) dateLabel.innerText = shortDate.toUpperCase();
            if (timeLabel) timeLabel.innerText = timeString;
            if (headerLabel) headerLabel.innerText = shortDate + " " + timeString;
        }, 1000);
    },

    // Process user interaction submission events
        async handleLoginSubmit() {
        console.log("Stage 1: Login triggered.");
        
        let numField = document.getElementById("login-emp-num");
        let passField = document.getElementById("login-emp-pass");
        
        if (!numField || !passField) {
            alert("Error: Input fields not found.");
            return;
        }

        let inputNum = numField.value.trim();
        let inputPass = passField.value;
        console.log("Stage 2: Inputs captured: " + inputNum);

        // Check if employees cache is loaded
        if (!state || !state.dbCache || !state.dbCache.employees) {
            alert("Error: Database cache not loaded yet.");
            return;
        }

        console.log("Stage 3: Attempting to find user in cache...");
        let matchedUser = state.dbCache.employees.find(e => e.employeeNum === inputNum);
        
        if (!matchedUser) {
            alert("Error: Employee ID not found.");
            return;
        }

        console.log("Stage 4: User found. Checking password...");
        if (matchedUser.password !== inputPass) {
            alert("Error: Incorrect password.");
            return;
        }

        console.log("Stage 5: Success! Routing to dashboard.");
        state.activeEmployee = matchedUser;
        AppRouter.navigateTo('view-home');
    }
        
        // Establish active session token boundaries configurations
        state.activeEmployee = matchedUser;
        document.getElementById("header-user").innerText = `${matchedUser.fullName} (${matchedUser.positionTitle.toUpperCase()})`;
        
        // Log clean authorization footprint into audit logs database collection
        await writeAuditTrailLogEntry(matchedUser.employeeNum, `Successfully opened secure device terminal session lease under tracking role [${matchedUser.positionTitle}].`);
        
        // Flush screen forms input parameters elements fields
        numField.value = "";
        passField.value = "";
        
        // Route view smooth slide animations triggers
        AppRouter.navigateTo('view-home');
    },

    // Process device logout requests orders sequences
    async handleLogoutRequest() {
        if (state.activeEmployee) {
            await writeAuditTrailLogEntry(state.activeEmployee.employeeNum, "Terminated systemic device lease interaction view workspace.");
        }
        state.activeEmployee = null;
        AppRouter.navigateTo('view-login');
    }
};
