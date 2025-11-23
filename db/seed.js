import db from "#db/client";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
  await db.query("DELETE FROM files");
  await db.query("DELETE FROM folders");

  const folderNames = ["Documents", "Pictures", "Music"];
  const folderInserts = [];

  for (const name of folderNames) {
    const { rows } = await db.query(
      "INSERT INTO folders (name) VALUES ($1) RETURNING *",
      [name]
    );
    folderInserts.push(rows[0]);
  }

  const fileTemplates = [
    { name: "file1.txt", size: 1200 },
    { name: "file2.txt", size: 3400 },
    { name: "file3.txt", size: 5600 },
    { name: "file4.txt", size: 7800 },
    { name: "file5.txt", size: 9100 },
  ];

  for (const folder of folderInserts) {
    for (const template of fileTemplates) {
      const name = `${folder.name.toLowerCase()}_${template.name}`;
      const size = template.size;

      await db.query(
        "INSERT INTO files (name, size, folder_id) VALUES ($1, $2, $3)",
        [name, size, folder.id]
      );
    }
  }
}
