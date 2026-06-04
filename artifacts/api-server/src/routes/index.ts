import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import feedRouter from "./feed";
import storageRouter from "./storage";
import marketplaceRouter from "./marketplace";
import safetyRouter from "./safety";
import adminRouter from "./admin";
import eventsRouter from "./events";
import pollsRouter from "./polls";
import notificationsRouter from "./notifications";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(feedRouter);
router.use(storageRouter);
router.use(marketplaceRouter);
router.use(safetyRouter);
router.use(adminRouter);
router.use(eventsRouter);
router.use(pollsRouter);
router.use(notificationsRouter);
router.use(profileRouter);

export default router;
