import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireCompany } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { checkInSchema, checkOutSchema } from "./attendance.schema";
import {
  checkInHandler,
  checkOutHandler,
  getTodayHandler,
  getStatusHandler,
} from "./attendance.controller";

const router: IRouter = Router();

router.use(authenticate, requireCompany);

router.post("/check-in", validate(checkInSchema), checkInHandler);
router.post("/check-out", validate(checkOutSchema), checkOutHandler);
router.get("/today", getTodayHandler);
router.get("/status", getStatusHandler);

export default router;
