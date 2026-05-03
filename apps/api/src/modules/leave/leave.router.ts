import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize, requireCompany } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createLeaveRequestSchema, rejectLeaveRequestSchema } from "./leave.schema";
import {
  getLeaveTypesHandler,
  getBalanceHandler,
  getMyRequestsHandler,
  createLeaveRequestHandler,
  cancelLeaveRequestHandler,
  getPendingRequestsHandler,
  approveRequestHandler,
  rejectRequestHandler,
  getAllRequestsHandler,
} from "./leave.controller";

const router: IRouter = Router();

router.use(authenticate, requireCompany);

// --- Employee-facing ---
router.get("/types", getLeaveTypesHandler);
router.get("/balance", getBalanceHandler);
router.get("/requests", getMyRequestsHandler);
router.post("/requests", validate(createLeaveRequestSchema), createLeaveRequestHandler);
router.delete("/requests/:id", cancelLeaveRequestHandler);

// --- Manager / HR Admin ---
router.get("/requests/pending", authorize("HR_ADMIN", "MANAGER"), getPendingRequestsHandler);
router.patch("/requests/:id/approve", authorize("HR_ADMIN", "MANAGER"), approveRequestHandler);
router.patch("/requests/:id/reject", authorize("HR_ADMIN", "MANAGER"), validate(rejectLeaveRequestSchema), rejectRequestHandler);
router.get("/requests/all", authorize("HR_ADMIN"), getAllRequestsHandler);

export default router;
