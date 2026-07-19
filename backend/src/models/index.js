import sequelize from "../config/db.js";
import User from "./User.js";
import Schedule from "./Schedule.js";
import WorkBoardCard from "./WorkBoardCard.js";
import { Group, GroupMember } from "./Group.js";
import Message from "./Message.js";
import Notification from "./Notification.js";

// One user -> many schedules
User.hasMany(Schedule, { foreignKey: "user_id" });
Schedule.belongsTo(User, { foreignKey: "user_id" });

// One user -> many cards (as assignee or creator)
User.hasMany(WorkBoardCard, { foreignKey: "assigned_to", as: "assignedCards" });
User.hasMany(WorkBoardCard, { foreignKey: "created_by", as: "createdCards" });
WorkBoardCard.belongsTo(User, { foreignKey: "assigned_to", as: "assignee" });
WorkBoardCard.belongsTo(User, { foreignKey: "created_by", as: "creator" });

// Groups <-> Users (many-to-many via GroupMember)
User.belongsToMany(Group, { through: GroupMember, foreignKey: "user_id" });
Group.belongsToMany(User, { through: GroupMember, foreignKey: "group_id" });
Group.hasMany(GroupMember, { foreignKey: "group_id" });

// Messages: sender always a user; receiver is either a user or a group
User.hasMany(Message, { foreignKey: "sender_id" });
Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

// One user -> many notifications
User.hasMany(Notification, { foreignKey: "user_id" });
Notification.belongsTo(User, { foreignKey: "user_id" });

export { sequelize, User, Schedule, WorkBoardCard, Group, GroupMember, Message, Notification };
