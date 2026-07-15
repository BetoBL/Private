import type { TokenPayload } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      profissional?: TokenPayload;
    }
  }
}

export {};
