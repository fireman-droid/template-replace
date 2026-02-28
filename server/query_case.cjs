const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mysql = require("mysql2/promise");

const outFile = path.join(__dirname, "query_result.json");

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    const [rows] = await conn.query(
      "SELECT id, title, template_id, form_data FROM cases",
    );
    const result = rows.map((row) => ({
      id: row.id,
      title: row.title,
      template_id: row.template_id,
      form_data:
        typeof row.form_data === "string"
          ? JSON.parse(row.form_data || "{}")
          : row.form_data || {},
    }));
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf-8");
    await conn.end();
  } catch (e) {
    fs.writeFileSync(outFile, JSON.stringify({ error: e.message }), "utf-8");
  }
  process.exit(0);
})();
