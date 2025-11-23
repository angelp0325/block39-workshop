import express from "express";
import db from "#db/client";

const app = express();

app.use(express.json());

app.get("/files", async (req, res, next) => {
  try {
    const sql = `
      SELECT
        files.*,
        folders.name AS folder_name
      FROM
        files
        JOIN folders ON files.folder_id = folders.id
    `;
    const { rows } = await db.query(sql);
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
});

app.get("/folders", async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT * FROM folders");
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
});

app.get("/folders/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows: folders } = await db.query(
      "SELECT * FROM folders WHERE id = $1",
      [id]
    );
    if (folders.length === 0) {
      return res.status(404).json({ error: "Folder not found" });
    }
    const folder = folders[0];

    const { rows: files } = await db.query(
      "SELECT * FROM files WHERE folder_id = $1",
      [id]
    );
    folder.files = files;

    res.status(200).json(folder);
  } catch (err) {
    next(err);
  }
});

app.post("/folders/:id/files", async (req, res, next) => {
  const { id } = req.params;
  const { name, size } = req.body || {};

  try {
    const { rowCount: folderExists } = await db.query(
      "SELECT 1 FROM folders WHERE id = $1",
      [id]
    );
    if (folderExists === 0) {
      return res.status(404).json({ error: "Folder not found" });
    }

    if (!req.body || !name || !size) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `
      INSERT INTO files (name, size, folder_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await db.query(sql, [name, size, id]);

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
