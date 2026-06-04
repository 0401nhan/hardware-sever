export function renderLoginPage() {
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Electric Bird Hardware Server</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #151c23;
      --panel: rgba(195, 201, 200, 0.5);
      --panel-edge: rgba(255, 255, 255, 0.64);
      --line: rgba(94, 99, 98, 0.28);
      --muted: #837a6c;
      --muted-strong: #6e685f;
      --accent: #b25b2c;
      --accent-light: #cf7b41;
      --accent-dark: #763112;
      --danger: #9f2d20;
      --shadow: 20px 26px 34px rgba(21, 24, 25, 0.27);
      --focus: #c86f38;
    }

    * { box-sizing: border-box; }

    body {
      position: relative;
      margin: 0;
      width: 100%;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      overflow: hidden;
      background:
        linear-gradient(135deg, #1c2630 0 39.6%, transparent 39.72%),
        linear-gradient(135deg, transparent 0 39.6%, #e8ebe8 39.72% 100%);
    }

    body::before {
      position: fixed;
      inset: 0;
      z-index: 0;
      background:
        linear-gradient(118deg, transparent 0 49.7%, rgba(142, 146, 143, 0.22) 49.8%, transparent 50.05%) 62% 0 / 46% 100% no-repeat,
        linear-gradient(118deg, transparent 0 49.5%, rgba(168, 170, 164, 0.22) 49.62%, transparent 49.88%) 70% 0 / 47% 100% no-repeat,
        linear-gradient(118deg, transparent 0 50%, rgba(100, 104, 101, 0.14) 50.1%, transparent 50.26%) 58% 0 / 55% 100% no-repeat,
        radial-gradient(circle at 45% 44%, rgba(255, 255, 255, 0.36), transparent 23%),
        linear-gradient(135deg, transparent 0 39.6%, rgba(255, 255, 255, 0.48) 39.72%, rgba(198, 203, 200, 0.62) 100%);
      content: "";
      pointer-events: none;
    }

    body::after {
      position: fixed;
      inset: 0;
      z-index: 0;
      background:
        linear-gradient(135deg, transparent 0 39.6%, rgba(255, 255, 255, 0.12) 39.72%, transparent 78%),
        repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.04) 0 1px, transparent 1px 3px);
      opacity: 0.22;
      content: "";
      pointer-events: none;
    }

    main {
      position: relative;
      z-index: 1;
      width: min(406px, calc(100vw - 32px));
      max-width: calc(100vw - 32px);
      min-height: 320px;
      padding: 20px 29px 23px;
      border: 1px solid var(--panel-edge);
      border-radius: 13px;
      background:
        linear-gradient(145deg, rgba(255, 255, 255, 0.35), rgba(171, 179, 178, 0.2)),
        var(--panel);
      box-shadow: var(--shadow);
      backdrop-filter: blur(10px) saturate(86%);
      -webkit-backdrop-filter: blur(10px) saturate(86%);
    }

    main::before,
    main::after {
      position: absolute;
      inset: 8px;
      border-radius: 10px;
      pointer-events: none;
      content: "";
    }

    main::before {
      border-top: 1px solid rgba(255, 255, 255, 0.5);
      border-left: 1px solid rgba(255, 255, 255, 0.38);
      box-shadow:
        inset -18px -20px 34px rgba(38, 44, 45, 0.1),
        inset 10px 12px 24px rgba(255, 255, 255, 0.18);
    }

    main::after {
      inset: auto 15px 10px;
      height: 16px;
      border-radius: 50%;
      background: rgba(34, 37, 38, 0.24);
      filter: blur(10px);
      transform: translateY(26px);
      z-index: -1;
    }

    .brand-row {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .brand-logo {
      display: block;
      width: min(306px, 100%);
      height: auto;
      filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.13));
    }

    form {
      display: grid;
      gap: 12px;
    }

    label {
      display: grid;
      gap: 4px;
      color: var(--muted-strong);
      font-size: 11px;
      font-weight: 600;
    }

    .input-row {
      display: grid;
      grid-template-columns: 20px minmax(0, 1fr);
      align-items: center;
      min-height: 30px;
      border-bottom: 1px solid var(--line);
      color: #a18d74;
    }

    .input-row svg {
      width: 15px;
      height: 15px;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
    }

    input {
      width: 100%;
      min-width: 0;
      height: 29px;
      border: 0;
      padding: 0;
      font: inherit;
      color: #57504a;
      background: transparent;
      outline: none;
    }

    input::placeholder {
      color: rgba(112, 103, 93, 0.58);
    }

    input:focus {
      color: var(--ink);
    }

    label:focus-within .input-row {
      border-color: var(--focus);
      box-shadow: 0 1px 0 rgba(200, 111, 56, 0.42);
    }

    .form-links {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      color: var(--muted);
      font-size: 11px;
      font-weight: 600;
    }

    .form-links span {
      min-width: 0;
    }

    button {
      width: 100%;
      height: 36px;
      border: 1px solid rgba(127, 54, 18, 0.28);
      border-radius: 15px;
      background:
        repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.035) 0 1px, transparent 1px 3px),
        linear-gradient(180deg, var(--accent-light), var(--accent));
      color: #f8eee8;
      font: inherit;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0;
      cursor: pointer;
      text-transform: uppercase;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.24),
        inset 0 -3px 0 rgba(91, 35, 11, 0.34),
        0 7px 10px rgba(66, 34, 20, 0.28);
      transition: transform 0.15s ease, filter 0.15s ease;
    }

    button:hover {
      filter: brightness(1.04);
      transform: translateY(-1px);
    }

    button:focus-visible {
      outline: 3px solid rgba(200, 111, 56, 0.26);
      outline-offset: 4px;
    }

    .error {
      min-height: 18px;
      color: var(--danger);
      font-size: 12px;
      font-weight: 700;
      text-align: center;
    }

    @media (max-width: 620px) {
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        overflow-x: hidden;
        overflow-y: auto;
        background:
          linear-gradient(135deg, #1c2630 0 30%, transparent 30.15%),
          linear-gradient(135deg, transparent 0 30%, #e8ebe8 30.15% 100%);
      }

      main {
        flex: 0 1 365px;
        width: calc(100vw - 32px);
        max-width: 365px;
        min-height: 318px;
        padding: 20px 22px 24px;
      }

      .brand-logo {
        width: min(286px, 100%);
      }
    }
  </style>
</head>
<body>
  <main>
    <div class="brand-row">
      <img class="brand-logo" src="/logo/logo-login-full.png" alt="electric bird">
    </div>
    <form id="loginForm">
      <label>
        Username
        <span class="input-row">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <input name="username" autocomplete="username" placeholder="admin" required>
        </span>
      </label>
      <label>
        Password
        <span class="input-row">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="7.5" cy="14" r="3.5" />
            <path d="M11 14h10" />
            <path d="M17 14v-3" />
            <path d="M20 14v-2" />
          </svg>
          <input name="password" type="password" autocomplete="current-password" placeholder="......." required>
        </span>
      </label>
      <div class="form-links">
        <span>Forgot password?</span>
        <span>Request access</span>
      </div>
      <button type="submit">Sign in</button>
      <div class="error" id="error"></div>
    </form>
  </main>
  <script>
    document.getElementById("loginForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password")
        })
      });
      if (response.ok) {
        location.href = "/";
        return;
      }
      const payload = await response.json().catch(() => ({}));
      document.getElementById("error").textContent = payload.error || "Login failed";
    });
  </script>
