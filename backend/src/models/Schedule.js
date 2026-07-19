import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// start_time / end_time are always stored in UTC (ISO strings).
// Time zone conversion happens only at the presentation layer using the
// requesting user's `time_zone` field -- this keeps conflict detection
// (a pure interval-overlap check) independent of time zone entirely.
const Schedule = sequelize.define(
  "Schedule",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    start_time: { type: DataTypes.DATE, allowNull: false },
    end_time: { type: DataTypes.DATE, allowNull: false },
    status: {
      type: DataTypes.ENUM("confirmed", "conflict"),
      defaultValue: "confirmed",
    },
  },
  { tableName: "schedules", timestamps: true }
);

export default Schedule;
