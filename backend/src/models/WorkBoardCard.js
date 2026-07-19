import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const WorkBoardCard = sequelize.define(
  "WorkBoardCard",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    assigned_to: { type: DataTypes.INTEGER, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    status_column: {
      type: DataTypes.ENUM("todo", "in_progress", "for_review", "completed"),
      defaultValue: "todo",
    },
    due_date: { type: DataTypes.DATE, allowNull: true },
    deadline_notified: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "work_board_cards", timestamps: true }
);

export default WorkBoardCard;
