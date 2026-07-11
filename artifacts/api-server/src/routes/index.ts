import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import obrasRouter from "./obras";
import contratosRouter from "./contratos";
import frentesRouter from "./frentes";
import ativosRouter from "./ativos";
import visitasRouter from "./visitas";
import rncsRouter from "./rncs";
import miscRouter from "./misc";
import conciliacaoImportRouter from "./conciliacaoImport";
import { requireAuth } from "../middlewares/authMiddleware";
import { idempotencyMiddleware } from "../middlewares/idempotency";

const router: IRouter = Router();

// Public: health checks and the auth flow itself.
router.use(healthRouter);
router.use(authRouter);

// Everything else is TEQUALY field-intelligence data and requires a
// logged-in session — none of these routes may be reachable anonymously.
router.use(requireAuth);
router.use((req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    next();
    return;
  }

  const writableRoles = new Set(["admin", "auditor", "coordenador", "gestor"]);
  if (!req.user?.role || !writableRoles.has(req.user.role)) {
    res.status(403).json({ error: "Your role does not permit this operation." });
    return;
  }

  next();
});
router.use(idempotencyMiddleware);
router.use(dashboardRouter);
router.use(obrasRouter);
router.use(contratosRouter);
router.use(frentesRouter);
router.use(ativosRouter);
router.use(visitasRouter);
router.use(rncsRouter);
router.use(miscRouter);
router.use(conciliacaoImportRouter);

export default router;
