import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Group = sequelize.define(
  "Group",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    group_name: { type: DataTypes.STRING, allowNull: false },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "groups", timestamps: true }
);

// Join table for many-to-many User <-> Group membership
const GroupMember = sequelize.define(
  "GroupMember",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    group_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "group_members", timestamps: false }
);

export { Group, GroupMember };
