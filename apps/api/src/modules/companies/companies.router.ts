import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize, requireCompany } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import {
  createCompanySchema,
  updateCompanySchema,
  inviteAdminSchema,
  updateMyCompanySchema,
} from "./companies.schema";
import {
  listHandler,
  createHandler,
  getHandler,
  updateHandler,
  deleteHandler,
  inviteAdminHandler,
  statsHandler,
  getMyCompanyHandler,
  updateMyCompanyHandler,
  getMyCompanyStatsHandler,
  platformStatsHandler,
  listCompanyAdminsHandler,
  setCompanyAdminActiveHandler,
} from "./companies.controller";

const router: IRouter = Router();

// HR_ADMIN routes for their own company. Must come before the SUPER_ADMIN guard.
router.get(
  "/me",
  authenticate,
  requireCompany,
  authorize("HR_ADMIN"),
  getMyCompanyHandler,
);
router.patch(
  "/me",
  authenticate,
  requireCompany,
  authorize("HR_ADMIN"),
  validate(updateMyCompanySchema),
  updateMyCompanyHandler,
);
router.get(
  "/me/stats",
  authenticate,
  requireCompany,
  authorize("HR_ADMIN"),
  getMyCompanyStatsHandler,
);

// All routes below require SUPER_ADMIN
router.use(authenticate, authorize("SUPER_ADMIN"));

router.get("/platform/stats", platformStatsHandler);
router.get("/", listHandler);
router.post("/", validate(createCompanySchema), createHandler);
router.get("/:id", getHandler);
router.patch("/:id", validate(updateCompanySchema), updateHandler);
router.delete("/:id", deleteHandler);
router.post("/:id/invite-admin", validate(inviteAdminSchema), inviteAdminHandler);
router.get("/:id/stats", statsHandler);
router.get("/:id/admins", listCompanyAdminsHandler);
router.patch("/:id/admins/:userId", setCompanyAdminActiveHandler);

export default router;
