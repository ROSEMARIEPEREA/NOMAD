import { WorkBoardCard, User, Notification } from "../models/index.js";

const COLUMNS = ["todo", "in_progress", "for_review", "completed"];

export async function listCards(req, res) {
  const cards = await WorkBoardCard.findAll({
    include: [
      { model: User, as: "assignee", attributes: ["id", "full_name"] },
      { model: User, as: "creator", attributes: ["id", "full_name"] },
    ],
    order: [["createdAt", "ASC"]],
  });
  res.json(cards);
}

export async function createCard(req, res) {
  try {
    const { title, description, assigned_to, due_date } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });

    const card = await WorkBoardCard.create({
      title,
      description,
      assigned_to: assigned_to || null,
      created_by: req.user.id,
      due_date: due_date || null,
      status_column: "todo",
    });

    if (assigned_to) {
      await Notification.create({
        user_id: assigned_to,
        type: "assignment",
        message: `You were assigned a new task: "${title}"`,
      });
      req.io?.to(`user:${assigned_to}`).emit("notification", { type: "assignment", message: `New task: ${title}` });
    }

    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Moves a card between columns -- this is the core Kanban drag-and-drop action.
export async function moveCard(req, res) {
  try {
    const { status_column } = req.body;
    if (!COLUMNS.includes(status_column)) {
      return res.status(400).json({ error: `status_column must be one of: ${COLUMNS.join(", ")}` });
    }
    const card = await WorkBoardCard.findByPk(req.params.id);
    if (!card) return res.status(404).json({ error: "Card not found" });

    card.status_column = status_column;
    await card.save();

    req.io?.emit("card_moved", { id: card.id, status_column });
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// General edit -- title, description, assignee, due date. Separate from
// moveCard (which only handles drag-and-drop column changes) so that a
// simple status move stays a lightweight, single-purpose action.
export async function editCard(req, res) {
  try {
    const { title, description, assigned_to, due_date } = req.body;
    const card = await WorkBoardCard.findByPk(req.params.id);
    if (!card) return res.status(404).json({ error: "Card not found" });

    const previousAssignee = card.assigned_to;

    if (title !== undefined) card.title = title;
    if (description !== undefined) card.description = description;
    if (due_date !== undefined) card.due_date = due_date || null;
    if (assigned_to !== undefined) {
      card.assigned_to = assigned_to || null;
      // Reset the deadline notification flag if reassigned with a due date,
      // so the new assignee still gets warned even if the old one already was.
      if (assigned_to && assigned_to !== previousAssignee) {
        card.deadline_notified = false;
      }
    }
    await card.save();

    if (assigned_to && assigned_to !== previousAssignee) {
      const notif = await Notification.create({
        user_id: assigned_to,
        type: "assignment",
        message: `You were assigned a task: "${card.title}"`,
      });
      req.io?.to(`user:${assigned_to}`).emit("notification", { id: notif.id, type: "assignment", message: notif.message });
    }

    req.io?.emit("card_updated", { id: card.id });
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Team Leader/Manager view: aggregate progress instead of raw cards.
// Satisfies Section 1.6's "real-time visibility into deliverable progress"
// claim with an actual summary, not just the raw board a user has to
// eyeball and tally manually.
export async function progressSummary(req, res) {
  const cards = await WorkBoardCard.findAll({
    include: [{ model: User, as: "assignee", attributes: ["id", "full_name"] }],
  });

  const now = new Date();
  const byColumn = { todo: 0, in_progress: 0, for_review: 0, completed: 0 };
  const byMember = {}; // { user_id: { full_name, open, completed, overdue } }
  let overdueTotal = 0;

  for (const card of cards) {
    byColumn[card.status_column] = (byColumn[card.status_column] || 0) + 1;

    const isOverdue = card.due_date && new Date(card.due_date) < now && card.status_column !== "completed";
    if (isOverdue) overdueTotal++;

    if (card.assignee) {
      const key = card.assignee.id;
      if (!byMember[key]) {
        byMember[key] = { user_id: key, full_name: card.assignee.full_name, open: 0, completed: 0, overdue: 0 };
      }
      if (card.status_column === "completed") byMember[key].completed++;
      else byMember[key].open++;
      if (isOverdue) byMember[key].overdue++;
    }
  }

  const total = cards.length;
  const completionRate = total > 0 ? Math.round((byColumn.completed / total) * 100) : 0;

  res.json({
    total_cards: total,
    completion_rate: completionRate,
    by_column: byColumn,
    overdue_total: overdueTotal,
    by_member: Object.values(byMember),
  });
}

export async function deleteCard(req, res) {
  const card = await WorkBoardCard.findByPk(req.params.id);
  if (!card) return res.status(404).json({ error: "Not found" });
  await card.destroy();
  res.json({ message: "Deleted" });
}
