import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize, requireCompany } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { checkInSchema, checkOutSchema, adminMarkSchema, adminEditLogSchema, adminAddSessionSchema, adminEditSessionSchema } from "./attendance.schema";
import {
  checkInHandler,
  checkOutHandler,
  getTodayHandler,
  getStatusHandler,
  getMyAttendanceHandler,
  getEmployeeAttendanceHandler,
  getTeamAttendanceHandler,
  getCompanyAttendanceHandler,
  getMySummaryHandler,
  getEmployeeSummaryHandler,
  adminMarkHandler,
  adminEditLogHandler,
  adminAddSessionHandler,
  adminEditSessionHandler,
  adminDeleteSessionHandler,
} from "./attendance.controller";

const router: IRouter = Router();

router.use(authenticate, requireCompany);

// --- Task 06: Check-in/out ---
router.post("/check-in", validate(checkInSchema), checkInHandler);
router.post("/check-out", validate(checkOutSchema), checkOutHandler);
router.get("/today", getTodayHandler);
router.get("/status", getStatusHandler);

// --- Task 07: Attendance history & summaries ---
router.get("/my", getMyAttendanceHandler);
router.get("/employees/:id", authorize("HR_ADMIN", "MANAGER"), getEmployeeAttendanceHandler);
router.get("/team", authorize("MANAGER"), getTeamAttendanceHandler);
router.get("/company", authorize("HR_ADMIN"), getCompanyAttendanceHandler);
router.get("/summary/me", getMySummaryHandler);
router.get("/summary/employee/:id", authorize("HR_ADMIN", "MANAGER"), getEmployeeSummaryHandler);

// --- Task 07: Admin overrides (HR_ADMIN only) ---
router.post("/admin/mark", authorize("HR_ADMIN"), validate(adminMarkSchema), adminMarkHandler);
router.patch("/admin/logs/:id", authorize("HR_ADMIN"), validate(adminEditLogSchema), adminEditLogHandler);
router.post("/admin/sessions", authorize("HR_ADMIN"), validate(adminAddSessionSchema), adminAddSessionHandler);
router.patch("/admin/sessions/:id", authorize("HR_ADMIN"), validate(adminEditSessionSchema), adminEditSessionHandler);
router.delete("/admin/sessions/:id", authorize("HR_ADMIN"), adminDeleteSessionHandler);

export default router;
