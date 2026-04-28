import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middleware/authenticate";
import {
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} from "./auth.controller";

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

export default router;
