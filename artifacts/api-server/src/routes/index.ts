import { Router, type IRouter } from "express";
import healthRouter from "./health";
import airQualityRouter from "./airQuality";

const router: IRouter = Router();

router.use(healthRouter);
router.use(airQualityRouter);

export default router;
