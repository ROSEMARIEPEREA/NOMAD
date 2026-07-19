import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Matches the ERD: a message is EITHER direct (receiver_id set, is_group=false)
// OR group (group_id set, is_group=true) -- never both. Enforced in the
// controller layer (see messageController.js) since SQLite doesn't support
// CHECK constraints as strictly as MySQL would.
const Message = sequelize.define(
  "Message",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sender_id: { type: DataTypes.INTEGER, allowNull: false },
    receiver_id: { type: DataTypes.INTEGER, allowNull: true },
    group_id: { type: DataTypes.INTEGER, allowNull: true },
    is_group: { type: DataTypes.BOOLEAN, defaultValue: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    sent_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "messages", timestamps: false }
);

export default Message;
