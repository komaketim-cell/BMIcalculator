@import url("https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;700;800&display=swap");

:root {
  --bg: #f3f6fb;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #6b7280;
  --primary: #4f46e5;
  --primary-dark: #4338ca;
  --border: #e5e7eb;
  --shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
  --radius: 18px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "Vazirmatn", sans-serif;
  background: radial-gradient(1200px 600px at 80% -20%, #e9edff, transparent),
              radial-gradient(900px 500px at 10% 120%, #e8f8ff, transparent),
              var(--bg);
  color: var(--text);
}

.container {
  width: min(1200px, 92vw);
  margin: 40px auto;
  display: flex;
  gap: 24px;
  align-items: stretch;
  direction: ltr; /* کنترل جای ستون‌ها */
}

.panel {
  background: var(--card);
  border-radius: var(--radius);
  padding: 24px;
  flex: 1;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  direction: rtl; /* محتوای فارسی */
}

.results {
  order: 1; /* نتایج سمت چپ */
}

.inputs {
  order: 2; /* مشخصات سمت راست */
}

h2 {
  margin: 0 0 16px;
  font-weight: 800;
  font-size: 22px;
}

.row {
  margin-bottom: 16px;
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #111827;
}

input,
select {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #f9fbff;
  font-size: 15px;
  transition: 0.2s ease;
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.14);
}

.date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.toggle {
  display: flex;
  gap: 10px;
}

.toggle-btn {
  flex: 1;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #f9fafb;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s ease;
}

.toggle-btn.active {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: #fff;
  border-color: transparent;
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.25);
}

.primary {
  width: 100%;
  padding: 12px 18px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: #fff;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.30);
}

.card {
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 10px;
  font-weight: 600;
  color: #1f2937;
}

.pdf-btn {
  width: 100%;
  padding: 11px 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.pdf-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.hint {
  display: block;
  margin-top: 8px;
  color: var(--muted);
  font-size: 13px;
}

@media (max-width: 980px) {
  .container {
    flex-direction: column;
    direction: rtl; /* در موبایل حالت معمول */
  }
  .results, .inputs {
    order: initial;
  }
}
