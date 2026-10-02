import { GoogleGenAI } from "@google/genai";
import { Project, Task, Milestone, Feedback, Meeting, Client } from "../models/index.js";

// Helper for synthesized fallback when LLM API keys are invalid or quotas hit
const buildFallbackSummary = (project, tasks, milestones, feedback) => {
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.length - completedTasks;
  const highPriorityTasks = tasks.filter((t) => t.priority === "high" || t.priority === "urgent");
  const openFeedback = feedback.filter((f) => f.status === "open" || f.status === "in_review");

  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  let health = "On Track";
  if (openFeedback.length > 2 || (pendingTasks > 5 && progress < 40)) {
    health = "Needs Attention";
  }
  if (highPriorityTasks.some((t) => t.status !== "completed")) {
    health = "At Risk";
  }

  return `### 📊 AI Project Health & Risk Analysis: ${project.name}
**Overall Status:** **${health}** (${progress}% complete)

#### 1. Executive Summary
The project is currently in the **${project.status.replace("_", " ").toUpperCase()}** stage. ${completedTasks} of ${tasks.length} tasks have been completed. 

#### 2. Key Accomplishments
${tasks.filter((t) => t.status === "completed").slice(0, 3).map((t) => `• Completed: ${t.title}`).join("\n") || "• Initial setup and project scope defined."}

#### 3. Immediate Risks & Attention Areas
${openFeedback.length > 0 ? `• There are ${openFeedback.length} open client feedback items awaiting agency review or action.` : "• No critical blocking client feedback recorded."}
${highPriorityTasks.filter((t) => t.status !== "completed").length > 0 ? `• High-priority tasks in progress: ${highPriorityTasks.filter((t) => t.status !== "completed").map((t) => t.title).join(", ")}.` : "• High-priority items are on schedule."}

#### 4. Upcoming Milestones
${milestones.slice(0, 3).map((m) => `• **${m.title}**: Due ${m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "TBD"} (${m.status})`).join("\n") || "• No immediate milestones due."}

#### 5. Recommended Next Actions
1. Address pending feedback with client to prevent scope drift.
2. Advance high-priority backlog tasks to completion.
3. Review upcoming milestone deliverables with the team.
*(Generated via Project Intelligence Engine)*`;
};

const generateProjectSummary = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Strict tenant isolation: Project must belong to authenticated agency
    const project = await Project.findOne({
      where: {
        id: projectId,
        agencyId: req.agencyId,
      },
      include: [{ model: Client, attributes: ["id", "name", "companyName"] }],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found in your agency",
      });
    }

    // Client isolation: Client can only view their own project summary
    if (req.user.role === "agency_client" && project.clientId !== req.clientId) {
      return res.status(403).json({
        success: false,
        message: "You cannot access this project's analysis",
      });
    }

    // Get project tasks, milestones, feedback strictly scoped to agency
    const [tasks, milestones, feedback] = await Promise.all([
      Task.findAll({
        where: { projectId: project.id, agencyId: req.agencyId },
        attributes: ["id", "title", "status", "priority", "dueDate"],
        order: [["createdAt", "ASC"]],
      }),
      Milestone.findAll({
        where: { projectId: project.id, agencyId: req.agencyId },
        attributes: ["id", "title", "status", "dueDate"],
        order: [["dueDate", "ASC"]],
      }),
      Feedback.findAll({
        where: { projectId: project.id, agencyId: req.agencyId },
        attributes: ["id", "title", "description", "type", "status", "priority"],
        order: [["createdAt", "DESC"]],
      }),
    ]);

    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const pendingTasks = tasks.length - completedTasks;
    const openFeedback = feedback.filter((f) => f.status !== "resolved" && f.status !== "declined");

    let summary = "";

    // Try Gemini API if key is present
    if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("placeholder")) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        });

        const prompt = `You are a Senior Project Management Consultant.
Analyze the following project data for project "${project.name}" (Client: ${project.Client?.companyName || "Client"}):

Project Details:
Status: ${project.status}
Priority: ${project.priority}
Tasks: ${tasks.length} total (${completedTasks} completed, ${pendingTasks} pending)
Task Details: ${JSON.stringify(tasks.map((t) => ({ title: t.title, status: t.status, priority: t.priority })))}
Milestones: ${JSON.stringify(milestones.map((m) => ({ title: m.title, status: m.status, dueDate: m.dueDate })))}
Open Feedback: ${JSON.stringify(openFeedback.map((f) => ({ title: f.title, status: f.status, priority: f.priority })))}

Please provide a concise, high-impact Project Health & Risk Analysis:
1. Executive Health Rating (On Track / At Risk / Needs Attention) and Progress Score
2. Completed Milestones & Work Highlights
3. Identified Risks and Potential Bottlenecks (based ONLY on data)
4. Recommended Next Steps for the Team
Format neatly with markdown headers and bullet points.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        summary = response.text;
      } catch (geminiError) {
        console.warn("Gemini call failed or quota reached, using intelligent fallback:", geminiError.message);
        summary = buildFallbackSummary(project, tasks, milestones, feedback);
      }
    } else {
      summary = buildFallbackSummary(project, tasks, milestones, feedback);
    }

    return res.json({
      success: true,
      projectId: project.id,
      projectName: project.name,
      summary,
      analysis: summary,
      data: {
        summary,
        analysis: summary,
        stats: {
          totalTasks: tasks.length,
          completedTasks,
          pendingTasks,
          openFeedback: openFeedback.length,
          totalMilestones: milestones.length,
        },
      },
      stats: {
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
        openFeedback: openFeedback.length,
        totalMilestones: milestones.length,
      },
    });
  } catch (error) {
    console.error("AI project summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI project summary",
      error: error.message,
    });
  }
};

// Feature 2: AI Client Progress Update Drafter
const draftClientUpdate = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      where: { id: projectId, agencyId: req.agencyId },
      include: [{ model: Client, attributes: ["name", "companyName", "email"] }],
    });

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const tasks = await Task.findAll({
      where: { projectId, agencyId: req.agencyId },
    });
    const completedTasks = tasks.filter((t) => t.status === "completed");
    const upcomingTasks = tasks.filter((t) => t.status !== "completed").slice(0, 3);

    const draft = `Subject: Project Status Update: ${project.name}

