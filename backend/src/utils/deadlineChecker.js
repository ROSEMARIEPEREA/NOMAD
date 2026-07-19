import { WorkBoardCard, Notification } from "../models/index.js";
import { Op } from "sequelize";

const DEADLINE_WINDOW_HOURS = 24;

// Scans for cards due within the next 24h (and not yet completed) that
// haven't already been notified about, creates a Notification for the
// assignee, and pushes it live over the socket. This is what satisfies
// the "notifications for... approaching deadlines" part of the
// Communication Module (Section 1.3).
export async function checkApproachingDeadlines(io) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + DEADLINE_WINDOW_HOURS * 60 * 60 * 1000);

  const cards = await WorkBoardCard.findAll({
    where: {
      due_date: { [Op.ne]: null, [Op.between]: [now, windowEnd] },
      deadline_notified: false,
      status_column: { [Op.ne]: "completed" },
      assigned_to: { [Op.ne]: null },
    },
  });

  for (const card of cards) {
    const message = `Deadline approaching: "${card.title}" is due ${new Date(card.due_date).toLocaleString()}`;
    const notif = await Notification.create({
      user_id: card.assigned_to,
      type: "deadline",
      message,
    });
    io.to(`user:${card.assigned_to}`).emit("notification", { id: notif.id, type: "deadline", message });

    card.deadline_notified = true;
    await card.save();
  }

  return cards.length;
}

// Starts the recurring check. In production this interval would be longer
// (e.g. every 15-30 min); shortened here so it's demoable without waiting.
export function startDeadlineChecker(io, intervalMs = 60 * 1000) {
  setInterval(() => {
    checkApproachingDeadlines(io).catch((err) => console.error("Deadline check failed:", err));
  }, intervalMs);
  console.log(`Deadline checker running every ${intervalMs / 1000}s`);
}
