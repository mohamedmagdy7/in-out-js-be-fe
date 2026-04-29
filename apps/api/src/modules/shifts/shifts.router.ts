import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize, requireCompany } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { z } from "zod";
import {
  listHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} from "./shifts.controller";

const createShiftSchema = z.object({
  name: z.string().min(1, "Name is required"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  is_default: z.boolean().optional(),
});

const updateShiftSchema = z.object({
  name: z.string().min(1).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format").optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format").optional(),
  is_default: z.boolean().optional(),
});

const router: IRouter = Router();

router.use(authenticate, requireCompany, authorize("HR_ADMIN", "MANAGER"));

router.get("/", listHandler);
router.post("/", authorize("HR_ADMIN"), validate(createShiftSchema), createHandler);
router.patch("/:id", authorize("HR_ADMIN"), validate(updateShiftSchema), updateHandler);
router.delete("/:id", authorize("HR_ADMIN"), deleteHandler);

export default router;
