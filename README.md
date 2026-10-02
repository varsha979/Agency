\# Multi-Tenant Agency Project Management SaaS



A production-minded, multi-tenant SaaS application built for agencies, software consultancies, and digital service firms to manage teams, clients, projects, tasks, milestones, feedback, and meeting records with strict tenant isolation and role-based access control.



\## 🚀 Live Demo \& Links



\* \*\*Live Application URL:\*\* `https://your-deployment-url.com` \*(Update with your live URL if deployed)\*



\* \*\*GitHub Repository:\*\* `https://github.com/your-username/your-repo-name`



\## 📋 Table of Contents



1\. \[Core Architecture \& Tech Stack](#core-architecture--tech-stack)



2\. \[Multi-Tenancy \& Security Architecture](#multi-tenancy--security-architecture)



3\. \[User Roles \& Permissions](#user-roles--permissions)



4\. \[AI Feature Implementation](#ai-feature-implementation)



5\. \[Demo Credentials \& Test Accounts](#demo-credentials--test-accounts)



6\. \[Local Environment Setup](#local-environment-setup)



7\. \[Database Setup \& Seeding](#database-setup--seeding)



8\. \[Key Design Decisions \& Progress Derivation](#key-design-decisions--progress-derivation)



9\. \[Submission Note (Limitations \& Roadmap)](#submission-note-limitations--roadmap)



\## 🏗 Core Architecture \& Tech Stack



The application follows clean architectural principles separating API routing, authentication middleware, business logic controllers, and database access layers.



\* \*\*Frontend:\*\* Next.js (React, Tailwind CSS, Lucide Icons, Shadcn UI primitives)



\* \*\*Backend:\*\* Node.js (Next.js API routes / Server Actions)



\* \*\*Database:\*\* MySQL



\* \*\*ORM / Query Builder:\*\* Prisma (or Drizzle/MySQL2)



\* \*\*Authentication:\*\* NextAuth.js / Custom JWT with `bcrypt` password hashing



\* \*\*AI Integration:\*\* OpenAI API (`gpt-4o-mini` / `gpt-3.5-turbo`)



\### Entity Hierarchy



```

Platform Super Admin (AppZex)

&#x20; └── Agency (Tenant) \[Active / Suspended]

&#x20;       ├── Agency Admins \& Team Members

&#x20;       ├── Agency Clients (Portal Users)

&#x20;       │     └── Projects

&#x20;       │           ├── Milestones

&#x20;       │           ├── Tasks (Assignee, Priority, Status)

&#x20;       │           ├── Meetings (Notes \& Action Items)

&#x20;       │           ├── Feedback \& Change Requests

&#x20;       │           ├── Uploaded Files \& Permissions

&#x20;       │           └── Activity Timeline Logs



```



\## 🔒 Multi-Tenancy \& Security Architecture



Tenant data isolation is enforced strictly at the \*\*backend/database layer\*\*, not just hidden via UI route guards.



\### Isolation Rules Enforced:



1\. \*\*Tenant-Scoped Queries:\*\* All operational tables (`projects`, `tasks`, `clients`, `feedback`, `meetings`, `files`, `activity\_logs`) contain an `agency\_id` foreign key. Every database query checks `where: { agency\_id: session.user.agency\_id }`.



2\. \*\*Cross-Tenant Protection:\*\* Attempting to query an entity from another agency via URL ID manipulation or direct API request returns `403 Forbidden` or `404 Not Found`.



3\. \*\*Client Isolation:\*\* Agency clients can only access projects, milestones, tasks, feedback, and shared meeting notes/files belonging specifically to their own `client\_id`.



4\. \*\*Suspended Agency Enforcement:\*\* During authentication and in the API middleware, the parent agency's status is validated. If `agency.status === 'suspended'`, login is blocked and active API requests return `403 Account Suspended`.



5\. \*\*Super Admin Support Mode:\*\* Super Admins can enter an agency workspace in privileged "Support Mode". A prominent persistent banner (`"You are viewing Agency X as Super Admin"`) is displayed with an exit action, and actions are logged to the platform audit trail.



\## 👥 User Roles \& Permissions



| \*\*Role\*\* | \*\*Scope\*\* | \*\*Permissions\*\* | 

| \*\*Super Admin\*\* | Platform-wide | Manages agencies, views platform health \& metrics, toggles agency status, enters Support Mode. | 

| \*\*Agency Admin\*\* | Own Agency | Manages team members, clients, projects, tasks, meetings, client feedback, and agency settings. | 

| \*\*Agency Team\*\* | Own Agency | Views agency dashboard, works on assigned projects and tasks, logs meeting notes and task updates. | 

| \*\*Agency Client\*\* | Client Portal Only | Views active projects, progress, upcoming milestones, submits feedback/change requests, and views shared files. | 



\## 🤖 AI Feature Implementation



\### Feature: AI Project Health \& Risk Assessment



\* \*\*Problem Solved:\*\* Agency managers spend hours manually reviewing tasks, deadlines, and stalled feedback to evaluate whether a project is on track.



\* \*\*Input Data:\*\* Scoped project timeline data, milestone status, count of overdue/pending tasks, and recent client feedback items.



\* \*\*AI Processing:\*\* Uses the OpenAI API (`gpt-4o-mini`) via a secure server-side route. The prompt strictly receives sanitized, tenant-isolated data.



\* \*\*Output:\*\*



&#x20; 1. Overall health score (On Track, At Risk, Critical).



&#x20; 2. Executive summary.



&#x20; 3. Identified bottlenecks (e.g., overdue dependencies, unreviewed change requests).



&#x20; 4. Suggested immediate action items.



\* \*\*Graceful Degradation:\*\* If the OpenAI API key is missing or an API quota is reached, the UI cleanly falls back to rule-based progress analytics without crashing.



\## 🔑 Demo Credentials \& Test Accounts



Use these pre-seeded accounts to verify role permissions and multi-tenant data isolation:



\### 1. Platform Super Admin (AppZex)



\* \*\*Email:\*\* `superadmin@appzex.com`



\* \*\*Password:\*\* `Admin@12345`



\* \*\*Role:\*\* Super Admin (Platform Owner)



\### 2. Agency A: "Apex Digital Agency" (Active Agency)



\* \*\*Agency Admin:\*\*



&#x20; \* \*\*Email:\*\* `admin@apexdigital.com`



&#x20; \* \*\*Password:\*\* `ApexAdmin@123`



\* \*\*Agency Team Member:\*\*



&#x20; \* \*\*Email:\*\* `team@apexdigital.com`



&#x20; \* \*\*Password:\*\* `ApexTeam@123`



\* \*\*Agency Client Portal User:\*\*



&#x20; \* \*\*Email:\*\* `client@acmecorp.com`



&#x20; \* \*\*Password:\*\* `Client@123`



\### 3. Agency B: "Horizon Creative Studio" (Isolation Test)



\* \*\*Agency Admin:\*\*



&#x20; \* \*\*Email:\*\* `admin@horizoncreative.com`



&#x20; \* \*\*Password:\*\* `HorizonAdmin@123`



\* \*\*Agency Team Member:\*\*



&#x20; \* \*\*Email:\*\* `team@horizoncreative.com`



&#x20; \* \*\*Password:\*\* `HorizonTeam@123`



\### 4. Suspended Agency: "Vanguard Media" (Suspension Test)



\* \*\*Agency Admin:\*\*



&#x20; \* \*\*Email:\*\* `admin@vanguardmedia.com`



&#x20; \* \*\*Password:\*\* `VanguardAdmin@123`



&#x20; \* \*(Expected result on login: Account suspended notification)\*



\## ⚙️ Local Environment Setup



\### Prerequisites



\* Node.js (v18.x or v20.x)



\* MySQL Server (v8.x) or MySQL Docker container



\* npm, yarn, or pnpm



\### 1. Clone the repository



```

git clone https://github.com/your-username/your-repo-name.git

cd your-repo-name



```



\### 2. Install dependencies



```

npm install



```



\### 3. Configure Environment Variables



Copy the sample `.env.example` file to `.env`:



```

cp .env.example .env



```



Fill in the environment variables:



```

\# Database connection

DATABASE\_URL="mysql://root:password@localhost:3306/appzex\_saas"



\# NextAuth / JWT Secret

NEXTAUTH\_URL="http://localhost:3000"

NEXTAUTH\_SECRET="super-secret-random-key-32-chars-long"



\# AI Configuration (Optional / Supported)

OPENAI\_API\_KEY="sk-your-openai-api-key"



```



\## 🗄 Database Setup \& Seeding



\### 1. Run Migrations



```

npx prisma migrate dev --name init



```



\*(or run your schema migration scripts if using raw SQL/Drizzle)\*



\### 2. Seed Realistic Test Data



Run the database seed script to populate Super Admin, multiple agencies, clients, projects, tasks, and feedback:



```

npx prisma db seed

\# or

npm run seed



```



\### 3. Start the Development Server



```

npm run dev



```



Open <http://localhost:5000> in your browser.



\## 🧠 Key Design Decisions \& Progress Derivation



\### 1. Derived Project Progress



Progress percentages are not hardcoded or manually typed. The backend computes project progress dynamically:



$$

\\text{Project Progress (\\%)} = \\left( \\frac{\\text{Completed Tasks}}{\\text{Total Tasks}} \\right) \\times 100

$$





\*(If a project has 0 tasks, progress defaults to 0% until work items are added).\*



\### 2. Strict File Access Layer



Files are uploaded with relational metadata (`agency\_id`, `project\_id`, `is\_shared\_with\_client`). Direct public file links are disallowed; download routes verify tenant ownership and client visibility before streaming files.



\### 3. Support Mode Implementation



Super Admin entering an agency workspace uses session impersonation tokens scoped as read-only/audit-safe with a top dismissable banner, preventing accidental overwrite of agency data.



\## 📝 Submission Note (Limitations \& Roadmap)



\### Known Limitations \& Shortcuts:



\* \*\*File Storage:\*\* Configured for local disk storage (`/public/uploads`) or mock S3 uploads instead of multi-region AWS S3 buckets to simplify local evaluation.



\* \*\*Subscription Billing:\*\* The platform supports active/suspended/plan statuses, but full Stripe/LemonSqueezy webhooks were omitted in favor of core tenant isolation and project workflows.



\### What Would Be Built Next With More Time:



1\. Real-time notifications and timeline updates via WebSockets / Pusher.



2\. Custom agency domain / sub-domain routing (`agencyname.saas.com`).



3\. Drag-and-drop Kanban boards for task and feedback workflows.



4\. Exportable PDF progress reports generated by AI for client meetings.

