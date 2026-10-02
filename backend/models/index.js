import Agency from "./Agency.js";
import User from "./User.js";
import AgencyMember from "./AgencyMember.js";
import Client from "./Client.js";
import Project from "./Project.js";
import Milestone from "./Milestone.js";
import Task from "./Task.js";
import Meeting from "./Meeting.js";
import Feedback from "./Feedback.js";
import FeedbackComment from "./FeedbackComment.js";
import File from "./File.js";
import ActivityLog from "./ActivityLog.js";

/* =========================
   AGENCY RELATIONSHIPS
========================= */

Agency.hasMany(User, {
    foreignKey: "agencyId",
    onDelete: "CASCADE",
});

User.belongsTo(Agency, {
    foreignKey: "agencyId",
});

Agency.hasMany(AgencyMember, {
    foreignKey: "agencyId",
    onDelete: "CASCADE",
});

AgencyMember.belongsTo(Agency, {
    foreignKey: "agencyId",
});

Agency.hasMany(Client, {
    foreignKey: "agencyId",
    onDelete: "CASCADE",
});

Client.belongsTo(Agency, {
    foreignKey: "agencyId",
});

Agency.hasMany(Project, {
    foreignKey: "agencyId",
    onDelete: "CASCADE",
});

Project.belongsTo(Agency, {
    foreignKey: "agencyId",
});


/* =========================
   USER RELATIONSHIPS
========================= */

User.hasMany(AgencyMember, {
    foreignKey: "userId",
    onDelete: "CASCADE",
});

AgencyMember.belongsTo(User, {
    foreignKey: "userId",
});

User.hasMany(Project, {
    foreignKey: "managerId",
    as: "managedProjects",
});

Project.belongsTo(User, {
    foreignKey: "managerId",
    as: "manager",
});

Client.hasMany(User, {
    foreignKey: "clientId",
    onDelete: "SET NULL",
});

User.belongsTo(Client, {
    foreignKey: "clientId",
});


/* =========================
   CLIENT + PROJECT
========================= */

Client.hasMany(Project, {
    foreignKey: "clientId",
    onDelete: "CASCADE",
});

Project.belongsTo(Client, {
    foreignKey: "clientId",
});


/* =========================
   PROJECT + MILESTONE
========================= */

Project.hasMany(Milestone, {
    foreignKey: "projectId",
    onDelete: "CASCADE",
});

Milestone.belongsTo(Project, {
    foreignKey: "projectId",
});

Agency.hasMany(Milestone, {
    foreignKey: "agencyId",
    onDelete: "CASCADE",
});

Milestone.belongsTo(Agency, {
    foreignKey: "agencyId",
});


/* =========================
   PROJECT + TASK
========================= */

Project.hasMany(Task, {
    foreignKey: "projectId",
    onDelete: "CASCADE",
});

Task.belongsTo(Project, {
    foreignKey: "projectId",
});

Milestone.hasMany(Task, {
    foreignKey: "milestoneId",
    onDelete: "SET NULL",
});

Task.belongsTo(Milestone, {
    foreignKey: "milestoneId",
});

User.hasMany(Task, {
    foreignKey: "assignedTo",
    onDelete: "SET NULL",
});

Task.belongsTo(User, {
    foreignKey: "assignedTo",
});

Agency.hasMany(Task, {
    foreignKey: "agencyId",
    onDelete: "CASCADE",
});

Task.belongsTo(Agency, {
    foreignKey: "agencyId",
});


/* =========================
   MEETINGS
========================= */

Agency.hasMany(Meeting, {
    foreignKey: "agencyId",
    onDelete: "CASCADE",
});

Meeting.belongsTo(Agency, {
    foreignKey: "agencyId",
});

Project.hasMany(Meeting, {
    foreignKey: "projectId",
    onDelete: "SET NULL",
});

Meeting.belongsTo(Project, {
    foreignKey: "projectId",
});

Client.hasMany(Meeting, {
    foreignKey: "clientId",
    onDelete: "SET NULL",
});

Meeting.belongsTo(Client, {
    foreignKey: "clientId",
});


/* =========================
   FEEDBACK
========================= */

Agency.hasMany(Feedback, {
    foreignKey: "agencyId",
    onDelete: "CASCADE",
});

Feedback.belongsTo(Agency, {
    foreignKey: "agencyId",
});

Project.hasMany(Feedback, {
    foreignKey: "projectId",
    onDelete: "CASCADE",
});

Feedback.belongsTo(Project, {
    foreignKey: "projectId",
});

Client.hasMany(Feedback, {
    foreignKey: "clientId",
    onDelete: "CASCADE",
});

Feedback.belongsTo(Client, {
    foreignKey: "clientId",
});

User.hasMany(Feedback, {
    foreignKey: "createdBy",
    as: "submittedFeedback",
});

Feedback.belongsTo(User, {
    foreignKey: "createdBy",
    as: "creator",
});


/* =========================
   FEEDBACK COMMENTS
========================= */

Agency.hasMany(FeedbackComment, {
    foreignKey: "agencyId",
    onDelete: "CASCADE",
});

FeedbackComment.belongsTo(Agency, {
    foreignKey: "agencyId",
});

Feedback.hasMany(FeedbackComment, {
    foreignKey: "feedbackId",
    onDelete: "CASCADE",
});

FeedbackComment.belongsTo(Feedback, {
    foreignKey: "feedbackId",
});

User.hasMany(FeedbackComment, {
    foreignKey: "userId",
    onDelete: "CASCADE",
});

FeedbackComment.belongsTo(User, {
    foreignKey: "userId",
});


/* =========================
   FILES
========================= */

Agency.hasMany(File, {
    foreignKey: "agencyId",
    onDelete: "CASCADE",
});

File.belongsTo(Agency, {
    foreignKey: "agencyId",
});

Project.hasMany(File, {
    foreignKey: "projectId",
    onDelete: "SET NULL",
});

File.belongsTo(Project, {
    foreignKey: "projectId",
});

Client.hasMany(File, {
    foreignKey: "clientId",
    onDelete: "SET NULL",
});

File.belongsTo(Client, {
    foreignKey: "clientId",
});

Task.hasMany(File, {
    foreignKey: "taskId",
    onDelete: "SET NULL",
});

File.belongsTo(Task, {
    foreignKey: "taskId",
});

Feedback.hasMany(File, {
    foreignKey: "feedbackId",
    onDelete: "SET NULL",
});

File.belongsTo(Feedback, {
    foreignKey: "feedbackId",
});

User.hasMany(File, {
    foreignKey: "uploadedBy",
    onDelete: "CASCADE",
});

File.belongsTo(User, {
    foreignKey: "uploadedBy",
});


/* =========================
   ACTIVITY LOGS
========================= */

Agency.hasMany(ActivityLog, {
    foreignKey: "agencyId",
    onDelete: "CASCADE",
});

ActivityLog.belongsTo(Agency, {
    foreignKey: "agencyId",
});

User.hasMany(ActivityLog, {
    foreignKey: "userId",
    onDelete: "SET NULL",
});

ActivityLog.belongsTo(User, {
    foreignKey: "userId",
});

Project.hasMany(ActivityLog, {
    foreignKey: "projectId",
    onDelete: "SET NULL",
});

ActivityLog.belongsTo(Project, {
    foreignKey: "projectId",
});


export {
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
};