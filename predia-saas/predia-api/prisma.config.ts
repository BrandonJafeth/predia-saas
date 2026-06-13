import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, ".env") });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "src/prisma/schema.prisma",
  migrations: {
    path: "src/prisma/migrations",
  },
  datasource: {
    url: process.env["MIGRATION_URL"] ?? process.env["DATABASE_URL"],
  },
});
