import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize, requireCompany } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createEmployeeSchema, updateEmployeeSchema, resetPasswordSchema } from "./employees.schema";
import {
  listHandler,
  createHandler,
  getHandler,
  updateHandler,
  deleteHandler,
  resetPasswordHandler,
} from "./employees.controller";

const router: IRouter = Router();

// All routes require auth + company context + HR_ADMIN or MANAGER role
router.use(authenticate, requireCompany, authorize("HR_ADMIN", "MANAGER"));

router.get("/", listHandler);
router.post("/", authorize("HR_ADMIN"), validate(createEmployeeSchema), createHandler);
router.get("/:id", getHandler);
router.patch("/:id", authorize("HR_ADMIN"), validate(updateEmployeeSchema), updateHandler);
router.delete("/:id", authorize("HR_ADMIN"), deleteHandler);
router.patch("/:id/reset-password", authorize("HR_ADMIN"), validate(resetPasswordSchema), resetPasswordHandler);

export default router;
