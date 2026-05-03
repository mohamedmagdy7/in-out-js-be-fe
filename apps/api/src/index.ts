import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./modules/auth/auth.router";
import companiesRouter from "./modules/companies/companies.router";
import employeesRouter from "./modules/employees/employees.router";
import departmentsRouter from "./modules/departments/departments.router";
import shiftsRouter from "./modules/shifts/shifts.router";
import attendanceRouter from "./modules/attendance/attendance.router";
import leaveRouter from "./modules/leave/leave.router";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/departments", departmentsRouter);
app.use("/api/shifts", shiftsRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/leave", leaveRouter);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
