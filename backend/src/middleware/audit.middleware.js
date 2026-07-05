import prisma from '../config/database.js';
import logger from '../config/logger.js';

export const auditLog = (action, entity) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      try {
        if (res.statusCode < 400) {
          await prisma.auditLog.create({
            data: {
              userId: req.user?.id || null,
              action,
              entity,
              entityId: req.params?.id || body?.data?.id || null,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
              newData: body?.data || null,
            },
          });
        }
      } catch (err) {
        logger.warn('Audit log failed:', err.message);
      }
      return originalJson(body);
    };

    next();
  };
};
