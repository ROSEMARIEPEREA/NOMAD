import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listMySchedule,
  listTeamSchedule,
  createSchedule,
  deleteSchedule,
  recommendMeeting,
  bookMeeting,
} from "../controllers/scheduleController.js";

const router = Router();

router.use(requireAuth);
router.get("/mine", listMySchedule);
router.get("/team", listTeamSchedule);
router.post("/", createSchedule);
router.post("/recommend", recommendMeeting);
router.post("/book-meeting", bookMeeting);
router.delete("/:id", deleteSchedule);

export default router;
