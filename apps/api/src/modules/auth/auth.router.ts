import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import {
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} from "./auth.controller";
import {
  getProfileHandler,
  updateProfileHandler,
  changePasswordHandler,
} from "./profile.controller";
import { updateProfileSchema, changePasswordSchema } from "./profile.schema";

const router: IRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post("/login", loginLimiter, loginHandler);
router.post("/refresh", refreshHandler);
router.post("/logout", logoutHandler);

// Protected routes
router.get("/me", authenticate, meHandler);

// Self-service profile (any authenticated user)
router.get("/profile", authenticate, getProfileHandler);
router.patch(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  updateProfileHandler,
);
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePasswordHandler,
);

export default router;
