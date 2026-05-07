const { execSync } = require("node:child_process");
const url = new URL(process.env.DATABASE_URL);
const psql = `"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"`;
const env = { ...process.env, PGPASSWORD: url.password };
try {
  const r = execSync(
    `${psql} -h ${url.hostname} -p ${url.port} -U ${url.username} -d postgres -c "\\l"`,
    { env, timeout: 8000, encoding: "utf8" }
  );
  console.log(r.slice(0, 2000));
} catch (e) {
  console.log("EXIT:", e.status);
  console.log((e.stderr || e.stdout || e.message).slice(0, 1000));
}
