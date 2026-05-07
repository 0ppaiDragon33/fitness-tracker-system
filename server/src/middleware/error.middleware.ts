import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) { super(message); this.statusCode = statusCode; }
}

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV === 'development') console.error(err);
  res.status(statusCode).json({ success: false, message });
};
