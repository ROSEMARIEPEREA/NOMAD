// Quick seed script: creates 3 pre-verified demo users so you don't have to
// go through signup/OTP every time you restart the demo.
// Run with: npm run seed
import bcrypt from "bcryptjs";
import { sequelize, User, WorkBoardCard } from "../models/index.js";

async function seed() {
  await sequelize.sync();

  const password_hash = await bcrypt.hash("Password123!", 10);

  const [leader] = await User.findOrCreate({
    where: { company_email: "leader@company.com" },
    defaults: {
      full_name: "Rosemarie Perea",
      password_hash,
      role: "leader",
      time_zone: "Asia/Manila",
      is_verified: true,
    },
  });
  const [member1] = await User.findOrCreate({
    where: { company_email: "member1@company.com" },
    defaults: {
      full_name: "Alex Rivera",
      password_hash,
      role: "member",
      time_zone: "America/New_York",
      is_verified: true,
    },
  });
  await User.findOrCreate({
    where: { company_email: "member2@company.com" },
    defaults: {
      full_name: "Priya Nair",
      password_hash,
      role: "member",
      time_zone: "Asia/Kolkata",
      is_verified: true,
    },
  });

  await WorkBoardCard.findOrCreate({
    where: { title: "Design ERD" },
    defaults: { created_by: leader.id, assigned_to: member1.id, status_column: "in_progress" },
  });
  await WorkBoardCard.findOrCreate({
    where: { title: "Set up Socket.IO messaging" },
    defaults: { created_by: leader.id, assigned_to: leader.id, status_column: "todo" },
  });

  console.log("Seed complete. Demo accounts (all password: Password123!):");
  console.log("  leader@company.com  (leader, Asia/Manila)");
  console.log("  member1@company.com (member, America/New_York)");
  console.log("  member2@company.com (member, Asia/Kolkata)");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
