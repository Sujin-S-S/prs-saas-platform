import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      user?: {
        id: string;
        email: string;
        role: string;
        tenantId?: string | null;
      };
    }
  }
}
