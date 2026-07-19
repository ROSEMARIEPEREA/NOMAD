import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

// DB_DIALECT=sqlite (default, zero setup) or mysql (matches the manuscript's stack)
const dialect = process.env.DB_DIALECT || "sqlite";

let sequelize;

if (dialect === "mysql") {
  sequelize = new Sequelize(
    process.env.DB_NAME || "nomad",
    process.env.DB_USER || "root",
    process.env.DB_PASS || "",
    {
      host: process.env.DB_HOST || "127.0.0.1",
      dialect: "mysql",
      logging: false,
    }
  );
} else {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.SQLITE_PATH || "./data/nomad.sqlite",
    logging: false,
  });
}

export default sequelize;