</body>
</html>`;
}

export function renderDashboardPage({ publicUrl }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Electric Bird Hardware Server</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f6f8;
      --surface: #ffffff;
      --surface-soft: #f8fafc;
      --line: #d9e1ea;
      --line-strong: #aeb8c5;
      --text: #16202a;
      --muted: #617084;
      --muted-strong: #344256;
      --accent: #f97316;
      --accent-strong: #ea580c;
      --accent-soft: #fff7ed;
      --blue: #2563eb;
      --blue-soft: #eff6ff;
      --danger: #b42318;
      --danger-soft: #fff1f0;
      --ok: #16833a;
      --ok-soft: #ecfdf3;
      --warning: #a15c07;
      --sidebar: #1d242d;
      --sidebar-strong: #111923;
      --sidebar-soft: rgba(255, 255, 255, 0.08);
      --shadow: 0 14px 34px rgba(16, 24, 40, 0.08);
      --focus: #2563eb;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background: linear-gradient(180deg, #f7f9fb 0%, var(--bg) 240px);
    }
    button, input, select, textarea { font: inherit; }
    button {
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 7px 10px;
      color: var(--muted-strong);
      background: #fff;
      cursor: pointer;
      font-weight: 700;
      line-height: 1.2;
      transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
    }
    button:hover { border-color: var(--line-strong); background: var(--surface-soft); }
    button.primary {
      border-color: var(--accent);
      background: var(--accent);
      color: #fff;
      box-shadow: 0 8px 18px rgba(249, 115, 22, 0.22);
    }
    button.primary:hover { border-color: var(--accent-strong); background: var(--accent-strong); }
    button.subtle { background: #fff; }
    button.danger { border-color: #fda29b; color: var(--danger); background: var(--danger-soft); }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
      box-shadow: none;
    }
    input, select, textarea {
      width: 100%;
      min-height: 38px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 0 10px;
      color: var(--text);
      background: #fff;
    }
    textarea {
      min-height: 460px;
      padding: 14px;
      resize: vertical;
      font-family: "Cascadia Code", Consolas, monospace;
      font-size: 13px;
      line-height: 1.45;
      tab-size: 2;
    }
    input:hover, select:hover, textarea:hover { border-color: var(--line-strong); }
    input:focus, select:focus, textarea:focus, button:focus-visible {
      outline: 3px solid rgba(37, 99, 235, 0.14);
      border-color: var(--focus);
    }
    label {
      display: grid;
      gap: 6px;
      color: var(--muted-strong);
      font-size: 12px;
      font-weight: 700;
    }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td {
      border-bottom: 1px solid var(--line);
      padding: 10px;
      text-align: left;
      vertical-align: top;
      font-size: 13px;
    }
    th {
      background: #f8fafc;
      color: var(--muted-strong);
      font-weight: 800;
    }
    td input, td select { min-width: 120px; }
    pre {
      margin: 0;
      overflow: auto;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fbfcfd;
      font-family: "Cascadia Code", Consolas, monospace;
      font-size: 12px;
      line-height: 1.45;
    }
    .hidden { display: none !important; }
    .icon-sprite {
      position: absolute;
      width: 0;
      height: 0;
      overflow: hidden;
    }
    .app-icon {
      width: 17px;
      height: 17px;
      flex: 0 0 auto;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .app-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 248px minmax(0, 1fr);
      background: var(--bg);
    }
    .sidebar {
      position: sticky;
      top: 0;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      background: linear-gradient(180deg, var(--sidebar) 0%, var(--sidebar-strong) 100%);
      color: #d8dee8;
      height: 100vh;
      min-height: 100vh;
    }
    .sidebar-brand {
      min-height: 72px;
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .brand-mark {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      border: 1px solid rgba(249, 115, 22, 0.42);
      border-radius: 8px;
      background: rgba(249, 115, 22, 0.14);
      color: #fff;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0;
    }
    .sidebar-brand > span:last-child { min-width: 0; }
    .sidebar-brand strong { display: block; color: #fff; font-size: 15px; font-weight: 800; }
    .sidebar-brand small { display: block; margin-top: 4px; color: #aab4c2; font-size: 12px; font-weight: 600; overflow-wrap: anywhere; }
    .sidebar-nav {
      display: grid;
      gap: 4px;
      padding: 12px 10px;
    }
    .nav-link, .nav-section {
      width: 100%;
      min-height: 42px;
      justify-content: flex-start;
      border-color: transparent;
      color: #c9d2df;
      background: transparent;
      box-shadow: none;
      text-align: left;
    }
    .nav-link:hover, .nav-section:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
    .nav-link.active, .nav-section.active {
      border-color: rgba(249, 115, 22, 0.38);
      background: rgba(249, 115, 22, 0.13);
      color: #fff;
      box-shadow: inset 3px 0 0 var(--accent);
    }
    .nav-icon {
      width: 24px;
      height: 24px;
      display: inline-grid;
      place-items: center;
      flex: 0 0 auto;
      color: #cfd7e3;
    }
    .nav-link.active .nav-icon { color: #fff; }
    .nav-child {
      display: none;
      gap: 2px;
      padding: 2px 0 8px 18px;
    }
    .nav-child.active { display: grid; }
    .nav-child a {
      min-height: 32px;
      display: flex;
      align-items: center;
      padding: 0 10px;
      border-radius: 6px;
      color: #aeb9c8;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
    }
    .nav-child a:hover, .nav-child a.active { background: rgba(255, 255, 255, 0.08); color: #fff; }
    .workspace { min-width: 0; }
    header.topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      min-height: 68px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 22px;
      border-bottom: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 1px 0 rgba(16, 24, 40, 0.04);
      backdrop-filter: blur(10px);
    }
    .topbar-title { min-width: 0; margin-right: auto; }
    .topbar-title strong {
      display: block;
      overflow: hidden;
      color: var(--text);
      font-size: 18px;
      font-weight: 800;
      line-height: 1.2;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .topbar-title span {
      display: block;
      overflow: hidden;
      margin-top: 3px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .topbar-meta, .topbar-actions, .status-chip {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      min-width: 0;
    }
    .topbar-item {
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface-soft);
      color: var(--muted-strong);
      font-size: 12px;
      font-weight: 700;
    }
    .status-chip {
      min-height: 34px;
      max-width: min(360px, 38vw);
      padding: 0 10px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: #fff;
    }
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #9aa8ae;
      flex: 0 0 auto;
    }
    .status-dot.ok { background: var(--ok); }
    .status-dot.error { background: var(--danger); }
    .status-text {
      min-width: 0;
      overflow: hidden;
      color: var(--muted-strong);
      font-size: 12px;
      font-weight: 700;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    main.content {
      max-width: 1480px;
      margin: 0 auto;
      padding: 22px;
    }
    .home-panel, .config-section {
      margin-bottom: 16px;
      padding: 20px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }
    .home-panel > p, .panel-title-row p {
      margin: 6px 0 0;
      color: var(--muted);
      font-weight: 600;
      line-height: 1.45;
    }
    .panel-title-row, .section-header, .device-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 16px;
    }
    .panel-title, h2 {
      margin: 0;
      color: var(--text);
      font-size: 18px;
      font-weight: 800;
    }
    .section-title p, .panel-title span {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
    }
    .actions, .template-actions, .register-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 8px;
    }
    .overview {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .metric, .gateway-card {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      background: linear-gradient(180deg, #fff 0%, #fbfcfd 100%);
      box-shadow: 0 6px 18px rgba(16, 24, 40, 0.05);
    }
    .metric span, .gateway-card span { display: block; color: var(--muted); font-size: 12px; font-weight: 700; }
    .metric strong { display: block; margin-top: 6px; color: var(--text); font-size: 22px; font-weight: 800; overflow-wrap: anywhere; }
    .gateway-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
    }
    .gateway-card {
      position: relative;
      display: grid;
      gap: 14px;
      overflow: hidden;
    }
    .gateway-card::before {
      position: absolute;
      inset: 0 auto 0 0;
      width: 4px;
      background: var(--line-strong);
      content: "";
    }
    .gateway-card.is-online::before { background: var(--ok); }
    .gateway-card.is-offline::before { background: #94a3b8; }
    .gateway-card.is-error::before { background: var(--danger); }
    .gateway-card-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .gateway-card strong {
      display: block;
      color: var(--text);
      font-size: 16px;
      font-weight: 800;
      overflow-wrap: anywhere;
    }
    .gateway-card p { margin: 4px 0 0; color: var(--muted); font-size: 12px; font-weight: 700; overflow-wrap: anywhere; }
    .gateway-stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .gateway-stat {
      min-height: 76px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
    }
    .gateway-stat span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
    }
    .gateway-stat strong {
      margin-top: 8px;
      font-size: 14px;
      line-height: 1.35;
    }
    .gateway-card-actions { justify-content: flex-end; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 28px;
      padding: 0 9px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface-soft);
      color: var(--muted-strong);
      font-size: 12px;
      font-weight: 800;
    }
    .badge::before {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
      content: "";
    }
    .badge.online { border-color: #8bd7a2; background: var(--ok-soft); color: var(--ok); }
    .badge.error { border-color: #fda29b; background: var(--danger-soft); color: var(--danger); }
    .badge.queued { border-color: #bfdbfe; background: var(--blue-soft); color: var(--blue); }
    .badge.delivered, .badge.running { border-color: #fed7aa; background: var(--accent-soft); color: var(--warning); }
    .badge.applied { border-color: #8bd7a2; background: var(--ok-soft); color: var(--ok); }
    .badge.failed { border-color: #fda29b; background: var(--danger-soft); color: var(--danger); }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }
    .wide { grid-column: span 2; }
    .inline-field {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
    }
    .table-wrap {
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      box-shadow: inset 0 0 0 1px rgba(16, 24, 40, 0.02);
    }
    .table-wrap table { min-width: 860px; }
    .device {
      margin-top: 14px;
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fbfcfd;
    }
    .device-head {
      padding-bottom: 12px;
      border-bottom: 1px solid var(--line);
    }
    .device-title strong { display: block; font-size: 16px; font-weight: 800; overflow-wrap: anywhere; }
    .device-title p { margin: 4px 0 0; color: var(--muted); font-size: 12px; font-weight: 700; overflow-wrap: anywhere; }
    .device[data-protocol-mode="modbus-rtu"] .tcp-field,
    .device[data-protocol-mode="modbus-tcp"] .rtu-field { display: none; }
    .registers-head {
      margin-top: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      border: 1px solid #bfdbfe;
      border-radius: 999px;
      background: var(--blue-soft);
      color: var(--blue);
      font-size: 12px;
      font-weight: 800;
    }
    .register-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      min-height: 42px;
      margin-top: 12px;
      padding: 10px;
      border: 1px dashed var(--line-strong);
      border-radius: 8px;
      background: #fff;
    }
    .register-chip {
      display: inline-flex;
      align-items: center;
      min-height: 26px;
      max-width: 220px;
      padding: 3px 9px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface-soft);
      color: var(--muted-strong);
      font-size: 12px;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tab-panel, .subtab-panel { display: none; }
    .tab-panel.active, .subtab-panel.active { display: block; }
    .monitor-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 14px;
    }
    .monitor-card {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 8px 20px rgba(16, 24, 40, 0.06);
      overflow: hidden;
    }
    .monitor-head {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 12px;
      border-bottom: 1px solid var(--line);
      background: #fbfcfd;
    }
    .monitor-title strong { display: block; font-size: 14px; font-weight: 800; }
    .monitor-title span { display: block; margin-top: 3px; color: var(--muted); font-size: 12px; font-weight: 700; }
    .monitor-body { padding: 12px; }
    .monitor-table { min-width: 0; table-layout: auto; }
    .control-layout {
      display: grid;
      grid-template-columns: minmax(240px, 340px) minmax(0, 1fr);
      gap: 14px;
      align-items: end;
    }
    .control-stack {
      display: grid;
      gap: 14px;
    }
    .control-actions {
      display: grid;
      grid-template-columns: repeat(4, minmax(120px, 1fr));
      gap: 8px;
    }
    .limit-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(140px, 1fr));
      gap: 12px;
      align-items: end;
    }
    .command-detail {
      overflow-wrap: anywhere;
      color: var(--muted-strong);
      font-weight: 700;
    }
    .empty-state {
      padding: 22px;
      border: 1px dashed var(--line-strong);
      border-radius: 8px;
      background: #fbfcfd;
      color: var(--muted);
      font-weight: 700;
    }
    @media (max-width: 1100px) {
      .app-shell { grid-template-columns: 220px minmax(0, 1fr); }
      .overview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 820px) {
      .app-shell { display: block; }
      .sidebar { position: sticky; top: 0; z-index: 30; height: auto; min-height: auto; }
      .sidebar-brand { min-height: 58px; padding: 10px 12px; }
      .brand-mark { width: 34px; height: 34px; }
      .sidebar-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; padding: 8px; }
      .nav-link { min-height: 40px; padding: 7px 8px; }
      .nav-child { grid-column: 1 / -1; padding: 0; }
      .nav-child.active { display: flex; gap: 6px; overflow-x: auto; }
      .nav-child a { flex: 0 0 auto; border: 1px solid rgba(255, 255, 255, 0.08); }
      header.topbar { position: static; align-items: stretch; flex-direction: column; gap: 10px; padding: 12px; }
      main.content { padding: 14px; }
      .status-chip { max-width: 100%; }
      .control-layout, .limit-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 620px) {
      .overview, .grid, .gateway-grid { grid-template-columns: 1fr; }
      .wide { grid-column: span 1; }
      .gateway-stats { grid-template-columns: 1fr; }
      .section-header, .device-head, .panel-title-row { flex-direction: column; }
      .actions, .template-actions, .topbar-actions { width: 100%; }
      .actions button, .topbar-actions button { flex: 1 1 120px; }
      .inline-field { grid-template-columns: 1fr; }
      .control-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <svg class="icon-sprite" aria-hidden="true">
    <symbol id="icon-home" viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path></symbol>
    <symbol id="icon-server" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="6" rx="2"></rect><rect x="4" y="14" width="16" height="6" rx="2"></rect><path d="M8 7h.01M8 17h.01"></path></symbol>
    <symbol id="icon-monitor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 16v4"></path></symbol>
    <symbol id="icon-sliders" viewBox="0 0 24 24"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"></path><path d="M2 14h4M10 8h4M18 16h4"></path></symbol>
    <symbol id="icon-activity" viewBox="0 0 24 24"><path d="M3 12h4l3-7 4 14 3-7h4"></path></symbol>
    <symbol id="icon-database" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="7" ry="3"></ellipse><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"></path></symbol>
    <symbol id="icon-refresh" viewBox="0 0 24 24"><path d="M20 11a8 8 0 0 0-14.7-4.4L3 9"></path><path d="M3 4v5h5"></path><path d="M4 13a8 8 0 0 0 14.7 4.4L21 15"></path><path d="M21 20v-5h-5"></path></symbol>
    <symbol id="icon-log-out" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5"></path><path d="M15 12H3"></path><path d="M21 19V5a2 2 0 0 0-2-2h-4"></path></symbol>
    <symbol id="icon-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></symbol>
    <symbol id="icon-arrow-left" viewBox="0 0 24 24"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></symbol>
  </svg>
  <div id="homeView" class="app-shell">
    <aside class="sidebar" aria-label="Fleet navigation">
      <div class="sidebar-brand">
        <span class="brand-mark">EB</span>
        <span>
          <strong>Hardware Server</strong>
          <small>${escapeHtml(publicUrl)}</small>
        </span>
      </div>
      <nav class="sidebar-nav">
        <button class="nav-link active" type="button"><span class="nav-icon"><svg class="app-icon"><use href="#icon-home"></use></svg></span>Gateway Home</button>
      </nav>
    </aside>
    <div class="workspace">
      <header class="topbar">
        <div class="topbar-title">
          <strong>Gateway Home</strong>
          <span>Select a gateway to open the remote config workspace</span>
        </div>
        <div class="topbar-meta">
          <button id="homeRefreshBtn" class="subtle" type="button"><svg class="app-icon"><use href="#icon-refresh"></use></svg>Refresh</button>
          <button id="homeLogoutBtn" class="subtle" type="button"><svg class="app-icon"><use href="#icon-log-out"></use></svg>Logout</button>
        </div>
      </header>
      <main class="content">
        <section class="home-panel">
          <div class="panel-title-row">
            <div>
              <h2 class="panel-title">Gateways</h2>
              <p>Auto-provisioned hardware appears here after the first heartbeat.</p>
            </div>
            <div class="actions">
              <button id="addManualGatewayBtn" class="subtle" type="button"><svg class="app-icon"><use href="#icon-plus"></use></svg>Add Manual Gateway</button>
            </div>
          </div>
          <div id="gatewayHomeGrid" class="gateway-grid"></div>
        </section>
        <section id="manualGatewayPanel" class="home-panel hidden">
          <div class="section-header">
            <div class="section-title">
              <h2>Manual Gateway</h2>
              <p>Use this only when you need to pre-create a gateway.</p>
            </div>
          </div>
          <form class="grid" id="gatewayForm">
            <label>Gateway ID<input name="id" required></label>
            <label>Name<input name="name"></label>
            <label>Site<input name="site"></label>
            <label>Token<input name="token" required></label>
            <div class="actions"><button class="primary" type="submit">Save Gateway</button></div>
          </form>
        </section>
      </main>
    </div>
  </div>

  <div id="remoteView" class="app-shell hidden">
    <aside class="sidebar" aria-label="Remote gateway navigation">
      <div class="sidebar-brand">
        <span class="brand-mark">MD</span>
        <span>
          <strong>Monitoring Device</strong>
          <small>Electricbird Remote</small>
        </span>
      </div>
      <nav class="sidebar-nav">
        <button id="backHomeBtn" class="nav-link" type="button"><span class="nav-icon"><svg class="app-icon"><use href="#icon-arrow-left"></use></svg></span>Gateway Home</button>
        <button class="nav-link active" type="button" data-tab-target="generalInformation"><span class="nav-icon"><svg class="app-icon"><use href="#icon-home"></use></svg></span>General Information</button>
        <div class="nav-child active" data-child-menu="generalInformation">
          <a class="active" href="#overviewSubtab" data-parent-tab="generalInformation" data-subtab-target="overviewSubtab">Overview</a>
          <a href="#stationDeviceOverviewSubtab" data-parent-tab="generalInformation" data-subtab-target="stationDeviceOverviewSubtab">Station Device Overview</a>
        </div>
        <button class="nav-link" type="button" data-tab-target="deviceMonitoringTab"><span class="nav-icon"><svg class="app-icon"><use href="#icon-monitor"></use></svg></span>Device Monitoring</button>
        <button class="nav-link" type="button" data-tab-target="inverterControlTab"><span class="nav-icon"><svg class="app-icon"><use href="#icon-activity"></use></svg></span>Inverter Control</button>
        <button class="nav-link" type="button" data-tab-target="settingCommunication"><span class="nav-icon"><svg class="app-icon"><use href="#icon-sliders"></use></svg></span>Setting Communication</button>
        <div class="nav-child" data-child-menu="settingCommunication">
          <a class="active" href="#gatewaySubtab" data-parent-tab="settingCommunication" data-subtab-target="gatewaySubtab">Gateway</a>
          <a href="#rs485PortsSubtab" data-parent-tab="settingCommunication" data-subtab-target="rs485PortsSubtab">RS485 Ports</a>
          <a href="#modbusDevicesSubtab" data-parent-tab="settingCommunication" data-subtab-target="modbusDevicesSubtab">Modbus Devices</a>
          <a href="#rawYamlSubtab" data-parent-tab="settingCommunication" data-subtab-target="rawYamlSubtab">Raw YAML</a>
        </div>
        <button class="nav-link" type="button" data-tab-target="libraryTab"><span class="nav-icon"><svg class="app-icon"><use href="#icon-database"></use></svg></span>Library</button>
      </nav>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <div class="topbar-title">
          <strong id="activePageTitle">Overview</strong>
          <span id="activePageSubtitle">Gateway status and configured capacity</span>
        </div>
        <div class="topbar-meta">
          <span class="topbar-item"><svg class="app-icon"><use href="#icon-server"></use></svg>Gateway <span id="topGatewayId">-</span></span>
          <span class="topbar-item">Version <span id="topConfigVersion">-</span></span>
          <div class="topbar-actions">
            <button id="remoteRefreshBtn" class="subtle" type="button"><svg class="app-icon"><use href="#icon-refresh"></use></svg>Refresh</button>
            <button id="logoutBtn" class="subtle" type="button"><svg class="app-icon"><use href="#icon-log-out"></use></svg>Logout</button>
          </div>
          <div class="status-chip">
            <span id="statusDot" class="status-dot"></span>
            <span id="statusText" class="status-text">Loading...</span>
          </div>
        </div>
      </header>

      <main class="content">
        <div id="generalInformation" class="tab-panel active" data-tab-panel>
          <div id="overviewSubtab" class="subtab-panel active" data-subtab-panel="generalInformation">
            <section class="home-panel">
              <div class="panel-title-row">
                <h2 class="panel-title">Overview</h2>
                <button class="subtle" type="button" data-parent-tab="generalInformation" data-subtab-target="stationDeviceOverviewSubtab">Details</button>
              </div>
              <div class="overview">
                <div class="metric"><span>Gateway</span><strong id="dashboardGateway">-</strong></div>
                <div class="metric"><span>Online Devices</span><strong id="dashboardOnlineCount">0</strong></div>
                <div class="metric"><span>RS485 Ports</span><strong id="dashboardPortCount">0</strong></div>
                <div class="metric"><span>Station Devices</span><strong id="dashboardDeviceCount">0</strong></div>
              </div>
            </section>
          </div>
          <div id="stationDeviceOverviewSubtab" class="subtab-panel" data-subtab-panel="generalInformation">
            <section class="home-panel">
              <div class="panel-title-row">
                <h2 class="panel-title">Station Device Overview <span>( Online <b id="dashboardOnlineInline">0</b>, Offline <b id="dashboardOfflineInline">0</b> )</span></h2>
              </div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Port</th>
                      <th>Device Name</th>
                      <th>Slave ID</th>
                      <th>Online Status</th>
                      <th>Device Model</th>
                      <th>Register Points</th>
                    </tr>
                  </thead>
                  <tbody id="dashboardDevices"></tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        <div id="deviceMonitoringTab" class="tab-panel" data-tab-panel>
          <section class="home-panel">
            <div class="panel-title-row">
              <h2 class="panel-title">Device Monitoring <span id="monitoringSummary">Waiting for readings</span></h2>
              <div class="actions"><span id="monitoringUpdated" class="topbar-item">Last refresh: -</span></div>
            </div>
            <div id="monitoringDevices" class="monitor-grid"></div>
          </section>
        </div>

        <div id="inverterControlTab" class="tab-panel" data-tab-panel>
          <section class="home-panel">
            <div class="panel-title-row">
              <h2 class="panel-title">Inverter Control</h2>
            </div>
            <div class="control-layout">
              <label>Device
                <select id="controlDeviceName"></select>
              </label>
              <div class="control-stack">
                <div class="control-actions">
                  <button class="primary" type="button" data-control-action="start">Start</button>
                  <button class="danger" type="button" data-control-action="stop">Stop</button>
                  <button class="subtle" type="button" data-control-action="reboot">Reboot</button>
                  <button class="subtle" type="button" data-control-action="clear_power_limit">Clear Limit</button>
                </div>
                <form id="powerLimitForm" class="limit-grid">
                  <label>Limit Type
                    <select id="powerLimitMode">
                      <option value="percent">Percent</option>
                      <option value="kw">kW</option>
                      <option value="watts">W</option>
                    </select>
                  </label>
                  <label>Limit Value<input id="powerLimitValue" type="number" min="0" step="0.1" value="60"></label>
                  <label>Duration Minutes<input id="powerLimitDurationMinutes" type="number" min="1" max="1440" step="1" value="15"></label>
                  <button class="primary" type="submit">Apply Limit</button>
                </form>
              </div>
            </div>
          </section>

          <section class="home-panel">
            <div class="panel-title-row">
              <h2 class="panel-title">Command History</h2>
              <div class="actions">
                <button id="commandRefreshBtn" class="subtle" type="button"><svg class="app-icon"><use href="#icon-refresh"></use></svg>Refresh</button>
              </div>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>Action</th>
                    <th>Status</th>
                    <th>Details</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody id="commandHistoryBody"></tbody>
              </table>
            </div>
          </section>
        </div>

        <div id="settingCommunication" class="tab-panel" data-tab-panel>
          <div id="gatewaySubtab" class="subtab-panel active" data-subtab-panel="settingCommunication">
            <section class="overview">
              <div class="metric"><span>Gateway</span><strong id="summaryGateway">-</strong></div>
              <div class="metric"><span>Server</span><strong id="summaryServer">-</strong></div>
              <div class="metric"><span>Ports</span><strong id="summaryPorts">0</strong></div>
              <div class="metric"><span>Devices</span><strong id="summaryDevices">0</strong></div>
            </section>
            <section class="config-section">
              <div class="section-header">
                <div class="section-title">
                  <h2>Gateway</h2>
                  <p>Send device data to the server and control upload behavior.</p>
                </div>
                <div class="actions">
                  <button class="subtle" type="button" data-parent-tab="settingCommunication" data-subtab-target="rawYamlSubtab">Raw YAML</button>
                  <button class="primary" type="button" data-save-config>Save New Version</button>
                </div>
              </div>
              <div class="grid">
                <label>Gateway ID <input id="gatewayId" autocomplete="off"></label>
                <label>Gateway ID path <input id="gatewayIdPath" autocomplete="off"></label>
                <label>Poll loop delay ms <input id="pollLoopDelayMs" type="number" min="50" step="50"></label>
                <label class="wide">Server URL <input id="serverUrl" autocomplete="url"></label>
                <label>Token env <input id="tokenEnv" autocomplete="off"></label>
                <label>Timeout ms <input id="timeoutMs" type="number" min="100"></label>
                <label>Batch size <input id="batchSize" type="number" min="1"></label>
                <label>Upload interval ms <input id="uploadIntervalMs" type="number" min="500"></label>
                <label class="wide">Remote Config URL <input id="remoteConfigUrl" autocomplete="url"></label>
                <label>Remote enabled <select id="remoteConfigEnabled"><option value="true">true</option><option value="false">false</option></select></label>
                <label>Remote token env <input id="remoteConfigTokenEnv" autocomplete="off"></label>
                <label>Remote check ms <input id="remoteConfigCheckIntervalMs" type="number" min="5000" step="1000"></label>
                <label>Remote timeout ms <input id="remoteConfigTimeoutMs" type="number" min="1000" step="1000"></label>
                <label class="wide">Remote state path <input id="remoteConfigStatePath" autocomplete="off"></label>
                <label>Mongo enabled <select id="mongoEnabled"><option value="false">false</option><option value="true">true</option></select></label>
                <label>Mongo URI env <input id="mongoUriEnv" autocomplete="off"></label>
                <label>Mongo DB env <input id="mongoDbNameEnv" autocomplete="off"></label>
                <label>Mongo DB name <input id="mongoDbName" autocomplete="off"></label>
                <label>Mongo check ms <input id="mongoCheckIntervalMs" type="number" min="5000" step="1000"></label>
                <label>Mongo upload ms <input id="mongoUploadIntervalMs" type="number" min="500" step="500"></label>
                <label>Mongo batch size <input id="mongoBatchSize" type="number" min="1"></label>
                <label class="wide">Mongo state path <input id="mongoStatePath" autocomplete="off"></label>
                <label class="wide">Queue path <input id="queuePath" autocomplete="off"></label>
              </div>
            </section>
          </div>

          <div id="rs485PortsSubtab" class="subtab-panel" data-subtab-panel="settingCommunication">
            <section class="config-section">
              <div class="section-header">
                <div class="section-title">
                  <h2>RS485 Ports</h2>
                  <p>Serial port and Modbus RTU connection settings.</p>
                </div>
                <div class="actions">
                  <button id="addPortBtn" class="subtle" type="button"><svg class="app-icon"><use href="#icon-plus"></use></svg>Add Port</button>
                  <button class="primary" type="button" data-save-config>Save New Version</button>
                </div>
              </div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Path</th>
                      <th>Baud</th>
                      <th>Parity</th>
                      <th>Data</th>
                      <th>Stop</th>
                      <th>Timeout</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody id="portsBody"></tbody>
                </table>
              </div>
            </section>
          </div>

          <div id="modbusDevicesSubtab" class="subtab-panel" data-subtab-panel="settingCommunication">
            <section class="config-section">
              <div class="section-header">
                <div class="section-title">
                  <h2>Modbus Devices</h2>
                  <p>Devices, slave IDs, polling intervals, and register maps on RS485 ports.</p>
                </div>
                <div class="actions template-actions">
                  <select id="newDeviceTemplate" aria-label="Device template"><option value="">Blank device</option></select>
                  <button id="addDeviceBtn" class="subtle" type="button"><svg class="app-icon"><use href="#icon-plus"></use></svg>Add Device</button>
                  <button class="primary" type="button" data-save-config>Save New Version</button>
                </div>
              </div>
              <div id="devices"></div>
            </section>
          </div>

          <div id="rawYamlSubtab" class="subtab-panel" data-subtab-panel="settingCommunication">
            <section class="config-section">
              <div class="section-header">
                <div class="section-title">
                  <h2>Raw YAML</h2>
                  <p>Remote config document that will become the next cloud config version.</p>
                </div>
                <div class="actions"><button class="primary" type="button" data-save-config>Save New Version</button></div>
              </div>
              <textarea id="rawYaml" class="raw" readonly></textarea>
            </section>
          </div>
        </div>

        <div id="libraryTab" class="tab-panel" data-tab-panel>
          <section class="config-section">
            <div class="section-header">
              <div class="section-title">
                <h2>Library</h2>
                <p>Add, edit, and delete Modbus reading templates used by Modbus Devices.</p>
              </div>
              <div class="actions">
                <button id="refreshTemplatesBtn" class="subtle" type="button"><svg class="app-icon"><use href="#icon-refresh"></use></svg>Refresh Library</button>
                <button id="addTemplateBtn" class="subtle" type="button"><svg class="app-icon"><use href="#icon-plus"></use></svg>Add Template</button>
                <button id="saveTemplatesBtn" class="primary" type="button">Save Library</button>
              </div>
            </div>
            <div id="templateLibrary"></div>
          </section>
        </div>
      </main>
    </div>
  </div>

  <script>
    const publicUrl = ${JSON.stringify(publicUrl)};
    let gateways = [];
    let selectedId = "";
    let selectedGateway = null;
    let selectedConfigVersion = null;
    let state = null;
    let telemetry = { time: null, devices: [] };
    let commands = [];
    let selectedControlDevice = "";
    let templates = [];
    const expandedDeviceRegisters = new Set();
    const expandedTemplateRegisters = new Set();

    const el = (id) => document.getElementById(id);
    const templateTypeOptions = [
      { value: "inverter", label: "Inverter" },
      { value: "meter", label: "Meter" },
      { value: "weatherstation", label: "WeatherStation" },
      { value: "datalogger", label: "Datalogger" },
      { value: "other", label: "Other" },
    ];
    const tabIds = ["generalInformation", "deviceMonitoringTab", "inverterControlTab", "settingCommunication", "libraryTab"];
    const defaultSubtabs = {
      generalInformation: "overviewSubtab",
      settingCommunication: "gatewaySubtab",
    };
    const subtabParents = {
      overviewSubtab: "generalInformation",
      stationDeviceOverviewSubtab: "generalInformation",
      gatewaySubtab: "settingCommunication",
      rs485PortsSubtab: "settingCommunication",
      modbusDevicesSubtab: "settingCommunication",
      rawYamlSubtab: "settingCommunication",
    };
    const pageLabels = {
      overviewSubtab: ["Overview", "Gateway status and configured capacity"],
      stationDeviceOverviewSubtab: ["Station Device Overview", "Connection state for every configured device"],
      deviceMonitoringTab: ["Device Monitoring", "Latest uploaded telemetry records"],
      inverterControlTab: ["Inverter Control", "Queued actions and latest command state"],
      gatewaySubtab: ["Gateway", "Server upload, queue, and polling behavior"],
      rs485PortsSubtab: ["RS485 Ports", "Serial settings used by Modbus RTU devices"],
      modbusDevicesSubtab: ["Modbus Devices", "Device identity, connection mode, and register maps"],
      rawYamlSubtab: ["Raw YAML", "Current cloud config payload"],
      libraryTab: ["Library", "Reusable Modbus device templates"],
    };

    function setStatus(message, type = "") {
      el("statusText").textContent = message;
      el("statusDot").className = "status-dot " + type;
    }

    async function requestJson(url, options = {}) {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) {
        location.assign("/login");
        throw new Error(payload.error || "Authentication required");
      }
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "Request failed");
      }
      return payload;
    }

    async function loadGateways() {
      const [gatewayPayload, templatePayload] = await Promise.all([
        requestJson("/api/gateways"),
        requestJson("/api/device-templates"),
      ]);
      gateways = gatewayPayload.gateways || [];
      templates = templatePayload.templates || [];
      renderHome();
    }

    function renderHome() {
      const grid = el("gatewayHomeGrid");
      if (!gateways.length) {
        grid.innerHTML = '<div class="empty-state">No gateways yet. Power on hardware and it will auto-register here.</div>';
        return;
      }

      grid.innerHTML = gateways.map((gateway) => {
        const status = gateway.status || "offline";
        return \`
          <article class="gateway-card is-\${escapeHtml(status)}">
            <div class="gateway-card-head">
              <div>
                <strong>\${escapeHtml(gateway.name || gateway.id)}</strong>
                <p>\${escapeHtml(gateway.site || "No site")} | \${escapeHtml(gateway.id)}</p>
              </div>
              <span class="badge \${escapeHtml(status)}">\${escapeHtml(status)}</span>
            </div>
            <div class="gateway-stats">
              <div class="gateway-stat"><span>Last seen</span><strong>\${escapeHtml(formatDateTime(gateway.lastSeenAt))}</strong></div>
              <div class="gateway-stat"><span>Config</span><strong>\${escapeHtml((gateway.appliedConfigVersion || "-") + " / " + (gateway.desiredConfigVersion || gateway.latestConfigVersion || "-"))}</strong></div>
            </div>
            <div class="actions gateway-card-actions">
              <button class="primary" type="button" data-remote-gateway="\${escapeHtml(gateway.id)}"><svg class="app-icon"><use href="#icon-monitor"></use></svg>Remote</button>
            </div>
          </article>
        \`;
      }).join("");
    }

    async function openRemote(gatewayId) {
      selectedId = gatewayId;
      selectedGateway = gateways.find((gateway) => gateway.id === gatewayId) || { id: gatewayId };
      el("homeView").classList.add("hidden");
      el("remoteView").classList.remove("hidden");
      setStatus("Loading...");

      const [configPayload, telemetryPayload, commandPayload] = await Promise.all([
        requestJson("/api/gateways/" + encodeURIComponent(gatewayId) + "/config"),
        requestJson("/api/gateways/" + encodeURIComponent(gatewayId) + "/telemetry/latest"),
        requestJson("/api/gateways/" + encodeURIComponent(gatewayId) + "/commands"),
      ]);

      selectedConfigVersion = configPayload.version;
      state = configPayload.config || defaultConfig(gatewayId);
      telemetry = {
        time: telemetryPayload.records?.[0]?.createdAt || null,
        devices: telemetryRecordsToDevices(telemetryPayload.records || []),
      };
      commands = commandPayload.commands || [];

      el("topGatewayId").textContent = gatewayId;
      el("topConfigVersion").textContent = selectedConfigVersion || "-";
      render();
      showTab("generalInformation", false, "overviewSubtab");
      setStatus("Remote config loaded", "ok");
    }

    function backHome() {
      el("remoteView").classList.add("hidden");
      el("homeView").classList.remove("hidden");
      selectedId = "";
      selectedGateway = null;
      state = null;
      loadGateways().catch((error) => console.error(error));
    }

    function defaultConfig(gatewayId) {
      return {
        gateway: { id: gatewayId, idPath: "/data/gateway-id", pollLoopDelayMs: 250 },
        server: {
          url: publicUrl.replace(/\\/+$/, "") + "/api/telemetry",
          tokenEnv: "SERVER_TOKEN",
          timeoutMs: 10000,
          batchSize: 100,
          uploadIntervalMs: 5000,
        },
        remoteConfig: {
          enabled: true,
          url: publicUrl.replace(/\\/+$/, "") + "/api/gateway",
          tokenEnv: "GATEWAY_TOKEN",
          checkIntervalMs: 30000,
          timeoutMs: 10000,
          statePath: "/data/remote-config-state.json",
        },
        mongo: {
          enabled: false,
          uriEnv: "MONGODB_URI",
          dbNameEnv: "MONGODB_DB",
          dbName: "hardware_gateway",
          checkIntervalMs: 30000,
          uploadIntervalMs: 5000,
          batchSize: 100,
          statePath: "/data/mongo-sync-state.json",
        },
        storage: {
          queuePath: "/data/queue.jsonl",
          queue: {
            maxRecords: 100000,
            maxBytes: 52428800,
            retentionMs: 604800000,
            compactIntervalMs: 60000,
            corruptPath: "/data/queue.jsonl.corrupt",
          },
        },
        ports: {},
        devices: [],
      };
    }

    function render() {
      if (!state) return;

      el("gatewayId").value = state.gateway?.id || selectedId;
      el("gatewayIdPath").value = state.gateway?.idPath || "/data/gateway-id";
      el("pollLoopDelayMs").value = state.gateway?.pollLoopDelayMs ?? 250;
      el("serverUrl").value = state.server?.url || "";
      el("tokenEnv").value = state.server?.tokenEnv || "SERVER_TOKEN";
      el("timeoutMs").value = state.server?.timeoutMs ?? 10000;
      el("batchSize").value = state.server?.batchSize ?? 100;
      el("uploadIntervalMs").value = state.server?.uploadIntervalMs ?? 5000;
      el("remoteConfigEnabled").value = String(state.remoteConfig?.enabled ?? true);
      el("remoteConfigUrl").value = state.remoteConfig?.url || "";
      el("remoteConfigTokenEnv").value = state.remoteConfig?.tokenEnv || "GATEWAY_TOKEN";
      el("remoteConfigCheckIntervalMs").value = state.remoteConfig?.checkIntervalMs ?? 30000;
      el("remoteConfigTimeoutMs").value = state.remoteConfig?.timeoutMs ?? 10000;
      el("remoteConfigStatePath").value = state.remoteConfig?.statePath || "/data/remote-config-state.json";
      el("mongoEnabled").value = String(state.mongo?.enabled ?? false);
      el("mongoUriEnv").value = state.mongo?.uriEnv || "MONGODB_URI";
      el("mongoDbNameEnv").value = state.mongo?.dbNameEnv || "MONGODB_DB";
      el("mongoDbName").value = state.mongo?.dbName || "hardware_gateway";
      el("mongoCheckIntervalMs").value = state.mongo?.checkIntervalMs ?? 30000;
      el("mongoUploadIntervalMs").value = state.mongo?.uploadIntervalMs ?? 5000;
      el("mongoBatchSize").value = state.mongo?.batchSize ?? 100;
      el("mongoStatePath").value = state.mongo?.statePath || "/data/mongo-sync-state.json";
      el("queuePath").value = state.storage?.queuePath || "/data/queue.jsonl";
      el("rawYaml").value = stringifyConfig(state);

      renderSummary();
      renderDashboard();
      renderMonitoring();
      renderInverterControl();
      renderTemplatePicker();
      renderTemplateLibrary();
      renderPorts();
      renderDevices();
    }

    function renderSummary() {
      const portCount = Object.keys(state.ports || {}).length;
      const deviceCount = (state.devices || []).length;
      const serverUrl = state.server?.url || "";

      el("summaryGateway").textContent = state.gateway?.id || "-";
      el("summaryServer").textContent = hostFromUrl(serverUrl);
      el("summaryPorts").textContent = String(portCount);
      el("summaryDevices").textContent = String(deviceCount);
    }

    function renderDashboard() {
      const ports = Object.keys(state.ports || {});
      const devices = state.devices || [];
      const readings = telemetryDeviceMap();
      const onlineCount = devices.filter((device) => readings.get(device.name)?.status === "online").length;
      const offlineCount = Math.max(devices.length - onlineCount, 0);

      el("dashboardGateway").textContent = state.gateway?.id || "-";
      el("dashboardPortCount").textContent = String(ports.length);
      el("dashboardDeviceCount").textContent = String(devices.length);
      el("dashboardOnlineCount").textContent = String(onlineCount);
      el("dashboardOfflineInline").textContent = String(offlineCount);
      el("dashboardOnlineInline").textContent = String(onlineCount);

      const body = el("dashboardDevices");
      if (!devices.length) {
        body.innerHTML = '<tr><td colspan="6">No devices configured</td></tr>';
        return;
      }

      body.innerHTML = devices.map((device) => {
        const reading = readings.get(device.name);
        const status = runtimeStatus(reading);
        const model = [device.manufacturer, device.model].filter(Boolean).join(" - ") || device.type || "-";
        return \`
          <tr>
            <td>\${escapeHtml(device.port || "-")}</td>
            <td>\${escapeHtml(device.name || "-")}</td>
            <td>\${escapeHtml(device.slaveId ?? device.unitId ?? "-")}</td>
            <td><span class="badge \${escapeHtml(status.className)}">\${escapeHtml(status.label)}</span></td>
            <td>\${escapeHtml(model)}</td>
            <td>\${(device.registers || []).length}</td>
          </tr>
        \`;
      }).join("");
    }

    function renderMonitoring() {
      const container = el("monitoringDevices");
      const devices = state.devices || [];
      const readings = telemetryDeviceMap();
      const onlineCount = devices.filter((device) => readings.get(device.name)?.status === "online").length;

      el("monitoringSummary").textContent = "Online " + onlineCount + " / " + devices.length;
      el("monitoringUpdated").textContent = "Last refresh: " + formatDateTime(telemetry.time);

      if (!devices.length) {
        container.innerHTML = '<div class="empty-state">No devices configured</div>';
        return;
      }

      container.innerHTML = devices.map((device) => {
        const reading = readings.get(device.name);
        const status = runtimeStatus(reading);
        const measurements = reading?.measurements || {};
        const rows = Object.entries(measurements).slice(0, 8).map(([key, value]) => \`
          <tr><td>\${escapeHtml(key)}</td><td>\${escapeHtml(formatMeasurement(value))}</td></tr>
        \`).join("") || '<tr><td colspan="2">No latest measurements</td></tr>';

        return \`
          <article class="monitor-card">
            <div class="monitor-head">
              <div class="monitor-title">
                <strong>\${escapeHtml(device.name || "-")}</strong>
                <span>\${escapeHtml(deviceSubtitle(device))}</span>
              </div>
              <span class="badge \${escapeHtml(status.className)}">\${escapeHtml(status.label)}</span>
            </div>
            <div class="monitor-body">
              <table class="monitor-table"><tbody>\${rows}</tbody></table>
            </div>
          </article>
        \`;
      }).join("");
    }

    function renderInverterControl() {
      const deviceSelect = el("controlDeviceName");
      const devices = inverterControlDevices();
      const disabled = !devices.length;

      if (disabled) {
        deviceSelect.innerHTML = '<option value="">No inverter device</option>';
        selectedControlDevice = "";
      } else {
        if (!devices.some((device) => device.name === selectedControlDevice)) {
          selectedControlDevice = devices[0].name;
        }
        deviceSelect.innerHTML = devices.map((device) => option(device.name, selectedControlDevice, device.name + " | " + deviceSubtitle(device))).join("");
        deviceSelect.value = selectedControlDevice;
      }

      document.querySelectorAll("[data-control-action], #powerLimitForm button").forEach((button) => {
        button.disabled = disabled;
      });
      renderCommandHistory();
    }

    function inverterControlDevices() {
      const devices = state.devices || [];
      return devices.filter((device) => {
        const text = [device.category, device.type, device.manufacturer, device.model, device.templateId].filter(Boolean).join(" ").toLowerCase();
        const hasControlRegister = (device.registers || []).some((register) => {
          const name = String(register.name || "").toLowerCase();
          const access = String(register.access || "ro").toLowerCase();
          return access !== "ro" && [
            "startup_command",
            "shutdown_command",
            "active_power_percentage_derating_percent",
            "active_power_limit_kw",
            "active_power_limit_w",
            "schedule_instruction_valid_duration_s",
          ].includes(name);
        });

        return text.includes("inverter") || text.includes("sun2000") || text.includes("huawei") || hasControlRegister;
      });
    }

    function renderCommandHistory() {
      const body = el("commandHistoryBody");
      if (!commands.length) {
        body.innerHTML = '<tr><td colspan="5">No commands yet</td></tr>';
        return;
      }

      body.innerHTML = commands.map((command) => \`
        <tr>
          <td>\${escapeHtml(formatDateTime(command.createdAt))}</td>
          <td>\${escapeHtml(actionLabel(command.action))}</td>
          <td><span class="badge \${escapeHtml(command.status || "queued")}">\${escapeHtml(command.status || "queued")}</span></td>
          <td class="command-detail">\${escapeHtml(commandDetail(command))}</td>
          <td>\${escapeHtml(formatDateTime(command.completedAt || command.updatedAt || command.deliveredAt))}</td>
        </tr>
      \`).join("");
    }

    async function refreshCommands() {
      if (!selectedId) return;
      const payload = await requestJson("/api/gateways/" + encodeURIComponent(selectedId) + "/commands");
      commands = payload.commands || [];
      renderCommandHistory();
      setStatus("Command history refreshed", "ok");
    }

    async function queueInverterControl(action, extra = {}) {
      if (!selectedId) return;
      const deviceName = el("controlDeviceName").value;
      if (!deviceName) {
        setStatus("No inverter device selected", "error");
        return;
      }

      setStatus("Queueing " + actionLabel(action) + "...");
      const payload = await requestJson("/api/gateways/" + encodeURIComponent(selectedId) + "/control", {
        method: "POST",
        body: JSON.stringify({
          deviceName,
          action,
          ...extra,
        }),
      });

      commands = [payload.command, ...commands.filter((command) => command.id !== payload.command.id)].slice(0, 100);
      renderCommandHistory();
      setStatus("Queued " + actionLabel(payload.command.action), "ok");
    }

    function submitPowerLimitForm() {
      const mode = el("powerLimitMode").value;
      const value = Number(el("powerLimitValue").value);
      const durationMinutes = Number(el("powerLimitDurationMinutes").value);

      if (!["percent", "kw", "watts"].includes(mode)) {
        setStatus("Invalid limit type", "error");
        return;
      }
      if (!Number.isFinite(value) || value < 0) {
        setStatus("Limit value must be zero or higher", "error");
        return;
      }
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > 1440) {
        setStatus("Duration must be between 1 and 1440 minutes", "error");
        return;
      }

      queueInverterControl("limit_power", {
        [mode]: value,
        durationMinutes,
      }).catch((error) => setStatus(error.message, "error"));
    }

    function actionLabel(action) {
      const labels = {
        start: "Start",
        stop: "Stop",
        reboot: "Reboot",
        limit_power: "Limit Power",
        clear_power_limit: "Clear Limit",
      };
      return labels[action] || action || "-";
    }

    function commandDetail(command) {
      const payload = command.payload || {};
      const parts = [payload.deviceName || payload.device].filter(Boolean);
      if (payload.percent !== undefined) parts.push(payload.percent + "%");
      if (payload.kw !== undefined) parts.push(payload.kw + " kW");
      if (payload.watts !== undefined) parts.push(payload.watts + " W");
      if (payload.durationMinutes !== undefined) parts.push(payload.durationMinutes + " min");
      if (payload.durationSeconds !== undefined) parts.push(payload.durationSeconds + " sec");
      if (payload.delayMs !== undefined) parts.push(payload.delayMs + " ms delay");
      if (command.message) parts.push(command.message);
      return parts.join(" | ") || "-";
    }

    function renderTemplatePicker() {
      el("newDeviceTemplate").innerHTML = '<option value="">Blank device</option>' +
        templates.map((template) => option(template.id, template.id, template.label)).join("");
    }

    function renderTemplateLibrary() {
      const container = el("templateLibrary");
      container.innerHTML = "";

      if (!templates.length) {
        container.innerHTML = '<div class="empty-state">No templates in library</div>';
        return;
      }

      templates.forEach((template, index) => {
        const registersExpanded = expandedTemplateRegisters.has(String(index));
        const section = document.createElement("div");
        section.className = "device";
        section.innerHTML =
          '<div class="device-head">' +
            '<div class="device-title">' +
              '<strong>' + escapeHtml(template.label || template.id || "Template " + (index + 1)) + '</strong>' +
              '<p>' + escapeHtml(template.id || "-") + ' | ' + (template.registers || []).length + ' registers</p>' +
            '</div>' +
            '<button type="button" class="danger" data-remove-template="' + index + '">Remove Template</button>' +
          '</div>' +
          '<div class="grid">' +
            '<label>ID <input data-template="' + index + '" data-field="id" value="' + escapeHtml(template.id || "") + '" autocomplete="off"></label>' +
            '<label>Label <input data-template="' + index + '" data-field="label" value="' + escapeHtml(template.label || "") + '" autocomplete="off"></label>' +
            '<label>Manufacturer <input data-template="' + index + '" data-field="manufacturer" value="' + escapeHtml(template.manufacturer || "") + '"></label>' +
            '<label>Model <input data-template="' + index + '" data-field="model" value="' + escapeHtml(template.model || "") + '"></label>' +
            '<label>Category <input data-template="' + index + '" data-field="category" value="' + escapeHtml(template.category || "") + '"></label>' +
            '<label>Type <select data-template="' + index + '" data-field="type">' + templateTypeOptionsHtml(template.type, template.category) + '</select></label>' +
            '<label>Protocol <input data-template="' + index + '" data-field="protocol" value="' + escapeHtml(template.protocol || "modbus-rtu") + '"></label>' +
            '<label>Poll ms <input data-template="' + index + '" data-field="pollIntervalMs" type="number" min="500" value="' + (template.pollIntervalMs || 5000) + '"></label>' +
            '<label class="wide">Notes <input data-template="' + index + '" data-field="notes" value="' + escapeHtml(template.notes || "") + '"></label>' +
          '</div>' +
          '<div class="registers-head">' +
            '<span class="pill">' + (template.registers || []).length + ' registers</span>' +
            '<div class="register-actions">' +
              '<button class="subtle" type="button" data-toggle-template-registers="' + index + '">' + (registersExpanded ? "Hide Registers" : "Edit Registers") + '</button>' +
              (registersExpanded ? '<button class="subtle" type="button" data-add-template-register="' + index + '">Add Register</button>' : "") +
            '</div>' +
          '</div>' +
          (registersExpanded ? renderTemplateRegisterTable(index, template.registers || []) : renderRegisterPreview(template.registers || []));
        container.appendChild(section);
      });
    }

    function renderTemplateRegisterTable(templateIndex, registers) {
      return '<div class="table-wrap register-editor" style="margin-top: 12px;">' +
        '<table>' +
          '<thead>' +
            '<tr>' +
              '<th>Name</th>' +
              '<th>Function</th>' +
              '<th>Access</th>' +
              '<th>Poll</th>' +
              '<th>Address</th>' +
              '<th>Length</th>' +
              '<th>Type</th>' +
              '<th>Word</th>' +
              '<th>Scale</th>' +
              '<th>Offset</th>' +
              '<th>Unit</th>' +
              '<th></th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + registers.map((register, registerIndex) => renderTemplateRegisterRow(templateIndex, registerIndex, register)).join("") + '</tbody>' +
        '</table>' +
      '</div>';
    }

    function renderTemplateRegisterRow(templateIndex, registerIndex, register) {
      return '<tr>' +
        '<td><input data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="name" value="' + escapeHtml(register.name || "") + '"></td>' +
        '<td><select data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="function">' + ["holding", "input"].map((item) => option(item, register.function || "holding")).join("") + '</select></td>' +
        '<td><select data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="access">' + ["ro", "rw", "wo"].map((item) => option(item, register.access || "ro")).join("") + '</select></td>' +
        '<td><input data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="poll" type="checkbox" ' + (register.poll === false ? "" : "checked") + '></td>' +
        '<td><input data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="address" type="number" min="0" value="' + (register.address || 0) + '"></td>' +
        '<td><input data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="length" type="number" min="1" value="' + (register.length || 1) + '"></td>' +
        '<td><select data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="type">' + ["uint16", "int16", "uint32", "int32", "uint64", "int64", "float32", "float64", "string", "bytes", "bitfield16", "bitfield32"].map((item) => option(item, register.type || "uint16")).join("") + '</select></td>' +
        '<td><select data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="wordOrder">' + ["", "be", "le", "high-low", "low-high"].map((item) => option(item, register.wordOrder || "", item || "default")).join("") + '</select></td>' +
        '<td><input data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="scale" type="number" step="any" value="' + (register.scale ?? 1) + '"></td>' +
        '<td><input data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="offset" type="number" step="any" value="' + (register.offset ?? "") + '"></td>' +
        '<td><input data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="unit" value="' + escapeHtml(register.unit || "") + '"></td>' +
        '<td><button type="button" class="danger" data-remove-template-register="' + templateIndex + ':' + registerIndex + '">Remove</button></td>' +
      '</tr>';
    }

    function templateTypeOptionsHtml(type, category = "") {
      const selected = normalizedTemplateType(type, category);
      return templateTypeOptions.map((item) => option(item.value, selected, item.label)).join("");
    }

    function normalizedTemplateType(type, category = "") {
      const categoryKey = compactType(category);
      const typeKey = compactType(type);
      const known = ["inverter", "meter", "weatherstation", "datalogger", "other"];
      if (known.includes(typeKey)) return typeKey;
      if (known.includes(categoryKey)) return categoryKey;
      if (typeKey.includes("inverter")) return "inverter";
      if (typeKey.includes("meter")) return "meter";
      if (typeKey.includes("weather")) return "weatherstation";
      if (typeKey.includes("logger")) return "datalogger";
      return "other";
    }

    function compactType(value) {
      return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    function renderPorts() {
      const body = el("portsBody");
      body.innerHTML = "";

      for (const [name, port] of Object.entries(state.ports || {})) {
        const row = document.createElement("tr");
        row.innerHTML = \`
          <td><input data-port="\${escapeHtml(name)}" data-field="name" value="\${escapeHtml(name)}"></td>
          <td><input data-port="\${escapeHtml(name)}" data-field="path" value="\${escapeHtml(port.path || "")}"></td>
          <td><input data-port="\${escapeHtml(name)}" data-field="baudRate" type="number" value="\${port.baudRate || 9600}"></td>
          <td><select data-port="\${escapeHtml(name)}" data-field="parity">\${["none", "even", "odd", "mark", "space"].map((item) => option(item, port.parity || "none")).join("")}</select></td>
          <td><input data-port="\${escapeHtml(name)}" data-field="dataBits" type="number" value="\${port.dataBits || 8}"></td>
          <td><input data-port="\${escapeHtml(name)}" data-field="stopBits" type="number" value="\${port.stopBits || 1}"></td>
          <td><input data-port="\${escapeHtml(name)}" data-field="timeoutMs" type="number" value="\${port.timeoutMs || 1000}"></td>
          <td><button type="button" data-remove-port="\${escapeHtml(name)}" class="danger">Remove</button></td>
        \`;
        body.appendChild(row);
      }
    }

    function renderDevices() {
      const container = el("devices");
      container.innerHTML = "";

      if (!(state.devices || []).length) {
        container.innerHTML = '<div class="empty-state">No devices configured</div>';
        return;
      }

      (state.devices || []).forEach((device, index) => {
        const ports = Object.keys(state.ports || {});
        const protocolMode = device.protocol || "modbus-rtu";
        const registersExpanded = expandedDeviceRegisters.has(String(index));
        const section = document.createElement("div");
        section.className = "device";
        section.dataset.protocolMode = protocolMode;
        section.innerHTML = \`
          <div class="device-head">
            <div class="device-title">
              <strong>\${escapeHtml(device.name || "device_" + (index + 1))}</strong>
              <p>\${escapeHtml(deviceSubtitle(device))}</p>
            </div>
            <button type="button" class="danger" data-remove-device="\${index}">Remove Device</button>
          </div>
          <div class="grid">
            <label class="wide">Template
              <div class="inline-field">
                <select data-device="\${index}" data-field="templateId">
                  <option value="">Custom device</option>
                  \${templates.map((template) => option(template.id, selectedTemplateId(device), template.label)).join("")}
                </select>
                <button class="subtle" type="button" data-apply-template="\${index}">Apply</button>
              </div>
            </label>
            <label>Name <input data-device="\${index}" data-field="name" value="\${escapeHtml(device.name || "")}"></label>
            <label>Type <input data-device="\${index}" data-field="type" value="\${escapeHtml(device.type || "")}"></label>
            <label>Manufacturer <input data-device="\${index}" data-field="manufacturer" value="\${escapeHtml(device.manufacturer || "")}"></label>
            <label>Model <input data-device="\${index}" data-field="model" value="\${escapeHtml(device.model || "")}"></label>
            <label>Category <input data-device="\${index}" data-field="category" value="\${escapeHtml(device.category || "")}"></label>
            <label>Protocol <select data-device="\${index}" data-field="protocol">\${["modbus-rtu", "modbus-tcp"].map((name) => option(name, device.protocol || "modbus-rtu")).join("")}</select></label>
            <label class="rtu-field">Port <select data-device="\${index}" data-field="port"><option value="">None</option>\${ports.map((name) => option(name, device.port)).join("")}</select></label>
            <label class="rtu-field">Slave ID <input data-device="\${index}" data-field="slaveId" type="number" min="1" max="247" value="\${device.slaveId || 1}"></label>
            <label class="tcp-field">Host <input data-device="\${index}" data-field="host" value="\${escapeHtml(device.host || "")}" placeholder="192.168.1.50 or hostname"></label>
            <label class="tcp-field">TCP Port <input data-device="\${index}" data-field="tcpPort" type="number" min="1" max="65535" value="\${device.tcpPort || 502}"></label>
            <label class="tcp-field">Unit ID <input data-device="\${index}" data-field="unitId" type="number" min="1" max="247" value="\${device.unitId || device.slaveId || 3}"></label>
            <label>Poll ms <input data-device="\${index}" data-field="pollIntervalMs" type="number" min="500" value="\${device.pollIntervalMs || 5000}"></label>
          </div>
          <div class="registers-head">
            <span class="pill">\${(device.registers || []).length} registers</span>
            <div class="register-actions">
              <button class="subtle" type="button" data-toggle-device-registers="\${index}">\${registersExpanded ? "Hide Registers" : "Edit Registers"}</button>
              \${registersExpanded ? \`<button class="subtle" type="button" data-add-register="\${index}">Add Register</button>\` : ""}
            </div>
          </div>
          \${registersExpanded ? renderRegisterTable(index, device.registers || []) : renderRegisterPreview(device.registers || [])}
        \`;
        container.appendChild(section);
      });
    }

    function renderRegisterTable(deviceIndex, registers) {
      return \`
        <div class="table-wrap register-editor" style="margin-top: 12px;">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Function</th>
                <th>Access</th>
                <th>Poll</th>
                <th>Address</th>
                <th>Length</th>
                <th>Type</th>
                <th>Scale</th>
                <th>Unit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>\${registers.map((register, registerIndex) => renderRegisterRow(deviceIndex, registerIndex, register)).join("")}</tbody>
          </table>
        </div>
      \`;
    }

    function renderRegisterRow(deviceIndex, registerIndex, register) {
      return \`
        <tr>
          <td><input data-device="\${deviceIndex}" data-register="\${registerIndex}" data-field="name" value="\${escapeHtml(register.name || "")}"></td>
          <td><select data-device="\${deviceIndex}" data-register="\${registerIndex}" data-field="function">\${["holding", "input"].map((item) => option(item, register.function || "holding")).join("")}</select></td>
          <td><select data-device="\${deviceIndex}" data-register="\${registerIndex}" data-field="access">\${["ro", "rw", "wo"].map((item) => option(item, register.access || "ro")).join("")}</select></td>
          <td><input data-device="\${deviceIndex}" data-register="\${registerIndex}" data-field="poll" type="checkbox" \${register.poll === false ? "" : "checked"}></td>
          <td><input data-device="\${deviceIndex}" data-register="\${registerIndex}" data-field="address" type="number" min="0" value="\${register.address || 0}"></td>
          <td><input data-device="\${deviceIndex}" data-register="\${registerIndex}" data-field="length" type="number" min="1" value="\${register.length || 1}"></td>
          <td><select data-device="\${deviceIndex}" data-register="\${registerIndex}" data-field="type">\${["uint16", "int16", "uint32", "int32", "uint64", "int64", "float32", "float64", "string", "bytes", "bitfield16", "bitfield32"].map((item) => option(item, register.type || "uint16")).join("")}</select></td>
          <td><input data-device="\${deviceIndex}" data-register="\${registerIndex}" data-field="scale" type="number" step="any" value="\${register.scale ?? 1}"></td>
          <td><input data-device="\${deviceIndex}" data-register="\${registerIndex}" data-field="unit" value="\${escapeHtml(register.unit || "")}"></td>
          <td><button type="button" class="danger" data-remove-register="\${deviceIndex}:\${registerIndex}">Remove</button></td>
        </tr>
      \`;
    }

    function renderRegisterPreview(registers) {
      if (!registers.length) return '<div class="register-preview"><span class="register-chip">No registers</span></div>';
      const visible = registers.slice(0, 8);
      const remaining = registers.length - visible.length;
      return \`
        <div class="register-preview">
          \${visible.map((register) => \`<span class="register-chip">\${escapeHtml(register.name || "-")}</span>\`).join("")}
          \${remaining > 0 ? \`<span class="register-chip">+\${remaining} more</span>\` : ""}
        </div>
      \`;
    }

    function collectTemplateLibrary() {
      document.querySelectorAll("[data-template][data-field]:not([data-template-register])").forEach((input) => {
        const template = templates[Number(input.dataset.template)];
        if (!template) return;
        template[input.dataset.field] = coerceInput(input);
      });

      document.querySelectorAll("[data-template][data-template-register][data-field]").forEach((input) => {
        const template = templates[Number(input.dataset.template)];
        const register = template?.registers?.[Number(input.dataset.templateRegister)];
        if (!register) return;

        const field = input.dataset.field;
        if (field === "wordOrder" && !input.value.trim()) {
          delete register.wordOrder;
          return;
        }
        if (field === "offset" && !input.value.trim()) {
          delete register.offset;
          return;
        }
        register[field] = coerceInput(input);
      });

      return templates;
    }

    function collectConfig() {
      state.gateway = {
        id: el("gatewayId").value.trim(),
        idPath: el("gatewayIdPath").value.trim(),
        pollLoopDelayMs: numberValue("pollLoopDelayMs"),
      };
      state.server = {
        url: el("serverUrl").value.trim(),
        tokenEnv: el("tokenEnv").value.trim(),
        timeoutMs: numberValue("timeoutMs"),
        batchSize: numberValue("batchSize"),
        uploadIntervalMs: numberValue("uploadIntervalMs"),
      };
      state.remoteConfig = {
        enabled: el("remoteConfigEnabled").value === "true",
        url: el("remoteConfigUrl").value.trim(),
        tokenEnv: el("remoteConfigTokenEnv").value.trim(),
        checkIntervalMs: numberValue("remoteConfigCheckIntervalMs"),
        timeoutMs: numberValue("remoteConfigTimeoutMs"),
        statePath: el("remoteConfigStatePath").value.trim(),
      };
      state.mongo = {
        enabled: el("mongoEnabled").value === "true",
        uriEnv: el("mongoUriEnv").value.trim(),
        dbNameEnv: el("mongoDbNameEnv").value.trim(),
        dbName: el("mongoDbName").value.trim(),
        checkIntervalMs: numberValue("mongoCheckIntervalMs"),
        uploadIntervalMs: numberValue("mongoUploadIntervalMs"),
        batchSize: numberValue("mongoBatchSize"),
        statePath: el("mongoStatePath").value.trim(),
      };
      state.storage = {
        ...(state.storage || {}),
        queuePath: el("queuePath").value.trim(),
      };
      state.ports = state.ports || {};
      state.devices = state.devices || [];

      document.querySelectorAll("[data-port]").forEach((input) => {
        const oldName = input.dataset.port;
        const field = input.dataset.field;
        if (field === "name") return;
        state.ports[oldName] = state.ports[oldName] || {};
        state.ports[oldName][field] = coerceInput(input);
      });

      document.querySelectorAll("[data-port][data-field='name']").forEach((input) => {
        const oldName = input.dataset.port;
        const nextName = input.value.trim();
        if (!nextName || nextName === oldName) return;
        state.ports[nextName] = state.ports[oldName];
        delete state.ports[oldName];
        for (const device of state.devices) {
          if (device.port === oldName) device.port = nextName;
        }
      });

      document.querySelectorAll("[data-device]:not([data-register])").forEach((input) => {
        const device = state.devices[Number(input.dataset.device)];
        if (!device) return;
        device[input.dataset.field] = coerceInput(input);
      });

      document.querySelectorAll("[data-device][data-register]").forEach((input) => {
        const device = state.devices[Number(input.dataset.device)];
        const register = device?.registers?.[Number(input.dataset.register)];
        if (!register) return;
        register[input.dataset.field] = coerceInput(input);
      });

      return state;
    }

    async function saveConfig() {
      if (!selectedId) return;
      setStatus("Saving...");
      collectConfig();
      const payload = await requestJson("/api/gateways/" + encodeURIComponent(selectedId) + "/config", {
        method: "PUT",
        body: JSON.stringify({ config: state, restart_required: true }),
      });
      selectedConfigVersion = payload.version;
      el("topConfigVersion").textContent = selectedConfigVersion || "-";
      el("rawYaml").value = stringifyConfig(state);
      setStatus("Config version " + payload.version + " created", "ok");
      await loadGateways();
    }

    function selectedTemplateId(device) {
      if (device.templateId && templates.some((template) => template.id === device.templateId)) {
        return device.templateId;
      }

      const match = templates.find((template) => {
        const sameMakeModel = template.manufacturer &&
          template.model &&
          template.manufacturer === device.manufacturer &&
          template.model === device.model;

        return sameMakeModel || template.type === device.type || template.label === device.type;
      });

      return match?.id || "";
    }

    function addPort() {
      collectConfig();
      let index = Object.keys(state.ports || {}).length + 1;
      let name = "rs485_" + index;
      while (state.ports[name]) {
        index += 1;
        name = "rs485_" + index;
      }
      state.ports[name] = {
        path: "/dev/rs485-" + index,
        baudRate: 9600,
        parity: "none",
        dataBits: 8,
        stopBits: 1,
        timeoutMs: 1000,
      };
      render();
    }

    function addDevice() {
      collectConfig();
      const ports = Object.keys(state.ports || {});
      const index = (state.devices || []).length + 1;
      const template = templates.find((item) => item.id === el("newDeviceTemplate").value);

      state.devices.push(template ? deviceFromTemplate(template, index, ports) : {
        name: "device_" + index,
        type: "meter",
        protocol: "modbus-rtu",
        port: ports[0] || "rs485_1",
        slaveId: index,
        pollIntervalMs: 5000,
        registers: [defaultRegister()],
      });
      render();
    }

    function applyTemplate(deviceIndex) {
      collectConfig();
      const device = state.devices[deviceIndex];
      const template = templates.find((item) => item.id === device.templateId);

      if (!template) {
        setStatus("Select a template before applying", "error");
        return;
      }

      const ports = Object.keys(state.ports || {});
      state.devices[deviceIndex] = deviceFromTemplate(template, deviceIndex + 1, ports, device);
      render();
      setStatus("Applied " + template.label, "ok");
    }

    function addTemplate() {
      collectTemplateLibrary();
      const index = templates.length + 1;
      templates.push({
        id: "template_" + index,
        label: "New Template " + index,
        manufacturer: "",
        model: "",
        category: "meter",
        type: "meter",
        protocol: "modbus-rtu",
        pollIntervalMs: 5000,
        notes: "",
        registers: [defaultRegister()],
      });
      expandedTemplateRegisters.add(String(templates.length - 1));
      renderTemplatePicker();
      renderTemplateLibrary();
      setStatus("Added template", "ok");
    }

    function removeTemplate(index) {
      collectTemplateLibrary();
      templates.splice(index, 1);
      expandedTemplateRegisters.clear();
      renderTemplatePicker();
      renderTemplateLibrary();
      setStatus("Removed template", "ok");
    }

    function toggleTemplateRegisters(index) {
      collectTemplateLibrary();
      const key = String(index);
      if (expandedTemplateRegisters.has(key)) expandedTemplateRegisters.delete(key);
      else expandedTemplateRegisters.add(key);
      renderTemplatePicker();
      renderTemplateLibrary();
    }

    function addTemplateRegister(templateIndex) {
      collectTemplateLibrary();
      templates[templateIndex].registers = templates[templateIndex].registers || [];
      templates[templateIndex].registers.push(defaultRegister());
      expandedTemplateRegisters.add(String(templateIndex));
      renderTemplateLibrary();
    }

    function removeTemplateRegister(value) {
      collectTemplateLibrary();
      const [templateIndex, registerIndex] = value.split(":").map(Number);
      templates[templateIndex]?.registers?.splice(registerIndex, 1);
      expandedTemplateRegisters.add(String(templateIndex));
      renderTemplateLibrary();
    }

    async function saveTemplateLibrary() {
      setStatus("Saving template library...");
      collectTemplateLibrary();
      const payload = await requestJson("/api/device-templates", {
        method: "PUT",
        body: JSON.stringify({ templates }),
      });
      templates = payload.templates || [];
      expandedTemplateRegisters.clear();
      renderTemplatePicker();
      renderTemplateLibrary();
      setStatus("Template library saved" + (payload.path ? " to " + payload.path : ""), "ok");
    }

    async function refreshTemplateLibrary() {
      setStatus("Refreshing template library...");
      const payload = await requestJson("/api/device-templates");
      templates = payload.templates || [];
      expandedTemplateRegisters.clear();
      renderTemplatePicker();
      renderTemplateLibrary();
      setStatus("Template library refreshed", "ok");
    }

    function removePort(name) {
      collectConfig();
      delete state.ports[name];
      render();
    }

    function removeDevice(index) {
      collectConfig();
      state.devices.splice(index, 1);
      expandedDeviceRegisters.clear();
      render();
    }

    function toggleDeviceRegisters(index) {
      collectConfig();
      const key = String(index);
      if (expandedDeviceRegisters.has(key)) expandedDeviceRegisters.delete(key);
      else expandedDeviceRegisters.add(key);
      renderDevices();
    }

    function addRegister(deviceIndex) {
      collectConfig();
      state.devices[deviceIndex].registers = state.devices[deviceIndex].registers || [];
      state.devices[deviceIndex].registers.push(defaultRegister());
      expandedDeviceRegisters.add(String(deviceIndex));
      render();
    }

    function removeRegister(value) {
      collectConfig();
      const [deviceIndex, registerIndex] = value.split(":").map(Number);
      state.devices[deviceIndex]?.registers?.splice(registerIndex, 1);
      expandedDeviceRegisters.add(String(deviceIndex));
      render();
    }

    function defaultRegister() {
      return {
        name: "value",
        function: "holding",
        address: 0,
        length: 1,
        type: "uint16",
        scale: 1,
        unit: "",
        access: "ro",
        poll: true,
      };
    }

    function deviceFromTemplate(template, index, ports, existing = {}) {
      const existingRegisters = Array.isArray(existing.registers) ? existing.registers : [];
      const templateRegisters = Array.isArray(template.registers) ? template.registers : [];
      const protocol = template.protocol || existing.protocol || "modbus-rtu";
      const isTcp = protocol === "modbus-tcp";

      return {
        ...existing,
        name: existing.name || deviceNameFromTemplate(template, index),
        type: template.type || existing.type || "device",
        manufacturer: template.manufacturer || existing.manufacturer || "",
        model: template.model || existing.model || "",
        category: template.category || existing.category || "",
        templateId: template.id,
        protocol,
        port: isTcp ? existing.port || "" : existing.port || ports[0] || "rs485_1",
        slaveId: isTcp ? existing.slaveId || existing.unitId || 3 : existing.slaveId || index,
        host: isTcp ? existing.host || "" : existing.host || "",
        tcpPort: isTcp ? existing.tcpPort || 502 : existing.tcpPort || 502,
        unitId: isTcp ? existing.unitId || existing.slaveId || 3 : existing.unitId || existing.slaveId || index,
        pollIntervalMs: template.pollIntervalMs || existing.pollIntervalMs || 5000,
        registers: cloneRegisters(templateRegisters.length ? templateRegisters : existingRegisters.length ? existingRegisters : [defaultRegister()]),
      };
    }

    function deviceNameFromTemplate(template, index) {
      const base = slugIdentifier(template.model || template.label || template.type || "device");
      return (base || "device") + "_" + index;
    }

    function slugIdentifier(value) {
      return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    }

    function cloneRegisters(registers) {
      return registers.map((register) => ({ ...register }));
    }

    function showTab(tabId, updateHash = true, subtabId = null) {
      const activeTab = tabIds.includes(tabId) ? tabId : "generalInformation";
      const activeSubtab = subtabId || defaultSubtabs[activeTab] || null;

      document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
        panel.classList.toggle("active", panel.id === activeTab);
      });
      document.querySelectorAll("[data-tab-target]").forEach((target) => {
        target.classList.toggle("active", target.dataset.tabTarget === activeTab);
      });
      document.querySelectorAll("[data-subtab-panel]").forEach((panel) => {
        panel.classList.toggle("active", panel.id === activeSubtab);
      });
      document.querySelectorAll("[data-subtab-target]").forEach((target) => {
        target.classList.toggle("active", target.dataset.subtabTarget === activeSubtab);
      });
      document.querySelectorAll("[data-child-menu]").forEach((menu) => {
        menu.classList.toggle("active", menu.dataset.childMenu === activeTab);
      });

      const label = pageLabels[activeSubtab || activeTab] || pageLabels.overviewSubtab;
      el("activePageTitle").textContent = label[0];
      el("activePageSubtitle").textContent = label[1];

      const nextHash = activeSubtab || activeTab;
      if (updateHash && location.hash !== "#" + nextHash) history.replaceState(null, "", "#" + nextHash);
    }

    function telemetryRecordsToDevices(records) {
      const devices = new Map();
      for (const item of records) {
        const record = item.record || item;
        const device = record.device || {};
        const name = device.name;
        if (!name || devices.has(name)) continue;
        devices.set(name, {
          name,
          status: Object.keys(record.measurements || {}).length ? "online" : "waiting",
          measurements: record.measurements || {},
          units: record.units || {},
          lastSeenAt: item.createdAt || record.collected_at,
        });
      }
      return [...devices.values()];
    }

    function telemetryDeviceMap() {
      return new Map((telemetry.devices || []).map((device) => [device.name, device]));
    }

    function runtimeStatus(reading) {
      if (reading?.status === "online") return { label: "Online", className: "online" };
      if (reading?.status === "error") return { label: "Error", className: "error" };
      return { label: "Waiting", className: "" };
    }

    function deviceSubtitle(device) {
      const makeModel = [device.manufacturer, device.model].filter(Boolean).join(" - ");
      const identity = makeModel || device.type || "modbus";
      if (device.protocol === "modbus-tcp") {
        return identity + " | TCP " + (device.host || "-") + " | unit " + (device.unitId || device.slaveId || 3);
      }
      return identity + " | RTU port " + (device.port || "-") + " | slave " + (device.slaveId || 1);
    }

    function hostFromUrl(value) {
      if (!value) return "-";
      try { return new URL(value).host || value; } catch { return value; }
    }

    function numberValue(id) {
      const value = Number(el(id).value);
      return Number.isFinite(value) ? value : 0;
    }

    function coerceInput(input) {
      if (input.type === "checkbox") {
        return input.checked;
      }
      if (input.type === "number") {
        const value = Number(input.value);
        return Number.isFinite(value) ? value : 0;
      }
      return input.value.trim();
    }

    function option(value, selected, label = value) {
      return '<option value="' + escapeHtml(value) + '" ' + (value === selected ? "selected" : "") + '>' + escapeHtml(label) + '</option>';
    }

    function stringifyConfig(config) {
      return toYaml(config).trimEnd() + "\\n";
    }

    function toYaml(value, indent = 0) {
      const pad = " ".repeat(indent);
      if (Array.isArray(value)) {
        if (!value.length) return pad + "[]\\n";
        return value.map((item) => {
          if (item && typeof item === "object") {
            return pad + "-\\n" + toYaml(item, indent + 2);
          }
          return pad + "- " + yamlScalar(item) + "\\n";
        }).join("");
      }
      if (value && typeof value === "object") {
        const entries = Object.entries(value);
        if (!entries.length) return pad + "{}\\n";
        return entries.map(([key, item]) => {
          if (item && typeof item === "object") {
            return pad + key + ":\\n" + toYaml(item, indent + 2);
          }
          return pad + key + ": " + yamlScalar(item) + "\\n";
        }).join("");
      }
      return pad + yamlScalar(value) + "\\n";
    }

    function yamlScalar(value) {
      if (value === null || value === undefined) return "null";
      if (typeof value === "number" || typeof value === "boolean") return String(value);
      const text = String(value);
      if (!text) return '""';
      if (/[:#\\[\\]{},&*?|>'"%@\\n\\r\\t]/.test(text) || /^[-?]\\s/.test(text) || /^\\s|\\s$/.test(text)) {
        return JSON.stringify(text);
      }
      return text;
    }

    function formatMeasurement(value) {
      if (typeof value === "number") {
        return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "").replace(/\\.$/, "");
      }
      return value ?? "-";
    }

    function formatDateTime(value) {
      if (!value) return "-";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleString();
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    document.addEventListener("click", (event) => {
      const target = event.target.closest("button, a");
      if (!target) return;

      if (target.dataset.remoteGateway) {
        openRemote(target.dataset.remoteGateway).catch((error) => setStatus(error.message, "error"));
        return;
      }
      if (target.id === "backHomeBtn") {
        backHome();
        return;
      }
      if (target.dataset.subtabTarget) {
        event.preventDefault();
        showTab(target.dataset.parentTab, true, target.dataset.subtabTarget);
        return;
      }
      if (target.dataset.tabTarget) {
        event.preventDefault();
        showTab(target.dataset.tabTarget, true, defaultSubtabs[target.dataset.tabTarget]);
        return;
      }
      if (target.id === "homeRefreshBtn") loadGateways().catch((error) => console.error(error));
      if (target.id === "remoteRefreshBtn" && selectedId) openRemote(selectedId).catch((error) => setStatus(error.message, "error"));
      if (target.id === "commandRefreshBtn") refreshCommands().catch((error) => setStatus(error.message, "error"));
      if (target.id === "homeLogoutBtn" || target.id === "logoutBtn") logout().catch((error) => console.error(error));
      if (target.id === "addManualGatewayBtn") el("manualGatewayPanel").classList.toggle("hidden");
      if (target.dataset.saveConfig !== undefined) saveConfig().catch((error) => setStatus(error.message, "error"));
      if (target.dataset.controlAction) {
        const action = target.dataset.controlAction;
        if (["stop", "reboot"].includes(action) && !confirm("Queue " + actionLabel(action) + " for " + (el("controlDeviceName").value || "selected inverter") + "?")) return;
        queueInverterControl(action).catch((error) => setStatus(error.message, "error"));
      }
      if (target.id === "addPortBtn") addPort();
      if (target.id === "addDeviceBtn") addDevice();
      if (target.id === "addTemplateBtn") addTemplate();
      if (target.id === "saveTemplatesBtn") saveTemplateLibrary().catch((error) => setStatus(error.message, "error"));
      if (target.id === "refreshTemplatesBtn") refreshTemplateLibrary().catch((error) => setStatus(error.message, "error"));
      if (target.dataset.applyTemplate) applyTemplate(Number(target.dataset.applyTemplate));
      if (target.dataset.removePort) removePort(target.dataset.removePort);
      if (target.dataset.removeDevice) removeDevice(Number(target.dataset.removeDevice));
      if (target.dataset.toggleDeviceRegisters) toggleDeviceRegisters(Number(target.dataset.toggleDeviceRegisters));
      if (target.dataset.addRegister) addRegister(Number(target.dataset.addRegister));
      if (target.dataset.removeRegister) removeRegister(target.dataset.removeRegister);
      if (target.dataset.removeTemplate) removeTemplate(Number(target.dataset.removeTemplate));
      if (target.dataset.toggleTemplateRegisters) toggleTemplateRegisters(Number(target.dataset.toggleTemplateRegisters));
      if (target.dataset.addTemplateRegister) addTemplateRegister(Number(target.dataset.addTemplateRegister));
      if (target.dataset.removeTemplateRegister) removeTemplateRegister(target.dataset.removeTemplateRegister);
    });

    document.addEventListener("change", (event) => {
      const target = event.target;
      if (target?.id === "controlDeviceName") {
        selectedControlDevice = target.value;
        return;
      }
      if (!target?.matches?.("[data-device][data-field='protocol']")) return;
      const deviceCard = target.closest(".device");
      if (deviceCard) deviceCard.dataset.protocolMode = target.value || "modbus-rtu";
    });

    el("gatewayForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      await requestJson("/api/gateways", {
        method: "POST",
        body: JSON.stringify({
          id: form.get("id"),
          name: form.get("name"),
          site: form.get("site"),
          token: form.get("token"),
        }),
      });
      event.currentTarget.reset();
      el("manualGatewayPanel").classList.add("hidden");
      await loadGateways();
    });

    el("powerLimitForm").addEventListener("submit", (event) => {
      event.preventDefault();
      submitPowerLimitForm();
    });

    async function logout() {
      await fetch("/api/logout", { method: "POST" });
      location.assign("/login");
    }

    loadGateways().catch((error) => console.error(error));
  </script>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
