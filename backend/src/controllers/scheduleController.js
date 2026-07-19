import { Schedule, User, Notification } from "../models/index.js";
import { findConflicts } from "../utils/conflict.js";
import { recommendSlots } from "../utils/recommend.js";
import { DateTime } from "luxon";

// List the requesting user's schedule, with start/end converted to their
// own time_zone for display (storage stays UTC always).
export async function listMySchedule(req, res) {
  const entries = await Schedule.findAll({ where: { user_id: req.user.id }, order: [["start_time", "ASC"]] });
  const tz = req.user.time_zone || "Asia/Manila";
  const converted = entries.map((e) => ({
    id: e.id,
    title: e.title,
    status: e.status,
    start_time_utc: e.start_time,
    end_time_utc: e.end_time,
    start_time_local: DateTime.fromJSDate(new Date(e.start_time)).setZone(tz).toISO(),
    end_time_local: DateTime.fromJSDate(new Date(e.end_time)).setZone(tz).toISO(),
  }));
  res.json(converted);
}

// Team-wide calendar (for leaders) -- every user's entries, each converted
// to THAT user's own time zone, plus the viewer's zone for comparison.
export async function listTeamSchedule(req, res) {
  const entries = await Schedule.findAll({ include: [{ model: User, attributes: ["id", "full_name", "time_zone"] }] });
  const viewerTz = req.user.time_zone || "Asia/Manila";
  const mapped = entries.map((e) => ({
    id: e.id,
    title: e.title,
    status: e.status,
    user: e.User.full_name,
    owner_local: DateTime.fromJSDate(new Date(e.start_time)).setZone(e.User.time_zone).toFormat("MMM d, h:mm a"),
    viewer_local: DateTime.fromJSDate(new Date(e.start_time)).setZone(viewerTz).toFormat("MMM d, h:mm a"),
  }));
  res.json(mapped);
}

export async function createSchedule(req, res) {
  try {
    const { title, start_time, end_time } = req.body;
    if (!title || !start_time || !end_time) {
      return res.status(400).json({ error: "title, start_time, end_time are required (ISO strings)" });
    }
    const conflicts = await findConflicts(Schedule, req.user.id, start_time, end_time);
    const status = conflicts.length > 0 ? "conflict" : "confirmed";

    const entry = await Schedule.create({ user_id: req.user.id, title, start_time, end_time, status });

    if (conflicts.length > 0) {
      const conflictMsg = `"${title}" overlaps with "${conflicts.map((c) => c.title).join(", ")}"`;
      const notif = await Notification.create({
        user_id: req.user.id,
        type: "conflict",
        message: conflictMsg,
      });
      req.io?.to(`user:${req.user.id}`).emit("notification", { id: notif.id, type: "conflict", message: conflictMsg });
    }

    res.status(201).json({
      entry,
      conflict_detected: conflicts.length > 0,
      conflicting_with: conflicts.map((c) => ({ id: c.id, title: c.title })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Objective 1.4.1.a: "recommend suitable meeting times based on the team's
// combined availability" -- checks candidate slots against every invited
// user's own local business hours AND their existing schedule conflicts.
export async function recommendMeeting(req, res) {
  try {
    const { user_ids, duration_minutes } = req.body;
    if (!Array.isArray(user_ids) || user_ids.length === 0 || !duration_minutes) {
      return res.status(400).json({ error: "user_ids (array) and duration_minutes are required" });
    }
    const allIds = [...new Set([req.user.id, ...user_ids])];

    const users = await Promise.all(
      allIds.map(async (id) => {
        const u = await User.findByPk(id);
        const schedules = await Schedule.findAll({ where: { user_id: id } });
        return { id, time_zone: u.time_zone, full_name: u.full_name, schedules };
      })
    );

    const slots = recommendSlots(users, parseInt(duration_minutes, 10));
    res.json({ candidates: slots, participants: users.map((u) => ({ id: u.id, full_name: u.full_name })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Books a recommended slot by creating a schedule entry for every invited
// participant at once.
export async function bookMeeting(req, res) {
  try {
    const { title, start_time, end_time, user_ids } = req.body;
    const allIds = [...new Set([req.user.id, ...(user_ids || [])])];

    const entries = await Promise.all(
      allIds.map((uid) => Schedule.create({ user_id: uid, title, start_time, end_time, status: "confirmed" }))
    );

    // Notify everyone but the organizer that they've been added to a meeting
    for (const uid of allIds) {
      if (uid === req.user.id) continue;
      const notif = await Notification.create({
        user_id: uid,
        type: "assignment",
        message: `You were added to a meeting: "${title}"`,
      });
      req.io?.to(`user:${uid}`).emit("notification", { id: notif.id, type: "assignment", message: notif.message });
    }

    res.status(201).json({ message: "Meeting booked for all participants", entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteSchedule(req, res) {
  const entry = await Schedule.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!entry) return res.status(404).json({ error: "Not found" });
  await entry.destroy();
  res.json({ message: "Deleted" });
}
