import type { Response } from "express";

// The lab spec requires every REST response to use this envelope shape.
export function ok(res: Response, message: string, data: unknown = null) {
  return res.status(200).json({ error: false, message, data });
}

export function created(res: Response, message: string, data: unknown = null) {
  return res.status(201).json({ error: false, message, data });
}

export function fail(res: Response, status: number, message: string) {
  return res.status(status).json({ error: true, message, data: null });
}
