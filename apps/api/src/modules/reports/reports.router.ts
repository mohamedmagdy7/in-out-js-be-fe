import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize, requireCompany } from "../../middleware/authorize";
import {
  attendanceReportHandler,
  overtimeReportHandler,
  leaveReportHandler,
  summaryHandler,
  exportCsvHandler,
  exportPdfHandler,
} from "./reports.controller";

const router: IRouter = Router();

router.use(authenticate, requireCompany, authorize("HR_ADMIN", "MANAGER"));

router.get("/attendance", attendanceReportHandler);
router.get("/overtime", overtimeReportHandler);
router.get("/leave", leaveReportHandler);
router.get("/summary", summaryHandler);
router.post("/export/csv", exportCsvHandler);
router.post("/export/pdf", exportPdfHandler);

export default router;
