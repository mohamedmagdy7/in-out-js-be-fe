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
} from "./departments.controller";

const departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const router: IRouter = Router();

router.use(authenticate, requireCompany, authorize("HR_ADMIN", "MANAGER"));

router.get("/", listHandler);
router.post("/", authorize("HR_ADMIN"), validate(departmentSchema), createHandler);
router.patch("/:id", authorize("HR_ADMIN"), validate(departmentSchema), updateHandler);
router.delete("/:id", authorize("HR_ADMIN"), deleteHandler);

export default router;
