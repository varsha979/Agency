import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const API_URL = "http://localhost:5000/api";

function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
    } else {
        console.error(`❌ FAIL: ${message}`);
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

async function runBugFixVerification() {
    console.log("==========================================================");
    console.log("VERIFYING BUG 1 & BUG 2 CRITICAL SECURITY AND AUTH FIXES");
    console.log("==========================================================");

    try {
        // ==========================================
        // BUG 1 VERIFICATION: AGENCY TEAM ACCESS
        // ==========================================
        console.log("\n[Bug 1] Testing Agency Team Member Dashboard & Data Scoping...");
        
        // 1. Login as Agency Team Member
        const teamLoginRes = await api("/auth/login", {
            method: "POST",
            body: {
                email: "sarah.dev@nexus.com",
                password: "Password123!",
            },
        });
        assert(teamLoginRes.status === 200, "Agency Team member login succeeds (200 OK)");
        assert(teamLoginRes.data.user.role === "agency_team", "User role is confirmed as agency_team");
        const teamToken = teamLoginRes.data.token;

        // 2. Fetch Agency Dashboard via /api/agencies/dashboard
        const dashRes = await api("/agencies/dashboard", {
            headers: { Authorization: `Bearer ${teamToken}` },
        });
        assert(dashRes.status === 200, "Agency Team member can access /api/agencies/dashboard (200 OK - No 403 Access Denied)");
        assert(dashRes.data.success === true, "Dashboard payload returns success: true");
        assert(Boolean(dashRes.data.stats), "Dashboard payload returns complete agency stats");
        console.log(`   Agency stats fetched: ${dashRes.data.stats.activeProjects} active projects, ${dashRes.data.stats.tasks} tasks.`);

        // 3. Fetch Agency Dashboard via alias /api/dashboard
        const dashAliasRes = await api("/dashboard", {
            headers: { Authorization: `Bearer ${teamToken}` },
        });
        assert(dashAliasRes.status === 200, "Agency Team member can access /api/dashboard alias (200 OK)");

        // 4. Fetch Projects via /api/projects
        const projRes = await api("/projects", {
            headers: { Authorization: `Bearer ${teamToken}` },
        });
        assert(projRes.status === 200, "Agency Team member can view agency projects via /api/projects (200 OK)");

        // 5. Fetch My Tasks via /api/tasks/my-tasks
        const myTasksRes = await api("/tasks/my-tasks", {
            headers: { Authorization: `Bearer ${teamToken}` },
        });
        assert(myTasksRes.status === 200, "Agency Team member can view personal assigned tasks via /api/tasks/my-tasks (200 OK)");


        // ==========================================
        // BUG 2 VERIFICATION: SUSPENDED AGENCY ENFORCEMENT
        // ==========================================
        console.log("\n[Bug 2] Testing Suspended Agency Enforcement & Super Admin Support Mode...");

        // 1. Strict Login Blocking:
        const suspLoginRes = await api("/auth/login", {
            method: "POST",
            body: {
                email: "admin@vortex.com",
                password: "Password123!",
            },
        });
        assert(suspLoginRes.status === 403, "Suspended agency user login blocked with HTTP 403 Forbidden");
        assert(
            suspLoginRes.data.message === "Your agency account has been suspended. Please contact support.",
            `Exact user-friendly message returned: "${suspLoginRes.data.message}"`
        );

        // 2. Middleware API Route Enforcement with Pre-Existing Token:
        // Even if a user previously had a valid token, authMiddleware must verify agency status in DB
        // Victor Freeze (admin@vortex.com) has ID 10 and agencyId 3 (Vortex)
        const vortexUserId = 10;
        const forgedOldToken = jwt.sign(
            { userId: vortexUserId, role: "agency_admin", agencyId: 3 }, // Vortex agencyId is 3
            process.env.JWT_SECRET || "change_this_to_a_long_random_secret",
            { expiresIn: "1d" }
        );
        const apiCallWithSuspendedToken = await api("/projects", {
            headers: { Authorization: `Bearer ${forgedOldToken}` },
        });
        assert(apiCallWithSuspendedToken.status === 403, "API request from suspended agency user rejected by authMiddleware with HTTP 403 Forbidden");
        assert(
            apiCallWithSuspendedToken.data.message === "Your agency account has been suspended. Please contact support.",
            `Middleware returned exact suspension message: "${apiCallWithSuspendedToken.data.message}"`
        );

        // 3. Super Admin Override / Support Mode:
        // Super Admin must still be able to inspect a suspended agency without being blocked
        const saLogin = await api("/auth/login", {
            method: "POST",
            body: {
                email: "superadmin@agencysync.com",
                password: "Password123!",
            },
        });
        assert(saLogin.status === 200, "Super Admin login succeeds (200 OK)");
        const saToken = saLogin.data.token;

        // Impersonate suspended agency (Vortex = ID 3)
        const saInspectSuspendedRes = await api("/projects", {
            headers: {
                Authorization: `Bearer ${saToken}`,
                "x-impersonate-agency-id": "3",
            },
        });
        assert(
            saInspectSuspendedRes.status === 200,
            "Super Admin successfully inspects Suspended Agency in Support Mode (200 OK - Not blocked!)"
        );

        console.log("\n==========================================================");
        console.log("🎉 ALL BUG 1 & BUG 2 CRITICAL CHECKS PASSED FLAWLESSLY!");
        console.log("==========================================================");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Bug fix verification failed:", err.message);
        process.exit(1);
    }
}

runBugFixVerification();
