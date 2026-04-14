import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});

// Logging middleware for dev
db.$use(async (params, next) => {
  if (process.env.NODE_ENV === "development") {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    console.log(
      `Prisma Query ${params.model}.${params.action} took ${after - before}ms`
    );
    return result;
  }
  return next(params);
});

export { db };
export * from "@prisma/client";
