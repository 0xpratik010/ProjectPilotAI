import { DatabaseStorage } from "../server/database-storage";

async function main() {
  const db = new DatabaseStorage();
  try {
    console.log("Updating existing projects with default values...");
    await db.updateExistingProjectsWithDefaults();
    console.log("Successfully updated existing projects");
  } catch (error) {
    console.error("Error updating projects:", error);
    process.exit(1);
  }
}

main();