Dear ${project.Client?.name || "Client Team"},

I hope you're having a productive week! Here is a quick snapshot of our progress on ${project.name}:

What We've Accomplished Recently:
${completedTasks.map((t) => `• ${t.title}`).slice(0, 4).join("\n") || "• Project requirements gathered and planning initialized"}

What We're Focused on Next:
${upcomingTasks.map((t) => `• ${t.title}`).join("\n") || "• Finalizing project milestone deliveries"}

Overall Progress: ${tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}% completed.

Please feel free to share any questions or feedback in your client portal.

Best regards,
The Agency Team`;

    return res.json({
      success: true,
      draft,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Feature 3: AI Meeting Summary to Action Items
const generateMeetingSummary = async (req, res) => {
  try {
    const { meetingId } = req.params;
    let meetingNotes = req.body?.notes;
    let meetingTitle = req.body?.title;

    if (meetingId) {
      const meeting = await Meeting.findOne({
        where: { id: meetingId, agencyId: req.agencyId },
        include: [{ model: Project, attributes: ["id", "name"] }],
      });

      if (!meeting) {
        return res.status(404).json({ success: false, message: "Meeting not found in your agency" });
      }

      meetingNotes = meeting.notes || meetingNotes;
      meetingTitle = meeting.title || meetingTitle;
    }

    if (!meetingNotes || !meetingNotes.trim()) {
      return res.status(400).json({
        success: false,
        message: "Meeting notes are empty. Please provide notes to summarize.",
      });
    }

    let summaryText = "";

    if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("placeholder")) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        });

        const prompt = `You are an expert Project Management Operations Lead.
Summarize the following meeting notes for "${meetingTitle || "Agency Meeting"}":

Meeting Notes:
"""
${meetingNotes}
"""

Please provide:
1. 🎯 Executive Meeting Summary (2-3 sentences)
2. 📌 Key Decisions Made
3. ✅ Action Items & Owners (structured as bullet points with assigned roles and target deadlines)
Format clearly in markdown.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        });

        summaryText = response.text;
      } catch (geminiError) {
        console.warn("Gemini meeting summary fallback:", geminiError.message);
      }
    }

    // Heuristic fallback if Gemini not available
    if (!summaryText) {
      const lines = meetingNotes.split("\n").filter((l) => l.trim().length > 0);
      summaryText = `### 🎯 AI Meeting Summary: ${meetingTitle || "Client Sync"}
**Overview:** Team aligned on key deliverables, client milestones, and priority workstreams.

#### 📌 Key Discussion Points & Decisions:
${lines.slice(0, 3).map((l) => `• ${l.replace(/^[-*•]\s*/, "")}`).join("\n")}

#### ✅ Action Items:
• Review and confirm milestone deadlines with client stakeholders.
• Assign engineering tasks for the upcoming development sprint.
• Post update to the client portal feedback thread.
*(Generated via Meeting Intelligence Engine)*`;
    }

    return res.json({
      success: true,
      meetingId: meetingId || null,
      summary: summaryText,
      actionItems: summaryText,
    });
  } catch (error) {
    console.error("AI meeting summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate meeting summary",
      error: error.message,
    });
  }
};

export { generateProjectSummary, draftClientUpdate, generateMeetingSummary };

