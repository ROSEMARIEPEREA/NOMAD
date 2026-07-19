import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listDirectHistory,
  listGroupHistory,
  listContacts,
  createGroup,
  listMyGroups,
} from "../controllers/messageController.js";

const router = Router();

router.use(requireAuth);
router.get("/contacts", listContacts);
router.get("/direct/:userId", listDirectHistory);
router.get("/group/:groupId", listGroupHistory);
router.post("/groups", createGroup);
router.get("/groups", listMyGroups);

export default router;
