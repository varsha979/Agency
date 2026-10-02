import { ActivityLog } from "../models/index.js";

const logActivity = async ({
    req,
    agencyId = null,
    userId = null,
    action,
    description,
    entityType = null,
    entityId = null,
    projectId = null,
    isClientVisible = false,
}) => {
    try {
        const effectiveAgencyId = agencyId || req?.agencyId;
        if (!effectiveAgencyId) return;

        const effectiveUserId = userId || req?.user?.id || null;

        await ActivityLog.create({
            agencyId: effectiveAgencyId,
            userId: effectiveUserId,
            projectId,
            action,
            description,
            entityType,
            entityId,
            isClientVisible,
        });
    } catch (error) {
        // Activity logging should not break the main operation
        console.error("Activity log error:", error.message);
    }
};

export default logActivity;