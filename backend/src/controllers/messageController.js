import { Message, Group, GroupMember, User } from "../models/index.js";
import { Op } from "sequelize";

export async function listDirectHistory(req, res) {
  const otherUserId = parseInt(req.params.userId, 10);
  const messages = await Message.findAll({
    where: {
      is_group: false,
      [Op.or]: [
        { sender_id: req.user.id, receiver_id: otherUserId },
        { sender_id: otherUserId, receiver_id: req.user.id },
      ],
    },
    order: [["sent_at", "ASC"]],
  });
  res.json(messages);
}

export async function listGroupHistory(req, res) {
  const groupId = parseInt(req.params.groupId, 10);
  const messages = await Message.findAll({
    where: { is_group: true, group_id: groupId },
    order: [["sent_at", "ASC"]],
  });
  res.json(messages);
}

export async function listContacts(req, res) {
  const users = await User.findAll({
    attributes: ["id", "full_name", "role", "time_zone"],
    where: { id: { [Op.ne]: req.user.id } },
  });
  res.json(users);
}

export async function createGroup(req, res) {
  try {
    const { group_name, member_ids } = req.body;
    if (!group_name) return res.status(400).json({ error: "group_name is required" });

    const group = await Group.create({ group_name, created_by: req.user.id });
    const ids = new Set([req.user.id, ...(member_ids || [])]);
    await Promise.all([...ids].map((uid) => GroupMember.create({ group_id: group.id, user_id: uid })));

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function listMyGroups(req, res) {
  const memberships = await GroupMember.findAll({ where: { user_id: req.user.id } });
  const groupIds = memberships.map((m) => m.group_id);
  const groups = await Group.findAll({ where: { id: groupIds } });
  res.json(groups);
}
