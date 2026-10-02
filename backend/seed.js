import bcrypt from "bcryptjs";
import { connectDB, sequelize } from "./config/db.js";
import {
    Agency,
    User,
    AgencyMember,
    Client,
    Project,
    Milestone,
    Task,
    Meeting,
    Feedback,
    FeedbackComment,
    File,
    ActivityLog,
} from "./models/index.js";

const seedDatabase = async () => {
    try {
        console.log("Connecting to database...");
        await connectDB();

        console.log("Synchronizing schema (force recreation for pristine seed)...");
        await sequelize.sync({ force: true });
        console.log("Tables created fresh.");

        console.log("Cleaning old seed data...");
        // Clean in correct cascade order
        await ActivityLog.destroy({ where: {} });
        await FeedbackComment.destroy({ where: {} });
        await Feedback.destroy({ where: {} });
        await File.destroy({ where: {} });
        await Meeting.destroy({ where: {} });
        await Task.destroy({ where: {} });
        await Milestone.destroy({ where: {} });
        await Project.destroy({ where: {} });
        await Client.destroy({ where: {} });
        await AgencyMember.destroy({ where: {} });
        await User.destroy({ where: {} });
        await Agency.destroy({ where: {} });

        console.log("Creating default hashed password...");
        const defaultPassword = await bcrypt.hash("Password123!", 10);

        // 1. Super Admin
        console.log("Creating Super Admin...");
        const superAdmin = await User.create({
            name: "Platform Super Admin",
            email: "superadmin@agencysync.com",
            password: defaultPassword,
            role: "super_admin",
            agencyId: null,
            status: "active",
        });

        // 2. Agency A: Nexus Creative Digital
        console.log("Creating Agency A (Nexus Creative Digital)...");
        const agencyA = await Agency.create({
            name: "Nexus Creative Digital",
            email: "contact@nexus.com",
            phone: "+1 (555) 234-5678",
            logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&auto=format&fit=crop&q=80",
            status: "active",
        });

        const adminA = await User.create({
            name: "Alex Nexus",
            email: "admin@nexus.com",
            password: defaultPassword,
            role: "agency_admin",
            agencyId: agencyA.id,
            status: "active",
        });

        const teamA1 = await User.create({
            name: "Sarah Miller (Fullstack)",
            email: "sarah.dev@nexus.com",
            password: defaultPassword,
            role: "agency_team",
            agencyId: agencyA.id,
            status: "active",
        });

        const teamA2 = await User.create({
            name: "David Chen (UI/UX)",
            email: "david.design@nexus.com",
            password: defaultPassword,
            role: "agency_team",
            agencyId: agencyA.id,
            status: "active",
        });

        await AgencyMember.bulkCreate([
            { agencyId: agencyA.id, userId: adminA.id, role: "agency_admin" },
            { agencyId: agencyA.id, userId: teamA1.id, role: "agency_team" },
            { agencyId: agencyA.id, userId: teamA2.id, role: "agency_team" },
        ]);

        // Clients under Agency A
        console.log("Creating Clients for Agency A...");
        const clientA1 = await Client.create({
            agencyId: agencyA.id,
            name: "John Acme",
            email: "client@acme.com",
            phone: "+1 (555) 101-2020",
            companyName: "Acme Global Industries",
            status: "active",
        });

        const clientA1User = await User.create({
            name: "John Acme",
            email: "client@acme.com",
            password: defaultPassword,
            role: "agency_client",
            agencyId: agencyA.id,
            clientId: clientA1.id,
            status: "active",
        });

        const clientA2 = await Client.create({
            agencyId: agencyA.id,
            name: "Emma Star",
            email: "client@starlight.com",
            phone: "+1 (555) 303-4040",
            companyName: "Starlight Retail Group",
            status: "active",
        });

        const clientA2User = await User.create({
            name: "Emma Star",
            email: "client@starlight.com",
            password: defaultPassword,
            role: "agency_client",
            agencyId: agencyA.id,
            clientId: clientA2.id,
            status: "active",
        });

        // Project A1: Acme E-Commerce Portal Overhaul
        console.log("Creating Project A1 and workflow...");
        const projectA1 = await Project.create({
            agencyId: agencyA.id,
            clientId: clientA1.id,
            managerId: adminA.id,
            name: "Acme E-Commerce Portal Overhaul",
            description: "End-to-end redesign and technical re-platforming of the B2B wholesale store with real-time stock sync.",
            status: "in_progress",
            priority: "high",
            startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        });

        const milestoneA1_1 = await Milestone.create({
            agencyId: agencyA.id,
            projectId: projectA1.id,
            title: "Phase 1: Architecture & UI/UX Wireframes",
            description: "Deliver high-fidelity interactive mockups and system schema.",
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            status: "completed",
            order: 1,
        });

        const milestoneA1_2 = await Milestone.create({
            agencyId: agencyA.id,
            projectId: projectA1.id,
            title: "Phase 2: Core Frontend & Product Catalog",
            description: "Implement responsive catalog grid with facet search and filter capabilities.",
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            status: "in_progress",
            order: 2,
        });

        const milestoneA1_3 = await Milestone.create({
            agencyId: agencyA.id,
            projectId: projectA1.id,
            title: "Phase 3: Stripe Checkout & Webhook Handlers",
            description: "Seamless checkout flow with webhook idempotency and tax calculations.",
            dueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
            status: "pending",
            order: 3,
        });

        // Tasks for Project A1 (Derived progress: 2 completed of 5 = 40%)
        const taskA1_1 = await Task.create({
            agencyId: agencyA.id,
            projectId: projectA1.id,
            milestoneId: milestoneA1_1.id,
            assignedTo: teamA2.id,
            title: "User Persona Research & Journey Mapping",
            description: "Synthesized 12 user interviews and documented primary purchase funnels.",
            priority: "high",
            status: "completed",
            dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        });

        const taskA1_2 = await Task.create({
            agencyId: agencyA.id,
            projectId: projectA1.id,
            milestoneId: milestoneA1_1.id,
            assignedTo: teamA2.id,
            title: "Figma High-Fidelity Interactive Mockups",
            description: "Created design tokens and full Figma design system.",
            priority: "medium",
            status: "completed",
            dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        });

        const taskA1_3 = await Task.create({
            agencyId: agencyA.id,
            projectId: projectA1.id,
            milestoneId: milestoneA1_2.id,
            assignedTo: teamA1.id,
            title: "Implement Responsive Product Catalog Grid",
            description: "Virtual scrolling catalog grid with instant filtering.",
            priority: "high",
            status: "in_progress",
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        });

        const taskA1_4 = await Task.create({
            agencyId: agencyA.id,
            projectId: projectA1.id,
            milestoneId: milestoneA1_2.id,
            assignedTo: teamA1.id,
            title: "Develop Cart Context & State Persistence",
            description: "Session and localStorage sync with optimistic quantity updates.",
            priority: "medium",
            status: "todo",
            dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        });

        const taskA1_5 = await Task.create({
            agencyId: agencyA.id,
            projectId: projectA1.id,
            milestoneId: milestoneA1_3.id,
            assignedTo: teamA1.id,
            title: "Payment Gateway Webhook Handlers & Tax Jar API",
            description: "Handle asynchronous checkout fulfillment and security signatures.",
            priority: "urgent",
            status: "todo",
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        // Meetings for Project A1: 1 Client-Shared, 1 Agency-Internal
        await Meeting.create({
            agencyId: agencyA.id,
            projectId: projectA1.id,
            clientId: clientA1.id,
            title: "Bi-Weekly Sprint Review & Roadmap Alignment",
            meetingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            notes: "We will demonstrate Phase 1 interactive mockups and review catalog API endpoints.",
            meetingLink: "https://meet.google.com/nex-usac-me1",
            isSharedWithClient: true,
        });

        await Meeting.create({
            agencyId: agencyA.id,
            projectId: projectA1.id,
            clientId: clientA1.id,
            title: "Internal Agency Architecture & Code Review",
            meetingDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            notes: "Internal tech sync: Database query profiling and caching strategy.",
            meetingLink: "https://meet.google.com/internal-nex-dev",
            isSharedWithClient: false, // Internal: strictly hidden from client!
        });

        // Feedback for Project A1
        const feedbackA1 = await Feedback.create({
            agencyId: agencyA.id,
            projectId: projectA1.id,
            clientId: clientA1.id,
            createdBy: clientA1User.id,
            title: "Request for high-contrast dark mode during mobile checkout",
            description: "Our logistics team uses tablets in low-light warehouse docks and needs high contrast.",
            type: "change_request",
            priority: "medium",
            status: "in_review",
        });

        await FeedbackComment.create({
            agencyId: agencyA.id,
            feedbackId: feedbackA1.id,
            userId: clientA1User.id,
            comment: "We tested the preview in our lighting conditions and high contrast dark mode would prevent eye strain.",
        });

        await FeedbackComment.create({
            agencyId: agencyA.id,
            feedbackId: feedbackA1.id,
            userId: adminA.id,
            comment: "Excellent feedback, John! David is adding a high-contrast toggle into Sprint 3 deliverables.",
        });

        const feedbackA2 = await Feedback.create({
            agencyId: agencyA.id,
            projectId: projectA1.id,
            clientId: clientA1.id,
            createdBy: clientA1User.id,
            title: "Cart quantity selector allows negative count on fast double-click",
            description: "When tapping minus rapidly, the count briefly dips to -1.",
            type: "bug",
            priority: "high",
            status: "in_progress",
        });

        await FeedbackComment.create({
            agencyId: agencyA.id,
            feedbackId: feedbackA2.id,
            userId: teamA1.id,
            comment: "Reproduced and isolated. Adding a clamp(0, max) debounce guard on the quantity input.",
        });

        // Files for Project A1: 1 Shared with Client, 1 Private
        await File.create({
            agencyId: agencyA.id,
            projectId: projectA1.id,
            clientId: clientA1.id,
            uploadedBy: adminA.id,
            originalName: "Acme_Brand_Guidelines_2026.pdf",
            fileName: "acme-brand-guidelines.pdf",
            filePath: "uploads/sample-brand-guide.pdf",
            mimeType: "application/pdf",
            size: 2450000,
            isSharedWithClient: true, // Visible in Client Portal
        });

        await File.create({
            agencyId: agencyA.id,
            projectId: projectA1.id,
            clientId: clientA1.id,
            uploadedBy: teamA1.id,
            originalName: "Internal_Database_Schema_Spec.docx",
            fileName: "internal-schema-spec.docx",
            filePath: "uploads/internal-schema.docx",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            size: 1120000,
            isSharedWithClient: false, // Hidden from Client Portal
        });

        // Project A2: Starlight Retail Group
        const projectA2 = await Project.create({
            agencyId: agencyA.id,
            clientId: clientA2.id,
            managerId: teamA2.id,
            name: "Starlight Mobile App & Brand Refresh",
            description: "Unified iOS & Android commerce experience with customer loyalty integration.",
            status: "planning",
            priority: "medium",
            startDate: new Date(),
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        });

        await Milestone.create({
            agencyId: agencyA.id,
            projectId: projectA2.id,
            title: "Discovery & Market Research",
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            status: "in_progress",
            order: 1,
        });

        await Task.create({
            agencyId: agencyA.id,
            projectId: projectA2.id,
            assignedTo: teamA2.id,
            title: "Competitor Benchmarking Matrix",
            description: "Analyze top 5 competing retail apps.",
            priority: "medium",
            status: "in_progress",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        // Activity Logs for Agency A
        await ActivityLog.bulkCreate([
            {
                agencyId: agencyA.id,
                userId: adminA.id,
                projectId: projectA1.id,
                action: "project_created",
                description: `Project "${projectA1.name}" was initialized`,
                entityType: "project",
                entityId: projectA1.id,
                isClientVisible: true,
            },
            {
                agencyId: agencyA.id,
                userId: teamA2.id,
                projectId: projectA1.id,
                action: "task_completed",
                description: `Task "${taskA1_1.title}" was marked completed`,
                entityType: "task",
                entityId: taskA1_1.id,
                isClientVisible: true,
            },
            {
                agencyId: agencyA.id,
                userId: clientA1User.id,
                projectId: projectA1.id,
                action: "feedback_created",
                description: `Feedback "${feedbackA1.title}" submitted by Acme Corp`,
                entityType: "feedback",
                entityId: feedbackA1.id,
                isClientVisible: true,
            },
        ]);

        // 3. Agency B: Apex Growth Labs
        console.log("Creating Agency B (Apex Growth Marketing)...");
        const agencyB = await Agency.create({
            name: "Apex Growth Marketing",
            email: "hello@apexgrowth.com",
            phone: "+1 (555) 789-0123",
            logo: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=100&auto=format&fit=crop&q=80",
            status: "active",
        });

        const adminB = await User.create({
            name: "Marcus Vance",
            email: "admin@apex.com",
            password: defaultPassword,
            role: "agency_admin",
            agencyId: agencyB.id,
            status: "active",
        });

        const teamB1 = await User.create({
            name: "Elena Rostova (Growth Lead)",
            email: "elena.seo@apex.com",
            password: defaultPassword,
            role: "agency_team",
            agencyId: agencyB.id,
            status: "active",
        });

        await AgencyMember.bulkCreate([
            { agencyId: agencyB.id, userId: adminB.id, role: "agency_admin" },
            { agencyId: agencyB.id, userId: teamB1.id, role: "agency_team" },
        ]);

        // Client under Agency B
        const clientB1 = await Client.create({
            agencyId: agencyB.id,
            name: "Robert Quantum",
            email: "client@quantum.com",
            phone: "+1 (555) 888-9999",
            companyName: "Quantum Innovations Ltd",
            status: "active",
        });

        const clientB1User = await User.create({
            name: "Robert Quantum",
            email: "client@quantum.com",
            password: defaultPassword,
            role: "agency_client",
            agencyId: agencyB.id,
            clientId: clientB1.id,
            status: "active",
        });

        const projectB1 = await Project.create({
            agencyId: agencyB.id,
            clientId: clientB1.id,
            managerId: adminB.id,
            name: "Quantum Q3 SaaS Customer Acquisition Engine",
            description: "High-intent search engine optimization and performance marketing campaign.",
            status: "in_progress",
            priority: "high",
            startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        const milestoneB1 = await Milestone.create({
            agencyId: agencyB.id,
            projectId: projectB1.id,
            title: "Paid Search Funnel Setup & Tracking",
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            status: "in_progress",
            order: 1,
        });

        await Task.create({
            agencyId: agencyB.id,
            projectId: projectB1.id,
            milestoneId: milestoneB1.id,
            assignedTo: teamB1.id,
            title: "Audit Google Ads Conversions & GA4 Events",
            description: "Verify server-side tagging.",
            priority: "high",
            status: "completed",
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        });

        await Task.create({
            agencyId: agencyB.id,
            projectId: projectB1.id,
            milestoneId: milestoneB1.id,
            assignedTo: teamB1.id,
            title: "Build 3 High-Converting B2B Landing Pages",
            description: "A/B test value proposition headlines.",
            priority: "urgent",
            status: "in_progress",
            dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        });

        await Meeting.create({
            agencyId: agencyB.id,
            projectId: projectB1.id,
            clientId: clientB1.id,
            title: "Q3 Campaign Kickoff & Strategy",
            meetingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            notes: "Review target CAC and budget allocations.",
            meetingLink: "https://meet.google.com/apex-quantum-q3",
            isSharedWithClient: true,
        });

        await ActivityLog.create({
            agencyId: agencyB.id,
            userId: adminB.id,
            projectId: projectB1.id,
            action: "campaign_launched",
            description: `Apex started campaign for Quantum Innovations`,
            entityType: "project",
            entityId: projectB1.id,
            isClientVisible: true,
        });

        // 4. Agency C: Vortex Interactive (Suspended Agency for Testing Login Rejection)
        console.log("Creating Agency C (Vortex Interactive - Suspended)...");
        const agencyC = await Agency.create({
            name: "Vortex Interactive (Suspended)",
            email: "contact@vortexlabs.io",
            phone: "+1 (555) 999-0000",
            status: "suspended", // STRICTLY SUSPENDED
        });

        await User.create({
            name: "Victor Freeze",
            email: "admin@vortex.com",
            password: defaultPassword,
            role: "agency_admin",
            agencyId: agencyC.id,
            status: "active",
        });

        console.log("\n=======================================================");
        console.log("✅ Seed Data Generated Successfully!");
        console.log("=======================================================");
        console.log("Super Admin Login:");
        console.log("  Email:    superadmin@agencysync.com");
        console.log("  Password: Password123!");
        console.log("-------------------------------------------------------");
        console.log("Agency A (Nexus Digital) - Active:");
        console.log("  Admin:    admin@nexus.com / Password123!");
        console.log("  Team 1:   sarah.dev@nexus.com / Password123!");
        console.log("  Team 2:   david.design@nexus.com / Password123!");
        console.log("  Client 1: client@acme.com / Password123!");
        console.log("  Client 2: client@starlight.com / Password123!");
        console.log("-------------------------------------------------------");
        console.log("Agency B (Apex Growth) - Active:");
        console.log("  Admin:    admin@apex.com / Password123!");
        console.log("  Team:     elena.seo@apex.com / Password123!");
        console.log("  Client:   client@quantum.com / Password123!");
        console.log("-------------------------------------------------------");
        console.log("Agency C (Vortex Interactive) - Suspended:");
        console.log("  Admin:    admin@vortex.com / Password123! (Will be blocked from login!)");
        console.log("=======================================================\n");

        process.exit(0);
    } catch (error) {
        console.error("Seed Database Failed:", error);
        process.exit(1);
    }
};

seedDatabase();
