const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const crimes = require("./crimes.json");
const criminals = require("./criminals.json");
const victims = require("./victims.json");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ DATABASE
const db = new sqlite3.Database("crime.db");

// ---------------- DATABASE INIT ----------------
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS crimes (
    crime TEXT,
    incident_area TEXT,
    location TEXT,
    weapon TEXT,
    criminal_id INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS criminals (
    criminal_id INTEGER,
    incident_date TEXT,
    incident_area TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS victims (
    victim_age INTEGER,
    victim_gender TEXT,
    incident_area TEXT
  )`);

  db.get("SELECT COUNT(*) as count FROM crimes", (err, row) => {
    if (err) {
      console.log(err);
      return;
    }

    if (row.count === 0) {
      // 🔥 INSERT CRIMES
      crimes.forEach((c) => {
        db.run(
          "INSERT INTO crimes VALUES (?, ?, ?, ?, ?)",
          [
            c.crime,
            c.incident_area,
            c.location || "N/A",
            c.weapon || "N/A",
            c.criminal_id || null,
          ]
        );
      });

      // 🔥 INSERT CRIMINALS
      criminals.forEach((c) => {
        db.run(
          "INSERT INTO criminals VALUES (?, ?, ?)",
          [
            c.criminal_id,
            c.incident_date || "N/A",
            c.incident_area || "N/A",
          ]
        );
      });

      // 🔥 INSERT VICTIMS
      victims.forEach((v) => {
        db.run(
          "INSERT INTO victims VALUES (?, ?, ?)",
          [
            v.victim_age || null,
            v.victim_gender || "Unknown",
            v.incident_area || "N/A",
          ]
        );
      });

      console.log("✅ Database loaded from JSON");
    }
  });
});

// ---------------- ROOT ROUTE (IMPORTANT) ----------------
app.get("/", (req, res) => {
  res.send("🚀 Backend is running");
});

// ---------------- TEST ROUTE ----------------
app.get("/tables", (req, res) => {
  db.all("SELECT * FROM crimes LIMIT 200", [], (err, rows) => {
    if (err) {
      return res.json({
        success: false,
        error: err.message,
        data: [],
      });
    }

    res.json({
      success: true,
      data: rows,
    });
  });
});

// ---------------- QUERY ROUTE ----------------
app.post("/query", (req, res) => {
  const { query } = req.body;

  if (!query || !query.toLowerCase().startsWith("select")) {
    return res.json({
      success: false,
      error: "Only SELECT queries allowed",
      data: [],
    });
  }

  try {
    const safeQuery = query.trim() + " LIMIT 200";

    db.all(safeQuery, [], (err, rows) => {
      if (err) {
        console.log("SQL ERROR:", err.message);

        return res.json({
          success: false,
          error: err.message,
          data: [],
        });
      }

      return res.json({
        success: true,
        data: rows,
      });
    });
  } catch (e) {
    return res.json({
      success: false,
      error: e.message,
      data: [],
    });
  }
});

// ---------------- SERVER START ----------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});
