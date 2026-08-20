import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown[];
  meta?: Record<string, unknown>;
}

export function ok<T>(res: Response, data: T, message?: string, status = 200) {
  return res.status(status).json({ success: true, data, message } satisfies ApiResponse<T>);
}

export function created<T>(res: Response, data: T, message?: string) {
  return ok(res, data, message, 201);
}

export function noContent(res: Response) {
  return res.status(204).send();
}

export function badRequest(res: Response, message: string, errors?: unknown[]) {
  return res.status(400).json({ success: false, message, errors } satisfies ApiResponse);
}

export function unauthorized(res: Response, message = 'Unauthorized') {
  return res.status(401).json({ success: false, message } satisfies ApiResponse);
}

export function forbidden(res: Response, message = 'Forbidden') {
  return res.status(403).json({ success: false, message } satisfies ApiResponse);
}

export function notFound(res: Response, message = 'Not found') {
  return res.status(404).json({ success: false, message } satisfies ApiResponse);
}

export function conflict(res: Response, message: string) {
  return res.status(409).json({ success: false, message } satisfies ApiResponse);
}

export function serverError(res: Response, message = 'Internal server error') {
  return res.status(500).json({ success: false, message } satisfies ApiResponse);
}
