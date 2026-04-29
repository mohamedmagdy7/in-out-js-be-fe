import { z } from "zod";

export const checkInSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  notes: z.string().optional(),
});

export type CheckInBody = z.infer<typeof checkInSchema>;

export const checkOutSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export type CheckOutBody = z.infer<typeof checkOutSchema>;
