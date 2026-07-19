import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listCards, createCard, moveCard, editCard, deleteCard, progressSummary } from "../controllers/boardController.js";

const router = Router();

router.use(requireAuth);
router.get("/", listCards);
router.get("/progress", progressSummary);
router.post("/", createCard);
router.patch("/:id/move", moveCard);
router.patch("/:id", editCard);
router.delete("/:id", deleteCard);

export default router;
