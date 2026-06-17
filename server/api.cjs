const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const pool = new Pool({
  user: "akmal",
  password: "Akmal2026Secure!",
  host: "localhost",
  database: "akmal_hub",
  port: 5432,
});

// ── USERS ──────────────────────────────────────────────────
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length > 0) return res.json({ success: false, error: "Email already registered" });
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, password]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT id, name, email, password FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.json({ success: false, error: "No account found" });
    const user = result.rows[0];
    if (user.password !== password) return res.json({ success: false, error: "Incorrect password" });
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, created_at FROM users ORDER BY id");
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── MEMBERS ────────────────────────────────────────────────
app.get("/api/members", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM members ORDER BY id");
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/members", async (req, res) => {
  try {
    const { name, email, role, avatar } = req.body;
    const exists = await pool.query("SELECT id FROM members WHERE email = $1", [email]);
    if (exists.rows.length > 0) return res.json({ success: false, error: "Member already exists" });
    const result = await pool.query(
      "INSERT INTO members (name, email, role, avatar) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, role || "Team Member", avatar || ""]
    );
    res.json({ success: true, member: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/members/:id", async (req, res) => {
  try {
    const { name, email, role } = req.body;
    await pool.query("UPDATE members SET name=$1, email=$2, role=$3 WHERE id=$4", [name, email, role, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/members/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM members WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PROJECTS ───────────────────────────────────────────────
app.get("/api/projects", async (req, res) => {
  try {
    const userId = req.query.user_id;
    let result;
    if (userId) {
      result = await pool.query("SELECT * FROM projects WHERE user_id=$1 ORDER BY id DESC", [userId]);
    } else {
      result = await pool.query("SELECT * FROM projects ORDER BY id DESC");
    }
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/projects/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/projects", async (req, res) => {
  try {
    const { name, client, types, description, status, deadline, budget, spent, team, user_id } = req.body;
    const result = await pool.query(
      `INSERT INTO projects (name, client, types, description, status, deadline, budget, spent, team, user_id) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, client, types || [], description || "", status || "active", deadline || "", budget || 0, spent || 0, team || [], user_id || null]
    );
    res.json({ success: true, project: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/projects/:id", async (req, res) => {
  try {
    const { name, client, types, description, progress, status, deadline, budget, spent, team, phases, assets } = req.body;
    await pool.query(
      `UPDATE projects SET name=$1, client=$2, types=$3, description=$4, progress=$5, status=$6, deadline=$7, budget=$8, spent=$9, team=$10 WHERE id=$11`,
      [name, client, types, description, progress, status, deadline, budget, spent, team, req.params.id]
    );
    // Sync phases
    if (phases) {
      await pool.query("DELETE FROM phases WHERE project_id=$1", [req.params.id]);
      await pool.query("DELETE FROM tasks WHERE project_id=$1", [req.params.id]);
      for (const phase of phases) {
        const pr = await pool.query(
          "INSERT INTO phases (project_id, name, phase_local_id) VALUES ($1,$2,$3) RETURNING id",
          [req.params.id, phase.name, phase.id]
        );
        const dbPhaseId = pr.rows[0].id;
        for (const task of (phase.tasks || [])) {
          await pool.query(
            "INSERT INTO tasks (project_id, phase_id, title, description, status, priority, assignee, due_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
            [req.params.id, String(dbPhaseId), task.title, task.description || "", task.status, task.priority, task.assignee || "", task.dueDate || ""]
          );
        }
      }
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM projects WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── TASKS / PHASES ────────────────────────────────────────
app.get("/api/projects/:id/tasks", async (req, res) => {
  try {
    const tasks = await pool.query("SELECT * FROM tasks WHERE project_id=$1", [req.params.id]);
    const phases = await pool.query("SELECT * FROM phases WHERE project_id=$1", [req.params.id]);
    const phaseMap = {};
    phases.rows.forEach(p => { phaseMap[p.id] = { id: String(p.id), name: p.name, tasks: [] }; });
    tasks.rows.forEach(t => {
      if (phaseMap[t.phase_id]) phaseMap[t.phase_id].tasks.push({
        id: String(t.id), title: t.title, description: t.description, status: t.status,
        priority: t.priority, assignee: t.assignee, dueDate: t.due_date, comments: [], attachments: []
      });
    });
    res.json(Object.values(phaseMap));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── INVOICES ───────────────────────────────────────────────
app.get("/api/invoices", async (req, res) => {
  try {
    const userId = req.query.user_id;
    let result;
    if (userId) {
      result = await pool.query("SELECT * FROM invoices WHERE user_id=$1 ORDER BY id DESC", [userId]);
    } else {
      result = await pool.query("SELECT * FROM invoices ORDER BY id DESC");
    }
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/invoices", async (req, res) => {
  try {
    const { invoice_no, project_name, client_name, date, due_date, items, subtotal, gst_percentage, gst_amount, total, status, notes, user_id } = req.body;
    const result = await pool.query(
      `INSERT INTO invoices (invoice_no, project_name, client_name, date, due_date, items, subtotal, gst_percentage, gst_amount, total, status, notes, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [invoice_no, project_name, client_name, date, due_date, JSON.stringify(items || []), subtotal, gst_percentage, gst_amount, total, status, notes || "", user_id || null]
    );
    res.json({ success: true, invoice: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/invoices/:id", async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query("UPDATE invoices SET status=$1 WHERE id=$2", [status, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/invoices/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM invoices WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CHATS ──────────────────────────────────────────────────
app.get("/api/chats/:projectId", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM chats WHERE project_id=$1 ORDER BY id", [req.params.projectId]);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/chats", async (req, res) => {
  try {
    const { project_id, text, sender, role, timestamp, user_id } = req.body;
    const result = await pool.query(
      "INSERT INTO chats (project_id, text, sender, role, timestamp, user_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [project_id, text, sender, role, timestamp, user_id || null]
    );
    res.json({ success: true, message: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CLIENTS ────────────────────────────────────────────────
app.get("/api/clients", async (req, res) => {
  try {
    const userId = req.query.user_id;
    let result;
    if (userId) {
      result = await pool.query("SELECT * FROM clients WHERE user_id=$1 ORDER BY id DESC", [userId]);
    } else {
      result = await pool.query("SELECT * FROM clients ORDER BY id DESC");
    }
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/clients", async (req, res) => {
  try {
    const { name, email, phone, address, gstin, pan, place_of_supply, user_id } = req.body;
    const result = await pool.query(
      `INSERT INTO clients (name, email, phone, address, gstin, pan, place_of_supply, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, email || "", phone || "", address || "", gstin || "", pan || "", place_of_supply || "", user_id || null]
    );
    res.json({ success: true, client: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/clients/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM clients WHERE id=$1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Client not found" });
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/clients/:id", async (req, res) => {
  try {
    const { name, email, phone, address, gstin, pan, place_of_supply } = req.body;
    await pool.query(
      "UPDATE clients SET name=$1, email=$2, phone=$3, address=$4, gstin=$5, pan=$6, place_of_supply=$7 WHERE id=$8",
      [name, email, phone, address, gstin, pan, place_of_supply, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/clients/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM clients WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PROJECT HISTORY ────────────────────────────────────────
app.get("/api/project-history", async (req, res) => {
  try {
    const userId = req.query.user_id;
    const clientId = req.query.client_id;
    let query = "SELECT ph.*, c.name as client_name FROM project_history ph LEFT JOIN clients c ON ph.client_id = c.id";
    const params = [];
    const conditions = [];
    if (userId) { params.push(userId); conditions.push(`ph.user_id=$${params.length}`); }
    if (clientId) { params.push(clientId); conditions.push(`ph.client_id=$${params.length}`); }
    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY ph.id DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/project-history", async (req, res) => {
  try {
    const { user_id, client_id, project_name, status, budget, deadline, description, invoice_id } = req.body;
    const result = await pool.query(
      `INSERT INTO project_history (user_id, client_id, project_name, status, budget, deadline, description, invoice_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [user_id || null, client_id || null, project_name, status || "active", budget || 0, deadline || "", description || "", invoice_id || null]
    );
    res.json({ success: true, project: result.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── USER PROFILE ───────────────────────────────────────────
app.get("/api/user-profile/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await pool.query("SELECT id, name, email, created_at FROM users WHERE id=$1", [userId]);
    const projects = await pool.query("SELECT id, name, client, status, budget, deadline FROM projects WHERE user_id=$1 ORDER BY id DESC", [userId]);
    const invoices = await pool.query("SELECT id, title, project_name, client_name, total, status, date FROM invoices WHERE user_id=$1 ORDER BY id DESC", [userId]);
    const clients = await pool.query("SELECT id, name, email, phone FROM clients WHERE user_id=$1 ORDER BY id DESC", [userId]);
    res.json({
      user: user.rows[0] || null,
      projects: projects.rows,
      invoices: invoices.rows,
      clients: clients.rows,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DRIVE CONFIG ───────────────────────────────────────────
app.get("/api/drive-config", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM drive_config ORDER BY id DESC LIMIT 1");
    res.json(result.rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/drive-config", async (req, res) => {
  try {
    await pool.query("DELETE FROM drive_config");
    const { token, folder_id } = req.body;
    await pool.query("INSERT INTO drive_config (token, folder_id) VALUES ($1,$2)", [token || "", folder_id || ""]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
