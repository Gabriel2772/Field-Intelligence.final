import crypto from "node:crypto";
import express, { type Express } from "express";
import cors, { type CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const allowReplitOrigins =
  process.env.ALLOW_REPLIT_APP_ORIGINS === "true" ||
  process.env.NODE_ENV !== "production";

const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    if (
      allowReplitOrigins &&
      /^https:\/\/[a-z0-9-]+\.replit\.app$/i.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error("Origin not allowed"));
  },
};

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    genReqId(req, res) {
      const incoming = req.headers["x-request-id"];
      const requestId =
        typeof incoming === "string" && /^[a-zA-Z0-9._:-]{8,128}$/.test(incoming)
          ? incoming
          : crypto.randomUUID();
      res.setHeader("X-Request-Id", requestId);
      return requestId;
    },
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
          clientContext: {
            viewportClass: req.headers["x-viewport-class"],
            pointerType: req.headers["x-pointer-type"],
            displayMode: req.headers["x-display-mode"],
          },
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), geolocation=(self), microphone=(self)",
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? "1mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.FORM_BODY_LIMIT ?? "1mb",
  }),
);
app.use(authMiddleware);

app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/api", router);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error({ error }, "Unhandled request error");
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default app;
