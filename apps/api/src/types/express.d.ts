import { User } from '../generated/supabase';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
