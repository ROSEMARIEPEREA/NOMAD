import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    full_name: { type: DataTypes.STRING, allowNull: false },
    company_email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM("member", "leader"),
      allowNull: false,
      defaultValue: "member",
    },
    time_zone: { type: DataTypes.STRING, allowNull: false, defaultValue: "Asia/Manila" },
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    otp_code: { type: DataTypes.STRING, allowNull: true },
    otp_purpose: { type: DataTypes.ENUM("signup", "reset"), allowNull: true },
    otp_expires_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "users", timestamps: true }
);

export default User;
