import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createCompanySchema, updateCompanySchema, inviteAdminSchema } from "./companies.schema";
import {
  listHandler,
  createHandler,
  getHandler,
  updateHandler,
  deleteHandler,
  inviteAdminHandler,
  statsHandler,
} from "./companies.controller";

const router: IRouter = Router();

// All routes require SUPER_ADMIN
router.use(authenticate, authorize("SUPER_ADMIN"));

router.get("/", listHandler);
router.post("/", validate(createCompanySchema), createHandler);
router.get("/:id", getHandler);
router.patch("/:id", validate(updateCompanySchema), updateHandler);
router.delete("/:id", deleteHandler);
router.post("/:id/invite-admin", validate(inviteAdminSchema), inviteAdminHandler);
router.get("/:id/stats", statsHandler);

export default router;
