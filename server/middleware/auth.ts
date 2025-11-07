import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../supabase.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseClient(token);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
}
