import { Notification } from "../models/index.js";

export async function listNotifications(req, res) {
  const notifs = await Notification.findAll({
    where: { user_id: req.user.id },
    order: [["created_at", "DESC"]],
    limit: 50,
  });
  res.json(notifs);
}

export async function markRead(req, res) {
  const notif = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!notif) return res.status(404).json({ error: "Not found" });
  notif.is_read = true;
  await notif.save();
  res.json(notif);
}
