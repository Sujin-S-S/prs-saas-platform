import prisma from '../config/db';

export const logAuditAction = async ({
  tenantId,
  userId,
  action,
  entityName,
  entityId,
  changesJson
}: {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entityName: string;
  entityId?: string | null;
  changesJson?: string | null;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: tenantId || null,
        userId: userId || null,
        action,
        entityName,
        entityId: entityId || null,
        changesJson: changesJson || null,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
