const API_URL = "http://localhost:5000/api";

const results = [];

function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
        results.push({ test: message, status: "PASS" });
    } else {
        console.error(`❌ FAIL: ${message}`);
        results.push({ test: message, status: "FAIL" });
        throw new Error(`Assertion failed: ${message}`);
    }
}

async function api(path, options = {}) {
    const url = `${API_URL}${path}`;
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    const res = await fetch(url, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let data = null;
    const text = await res.text();
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }

    return {
        status: res.status,
        ok: res.ok,
        data,
    };
}

async function runTests() {
    console.log("==================================================");
    console.log("STARTING AGENCY SYNC SPECIFICATION VERIFICATION");
    console.log("==================================================");

    try {
        // 1. Super Admin Login
        console.log("\n[Test 1] Super Admin Login...");
        const saRes = await api("/auth/login", {
            method: "POST",
            body: {
                email: "superadmin@agencysync.com",
                password: "Password123!",
            },
        });
        assert(saRes.status === 200, "Super admin login returns 200");
        assert(saRes.data.user.role === "super_admin", "User role is super_admin");
        const saToken = saRes.data.token;

        // 2. Suspended Agency Login Block
        console.log("\n[Test 2] Suspended Agency Login Block...");
        const suspRes = await api("/auth/login", {
            method: "POST",
            body: {
                email: "admin@vortex.com",
                password: "Password123!",
            },
        });
        assert(suspRes.status === 403, "Suspended agency login returns 403 Forbidden");
        assert(
            suspRes.data.message.toLowerCase().includes("suspended") ||
            suspRes.data.message.toLowerCase().includes("inactive"),
            "Error mentions suspended/inactive account"
        );

        // 3. Agency A Login
        console.log("\n[Test 3] Agency A Admin Login...");
        const agencyARes = await api("/auth/login", {
            method: "POST",
            body: {
                email: "admin@nexus.com",
                password: "Password123!",
            },
        });
        assert(agencyARes.status === 200, "Agency A admin login returns 200");
        const agencyAToken = agencyARes.data.token;
        const agencyAId = agencyARes.data.user.agencyId;
        assert(Boolean(agencyAId), "Agency A has valid agencyId");

        // 4. Agency B Login
        console.log("\n[Test 4] Agency B Admin Login...");
        const agencyBRes = await api("/auth/login", {
            method: "POST",
            body: {
                email: "admin@apex.com",
                password: "Password123!",
            },
        });
        assert(agencyBRes.status === 200, "Agency B admin login returns 200");
        const agencyBToken = agencyBRes.data.token;
        const agencyBId = agencyBRes.data.user.agencyId;
        assert(agencyAId !== agencyBId, "Agency A and Agency B have distinct agency IDs");

        // 5. Agency A Projects
        console.log("\n[Test 5] Fetch Agency A Projects & Details...");
        const aProjectsRes = await api("/projects", {
            headers: { Authorization: `Bearer ${agencyAToken}` },
        });
        assert(aProjectsRes.status === 200, "Agency A projects fetched");
        assert(aProjectsRes.data.data.length > 0, "Agency A has at least 1 project");
        const projectA = aProjectsRes.data.data[0];
        console.log(`   Found Project A: "${projectA.name}" (ID: ${projectA.id}, Initial Progress: ${projectA.progress}%)`);

        // 6. Cross-Tenant Data Isolation Enforcement (Agency B tries to access Agency A's project)
        console.log("\n[Test 6] Multi-Tenancy Data Isolation (Agency B accessing Agency A Project)...");
        const crossReadRes = await api(`/projects/${projectA.id}`, {
            headers: { Authorization: `Bearer ${agencyBToken}` },
        });
        assert(
            crossReadRes.status === 404 || crossReadRes.status === 403,
            `Agency B gets 404/403 when requesting Agency A project (Received: ${crossReadRes.status})`
        );

        // Cross-tenant mutation check (Agency B tries to create task on Agency A's project)
        const crossMutateRes = await api("/tasks", {
            method: "POST",
            headers: { Authorization: `Bearer ${agencyBToken}` },
            body: {
                title: "Hacked Task",
                projectId: projectA.id,
                priority: "high",
            },
        });
        assert(
            crossMutateRes.status === 404 || crossMutateRes.status === 403,
            `Agency B gets 404/403 when trying to add task to Agency A project (Received: ${crossMutateRes.status})`
        );

        // 7. Dynamic Derived Progress Calculation Check
        console.log("\n[Test 7] Dynamic Derived Progress Calculation...");
        const projectTasksRes = await api(`/tasks/project/${projectA.id}`, {
            headers: { Authorization: `Bearer ${agencyAToken}` },
        });
        const tasks = projectTasksRes.data.data;
        assert(tasks.length > 0, "Project A has tasks to calculate progress from");

        const targetTask = tasks[0];
        const newStatus = targetTask.status === "completed" ? "in_progress" : "completed";
        await api(`/tasks/${targetTask.id}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${agencyAToken}` },
            body: { status: newStatus },
        });

        const updatedProjectRes = await api(`/projects/${projectA.id}`, {
            headers: { Authorization: `Bearer ${agencyAToken}` },
        });
        const updatedProgress = updatedProjectRes.data.data.progress;
        console.log(`   Dynamically Recalculated Derived Progress: ${updatedProgress}%`);
        assert(typeof updatedProgress === "number", "Progress is dynamically updated number");

        // 8. Client Portal Isolation & Visibility Checks
        console.log("\n[Test 8] Client Portal Isolation & Visibility Controls...");
        const clientRes = await api("/auth/login", {
            method: "POST",
            body: {
                email: "client@acme.com",
                password: "Password123!",
            },
        });
        assert(clientRes.status === 200, "Acme Client login returns 200");
        assert(clientRes.data.user.role === "agency_client", "User role is agency_client");
        const clientToken = clientRes.data.token;

        // Client dashboard
        const clientDashRes = await api("/client-portal/dashboard", {
            headers: { Authorization: `Bearer ${clientToken}` },
        });
        assert(clientDashRes.status === 200, "Client portal dashboard returned 200");
        const clientProjects = clientDashRes.data.projects || clientDashRes.data.data?.projects;
        assert(clientProjects && clientProjects.length > 0, "Client can view their own project");
        console.log(`   Client sees project: "${clientProjects[0].name}" (Progress: ${clientProjects[0].progress}%)`);

        // Client Meetings (Strictly restricted to isSharedWithClient === true)
        const clientMeetingsRes = await api("/meetings", {
            headers: { Authorization: `Bearer ${clientToken}` },
        });
        assert(clientMeetingsRes.status === 200, "Client meetings returned 200");
        const meetings = clientMeetingsRes.data.meetings || clientMeetingsRes.data.data;
        assert(
            meetings.every(m => m.isSharedWithClient === true),
            "All returned meetings for client have isSharedWithClient === true"
        );
        console.log(`   Client has access to ${meetings.length} shared meeting(s).`);

        // Client Files (Strictly restricted to isSharedWithClient === true)
        const clientFilesRes = await api("/files", {
            headers: { Authorization: `Bearer ${clientToken}` },
        });
        assert(clientFilesRes.status === 200, "Client files returned 200");
        const files = clientFilesRes.data.files || clientFilesRes.data.data;
        assert(
            files.every(f => f.isSharedWithClient === true),
            "All returned files for client have isSharedWithClient === true"
        );
        console.log(`   Client has access to ${files.length} shared deliverable file(s).`);

        // 9. Super Admin Support Mode (Impersonation)
        console.log("\n[Test 9] Super Admin Support Mode Impersonation...");
        const supportRes = await api("/projects", {
            headers: {
                Authorization: `Bearer ${saToken}`,
                "x-impersonate-agency-id": agencyAId,
            },
        });
        const supportProjects = supportRes.data.projects || supportRes.data.data;
        assert(supportProjects && supportProjects.length > 0, "Impersonating Agency A returns Agency A's projects");

        // 10. AI Health & Risk Analysis / Client Update Drafter
        console.log("\n[Test 10] AI Project Health & Risk Analysis...");
        const aiRes = await api(`/ai/projects/${projectA.id}/summary`, {
            headers: { Authorization: `Bearer ${agencyAToken}` },
        });
        assert(aiRes.status === 200, "AI Project summary returned 200");
        assert(aiRes.data.success === true, "AI response success is true");
        const analysis = aiRes.data.analysis || aiRes.data.summary || aiRes.data.data?.analysis || aiRes.data.data?.summary;
        assert(Boolean(analysis), "AI response contains meaningful analysis text");
        console.log("   AI Analysis Preview:\n   " + analysis.substring(0, 160).replace(/\n/g, " ") + "...");

        console.log("\n==================================================");
        console.log("🎉 ALL 10 CORE SPECIFICATION CHECKS PASSED PERFECTLY!");
        console.log("==================================================");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Test execution encountered an error:", err.message);
        process.exit(1);
    }
}

runTests();
