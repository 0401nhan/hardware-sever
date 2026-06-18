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
  <link rel="stylesheet" href="/assets/admin-tailwind.css?v=20260611-ui5">
</head>
<body class="tailwind-ui login-screen server-login">
  <label class="language-select" aria-label="Ngôn ngữ">
    <select id="languageSelect">
      <option value="vi">Tiếng Việt</option>
      <option value="en">English</option>
    </select>
  </label>
  <main>
    <div class="brand">
      <span class="brand-mark"><img src="/logo/logo-login-mark.png" alt="Electricbird logo"></span>
      <div>
        <p class="eyebrow" data-i18n="brandName">Electricbird</p>
        <p class="product-name" data-i18n="productName">Hardware Server</p>
      </div>
    </div>

    <h1 class="login-title" data-i18n="loginTitle">Đăng nhập</h1>
    <form id="loginForm">
      <label><span data-i18n="usernameLabel">Tài khoản</span>
        <input id="username" name="username" autocomplete="username" placeholder="Tài khoản" required autofocus>
      </label>
      <label class="password-row"><span data-i18n="passwordLabel">Mật khẩu</span>
        <input id="password" name="password" type="password" autocomplete="current-password" placeholder="Mật khẩu" required>
        <button id="togglePasswordBtn" class="toggle-password" type="button" aria-label="Hiện mật khẩu">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </label>
      <button id="loginBtn" type="submit" data-i18n="loginButton">Đăng nhập</button>
    </form>
    <p id="status" class="status"></p>
  </main>
  <script>
    const form = document.getElementById("loginForm");
    const button = document.getElementById("loginBtn");
    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const status = document.getElementById("status");
    const languageSelect = document.getElementById("languageSelect");
    const togglePassword = document.getElementById("togglePasswordBtn");
    const translations = {
      en: {
        pageTitle: "Electricbird Hardware Server Login",
        brandName: "Electricbird",
        productName: "Hardware Server",
        loginTitle: "User Login",
        usernameLabel: "Username",
        passwordLabel: "Password",
        usernamePlaceholder: "Username",
        passwordPlaceholder: "Password",
        loginButton: "Login",
        showPassword: "Show password",
        hidePassword: "Hide password",
        invalidLogin: "Invalid username or password",
        loginFailed: "Login failed",
      },
      vi: {
        pageTitle: "Đăng nhập Electricbird Hardware Server",
        brandName: "Electricbird",
        productName: "Hardware Server",
        loginTitle: "Đăng nhập",
        usernameLabel: "Tài khoản",
        passwordLabel: "Mật khẩu",
        usernamePlaceholder: "Tài khoản",
        passwordPlaceholder: "Mật khẩu",
        loginButton: "Đăng nhập",
        showPassword: "Hiện mật khẩu",
        hidePassword: "Ẩn mật khẩu",
        invalidLogin: "Tài khoản hoặc mật khẩu không đúng",
        loginFailed: "Đăng nhập thất bại",
      },
    };
    let currentLanguage = "vi";

    function updatePasswordToggleLabel() {
      const copy = translations[currentLanguage];
      togglePassword.setAttribute(
        "aria-label",
        password.type === "password" ? copy.showPassword : copy.hidePassword
      );
    }

    function setLanguage(language) {
      currentLanguage = translations[language] ? language : "vi";
      const copy = translations[currentLanguage];

      document.documentElement.lang = currentLanguage;
      document.title = copy.pageTitle;
      languageSelect.value = currentLanguage;
      username.placeholder = copy.usernamePlaceholder;
      password.placeholder = copy.passwordPlaceholder;

      document.querySelectorAll("[data-i18n]").forEach((node) => {
        node.textContent = copy[node.dataset.i18n] || node.textContent;
      });

      updatePasswordToggleLabel();
      localStorage.setItem("loginLanguage", currentLanguage);
    }

    togglePassword.addEventListener("click", () => {
      password.type = password.type === "password" ? "text" : "password";
      updatePasswordToggleLabel();
    });

    languageSelect.addEventListener("change", (event) => {
      setLanguage(event.target.value);
    });

    setLanguage(localStorage.getItem("loginLanguage") || "vi");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "";
      status.className = "status";
      button.disabled = true;
      const form = new FormData(event.currentTarget);
      try {
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
        const copy = translations[currentLanguage];
        status.textContent = payload.error === "Invalid username or password" ? copy.invalidLogin : (payload.error || copy.loginFailed);
        status.className = "status error";
      } finally {
        button.disabled = false;
      }
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
      --bg: #f5f6f8;
      --surface: #ffffff;
      --surface-soft: #fafbfc;
      --line: #e5e8ed;
      --line-strong: #b7c0cc;
      --text: #111827;
      --muted: #6b7280;
      --muted-strong: #374151;
      --accent: #f97316;
      --accent-strong: #ea580c;
      --accent-soft: #fff7ed;
      --blue: #2563eb;
      --blue-soft: #eff6ff;
      --danger: #b42318;
      --danger-soft: #fff1f0;
      --ok: #16833a;
      --ok-soft: #ecfdf3;
      --warning: #b45309;
      --warning-soft: #fff7ed;
      --sidebar: #111820;
      --sidebar-strong: #071016;
      --sidebar-soft: rgba(255, 255, 255, 0.08);
      --shadow: 0 10px 24px rgba(16, 24, 40, 0.06);
      --focus: #2563eb;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background: var(--bg);
      overflow-x: hidden;
    }
    button, input, select, textarea { font: inherit; }
    button {
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 1px solid var(--line);
      border-radius: 6px;
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
      border-radius: 6px;
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
      border-radius: 6px;
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
    button.icon-only {
      display: inline-grid;
      width: 38px;
      min-width: 38px;
      padding: 0;
      place-items: center;
    }
    .actions button.icon-only,
    .inline-actions button.icon-only,
    .register-actions button.icon-only,
    .actions-cell button.icon-only {
      flex: 0 0 38px;
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      white-space: nowrap;
    }
    .app-shell {
      width: 100%;
      max-width: 100vw;
      min-height: 100vh;
      display: grid;
      grid-template-columns: 178px minmax(0, 1fr);
      background: var(--bg);
    }
    .sidebar {
      position: sticky;
      top: 0;
      display: flex;
      flex-direction: column;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      background: linear-gradient(180deg, var(--sidebar) 0%, var(--sidebar-strong) 100%);
      color: #d8dee8;
      height: 100vh;
      min-height: 100vh;
    }
    .sidebar-brand {
      min-height: 58px;
      padding: 10px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .sidebar-logo,
    .brand-mark {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      border: 1px solid rgba(249, 115, 22, 0.42);
      border-radius: 8px;
      background: #fff;
      color: #fff;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0;
    }
    .sidebar-logo img,
    .brand-mark img {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }
    .sidebar-brand > span:last-child { min-width: 0; }
    .sidebar-brand strong { display: block; color: #fff; font-size: 13px; font-weight: 850; }
    .sidebar-brand small { display: block; margin-top: 2px; color: #aab4c2; font-size: 11px; font-weight: 650; overflow-wrap: anywhere; }
    .sidebar-nav {
      display: grid;
      gap: 2px;
      padding: 8px;
      flex: 1 1 auto;
      align-content: start;
    }
    .nav-link, .nav-section {
      width: 100%;
      min-height: 36px;
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
      width: 22px;
      height: 22px;
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
    .sidebar-footer {
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      min-height: 58px;
      padding: 8px 10px;
      border-top: 1px solid rgba(0, 0, 0, 0.22);
      color: #6b7280;
    }
    .sidebar-footer .app-icon {
      width: 23px;
      height: 23px;
    }
    .connectivity-tile {
      display: grid;
      min-width: 0;
      place-items: center;
      color: #8a94a5;
    }
    .connectivity-icon {
      display: grid;
      width: 46px;
      height: 46px;
      place-items: center;
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 8px;
      background: rgba(148, 163, 184, 0.14);
      color: #94a3b8;
    }
    .connectivity-tile.status-online { color: #bbf7d0; }
    .connectivity-tile.status-online .connectivity-icon {
      border-color: rgba(34, 197, 94, 0.55);
      background: rgba(34, 197, 94, 0.18);
      color: #22c55e;
    }
    .connectivity-tile.status-warning { color: #fde68a; }
    .connectivity-tile.status-warning .connectivity-icon {
      border-color: rgba(245, 158, 11, 0.55);
      background: rgba(245, 158, 11, 0.18);
      color: #f59e0b;
    }
    .connectivity-tile.status-error { color: #fecaca; }
    .connectivity-tile.status-error .connectivity-icon {
      border-color: rgba(239, 68, 68, 0.55);
      background: rgba(239, 68, 68, 0.18);
      color: #ef4444;
    }
    .workspace { min-width: 0; max-width: 100%; }
    header.topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      min-height: 58px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 14px;
      border-bottom: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 1px 0 rgba(16, 24, 40, 0.04);
      backdrop-filter: blur(10px);
    }
    .menu-button {
      display: inline-grid;
      width: 42px;
      min-height: 42px;
      place-items: center;
      border: 0;
      background: transparent;
      color: var(--text);
      box-shadow: none;
    }
    .menu-button .app-icon {
      width: 24px;
      height: 24px;
    }
    .menu-button:hover {
      border: 0;
      background: var(--surface-soft);
      box-shadow: none;
      transform: none;
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
    .topbar-meta, .topbar-system, .topbar-actions, .status-chip {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      min-width: 0;
    }
    .topbar-system { justify-content: flex-end; }
    .admin-language-select {
      display: block;
      width: 150px;
    }
    .admin-language-select select {
      min-height: 34px;
      font-size: 12px;
      font-weight: 800;
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
    .status {
      width: 20px;
      min-width: 20px;
      min-height: 20px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: #98a2b3;
      box-shadow: 0 0 0 4px rgba(152, 162, 179, 0.16);
    }
    .status.ok {
      background: var(--ok);
      box-shadow: 0 0 0 4px rgba(22, 131, 58, 0.16);
    }
    .status.error {
      background: var(--danger);
      box-shadow: 0 0 0 4px rgba(180, 35, 24, 0.16);
    }
    .badge-dot {
      display: inline-grid;
      width: 20px;
      height: 20px;
      place-items: center;
      border-radius: 50%;
      color: #fff;
      font-size: 14px;
      font-weight: 800;
      line-height: 1;
    }
    .badge-dot .app-icon { width: 11px; height: 11px; stroke-width: 2.4; }
    .badge-dot.green { background: #16a34a; }
    .badge-dot.red { background: #f04438; }
    .badge-dot.orange { background: #ff8a00; }
    .badge-dot.gray { background: #98a2b3; }
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
      width: 100%;
      max-width: none;
      min-width: 0;
      margin: 0;
      padding: 10px;
      overflow-x: hidden;
    }
    .home-page { display: none; }
    .home-page.active { display: block; min-width: 0; max-width: 100%; }
    .home-panel, .config-section {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      margin-bottom: 8px;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }
    .home-panel > p, .panel-title-row p {
      margin: 6px 0 0;
      color: var(--muted);
      font-weight: 600;
      line-height: 1.45;
      overflow-wrap: anywhere;
    }
    .panel-title-row, .section-header, .device-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      min-width: 0;
      margin-bottom: 12px;
    }
    .panel-title-row > *,
    .section-header > *,
    .device-head > * {
      min-width: 0;
    }
    .panel-title, h2 {
      margin: 0;
      color: var(--text);
      font-size: 16px;
      font-weight: 800;
    }
    .section-title p, .panel-title span {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
      overflow-wrap: anywhere;
    }
    .danger-text { color: var(--danger); }
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
      gap: 8px;
      margin-bottom: 8px;
    }
    .metric, .gateway-card {
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 12px;
      background: #fff;
      box-shadow: 0 5px 16px rgba(16, 24, 40, 0.04);
    }
    .metric span, .gateway-card span { display: block; color: var(--muted); font-size: 12px; font-weight: 700; }
    .metric strong { display: block; margin-top: 6px; color: var(--text); font-size: 22px; font-weight: 800; overflow-wrap: anywhere; }
    .dashboard-board {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(320px, 0.92fr);
      gap: 8px;
      align-items: start;
    }
    .realtime-panel .panel-title-row {
      align-items: flex-start;
    }
    .status-legend {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      margin: 0 0 14px;
      color: var(--muted-strong);
      font-size: 12px;
      font-weight: 800;
    }
    .status-legend span {
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }
    .topology-tree {
      display: grid;
      gap: 12px;
    }
    .topology-station {
      display: grid;
      gap: 10px;
      min-width: 0;
    }
    .topology-level {
      display: grid;
      gap: 10px;
      margin-left: 18px;
      padding-left: 22px;
      border-left: 1px dashed var(--line-strong);
    }
    .topology-node {
      min-height: 64px;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 5px 16px rgba(16, 24, 40, 0.04);
    }
    .topology-node.good { border-left: 4px solid #16a34a; }
    .topology-node.warning { border-left: 4px solid #f59e0b; }
    .topology-node.bad { border-left: 4px solid #dc2626; }
    .topology-node.loss { border-left: 4px solid #98a2b3; }
    .topology-icon {
      width: 36px;
      height: 36px;
      display: inline-grid;
      place-items: center;
      border-radius: 8px;
      background: var(--surface-soft);
      color: var(--muted-strong);
    }
    .topology-copy { min-width: 0; }
    .topology-kicker {
      display: block;
      color: var(--muted);
      font-size: 11px;
      font-weight: 850;
      text-transform: uppercase;
    }
    .topology-copy strong {
      display: block;
      overflow: hidden;
      color: var(--text);
      font-size: 14px;
      font-weight: 850;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .topology-copy p {
      overflow: hidden;
      margin: 2px 0 0;
      color: var(--muted);
      font-size: 12px;
      font-weight: 650;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .topology-state {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      min-height: 30px;
      padding: 0 10px;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted-strong);
      font-size: 12px;
      font-weight: 850;
      white-space: nowrap;
    }
    .topology-state.good { border-color: #8bd7a2; background: var(--ok-soft); color: var(--ok); }
    .topology-state.warning { border-color: #fed7aa; background: var(--warning-soft); color: var(--warning); }
    .topology-state.bad { border-color: #fda29b; background: var(--danger-soft); color: var(--danger); }
    .topology-state.loss { border-color: #cbd5e1; background: #f8fafc; color: #64748b; }
    .topology-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      flex: 0 0 auto;
      border-radius: 50%;
      background: #98a2b3;
      box-shadow: 0 0 0 3px rgba(152, 162, 179, 0.18);
    }
    .topology-dot.good { background: #16a34a; box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.16); }
    .topology-dot.warning { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.18); }
    .topology-dot.bad { background: #dc2626; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.16); }
    .topology-dot.loss { background: #98a2b3; box-shadow: 0 0 0 3px rgba(152, 162, 179, 0.18); }
    .topology-empty {
      padding: 13px 14px;
      border: 1px dashed var(--line-strong);
      border-radius: 8px;
      background: #fbfcfd;
      color: var(--muted);
      font-size: 13px;
      font-weight: 800;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(6, minmax(142px, 1fr));
      gap: 8px;
      margin-bottom: 8px;
    }
    .metric-tile {
      min-height: 94px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
      box-shadow: 0 5px 16px rgba(16, 24, 40, 0.04);
    }
    .metric-tile.wide { grid-column: span 2; }
    .metric-tile span {
      color: var(--muted);
      font-size: 12px;
      font-weight: 750;
    }
    .metric-tile strong {
      display: block;
      margin-top: 8px;
      color: var(--text);
      font-size: 28px;
      font-weight: 850;
      line-height: 1;
      overflow-wrap: anywhere;
    }
    .metric-tile small {
      display: block;
      margin-top: 8px;
      color: var(--muted);
      font-size: 11px;
      font-weight: 650;
    }
    .metric-tile .ok { color: var(--ok); }
    .metric-tile .warn { color: var(--warning); }
    .metric-tile .danger { color: var(--danger); }
    .ok { color: var(--ok); }
    .warn { color: var(--warning); }
    .danger { color: var(--danger); }
    .metric-icon {
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      border-radius: 6px;
      background: var(--accent-soft);
      color: var(--accent);
    }
    .metric-icon.ok { background: var(--ok-soft); color: var(--ok); }
    .metric-icon.warn { background: var(--warning-soft); color: var(--warning); }
    .metric-icon.info { background: var(--blue-soft); color: var(--blue); }
    .fleet-table {
      min-width: 900px;
      table-layout: auto;
    }
    .fleet-table th,
    .fleet-table td {
      padding: 8px 10px;
      font-size: 12px;
      vertical-align: middle;
    }
    .fleet-table th {
      background: #fbfcfd;
      font-size: 11px;
      text-transform: none;
    }
    .id-link {
      color: var(--accent-strong);
      font-weight: 850;
      text-decoration: none;
    }
    .id-link:hover { text-decoration: underline; }
    .detail-grid {
      display: grid;
      gap: 8px;
    }
    .detail-card {
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
      box-shadow: 0 5px 16px rgba(16, 24, 40, 0.04);
    }
    .detail-card h3 {
      margin: 0 0 10px;
      color: var(--text);
      font-size: 13px;
      font-weight: 850;
    }
    .detail-row {
      display: grid;
      grid-template-columns: 112px minmax(0, 1fr);
      gap: 10px;
      padding: 6px 0;
      border-bottom: 1px solid #f1f3f6;
      font-size: 12px;
    }
    .detail-row:last-child { border-bottom: 0; }
    .detail-row span:first-child {
      color: var(--muted);
      font-weight: 750;
    }
    .detail-row span:last-child {
      color: var(--text);
      font-weight: 750;
      overflow-wrap: anywhere;
    }
    .status-strip {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 8px;
    }
    .status-item {
      min-height: 70px;
      padding: 10px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
    }
    .status-item span {
      display: block;
      color: var(--muted);
      font-size: 11px;
      font-weight: 750;
    }
    .status-item strong {
      display: block;
      margin-top: 8px;
      color: var(--text);
      font-size: 13px;
      font-weight: 850;
      overflow-wrap: anywhere;
    }
    .health-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 8px;
    }
    .health-item {
      min-height: 78px;
      padding: 10px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
    }
    .health-item span {
      display: block;
      color: var(--muted);
      font-size: 11px;
      font-weight: 750;
    }
    .health-item strong {
      display: block;
      margin-top: 8px;
      font-size: 14px;
      font-weight: 850;
    }
    .health-item small {
      display: block;
      margin-top: 6px;
      color: var(--muted);
      font-size: 11px;
      font-weight: 650;
    }
    .evn-layout {
      display: grid;
      grid-template-columns: minmax(280px, 420px) minmax(0, 1fr);
      gap: 8px;
      align-items: start;
    }
    .metric-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 8px;
    }
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
    .badge.offline, .badge.waiting { border-color: #d1d5db; background: #f9fafb; color: #6b7280; }
    .badge.warning, .badge.warn { border-color: #fed7aa; background: var(--warning-soft); color: var(--warning); }
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
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
      align-items: center;
      gap: 12px;
      padding: 14px;
      border-bottom: 1px solid var(--line);
      background: #fff;
    }
    .monitor-status-icon {
      display: grid;
      width: 38px;
      height: 38px;
      place-items: center;
      flex: 0 0 auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #f1f5f9;
      color: #64748b;
    }
    .monitor-status-icon .app-icon {
      width: 25px;
      height: 25px;
      stroke-width: 2.5;
    }
    .monitor-status-icon.good { border-color: #16a34a; background: #16a34a; color: #fff; }
    .monitor-status-icon.warning { border-color: #f59e0b; background: #f59e0b; color: #fff; }
    .monitor-status-icon.bad { border-color: #dc2626; background: #dc2626; color: #fff; }
    .monitor-status-icon.loss { border-color: #94a3b8; background: #94a3b8; color: #fff; }
    .monitor-title {
      min-width: 0;
      flex: 1 1 auto;
    }
    .monitor-title strong {
      display: block;
      overflow: hidden;
      color: #17202a;
      font-size: 16px;
      font-weight: 800;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .monitor-title span {
      display: block;
      margin-top: 4px;
      color: #606b75;
      font-size: 12px;
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .monitor-status,
    .monitor-status-chip {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 3px 10px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: #fff;
      color: #606b75;
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
    }
    .monitor-status-chip.good { border-color: var(--ok-line); background: var(--ok-soft); color: var(--ok); }
    .monitor-status-chip.bad { border-color: #f4b7ae; background: var(--danger-soft); color: var(--danger); }
    .monitor-status-chip.warning { border-color: #ffd59b; background: #fff7ed; color: #946200; }
    .monitor-status-chip.loss { border-color: #cbd5e1; background: #f8fafc; color: #64748b; }
    .monitor-meta[hidden] { display: none !important; }
    .monitor-key-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      background: #fff;
    }
    .monitor-key-item {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
      min-height: 66px;
      padding: 10px 12px;
      border: 1px solid #e1e8f0;
      border-radius: 8px;
      background: #f8fafc;
    }
    .monitor-key-item span {
      display: block;
      color: #667385;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .monitor-key-item strong {
      display: block;
      margin-top: 5px;
      color: #17202a;
      font-size: 15px;
      font-weight: 800;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }
    .monitor-key-item.power strong {
      color: var(--accent-strong);
      font-size: 14px;
      line-height: 1.28;
    }
    .monitor-key-item.status strong { color: var(--accent-strong); }
    .monitor-detail {
      padding: 0 14px 12px;
      background: #fff;
    }
    .monitor-detail summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-height: 44px;
      cursor: pointer;
      color: #344256;
      font-size: 13px;
      font-weight: 800;
      list-style: none;
    }
    .monitor-detail summary::-webkit-details-marker { display: none; }
    .monitor-detail summary .app-icon {
      width: 18px;
      height: 18px;
      transition: transform 120ms ease;
    }
    .monitor-detail[open] summary .app-icon { transform: rotate(180deg); }
    .monitor-detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
      gap: 8px;
      margin-bottom: 10px;
    }
    .monitor-detail-grid div {
      min-width: 0;
      padding: 9px 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #f8fafc;
    }
    .monitor-detail-grid span {
      display: block;
      color: #667385;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .monitor-detail-grid strong {
      display: block;
      overflow: hidden;
      margin-top: 4px;
      color: #17202a;
      font-size: 13px;
      font-weight: 800;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .monitor-table-wrap { margin-top: 10px; }
    .monitor-table {
      width: 100%;
      min-width: 0;
      table-layout: auto;
    }
    .monitor-table th,
    .monitor-table td {
      padding: 10px 12px;
      font-size: 13px;
    }
    .monitor-table th { background: #fff; }
    .monitor-value {
      color: #17202a;
      font-size: 18px;
      font-weight: 800;
      white-space: nowrap;
    }
    .monitor-unit, .monitor-raw { color: #667385; font-size: 12px; font-weight: 700; }
    .monitor-error {
      padding: 10px 12px;
      border-top: 1px solid #f4b7ae;
      background: var(--danger-soft);
      color: var(--danger);
      font-size: 12px;
      font-weight: 700;
      overflow-wrap: anywhere;
    }
    .control-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      align-items: start;
    }
    .control-target {
      max-width: 360px;
    }
    .control-stack {
      display: grid;
      gap: 12px;
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
      max-width: 100%;
      padding: 22px;
      border: 1px dashed var(--line-strong);
      border-radius: 8px;
      background: #fbfcfd;
      color: var(--muted);
      font-weight: 700;
      overflow-wrap: anywhere;
    }
    div.empty-state {
      display: grid;
      gap: 6px;
    }
    div.empty-state strong {
      display: block;
      color: var(--muted-strong);
      font-size: 14px;
    }
    div.empty-state span {
      display: block;
      color: var(--muted);
      font-size: 13px;
      font-weight: 650;
      line-height: 1.45;
    }
    @media (max-width: 1100px) {
      .app-shell { grid-template-columns: 220px minmax(0, 1fr); }
      .overview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .dashboard-board, .evn-layout { grid-template-columns: 1fr; }
      .kpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .status-strip, .health-grid, .metric-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 820px) {
      .app-shell { display: block; }
      .sidebar { position: sticky; top: 0; z-index: 30; height: auto; min-height: auto; }
      .sidebar-brand { min-height: 58px; padding: 10px 12px; }
      .sidebar-logo, .brand-mark { width: 34px; height: 34px; }
      .sidebar-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; padding: 8px; }
      .nav-link { min-height: 40px; padding: 7px 8px; }
      .nav-child { grid-column: 1 / -1; padding: 0; }
      .nav-child.active { display: flex; gap: 6px; overflow-x: auto; }
      .nav-child a { flex: 0 0 auto; border: 1px solid rgba(255, 255, 255, 0.08); }
      header.topbar { position: static; align-items: stretch; flex-direction: column; gap: 10px; padding: 12px; }
      main.content { padding: 14px; }
      .status-chip { max-width: 100%; }
      .control-layout, .limit-grid { grid-template-columns: 1fr; }
      .kpi-grid, .status-strip, .health-grid, .metric-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 620px) {
      .app-shell, .workspace, main.content, .home-page, .home-panel, .config-section { max-width: 100vw; }
      main.content { padding: 14px; }
      .overview, .grid, .gateway-grid { grid-template-columns: 1fr; }
      .wide { grid-column: span 1; }
      .gateway-stats { grid-template-columns: 1fr; }
      .section-header, .device-head, .panel-title-row { flex-direction: column; }
      .actions, .template-actions, .topbar-actions { width: 100%; }
      .actions button, .topbar-actions button { flex: 1 1 120px; }
      .inline-field { grid-template-columns: 1fr; }
      .control-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    #remoteView {
      --bg: #f3f5f7;
      --surface: #ffffff;
      --surface-soft: #f8fafb;
      --line: #dde3ea;
      --line-strong: #b7c0cc;
      --text: #111827;
      --muted: #6b7280;
      --muted-strong: #374151;
      --accent: #ff7a00;
      --accent-strong: #e56e00;
      --accent-soft: #fff2e5;
      --blue: #ff7a00;
      --blue-soft: #fff2e5;
      --danger: #b42318;
      --danger-soft: #fff1f0;
      --ok: #16833a;
      --ok-soft: #ecfdf3;
      --ok-line: #8bd7a2;
      --warning: #a15c07;
      --warning-soft: #fff7ed;
      --shadow: 0 10px 28px rgba(16, 24, 40, 0.08);
      --focus: #2563eb;
      grid-template-columns: 190px minmax(0, 1fr);
      background: var(--bg);
      color: var(--text);
    }
    #remoteView .sidebar {
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      background: #111820;
      color: #d8dee8;
    }
    #remoteView .sidebar-brand {
      min-height: 58px;
      padding: 0 14px;
      gap: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      color: #fff;
      font-size: 14px;
      font-weight: 700;
    }
    #remoteView .sidebar-brand strong,
    #remoteView .sidebar-brand small {
      display: block;
      line-height: 1.2;
    }
    #remoteView .sidebar-brand small {
      margin-top: 3px;
      color: #aab4c2;
      font-size: 12px;
      font-weight: 600;
    }
    #remoteView .sidebar-logo {
      display: grid;
      width: 34px;
      height: 34px;
      place-items: center;
      overflow: hidden;
      padding: 3px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 8px;
      background: #fff;
      flex: 0 0 auto;
    }
    #remoteView .sidebar-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    #remoteView .sidebar-nav {
      gap: 2px;
      padding: 8px;
    }
    #remoteView .nav-link,
    #remoteView .nav-section {
      min-height: 36px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      margin: 0;
      padding: 0 12px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      color: #c9d2df;
      font-size: 13px;
      font-weight: 700;
      text-align: left;
      text-decoration: none;
      box-shadow: none;
    }
    #remoteView .nav-link:hover,
    #remoteView .nav-section:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
    #remoteView .nav-link.active,
    #remoteView .nav-section.active {
      border-color: transparent;
      background: rgba(249, 115, 22, 0.13);
      color: #fff;
      box-shadow: inset 3px 0 0 var(--accent);
    }
    #remoteView .nav-child {
      gap: 2px;
      padding: 2px 0 8px 39px;
      background: transparent;
    }
    #remoteView .nav-child a {
      min-height: 32px;
      padding: 0 10px;
      border-radius: 6px;
      color: #aeb9c8;
      font-size: 12px;
      font-weight: 700;
    }
    #remoteView .nav-child a:hover,
    #remoteView .nav-child a.active {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
    #remoteView .sidebar-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(0, 0, 0, 0.08);
    }
    #remoteView header.topbar {
      z-index: 10;
      min-height: 68px;
      padding: 12px 22px;
      border-bottom: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 1px 0 rgba(16, 24, 40, 0.04);
      backdrop-filter: blur(10px);
    }
    #remoteView .menu-button {
      display: none;
    }
    #remoteView .topbar-title {
      display: grid;
      min-width: 180px;
      gap: 2px;
      margin-right: auto;
    }
    #remoteView .topbar-title strong {
      color: var(--text);
      font-size: 18px;
      font-weight: 800;
      line-height: 1.2;
    }
    #remoteView .topbar-title span {
      margin-top: 0;
      color: var(--muted);
      font-size: 12px;
      font-weight: 600;
    }
    #remoteView .topbar-meta {
      flex-wrap: wrap;
      gap: 10px;
      color: #333;
      font-size: 13px;
      font-weight: 700;
      white-space: normal;
    }
    #remoteView .topbar-system,
    #remoteView .topbar-actions,
    #remoteView .status-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    #remoteView .topbar-item {
      min-height: 34px;
      padding: 0 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface-soft);
      color: var(--muted-strong);
      font-size: 12px;
      font-weight: 700;
    }
    #remoteView .topbar-actions button {
      min-height: 34px;
      padding: 7px 10px;
    }
    #remoteView .admin-language-select {
      display: block;
      min-width: 126px;
      width: auto;
      color: var(--muted-strong);
      font-size: 12px;
      font-weight: 800;
    }
    #remoteView .admin-language-select select {
      min-height: 34px;
      border-radius: 8px;
      background: #fff;
      font-size: 12px;
      font-weight: 800;
    }
    #remoteView .status-chip {
      min-height: 34px;
      max-width: min(360px, 38vw);
      padding: 0 10px 0 0;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: #fff;
    }
    #remoteView .status {
      position: relative;
      display: inline-grid;
      width: 38px;
      min-width: 38px;
      min-height: 38px;
      place-items: center;
      overflow: visible;
      padding: 0;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface-soft);
      color: var(--muted);
      box-shadow: none;
    }
    #remoteView .status::before {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--line-strong);
      box-shadow: 0 0 0 4px rgba(183, 192, 204, 0.2);
      content: "";
    }
    #remoteView .status::after {
      position: absolute;
      top: calc(100% + 9px);
      left: 0;
      z-index: 20;
      width: max-content;
      max-width: min(520px, calc(100vw - 32px));
      padding: 8px 10px;
      border: 1px solid rgba(18, 32, 46, 0.16);
      border-radius: 6px;
      background: #17202a;
      box-shadow: 0 12px 26px rgba(18, 32, 46, 0.18);
      color: #fff;
      content: attr(data-message);
      font-size: 12px;
      font-weight: 700;
      line-height: 1.35;
      opacity: 0;
      overflow-wrap: anywhere;
      pointer-events: none;
      text-align: left;
      transform: translateY(-3px);
      transition: opacity 120ms ease, transform 120ms ease;
      white-space: normal;
    }
    #remoteView .status:hover::after,
    #remoteView .status:focus-visible::after {
      opacity: 1;
      transform: translateY(0);
    }
    #remoteView .status.ok {
      border-color: var(--ok-line);
      background: var(--ok-soft);
    }
    #remoteView .status.ok::before {
      background: var(--ok);
      box-shadow: 0 0 0 4px rgba(22, 131, 58, 0.16);
    }
    #remoteView .status.error {
      border-color: #f4b7ae;
      background: var(--danger-soft);
    }
    #remoteView .status.error::before {
      background: var(--danger);
      box-shadow: 0 0 0 4px rgba(180, 35, 24, 0.16);
    }
    #remoteView .status-chip .status {
      width: 32px;
      min-width: 32px;
      min-height: 32px;
      border: 0;
      background: transparent;
    }
    #remoteView .status-text,
    #remoteView #statusText {
      min-width: 0;
      overflow: hidden;
      color: var(--muted-strong);
      font-size: 12px;
      font-weight: 700;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #remoteView main.content {
      width: 100%;
      max-width: 1480px;
      margin: 0 auto;
      padding: 22px;
    }
    #remoteView .home-panel,
    #remoteView .config-section {
      margin-bottom: 16px;
      padding: 20px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }
    #remoteView .panel-title-row,
    #remoteView .section-header,
    #remoteView .device-head {
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;
    }
    #remoteView .panel-title,
    #remoteView h2 {
      color: var(--text);
      font-size: 18px;
      font-weight: 800;
    }
    #remoteView .panel-title span {
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
    }
    #remoteView .panel-title::before {
      top: 3px;
      bottom: 3px;
      border-radius: 999px;
    }
    #remoteView .overview.config-overview {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin: 0 0 16px;
    }
    #remoteView .metric {
      padding: 14px;
      border-radius: 8px;
      box-shadow: 0 6px 18px rgba(16, 24, 40, 0.05);
    }
    #remoteView .grid {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }
    #remoteView .wide {
      grid-column: span 2;
    }
    #remoteView label {
      color: var(--muted-strong);
      font-size: 12px;
      font-weight: 700;
    }
    #remoteView input,
    #remoteView select,
    #remoteView textarea {
      min-height: 38px;
      border-radius: 8px;
      background: #fff;
    }
    #remoteView button {
      border-radius: 8px;
    }
    #remoteView button.primary {
      box-shadow: 0 8px 18px rgba(249, 115, 22, 0.22);
    }
    #remoteView button.subtle {
      background: #fff;
    }
    #remoteView .table-wrap {
      border-radius: 8px;
      box-shadow: inset 0 0 0 1px rgba(16, 24, 40, 0.02);
    }
    #remoteView .table-wrap table {
      min-width: 860px;
    }
    #remoteView th,
    #remoteView td {
      padding: 10px;
    }
    #remoteView th {
      background: #f8fafc;
      color: var(--muted-strong);
      font-weight: 800;
    }
    #remoteView tbody tr:hover td {
      background: #fbfdff;
    }
    #remoteView .device {
      margin-top: 14px;
      padding: 16px;
      border-color: var(--line);
      border-radius: 8px;
      background: #fbfcfd;
    }
    #remoteView .device-head {
      padding-bottom: 12px;
      border-bottom: 1px solid var(--line);
    }
    #remoteView .device-title strong {
      font-size: 16px;
    }
    #remoteView .registers-head {
      margin-top: 18px;
    }
    #remoteView .pill {
      border: 1px solid #bfdbfe;
      background: var(--blue-soft);
      color: var(--blue);
    }
    #remoteView .evn-iec104-note {
      display: grid;
      gap: 6px;
      margin: 0 0 16px;
      padding: 12px 14px;
      border: 1px solid #d8e2ee;
      border-left: 4px solid var(--accent);
      border-radius: 8px;
      background: #fbfcfd;
      color: var(--muted-strong);
      font-size: 13px;
      font-weight: 700;
    }
    #remoteView .evn-iec104-note strong {
      color: var(--text);
      font-size: 14px;
    }
    #remoteView .toggle-field {
      align-content: start;
    }
    #remoteView .toggle-switch {
      display: inline-grid;
      grid-template-columns: auto auto auto;
      gap: 10px;
      align-items: center;
      width: fit-content;
      min-height: 38px;
      padding: 0 10px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface-soft);
      color: var(--muted-strong);
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      user-select: none;
    }
    #remoteView .toggle-switch input {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      opacity: 0;
      pointer-events: none;
    }
    #remoteView .toggle-track {
      position: relative;
      width: 46px;
      height: 24px;
      border-radius: 999px;
      background: #cbd5e1;
      transition: background 120ms ease;
    }
    #remoteView .toggle-track::after {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 2px 5px rgba(16, 24, 40, 0.2);
      content: "";
      transition: transform 120ms ease;
    }
    #remoteView .toggle-switch input:checked + .toggle-track {
      background: var(--ok);
    }
    #remoteView .toggle-switch input:checked + .toggle-track::after {
      transform: translateX(22px);
    }
    #remoteView .toggle-off {
      color: var(--muted);
    }
    #remoteView .toggle-switch input:checked ~ .toggle-on {
      color: var(--ok);
    }
    #remoteView .toggle-switch input:not(:checked) ~ .toggle-off {
      color: var(--danger);
    }
    #remoteView .section-footnote {
      margin: 10px 0 0;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      line-height: 1.45;
    }
    #remoteView .register-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }
    #remoteView .register-preview {
      margin-top: 0;
      padding: 10px;
      border-radius: 8px;
    }
    #remoteView .dashboard-table-wrap {
      margin: 0;
    }
    #remoteView table.dashboard-table {
      min-width: 760px;
    }
    #remoteView .dashboard-table th,
    #remoteView .dashboard-table td {
      padding: 12px 14px;
      font-size: 13px;
    }
    #remoteView .monitor-grid {
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 14px;
    }
    #remoteView .monitoring-panel .panel-title-row {
      align-items: center;
    }
    #remoteView .monitor-toolbar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 10px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
    }
    #remoteView .icon-text {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    #remoteView .icon-text .app-icon {
      width: 17px;
      height: 17px;
    }
    #remoteView .monitor-card {
      border-radius: 8px;
      box-shadow: 0 8px 20px rgba(16, 24, 40, 0.06);
    }
    #remoteView .monitor-head {
      background: #fbfcfd;
    }
    #remoteView .monitor-status {
      gap: 6px;
      border-radius: 999px;
    }
    #remoteView .monitor-status::before {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
      content: "";
    }
    #remoteView .monitor-status.good,
    #remoteView .monitor-status.online {
      border-color: var(--ok-line);
      background: var(--ok-soft);
      color: var(--ok);
    }
    #remoteView .monitor-status.warning,
    #remoteView .monitor-status.waiting {
      border-color: #fcd34d;
      background: #fffbeb;
      color: #92400e;
    }
    #remoteView .monitor-status.bad,
    #remoteView .monitor-status.error {
      border-color: #fda29b;
      background: var(--danger-soft);
      color: var(--danger);
    }
    #remoteView .monitor-status.loss {
      border-color: #cbd5e1;
      background: #f8fafc;
      color: #64748b;
    }
    #remoteView .monitor-table {
      min-width: 0;
    }
    #remoteView .monitor-table th,
    #remoteView .monitor-table td {
      font-size: 12px;
    }
    #remoteView .monitor-value {
      font-size: 16px;
    }
    #remoteView .empty-state {
      border-radius: 8px;
      background: #fbfcfd;
    }
    #remoteView .topology-tree-compact {
      margin-bottom: 16px;
    }
    @media (max-width: 1100px) {
      #remoteView {
        grid-template-columns: 220px minmax(0, 1fr);
      }
      #remoteView .overview.config-overview,
      #remoteView .index-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      #remoteView .topology-node {
        grid-template-columns: 38px minmax(0, 1fr);
      }
      #remoteView .monitor-meta {
        grid-template-columns: 1fr;
      }
      #remoteView .monitor-key-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      #remoteView .topology-state {
        grid-column: 2;
        justify-self: start;
      }
      #remoteView .topbar-title span {
        display: none;
      }
    }
    @media (max-width: 820px) {
      #remoteView {
        display: block;
      }
      #remoteView .sidebar {
        position: sticky;
        top: 0;
        z-index: 30;
        height: auto;
        min-height: auto;
      }
      #remoteView .sidebar-brand {
        min-height: 56px;
      }
      #remoteView .sidebar-nav {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
        padding: 8px;
      }
      #remoteView .nav-link {
        min-height: 38px;
      }
      #remoteView .nav-child {
        grid-column: 1 / -1;
        padding: 0;
      }
      #remoteView .nav-child.active {
        display: flex;
        gap: 6px;
        overflow-x: auto;
      }
      #remoteView .nav-child a {
        flex: 0 0 auto;
        min-height: 32px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      #remoteView .topology-level {
        margin-left: 10px;
        padding-left: 12px;
      }
      #remoteView header.topbar {
        align-items: stretch;
        flex-direction: column;
        gap: 10px;
        padding: 12px;
      }
      #remoteView .topbar-title {
        margin-right: 0;
      }
      #remoteView .topbar-meta {
        justify-content: space-between;
      }
      #remoteView .topbar-actions {
        flex-wrap: wrap;
      }
      #remoteView .status-chip {
        max-width: 100%;
      }
      #remoteView main.content {
        padding: 14px;
      }
    }
    @media (max-width: 620px) {
      #remoteView .overview.config-overview,
      #remoteView .index-grid {
        grid-template-columns: 1fr;
      }
      #remoteView .wide {
        grid-column: span 1;
      }
      #remoteView .section-header,
      #remoteView .device-head,
      #remoteView .panel-title-row {
        flex-direction: column;
      }
      #remoteView .actions,
      #remoteView .template-actions,
      #remoteView .topbar-actions {
        width: 100%;
      }
      #remoteView .actions button,
      #remoteView .topbar-actions button {
        flex: 1 1 120px;
      }
      #remoteView .actions button.icon-only,
      #remoteView .topbar-actions button.icon-only,
      #remoteView .inline-actions button.icon-only,
      #remoteView .register-actions button.icon-only,
      #remoteView .actions-cell button.icon-only {
        flex: 0 0 38px;
      }
      #remoteView .topbar-system,
      #remoteView .status-chip {
        width: 100%;
      }
      #remoteView .topbar-item {
        flex: 1 1 0;
        justify-content: center;
      }
      #remoteView .monitor-grid {
        grid-template-columns: 1fr;
      }
      #remoteView .control-layout,
      #remoteView .limit-grid {
        grid-template-columns: 1fr;
      }
      #remoteView .control-actions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  </style>
  <link rel="stylesheet" href="/assets/admin-tailwind.css?v=20260611-ui5">
</head>
<body class="tailwind-ui admin-screen server-admin">
  <svg class="icon-sprite" aria-hidden="true">
    <symbol id="icon-home" viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path></symbol>
    <symbol id="icon-menu" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M3 12h18"></path><path d="M3 18h18"></path></symbol>
    <symbol id="icon-overview" viewBox="0 0 24 24"><path d="M3 13h8V3H3z"></path><path d="M13 21h8V11h-8z"></path><path d="M13 9h8V3h-8z"></path><path d="M3 21h8v-6H3z"></path></symbol>
    <symbol id="icon-server" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="6" rx="2"></rect><rect x="4" y="14" width="16" height="6" rx="2"></rect><path d="M8 7h.01M8 17h.01"></path></symbol>
    <symbol id="icon-monitor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 16v4"></path></symbol>
    <symbol id="icon-device" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"></rect><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"></path></symbol>
    <symbol id="icon-meter" viewBox="0 0 24 24"><path d="M5 12a7 7 0 0 1 14 0"></path><path d="M4 12v7h16v-7"></path><path d="m12 12 4-4"></path><path d="M8 16h8"></path></symbol>
    <symbol id="icon-inverter" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"></rect><path d="M8 7h8"></path><path d="m13 9-3 5h4l-2 5 5-7h-4l2-3Z"></path></symbol>
    <symbol id="icon-weather" viewBox="0 0 24 24"><circle cx="7" cy="7" r="3"></circle><path d="M7 1v2M7 11v2M1 7h2M11 7h2M4.2 4.2 2.8 2.8M11.2 11.2 9.8 9.8M9.8 4.2l1.4-1.4M2.8 11.2l1.4-1.4"></path><path d="M17.5 20H11a3.5 3.5 0 1 1 .7-6.93A5 5 0 0 1 21 15.5 3.5 3.5 0 0 1 17.5 20Z"></path></symbol>
    <symbol id="icon-chevron-down" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"></path></symbol>
    <symbol id="icon-sliders" viewBox="0 0 24 24"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"></path><path d="M2 14h4M10 8h4M18 16h4"></path></symbol>
    <symbol id="icon-rs485" viewBox="0 0 24 24"><path d="M6 3v18"></path><path d="M18 3v18"></path><path d="M6 7h12"></path><path d="M6 12h12"></path><path d="M6 17h12"></path><circle cx="6" cy="7" r="2"></circle><circle cx="18" cy="17" r="2"></circle></symbol>
    <symbol id="icon-activity" viewBox="0 0 24 24"><path d="M3 12h4l3-7 4 14 3-7h4"></path></symbol>
    <symbol id="icon-maintenance" viewBox="0 0 24 24"><path d="m14.7 6.3 2 2"></path><path d="M18 2l-4 4 3 3 4-4"></path><path d="m2 22 8.5-8.5"></path><path d="M10 14 8 12l-6 6v4h4z"></path></symbol>
    <symbol id="icon-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></symbol>
    <symbol id="icon-database" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="7" ry="3"></ellipse><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"></path></symbol>
    <symbol id="icon-refresh" viewBox="0 0 24 24"><path d="M20 11a8 8 0 0 0-14.7-4.4L3 9"></path><path d="M3 4v5h5"></path><path d="M4 13a8 8 0 0 0 14.7 4.4L21 15"></path><path d="M21 20v-5h-5"></path></symbol>
    <symbol id="icon-save" viewBox="0 0 24 24"><path d="M5 3h12l2 2v16H5Z"></path><path d="M8 3v6h8V3M8 21v-7h8v7"></path></symbol>
    <symbol id="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7Z"></path></symbol>
    <symbol id="icon-stop" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"></rect></symbol>
    <symbol id="icon-trash" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"></path></symbol>
    <symbol id="icon-log-out" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5"></path><path d="M15 12H3"></path><path d="M21 19V5a2 2 0 0 0-2-2h-4"></path></symbol>
    <symbol id="icon-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></symbol>
    <symbol id="icon-arrow-left" viewBox="0 0 24 24"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></symbol>
    <symbol id="icon-zap" viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"></path></symbol>
    <symbol id="icon-alert" viewBox="0 0 24 24"><path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="m10.3 3.9-8.2 14.2A2 2 0 0 0 3.8 21h16.4a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0z"></path></symbol>
    <symbol id="icon-check-circle" viewBox="0 0 24 24"><path d="m7.5 12.2 3.2 3.2 5.8-6.8"></path></symbol>
    <symbol id="icon-alert-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></symbol>
    <symbol id="icon-alert-triangle" viewBox="0 0 24 24"><path d="m10.3 3.9-8.2 14.2A2 2 0 0 0 3.8 21h16.4a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></symbol>
    <symbol id="icon-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M9.1 9a3 3 0 1 1 5.8 1c-.4.8-1.1 1.2-1.8 1.7-.7.5-1.1 1-1.1 2.3"></path><path d="M12 17h.01"></path></symbol>
    <symbol id="icon-user" viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"></path><circle cx="12" cy="7" r="4"></circle></symbol>
    <symbol id="icon-settings" viewBox="0 0 24 24"><path d="M12.2 2h-.4l-.8 3a7.8 7.8 0 0 0-1.8.8L6.4 4.3l-.3.3-2 3.5.3.3 2.4.7a8 8 0 0 0 0 2L4.4 12l-.3.3 2 3.5.3.3 2.8-1.5a7.8 7.8 0 0 0 1.8.8l.8 3h.4l.8-3a7.8 7.8 0 0 0 1.8-.8l2.8 1.5.3-.3 2-3.5-.3-.3-2.4-.8a8 8 0 0 0 0-2l2.4-.7.3-.3-2-3.5-.3-.3-2.8 1.5a7.8 7.8 0 0 0-1.8-.8L12.2 2z"></path><circle cx="12" cy="12" r="3"></circle></symbol>
    <symbol id="icon-cloud" viewBox="0 0 24 24"><path d="M17.5 19H7a5 5 0 0 1-.6-10A7 7 0 0 1 20 11.5 3.8 3.8 0 0 1 17.5 19z"></path></symbol>
    <symbol id="icon-network" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="6" rx="1"></rect><rect x="2" y="16" width="6" height="6" rx="1"></rect><rect x="16" y="16" width="6" height="6" rx="1"></rect><path d="M12 8v4M5 16v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"></path></symbol>
    <symbol id="icon-list" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13"></path><path d="M3 6h.01M3 12h.01M3 18h.01"></path></symbol>
    <symbol id="icon-hard-drive" viewBox="0 0 24 24"><path d="M22 12H2l3-8h14l3 8z"></path><path d="M2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6"></path><path d="M6 16h.01M10 16h.01"></path></symbol>
  </svg>
  <div id="homeView" class="app-shell">
    <aside class="sidebar" aria-label="Fleet navigation">
      <div class="sidebar-brand">
        <span class="sidebar-logo"><img src="/logo/logo-smallsize.png" alt=""></span>
        <span>
          <strong>Electric Bird</strong>
          <small>Hardware Gateway</small>
        </span>
      </div>
      <nav class="sidebar-nav">
        <button class="nav-link active" type="button" data-home-target="homeOverviewPanel"><span class="nav-icon"><svg class="app-icon"><use href="#icon-home"></use></svg></span>Site</button>
      </nav>
    </aside>
    <div class="workspace">
      <header class="topbar">
        <div class="topbar-title">
          <strong id="homePageTitle">Active Sites</strong>
          <span id="homePageSubtitle">Connected gateway sites and current status</span>
        </div>
        <div class="topbar-meta">
          <span class="topbar-item">All Sites</span>
          <button id="homeRefreshBtn" class="subtle icon-only" type="button" title="Refresh sites" aria-label="Refresh sites"><svg class="app-icon"><use href="#icon-refresh"></use></svg><span class="visually-hidden">Refresh sites</span></button>
          <button id="homeLogoutBtn" class="subtle icon-only" type="button" title="Logout" aria-label="Logout"><svg class="app-icon"><use href="#icon-log-out"></use></svg><span class="visually-hidden">Logout</span></button>
        </div>
      </header>
      <main class="content">
        <section id="homeOverviewPanel" class="home-page active" data-home-panel>
          <section class="home-panel">
            <div class="panel-title-row">
              <div>
                <h2 class="panel-title">Site</h2>
                <p>Connected gateway sites. Use Remote to open the gateway UI.</p>
              </div>
            </div>
            <div id="gatewayHomeGrid" class="gateway-grid"></div>
          </section>
        </section>

        <section id="manualGatewayPanel" class="home-panel hidden">
          <div class="section-header">
            <div class="section-title">
              <h2>Manual Gateway</h2>
              <p>Create a gateway record before the IPC registers itself.</p>
            </div>
          </div>
          <form class="grid" id="gatewayForm">
            <label>Gateway ID<input name="id" required></label>
            <label>Name<input name="name"></label>
            <label>Site<input name="site"></label>
            <label>Token<input name="token" required></label>
            <div class="actions"><button class="primary icon-only" type="submit" title="Save gateway" aria-label="Save gateway"><svg class="app-icon"><use href="#icon-save"></use></svg><span class="visually-hidden">Save gateway</span></button></div>
          </form>
        </section>

      </main>
    </div>
  </div>

  <div id="remoteView" class="app-shell hidden">
    <aside class="sidebar" aria-label="Điều hướng chính">
      <div class="sidebar-brand">
        <span class="sidebar-logo"><img src="/logo/logo-smallsize.png" alt=""></span>
        <span>
          <strong>Electric Bird</strong>
          <small>Hardware Gateway</small>
        </span>
      </div>
      <nav class="sidebar-nav">
        <a class="nav-link active" href="#stationDeviceOverviewSubtab" data-tab-target="generalInformation"><span class="nav-icon"><svg class="app-icon"><use href="#icon-overview"></use></svg></span>Overview</a>
        <div class="nav-child active" data-child-menu="generalInformation">
          <a class="active" href="#stationDeviceOverviewSubtab" data-parent-tab="generalInformation" data-subtab-target="stationDeviceOverviewSubtab">Station Devices</a>
        </div>
        <a class="nav-link" href="#deviceMonitoringTab" data-tab-target="deviceMonitoringTab"><span class="nav-icon"><svg class="app-icon"><use href="#icon-monitor"></use></svg></span>Monitoring</a>
        <a class="nav-link" href="#gatewaySubtab" data-tab-target="settingCommunication"><span class="nav-icon"><svg class="app-icon"><use href="#icon-rs485"></use></svg></span>Settings</a>
        <div class="nav-child" data-child-menu="settingCommunication">
          <a class="active" href="#gatewaySubtab" data-parent-tab="settingCommunication" data-subtab-target="gatewaySubtab">Gateway</a>
          <a href="#rs485PortsSubtab" data-parent-tab="settingCommunication" data-subtab-target="rs485PortsSubtab">RS485 / COM</a>
          <a href="#stationsSubtab" data-parent-tab="settingCommunication" data-subtab-target="stationsSubtab">Station</a>
          <a href="#modbusDevicesSubtab" data-parent-tab="settingCommunication" data-subtab-target="modbusDevicesSubtab">Device</a>
          <a href="#rawYamlSubtab" data-parent-tab="settingCommunication" data-subtab-target="rawYamlSubtab">Raw YAML</a>
        </div>
        <a class="nav-link" href="#iec104Subtab" data-tab-target="iec104Tab"><span class="nav-icon"><svg class="app-icon"><use href="#icon-server"></use></svg></span>IEC104 / EVN</a>
        <a class="nav-link" href="#libraryTab" data-tab-target="libraryTab"><span class="nav-icon"><svg class="app-icon"><use href="#icon-database"></use></svg></span>Template</a>
        <a class="nav-link" href="#inverterControlTab" data-tab-target="inverterControlTab"><span class="nav-icon"><svg class="app-icon"><use href="#icon-maintenance"></use></svg></span>Control</a>
        <a class="nav-link" href="#storageSyncTab" data-tab-target="storageSyncTab"><span class="nav-icon"><svg class="app-icon"><use href="#icon-server"></use></svg></span>Storage</a>
        <a class="nav-link" href="#logsEventsTab" data-tab-target="logsEventsTab"><span class="nav-icon"><svg class="app-icon"><use href="#icon-info"></use></svg></span>Events</a>
        <a class="nav-link" href="#systemTab" data-tab-target="systemTab"><span class="nav-icon"><svg class="app-icon"><use href="#icon-settings"></use></svg></span>System</a>
      </nav>
      <div class="sidebar-footer" aria-label="Connectivity status">
        <span id="sidebarLanStatus" class="connectivity-tile status-waiting" title="LAN" aria-label="LAN">
          <span class="connectivity-icon"><svg class="app-icon"><use href="#icon-rs485"></use></svg></span>
        </span>
        <span id="sidebarInternetStatus" class="connectivity-tile status-waiting" title="Internet" aria-label="Internet">
          <span class="connectivity-icon"><svg class="app-icon"><use href="#icon-server"></use></svg></span>
        </span>
        <span id="sidebarCloudStatus" class="connectivity-tile status-waiting" title="Cloud MongoDB" aria-label="Cloud MongoDB">
          <span class="connectivity-icon"><svg class="app-icon"><use href="#icon-cloud"></use></svg></span>
        </span>
      </div>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <button class="menu-button" type="button" data-tab-target="generalInformation" aria-label="Menu tổng quan"><svg class="app-icon"><use href="#icon-menu"></use></svg></button>
        <div class="topbar-title">
          <strong id="activePageTitle">Overview</strong>
          <span id="activePageSubtitle">Connection status của từng Modbus device</span>
        </div>
        <div class="topbar-meta">
          <div class="topbar-system" aria-label="Cảnh báo runtime">
            <span class="topbar-item" title="Kết nối tốt và đang đọc dữ liệu"><span class="badge-dot green"><svg class="app-icon"><use href="#icon-check-circle"></use></svg></span><span id="topOkCount">0</span></span>
            <span class="topbar-item" title="Thiết bị lỗi hoặc poll thất bại"><span class="badge-dot red"><svg class="app-icon"><use href="#icon-alert-circle"></use></svg></span><span id="topErrorCount">0</span></span>
            <span class="topbar-item" title="Có kết nối nhưng chưa có dữ liệu thanh ghi"><span class="badge-dot orange"><svg class="app-icon"><use href="#icon-alert-triangle"></use></svg></span><span id="topWarningCount">0</span></span>
            <span class="topbar-item" title="Mất liên lạc hoặc chưa có telemetry"><span class="badge-dot gray"><svg class="app-icon"><use href="#icon-help"></use></svg></span><span id="topLossCount">0</span></span>
            <span class="topbar-item" title="Quản trị" aria-label="Quản trị"><svg class="app-icon"><use href="#icon-user"></use></svg></span>
          </div>
          <div class="topbar-actions">
            <label class="admin-language-select" aria-label="Ngôn ngữ">
              <select id="adminLanguageSelect">
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </label>
            <button id="remoteDisconnectBtn" class="subtle icon-only" type="button" title="Về danh sách site" aria-label="Về danh sách site"><svg class="app-icon"><use href="#icon-arrow-left"></use></svg><span class="visually-hidden">Về danh sách site</span></button>
          </div>
          <div class="status-chip">
            <button id="status" class="status" type="button" aria-label="Trạng thái: Đang tải..." data-message="Đang tải..." title="Đang tải..."></button>
            <span id="statusText" class="status-text">Đang tải...</span>
          </div>
        </div>
      </header>

      <main class="content">
        <div id="generalInformation" class="tab-panel active" data-tab-panel>
          <div id="stationDeviceOverviewSubtab" class="subtab-panel active" data-subtab-panel="generalInformation">
            <section class="home-panel realtime-panel">
              <div class="panel-title-row">
                <h2 class="panel-title">Tổng quan thiết bị trạm <span>( Tốt <b id="dashboardGoodInline">0</b>, Cảnh báo <b id="dashboardWarningInline">0</b>, Lỗi <b class="danger-text" id="dashboardBadInline">0</b>, Mất liên lạc <b id="dashboardLossInline">0</b> )</span></h2>
              </div>
              <div class="status-legend" aria-label="Chú giải trạng thái">
                <span><i class="topology-dot good"></i>Tốt</span>
                <span><i class="topology-dot warning"></i>Cảnh báo</span>
                <span><i class="topology-dot bad"></i>Lỗi</span>
                <span><i class="topology-dot loss"></i>Mất liên lạc</span>
              </div>
              <div id="dashboardTopology" class="topology-tree"></div>
            </section>
          </div>
        </div>

        <div id="deviceMonitoringTab" class="tab-panel" data-tab-panel>
          <section id="deviceMonitoring" class="home-panel monitoring-panel">
            <div class="panel-title-row">
              <h2 class="panel-title">Giám sát thiết bị <span id="monitoringSummary">Đang chờ dữ liệu</span></h2>
              <div class="monitor-toolbar">
                <span id="monitoringUpdated">Cập nhật lần cuối: -</span>
                <button id="refreshTelemetryBtn" class="subtle icon-text" type="button">
                  <svg class="app-icon"><use href="#icon-refresh"></use></svg>
                  Làm mới
                </button>
              </div>
            </div>
            <div id="monitoringDevices" class="monitor-grid"></div>
          </section>
        </div>

        <div id="inverterControlTab" class="tab-panel" data-tab-panel>
          <section class="home-panel">
            <div class="panel-title-row">
              <h2 class="panel-title">Điều khiển trạm / inverter</h2>
            </div>
            <div class="control-layout">
              <label class="control-target">Đối tượng
                <select id="controlDeviceName"></select>
              </label>
              <div class="control-stack">
                <div class="control-actions">
                  <button class="primary icon-text" type="button" data-control-action="start"><svg class="app-icon"><use href="#icon-play"></use></svg>Khởi động</button>
                  <button class="danger icon-text" type="button" data-control-action="stop"><svg class="app-icon"><use href="#icon-stop"></use></svg>Dừng</button>
                  <button class="subtle icon-text" type="button" data-control-action="reboot"><svg class="app-icon"><use href="#icon-refresh"></use></svg>Khởi động lại</button>
                  <button class="subtle icon-text" type="button" data-control-action="clear_power_limit"><svg class="app-icon"><use href="#icon-trash"></use></svg>Xóa giới hạn</button>
                </div>
                <form id="powerLimitForm" class="limit-grid">
                  <label>Kiểu giới hạn
                    <select id="powerLimitMode">
                      <option value="percent">Percent</option>
                      <option value="kw">kW</option>
                      <option value="watts">W</option>
                    </select>
                  </label>
                  <label>Giá trị giới hạn<input id="powerLimitValue" type="number" min="0" max="100" step="0.1" value="60"></label>
                  <label class="schedule-now-field">Thời lượng phút<input id="powerLimitDurationMinutes" type="number" min="1" max="1440" step="1" value="15"></label>
                  <button class="primary icon-text" type="submit"><svg class="app-icon"><use href="#icon-check-circle"></use></svg>Áp dụng giới hạn</button>
                </form>
                <div class="control-schedule">
                  <div class="panel-title-row">
                    <div>
                      <h2 class="panel-title">Lịch hẹn lệnh</h2>
                      <p>Áp dụng cho nút điều khiển và form giới hạn công suất. Với giới hạn công suất, hệ thống tự tính thời lượng từ giờ bắt đầu đến giờ kết thúc.</p>
                    </div>
                  </div>
                  <div class="schedule-grid">
                    <label>Kiểu hẹn
                      <select id="controlScheduleMode">
                        <option value="now">Chạy ngay</option>
                        <option value="once">Một lần</option>
                        <option value="daily">Hằng ngày</option>
                        <option value="weekly">Hằng tuần</option>
                      </select>
                    </label>
                    <label class="schedule-once-field">Thời điểm chạy<input id="controlScheduleAt" type="datetime-local"></label>
                    <label class="schedule-once-field">Kết thúc giới hạn<input id="controlScheduleUntil" type="datetime-local"></label>
                    <label class="schedule-repeat-field">Giờ chạy<input id="controlScheduleTime" type="time" value="08:00"></label>
                    <label class="schedule-repeat-field">Đến giờ<input id="controlScheduleEndTime" type="time" value="17:00"></label>
                    <label class="schedule-repeat-field">Số lần tối đa<input id="controlScheduleMaxRuns" type="number" min="1" max="10000" step="1" placeholder="Không giới hạn"></label>
                    <label class="schedule-repeat-field">Kết thúc sau ngày<input id="controlScheduleEndAt" type="date"></label>
                  </div>
                  <fieldset class="weekday-grid schedule-weekly-field">
                    <legend>Ngày trong tuần</legend>
                    <label><input type="checkbox" data-schedule-weekday="1" checked> T2</label>
                    <label><input type="checkbox" data-schedule-weekday="2" checked> T3</label>
                    <label><input type="checkbox" data-schedule-weekday="3" checked> T4</label>
                    <label><input type="checkbox" data-schedule-weekday="4" checked> T5</label>
                    <label><input type="checkbox" data-schedule-weekday="5" checked> T6</label>
                    <label><input type="checkbox" data-schedule-weekday="6"> T7</label>
                    <label><input type="checkbox" data-schedule-weekday="7"> CN</label>
                  </fieldset>
                  <p id="controlScheduleSummary" class="section-footnote"></p>
                </div>
              </div>
            </div>
          </section>

          <section class="home-panel">
            <div class="panel-title-row">
              <h2 class="panel-title">Lịch sử lệnh</h2>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tạo lúc</th>
                    <th>Hành động</th>
                    <th>Trạng thái</th>
                    <th>Lịch</th>
                    <th>Chi tiết</th>
                    <th>Cập nhật</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody id="controlHistoryBody"></tbody>
              </table>
            </div>
          </section>
        </div>

        <div id="storageSyncTab" class="tab-panel" data-tab-panel>
          <section class="config-section">
            <div class="panel-title-row">
              <div>
                <h2 class="panel-title">Lưu trữ & Đồng bộ</h2>
                <p>Queue nội bộ, giới hạn lưu trữ, upload HTTP/Mongo và IEC104 runtime.</p>
              </div>
              <div class="actions">
                <button id="refreshRuntimeBtn" class="subtle icon-only" type="button" title="Làm mới" aria-label="Làm mới"><svg class="app-icon"><use href="#icon-refresh"></use></svg><span class="visually-hidden">Làm mới</span></button>
              </div>
            </div>
            <section class="overview config-overview" aria-label="Tổng quan đồng bộ runtime">
              <div class="metric"><span>Record trong queue</span><strong id="queueRecords">-</strong></div>
              <div class="metric"><span>Dung lượng queue</span><strong id="queueBytes">-</strong></div>
              <div class="metric"><span>Đồng bộ cloud</span><strong id="runtimeCloudMode">-</strong></div>
              <div class="metric"><span>IEC104</span><strong id="runtimeIec104">-</strong></div>
            </section>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Hạng mục</th><th>Giá trị</th><th>Ghi chú</th></tr></thead>
                <tbody id="storageSyncBody"></tbody>
              </table>
            </div>
          </section>
        </div>

        <div id="logsEventsTab" class="tab-panel" data-tab-panel>
          <section class="config-section">
            <div class="panel-title-row">
              <div>
                <h2 class="panel-title">Sự kiện</h2>
                <p>Sự kiện vận hành suy ra từ telemetry, queue, IEC104 và điều khiển gần nhất.</p>
              </div>
            </div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Thời gian</th><th>Loại</th><th>Nội dung</th><th>Trạng thái</th></tr></thead>
                <tbody id="logsEventsBody"></tbody>
              </table>
            </div>
          </section>
        </div>

        <div id="systemTab" class="tab-panel" data-tab-panel>
          <section class="config-section">
            <div class="panel-title-row">
              <div>
                <h2 class="panel-title">Hệ thống</h2>
                <p>Thông tin IPC gateway, tài nguyên cấu hình và trạng thái service.</p>
              </div>
              <div class="actions">
                <button class="subtle icon-only" type="button" data-restart-gateway title="Khởi động lại" aria-label="Khởi động lại"><svg class="app-icon"><use href="#icon-refresh"></use></svg><span class="visually-hidden">Khởi động lại</span></button>
                <button class="primary icon-only" type="button" data-save-config title="Lưu" aria-label="Lưu"><svg class="app-icon"><use href="#icon-save"></use></svg><span class="visually-hidden">Lưu</span></button>
              </div>
            </div>
            <div class="grid">
              <div class="metric"><span>Gateway ID</span><strong id="systemGatewayId">-</strong></div>
              <div class="metric"><span>Thiết bị</span><strong id="systemDeviceCount">0</strong></div>
              <div class="metric"><span>Cổng</span><strong id="systemPortCount">0</strong></div>
              <div class="metric"><span>Mẫu</span><strong id="systemTemplateCount">0</strong></div>
            </div>
          </section>
        </div>

        <div id="settingCommunication" class="tab-panel" data-tab-panel>
          <div id="gatewaySubtab" class="subtab-panel active" data-subtab-panel="settingCommunication">
            <section class="overview">
              <div class="metric"><span>Gateway</span><strong id="summaryGateway">-</strong></div>
              <div class="metric"><span>Máy chủ</span><strong id="summaryServer">-</strong></div>
              <div class="metric"><span>Cổng</span><strong id="summaryPorts">0</strong></div>
              <div class="metric"><span>Thiết bị</span><strong id="summaryDevices">0</strong></div>
            </section>
            <section class="config-section">
              <div class="section-header">
                <div class="section-title">
                  <h2>Gateway</h2>
                  <p>Thiết lập gửi dữ liệu thiết bị lên máy chủ và chu kỳ upload.</p>
                </div>
                <div class="actions">
                  <button class="subtle icon-text" type="button" data-parent-tab="settingCommunication" data-subtab-target="rawYamlSubtab"><svg class="app-icon"><use href="#icon-list"></use></svg>Raw YAML</button>
                  <button class="subtle icon-only" type="button" data-restart-gateway title="Khởi động lại" aria-label="Khởi động lại"><svg class="app-icon"><use href="#icon-refresh"></use></svg><span class="visually-hidden">Khởi động lại</span></button>
                  <button class="primary icon-only" type="button" data-save-config title="Lưu" aria-label="Lưu"><svg class="app-icon"><use href="#icon-save"></use></svg><span class="visually-hidden">Lưu</span></button>
                </div>
              </div>
              <div class="grid">
                <label>Gateway ID <input id="gatewayId" autocomplete="off"></label>
                <label>Đường dẫn Gateway ID <input id="gatewayIdPath" autocomplete="off"></label>
                <label>Độ trễ vòng poll ms <input id="pollLoopDelayMs" type="number" min="50" step="50"></label>
                <label class="wide">URL máy chủ <input id="serverUrl" autocomplete="url"></label>
                <label>Token env <input id="tokenEnv" autocomplete="off"></label>
                <label>Timeout ms <input id="timeoutMs" type="number" min="100"></label>
                <label>Cỡ lô upload <input id="batchSize" type="number" min="1"></label>
                <label>Chu kỳ upload ms <input id="uploadIntervalMs" type="number" min="500"></label>
                <label class="wide">URL cấu hình từ xa <input id="remoteConfigUrl" autocomplete="url"></label>
                <label>Bật cấu hình từ xa <select id="remoteConfigEnabled"><option value="true">Bật</option><option value="false">Tắt</option></select></label>
                <label>Remote token env <input id="remoteConfigTokenEnv" autocomplete="off"></label>
                <label>Chu kỳ kiểm tra remote ms <input id="remoteConfigCheckIntervalMs" type="number" min="5000" step="1000"></label>
                <label>Remote timeout ms <input id="remoteConfigTimeoutMs" type="number" min="1000" step="1000"></label>
                <label class="wide">Đường dẫn trạng thái remote <input id="remoteConfigStatePath" autocomplete="off"></label>
                <label>Bật Mongo <select id="mongoEnabled"><option value="false">Tắt</option><option value="true">Bật</option></select></label>
                <label>Mongo URI env <input id="mongoUriEnv" autocomplete="off"></label>
                <label>Mongo DB env <input id="mongoDbNameEnv" autocomplete="off"></label>
                <label>Tên Mongo DB <input id="mongoDbName" autocomplete="off"></label>
                <label>Chu kỳ Mongo ms <input id="mongoCheckIntervalMs" type="number" min="5000" step="1000"></label>
                <label>Chu kỳ upload Mongo ms <input id="mongoUploadIntervalMs" type="number" min="500" step="500"></label>
                <label>Cỡ lô Mongo <input id="mongoBatchSize" type="number" min="1"></label>
                <label class="wide">Đường dẫn trạng thái Mongo <input id="mongoStatePath" autocomplete="off"></label>
                <label class="wide">Đường dẫn queue <input id="queuePath" autocomplete="off"></label>
              </div>
            </section>
          </div>

          <div id="rs485PortsSubtab" class="subtab-panel" data-subtab-panel="settingCommunication">
            <section class="config-section">
              <div class="section-header">
                <div class="section-title">
                  <h2>RS485 / COM</h2>
                  <p>Cấu hình cổng serial cho Modbus RTU; Modbus TCP dùng host/port trong thiết bị.</p>
                </div>
                <div class="actions">
                  <button id="addPortBtn" class="subtle icon-only" type="button" title="Thêm cổng" aria-label="Thêm cổng"><svg class="app-icon"><use href="#icon-plus"></use></svg><span class="visually-hidden">Thêm cổng</span></button>
                  <button class="subtle icon-only" type="button" data-restart-gateway title="Khởi động lại" aria-label="Khởi động lại"><svg class="app-icon"><use href="#icon-refresh"></use></svg><span class="visually-hidden">Khởi động lại</span></button>
                  <button class="primary icon-only" type="button" data-save-config title="Lưu" aria-label="Lưu"><svg class="app-icon"><use href="#icon-save"></use></svg><span class="visually-hidden">Lưu</span></button>
                </div>
              </div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Đường dẫn COM</th>
                      <th>Tốc độ baud</th>
                      <th>Kiểm tra chẵn lẻ</th>
                      <th>Bit dữ liệu</th>
                      <th>Bit stop</th>
                      <th>Thời gian chờ</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody id="portsBody"></tbody>
                </table>
              </div>
            </section>
          </div>

          <div id="stationsSubtab" class="subtab-panel" data-subtab-panel="settingCommunication">
            <section class="config-section">
              <div class="section-header">
                <div class="section-title">
                  <h2>Trạm</h2>
                  <p>Tạo trạm và gán inverter, công tơ, cảm biến thời tiết vào từng trạm.</p>
                </div>
                <div class="actions">
                  <button id="addStationBtn" class="subtle icon-only" type="button" title="Thêm trạm" aria-label="Thêm trạm"><svg class="app-icon"><use href="#icon-plus"></use></svg><span class="visually-hidden">Thêm trạm</span></button>
                  <button class="subtle icon-only" type="button" data-restart-gateway title="Khởi động lại" aria-label="Khởi động lại"><svg class="app-icon"><use href="#icon-refresh"></use></svg><span class="visually-hidden">Khởi động lại</span></button>
                  <button class="primary icon-only" type="button" data-save-config title="Lưu" aria-label="Lưu"><svg class="app-icon"><use href="#icon-save"></use></svg><span class="visually-hidden">Lưu</span></button>
                </div>
              </div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tên trạm</th>
                      <th>Công suất</th>
                      <th>Thiết bị</th>
                      <th>EVN</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody id="stationsBody"></tbody>
                </table>
              </div>
            </section>
          </div>

          <div id="modbusDevicesSubtab" class="subtab-panel" data-subtab-panel="settingCommunication">
            <section class="config-section">
              <div class="section-header">
                <div class="section-title">
                  <h2>Thiết bị Modbus</h2>
                  <p>Thiết bị, slave/unit ID, chu kỳ polling và bản đồ thanh ghi trên RS485/COM hoặc Ethernet TCP.</p>
                </div>
                <div class="actions template-actions">
                  <select id="newDeviceTemplate" aria-label="Mẫu thiết bị"><option value="">Thiết bị trống</option></select>
                  <button id="addDeviceBtn" class="subtle icon-only" type="button" title="Thêm thiết bị" aria-label="Thêm thiết bị"><svg class="app-icon"><use href="#icon-plus"></use></svg><span class="visually-hidden">Thêm thiết bị</span></button>
                  <button class="subtle icon-only" type="button" data-restart-gateway title="Khởi động lại" aria-label="Khởi động lại"><svg class="app-icon"><use href="#icon-refresh"></use></svg><span class="visually-hidden">Khởi động lại</span></button>
                  <button class="primary icon-only" type="button" data-save-config title="Lưu" aria-label="Lưu"><svg class="app-icon"><use href="#icon-save"></use></svg><span class="visually-hidden">Lưu</span></button>
                </div>
              </div>
              <div id="configurationTopology" class="topology-tree topology-tree-compact"></div>
              <div id="devices"></div>
            </section>
          </div>

          <div id="rawYamlSubtab" class="subtab-panel" data-subtab-panel="settingCommunication">
            <section class="config-section">
              <div class="section-header">
                <div class="section-title">
                  <h2>YAML thô</h2>
                  <p>Tài liệu cấu hình remote sẽ trở thành phiên bản cloud config tiếp theo.</p>
                </div>
                <div class="actions"><button class="primary icon-only" type="button" data-save-config title="Lưu" aria-label="Lưu"><svg class="app-icon"><use href="#icon-save"></use></svg><span class="visually-hidden">Lưu</span></button></div>
              </div>
              <textarea id="rawYaml" class="raw" readonly></textarea>
            </section>
          </div>

          <div id="iec104Subtab" class="subtab-panel" data-subtab-panel="iec104Tab">
    <section class="config-section">
      <div class="section-header">
        <div class="section-title">
          <h2>IEC104 EVN</h2>
          <p>Cấu hình kết nối IEC104 cho EVN; IOA và register mapping nằm ở phần EVN bên dưới.</p>
        </div>
        <div class="actions">
          <button id="applyEvnIec104DefaultsBtn" class="subtle icon-text" type="button"><svg class="app-icon"><use href="#icon-settings"></use></svg>EVN mặc định</button>
          <button class="subtle icon-only" type="button" data-restart-gateway title="Khởi động lại" aria-label="Khởi động lại"><svg class="app-icon"><use href="#icon-refresh"></use></svg><span class="visually-hidden">Khởi động lại</span></button>
          <button class="primary icon-only" type="button" data-save-config title="Lưu" aria-label="Lưu"><svg class="app-icon"><use href="#icon-save"></use></svg><span class="visually-hidden">Lưu</span></button>
        </div>
      </div>
      <div class="evn-iec104-note">
        <strong>Vai trò IEC104 EVN cố định</strong>
        <span id="iec104ModeNote">EVN/SCADA là master/client; gateway là server/controlled station lắng nghe TCP 2404.</span>
        <span>CA thường là 1, OA thường là 0; gateway gửi định kỳ 5 phút và bật spontaneous theo chuẩn EVN.</span>
      </div>
      <div class="grid">
        <input id="iec104Mode" type="hidden" value="server">
        <input id="iec104RemoteHost" type="hidden" value="">
        <input id="iec104RemotePort" type="hidden" value="2404">
        <input id="iec104LocalAddress" type="hidden" value="">
        <input id="iec104LocalPort" type="hidden" value="0">
        <input id="iec104ReconnectMs" type="hidden" value="5000">
        <input id="iec104KeepAliveMs" type="hidden" value="30000">
        <input id="iec104StaleAfterMs" type="hidden" value="600000">
        <input id="iec104PeriodicMs" type="hidden" value="300000">
        <input id="iec104Spontaneous" type="hidden" value="true">
        <label class="toggle-field">Bật IEC104 EVN
          <span class="toggle-switch">
            <input id="iec104Enabled" type="checkbox" checked>
            <span class="toggle-track" aria-hidden="true"></span>
            <span class="toggle-on">Bật</span>
            <span class="toggle-off">Tắt</span>
          </span>
        </label>
        <label class="wide">IP gateway lắng nghe <input id="iec104Host" placeholder="0.0.0.0" autocomplete="off"></label>
        <label>Cổng IEC104 EVN <input id="iec104Port" type="number" min="1" max="65535"></label>
        <label>Địa chỉ ASDU (CA) <input id="iec104CommonAddress" type="number" min="1" max="65535"></label>
        <label>Địa chỉ nguồn (OA) <input id="iec104OriginatorAddress" type="number" min="0" max="255"></label>
        <label>Số kết nối EVN tối đa <input id="iec104MaxClientConnections" type="number" min="1" max="32"></label>
      </div>
    </section>

    <section class="config-section">
      <div class="section-header">
        <div class="section-title">
          <h2>Mapping IEC104 EVN cố định</h2>
          <p>IOA EVN là cố định; chọn trạm rồi cập nhật mapping để sinh point và lệnh điều khiển.</p>
        </div>
        <div class="actions">
          <select id="iec104EvnStation" aria-label="Trạm EVN"></select>
          <button id="generateEvnIec104Btn" class="subtle icon-only" type="button" title="Cập nhật mapping EVN" aria-label="Cập nhật mapping EVN"><svg class="app-icon"><use href="#icon-refresh"></use></svg><span class="visually-hidden">Cập nhật mapping EVN</span></button>
          <button class="primary icon-only" type="button" data-save-config title="Lưu" aria-label="Lưu"><svg class="app-icon"><use href="#icon-save"></use></svg><span class="visually-hidden">Lưu</span></button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Bật</th>
              <th>IOA</th>
              <th>Tín hiệu EVN</th>
              <th>Nguồn</th>
              <th>Thiết bị</th>
              <th>Register</th>
              <th>Snapshot</th>
            </tr>
          </thead>
          <tbody id="iec104EvnSourcesBody"></tbody>
        </table>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>IOA</th>
              <th>Tên</th>
              <th>Nguồn</th>
              <th>Đối tượng</th>
              <th>Thông số</th>
              <th>Kiểu</th>
              <th>Đảo chiều</th>
            </tr>
          </thead>
          <tbody id="iec104PointsBody"></tbody>
        </table>
      </div>
    </section>
        </div>
        </div>

        <div id="iec104Tab" class="tab-panel" data-tab-panel></div>

        <div id="libraryTab" class="tab-panel" data-tab-panel>
          <section class="config-section">
            <div class="section-header">
              <div class="section-title">
                <h2>Thư viện mẫu</h2>
                <p>Thêm, sửa và xóa mẫu đọc Modbus dùng cho thiết bị Modbus.</p>
              </div>
              <div class="actions">
                <button id="syncTemplatesBtn" class="subtle icon-only" type="button" title="Đồng bộ từ server" aria-label="Đồng bộ từ server"><svg class="app-icon"><use href="#icon-cloud"></use></svg><span class="visually-hidden">Đồng bộ từ server</span></button>
                <button id="addTemplateBtn" class="subtle icon-only" type="button" title="Thêm mẫu" aria-label="Thêm mẫu"><svg class="app-icon"><use href="#icon-plus"></use></svg><span class="visually-hidden">Thêm mẫu</span></button>
                <button id="saveTemplatesBtn" class="primary icon-only" type="button" title="Lưu thư viện" aria-label="Lưu thư viện"><svg class="app-icon"><use href="#icon-save"></use></svg><span class="visually-hidden">Lưu thư viện</span></button>
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
    let homeTelemetry = new Map();
    let homeConfigs = new Map();
    let homeCommands = new Map();
    let homeTelemetryRequestId = 0;
    let homeDetailsRequestId = 0;
    const expandedDeviceRegisters = new Set();
    const expandedTemplateRegisters = new Set();
    let currentLanguage = localStorage.getItem("adminLanguage") || localStorage.getItem("loginLanguage") || "vi";
    const adminTextViToEn = {
      "Tổng quan": "Overview",
      "Thiết bị trạm": "Station devices",
      "Giám sát": "Monitoring",
      "Cấu hình": "Configuration",
      "Gateway": "Gateway",
      "RS485 / COM": "RS485 / COM",
      "Trạm": "Station",
      "Thiết bị": "Devices",
      "IEC104 / EVN": "IEC104 / EVN",
      "YAML thô": "Raw YAML",
      "Mẫu": "Templates",
      "Điều khiển": "Control",
      "Lưu trữ": "Storage",
      "Sự kiện": "Events",
      "Hệ thống": "System",
      "Quản trị": "Admin",
      "Cổng phần cứng": "Hardware gateway",
      "Cảnh báo runtime": "Runtime alerts",
      "Tiếng Việt": "Vietnamese",
      "Đang tải...": "Loading...",
      "Tổng quan thiết bị trạm": "Station device overview",
      "Tốt": "Good",
      "Cảnh báo": "Warning",
      "Lỗi": "Bad",
      "Mất liên lạc": "Loss communication",
      "Giám sát thiết bị": "Device monitoring",
      "Làm mới": "Refresh",
      "Điều khiển trạm": "Station control",
      "Lưu lịch sử": "Save history",
      "Cấu hình gateway": "Gateway configuration",
      "Cấu hình RS485 / COM": "RS485 / COM configuration",
      "Cấu hình cổng serial cho Modbus RTU; Modbus TCP dùng host/port trong thiết bị.": "Serial port settings for Modbus RTU; Modbus TCP uses host/port on each device.",
      "Cấu hình trạm": "Station configuration",
      "Thiết bị Modbus": "Modbus devices",
      "Thiết bị, slave/unit ID, chu kỳ polling và bản đồ thanh ghi trên RS485/COM hoặc Ethernet TCP.": "Devices, slave/unit IDs, polling intervals, and register maps on RS485/COM or Ethernet TCP.",
      "Định danh thiết bị, chế độ RTU/TCP và bản đồ thanh ghi": "Device identity, RTU/TCP mode, and register maps",
      "EVN IEC104": "EVN IEC104",
      "Mặc định EVN": "EVN defaults",
      "Tạo mapping EVN": "Generate EVN mapping",
      "Lưu": "Save",
      "Khởi động lại": "Restart",
      "Thư viện mẫu": "Template library",
      "Đồng bộ từ server": "Sync from server",
      "Thêm mẫu": "Add template",
      "Lưu thư viện": "Save library",
      "Thêm trạm": "Add station",
      "Thêm cổng": "Add port",
      "Thêm thiết bị": "Add device",
      "Xóa": "Delete",
      "Kiểu": "Type",
      "Giao thức": "Protocol",
      "Chu kỳ poll ms": "Poll ms",
      "Hàm": "Function",
      "Quyền": "Access",
      "Đọc": "Poll",
      "Độ dài": "Length",
      "Thứ tự word": "Word order",
      "Hệ số": "Scale",
      "Độ lệch": "Offset",
      "Đơn vị": "Unit",
      "Không chọn": "None",
      "Chưa chọn": "Not selected",
      "Công tơ": "Meter",
      "Trạm thời tiết": "Weather station",
      "Khác": "Other",
      "Không dùng cho EVN": "Not used for EVN",
      "P tổng trạm": "Station total P",
      "P inverter để cộng": "Inverter P for sum",
      "Điện năng ngày trạm": "Station daily energy",
      "Điện năng ngày inverter": "Inverter daily energy",
      "Q tổng trạm": "Station total Q",
      "Q inverter để cộng": "Inverter Q for sum",
      "Điện áp pha A": "Phase A voltage",
      "Điện áp pha B": "Phase B voltage",
      "Điện áp pha C": "Phase C voltage",
      "Dòng pha A": "Phase A current",
      "Dòng pha B": "Phase B current",
      "Dòng pha C": "Phase C current",
      "Tần số lưới": "Grid frequency",
      "Hệ số công suất": "Power factor",
      "Tổng lượng phát": "Generation energy",
      "Tổng lượng giao/lên lưới": "Export energy",
      "Tổng lượng nhận/từ lưới": "Import energy",
      "Sẵn sàng": "Ready",
      "Đồng bộ": "Synced",
      "Đang tải": "Loading",
    };
    const adminTextEnToVi = Object.fromEntries(Object.entries(adminTextViToEn).map(([vi, en]) => [en, vi]));

    const el = (id) => document.getElementById(id);
    function setText(id, value) {
      const node = el(id);
      if (node) node.textContent = value;
    }
    const templateTypeOptions = [
      { value: "inverter", label: "Inverter" },
      { value: "meter", label: "Công tơ" },
      { value: "weatherstation", label: "Trạm thời tiết" },
      { value: "datalogger", label: "Datalogger" },
      { value: "other", label: "Khác" },
    ];
    const evnRoleOptions = [
      { value: "", label: "Không dùng cho EVN" },
      { value: "station_active_power_kw", label: "P tổng trạm" },
      { value: "inverter_active_power_kw", label: "P inverter để cộng" },
      { value: "station_daily_energy_kwh", label: "Điện năng ngày trạm" },
      { value: "inverter_daily_energy_kwh", label: "Điện năng ngày inverter" },
      { value: "station_reactive_power_kvar", label: "Q tổng trạm" },
      { value: "inverter_reactive_power_kvar", label: "Q inverter để cộng" },
      { value: "phase_a_voltage_v", label: "Điện áp pha A" },
      { value: "phase_b_voltage_v", label: "Điện áp pha B" },
      { value: "phase_c_voltage_v", label: "Điện áp pha C" },
      { value: "phase_a_current_a", label: "Dòng pha A" },
      { value: "phase_b_current_a", label: "Dòng pha B" },
      { value: "phase_c_current_a", label: "Dòng pha C" },
      { value: "grid_frequency_hz", label: "Tần số lưới" },
      { value: "power_factor", label: "Hệ số công suất" },
      { value: "generation_active_energy_kwh", label: "Tổng lượng phát" },
      { value: "export_active_energy_kwh", label: "Tổng lượng giao/lên lưới" },
      { value: "import_active_energy_kwh", label: "Tổng lượng nhận/từ lưới" },
    ];
    const monitoringMetricNames = {
      model: ["model", "model_no", "device_model", "solis_model_definition", "meter_model_detection_result", "current_battery_model"],
      activePower: ["active_power_kw", "active_power_w", "active_power_total_w", "total_active_power_w", "meter_total_active_power_kw", "meter_active_power_w", "power_meter_active_power_w", "inverter_grid_port_power_w", "total_ac_power_w"],
      ratedPower: ["rated_power_kw", "rated_active_power_kw", "rated_active_power_w", "nominal_active_power_kw", "max_active_power_kw", "max_permanent_active_power_w", "limit_active_power_rated_w"],
      dailyEnergy: ["daily_energy_yield_kwh", "daily_energy_kwh", "daily_ac_energy_kwh", "daily_ac_energy_wh", "daily_ac_energy_wh_64", "daily_export_energy_kwh", "today_energy_fed_to_grid_kwh"],
      reactivePower: ["reactive_power_kvar", "reactive_power_var", "reactive_power_total_var", "total_reactive_power_var", "ac_reactive_power_kvar", "meter_total_reactive_power_var"],
      deviceStatus: ["device_status", "operating_status", "inverter_current_status", "meter_status", "energy_storage_running_status", "esu1_running_status", "esu2_running_status", "work_status_1", "work_status_2", "status_message", "status_description"],
      ambientTemperature: ["ambient_temperature_c", "ambient_temp_c", "air_temperature_c"],
      moduleTemperature: ["module_temperature_c", "module_temp_c", "pv_module_temperature_c", "panel_temperature_c"],
      irradiance: ["irradiance_w_m2", "irradiation_w_m2", "solar_irradiance_w_m2", "poa_irradiance_w_m2"],
      voltage: ["voltage_v", "phase_a_voltage_v", "line_voltage_v", "meter_total_voltage_v"],
      frequency: ["frequency_hz", "grid_frequency_hz", "freq_hz"],
      powerFactor: ["power_factor", "pf", "total_power_factor"],
    };
    const tabIds = ["generalInformation", "deviceMonitoringTab", "settingCommunication", "iec104Tab", "libraryTab", "inverterControlTab", "storageSyncTab", "logsEventsTab", "systemTab"];
    const defaultSubtabs = {
      generalInformation: "stationDeviceOverviewSubtab",
      settingCommunication: "gatewaySubtab",
      iec104Tab: "iec104Subtab",
    };
    const subtabParents = {
      stationDeviceOverviewSubtab: "generalInformation",
      gatewaySubtab: "settingCommunication",
      rs485PortsSubtab: "settingCommunication",
      stationsSubtab: "settingCommunication",
      modbusDevicesSubtab: "settingCommunication",
      iec104Subtab: "iec104Tab",
      rawYamlSubtab: "settingCommunication",
    };
    const pageLabels = {
      stationDeviceOverviewSubtab: ["Overview", "Connection status của từng Modbus device"],
      deviceMonitoringTab: ["Device Monitoring", "Latest Modbus data và raw register"],
      inverterControlTab: ["Station Control", "Chạy Modbus command theo station hoặc inverter"],
      gatewaySubtab: ["Gateway", "Upload server, queue và polling cycle"],
      rs485PortsSubtab: ["RS485 / COM", "Serial settings cho Modbus RTU device"],
      stationsSubtab: ["Station", "Station topology và EVN control group"],
      modbusDevicesSubtab: ["Modbus Device", "Device identity, RTU/TCP mode và register map"],
      rawYamlSubtab: ["Raw YAML", "Cấu hình gateway hiện đang lưu"],
      libraryTab: ["Template", "Mẫu Modbus device có thể tái sử dụng"],
      iec104Subtab: ["IEC 60870-5-104", "Bật IEC104 và cấu hình point mapping"],
      storageSyncTab: ["Storage & Sync", "Local queue, cloud upload và IEC104 runtime"],
      logsEventsTab: ["Events", "Sự kiện vận hành gần nhất trên IPC gateway"],
      systemTab: ["System", "Thông tin IPC gateway và service status"],
    };
    const homePageLabels = {
      homeOverviewPanel: ["Active Sites", "Connected gateway sites and current status"],
    };

    function translateAdminText(value) {
      const raw = String(value ?? "");
      const text = raw.trim();
      if (!text) return raw;

      const translated = currentLanguage === "en"
        ? translateAdminViToEn(text)
        : translateAdminEnToVi(text);

      return translated === text ? raw : raw.replace(text, translated);
    }

    function translateAdminViToEn(text) {
      const direct = adminTextViToEn[text];
      if (direct) return direct;

      let match = text.match(/^Trạng thái: (.+)$/);
      if (match) return "Status: " + translateAdminViToEn(match[1]);
      match = text.match(/^Tổng quan thiết bị trạm \\( Tốt (\\d+), Cảnh báo (\\d+), Lỗi (\\d+), Mất liên lạc (\\d+) \\)$/);
      if (match) return "Station device overview ( Good " + match[1] + ", Warning " + match[2] + ", Bad " + match[3] + ", Loss communication " + match[4] + " )";
      match = text.match(/^(\\d+) thiết bị$/);
      if (match) return match[1] + " devices";
      match = text.match(/^Trạm (\\d+)$/);
      if (match) return "Station " + match[1];
      match = text.match(/^Đã đồng bộ (\\d+) mẫu từ server$/);
      if (match) return "Synced " + match[1] + " templates from server";
      match = text.match(/^Đã cập nhật mapping EVN cho (.+)$/);
      if (match) return "Updated EVN mapping for " + match[1];
      match = text.match(/^Đã xóa trạm\\/site (.+)$/);
      if (match) return "Deleted station/site " + match[1];

      return text;
    }

    function translateAdminEnToVi(text) {
      const direct = adminTextEnToVi[text];
      if (direct) return direct;

      let match = text.match(/^Status: (.+)$/);
      if (match) return "Trạng thái: " + translateAdminEnToVi(match[1]);
      match = text.match(/^Station device overview \\( Good (\\d+), Warning (\\d+), Bad (\\d+), Loss communication (\\d+) \\)$/);
      if (match) return "Tổng quan thiết bị trạm ( Tốt " + match[1] + ", Cảnh báo " + match[2] + ", Lỗi " + match[3] + ", Mất liên lạc " + match[4] + " )";
      match = text.match(/^(\\d+) devices$/);
      if (match) return match[1] + " thiết bị";
      match = text.match(/^Station (\\d+)$/);
      if (match) return "Trạm " + match[1];
      match = text.match(/^Synced (\\d+) templates from server$/);
      if (match) return "Đã đồng bộ " + match[1] + " mẫu từ server";
      match = text.match(/^Updated EVN mapping for (.+)$/);
      if (match) return "Đã cập nhật mapping EVN cho " + match[1];
      match = text.match(/^Deleted station\\/site (.+)$/);
      if (match) return "Đã xóa trạm/site " + match[1];

      return text;
    }

    function applyAdminLanguage(root = document) {
      const languageSelect = el("adminLanguageSelect");
      if (languageSelect && languageSelect.value !== currentLanguage) {
        languageSelect.value = currentLanguage;
      }

      const scope = root === document ? document.body : root;
      if (!scope) return;

      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || ["SCRIPT", "STYLE", "SVG", "TEXTAREA"].includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      for (const node of textNodes) {
        node.nodeValue = translateAdminText(node.nodeValue);
      }

      scope.querySelectorAll("[title], [aria-label], [placeholder], [data-message]").forEach((node) => {
        for (const attribute of ["title", "aria-label", "placeholder", "data-message"]) {
          if (!node.hasAttribute(attribute)) continue;
          node.setAttribute(attribute, translateAdminText(node.getAttribute(attribute)));
        }
      });
    }

    function setStatus(message, type = "") {
      const displayMessage = translateAdminText(message);
      setText("statusText", displayMessage);
      const status = el("status");
      if (status) {
        status.className = "status " + type;
        status.dataset.message = displayMessage;
        status.title = displayMessage;
        status.setAttribute("aria-label", translateAdminText("Trạng thái: " + displayMessage));
      }
      const dot = el("statusDot");
      if (dot) dot.className = "status-dot " + type;
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
      loadHomeTelemetry().catch((error) => console.error(error));
      loadHomeDetails().catch((error) => console.error(error));
    }

    async function loadHomeTelemetry() {
      const requestId = ++homeTelemetryRequestId;
      const entries = await Promise.allSettled(gateways.map(async (gateway) => {
        const payload = await requestJson("/api/gateways/" + encodeURIComponent(gateway.id) + "/telemetry/latest");
        return [gateway.id, payload.records || []];
      }));

      if (requestId !== homeTelemetryRequestId) return;

      homeTelemetry = new Map();
      for (const entry of entries) {
        if (entry.status === "fulfilled") {
          homeTelemetry.set(entry.value[0], entry.value[1]);
        }
      }
      renderHome();
    }

    async function loadHomeDetails() {
      const requestId = ++homeDetailsRequestId;
      const entries = await Promise.allSettled(gateways.map(async (gateway) => {
        const [configPayload, commandPayload] = await Promise.all([
          requestJson("/api/gateways/" + encodeURIComponent(gateway.id) + "/config"),
          requestJson("/api/gateways/" + encodeURIComponent(gateway.id) + "/commands"),
        ]);
        return [gateway.id, configPayload, commandPayload.commands || []];
      }));

      if (requestId !== homeDetailsRequestId) return;

      homeConfigs = new Map();
      homeCommands = new Map();
      for (const entry of entries) {
        if (entry.status !== "fulfilled") continue;
        homeConfigs.set(entry.value[0], entry.value[1]);
        homeCommands.set(entry.value[0], entry.value[2]);
      }
      renderHome();
    }

    function renderHome() {
      const grid = el("gatewayHomeGrid");
      const total = gateways.length;
      const online = gateways.filter((gateway) => gateway.status === "online").length;
      const offline = total - online;
      const onlineRatio = total ? Math.round((online / total) * 1000) / 10 : 0;
      const offlineRatio = total ? Math.round((offline / total) * 1000) / 10 : 0;
      const metrics = homeFleetMetrics();

      setText("homeTotalGateways", String(total));
      setText("homeOnlineGateways", String(online));
      setText("homeOfflineGateways", String(offline));
      setText("homeLostHeartbeat", String(offline));
      setText("homeGatewayBreakdown", "Online: " + online + " | Offline: " + offline);
      setText("homeOnlineRatio", onlineRatio + "%");
      setText("homeOfflineRatio", offlineRatio + "%");
      setText("homeTotalPower", metrics.powerKw === null ? "-" : formatPowerKw(metrics.powerKw));
      setText("homeTodayEnergy", metrics.todayKwh === null ? "-" : formatEnergyKwh(metrics.todayKwh));
      setText("homeYesterdayEnergy", metrics.yesterdayKwh === null ? "-" : formatEnergyKwh(metrics.yesterdayKwh));
      setText("homeQueueRecords", metrics.queueRecords === null ? "-" : formatCompactNumber(metrics.queueRecords));
      setText("homeProtocolState", total ? "Sẵn sàng" : "-");
      setText("homeModbusState", total ? "Cấu hình" : "-");
      setText("homeCloudState", online ? "Đồng bộ" : "-");

      if (!gateways.length) {
        if (grid) grid.innerHTML = '<div class="empty-state"><strong>Chưa có site kết nối.</strong><span>Trên IPC, kiểm tra gateway.id, GATEWAY_TOKEN hoặc PROVISIONING_TOKEN, rồi xem log Hardware-Gateway. Site sẽ xuất hiện sau khi heartbeat gửi về /api/gateway/heartbeat.</span></div>';
        if (el("homeFocusGatewayName")) renderHomeFocus(null);
        renderHomeModules();
        applyAdminLanguage(el("homeView"));
        return;
      }

      if (grid) {
        grid.innerHTML = gateways.map((gateway) => {
          const status = gateway.status || "offline";
          return \`
            <article class="gateway-card is-\${escapeHtml(status)}">
              <div class="gateway-card-head">
                <div>
                  <strong>\${escapeHtml(gateway.site || gateway.name || gateway.id)}</strong>
                  <p>\${escapeHtml(gateway.name || gateway.id)} | \${escapeHtml(gateway.id)}</p>
                </div>
                <span class="badge \${escapeHtml(status)}">\${escapeHtml(statusLabel(status))}</span>
              </div>
              <div class="gateway-stats">
                <div class="gateway-stat"><span>Last seen</span><strong>\${escapeHtml(formatDateTime(gateway.lastSeenAt))}</strong></div>
                <div class="gateway-stat"><span>Config</span><strong>\${escapeHtml((gateway.appliedConfigVersion || "-") + " / " + (gateway.desiredConfigVersion || gateway.latestConfigVersion || "-"))}</strong></div>
              </div>
              <div class="actions gateway-card-actions">
                <button class="primary icon-only" type="button" data-remote-gateway="\${escapeHtml(gateway.id)}" title="Remote" aria-label="Remote"><svg class="app-icon"><use href="#icon-monitor"></use></svg><span class="visually-hidden">Remote</span></button>
                <button class="danger icon-only" type="button" data-delete-gateway="\${escapeHtml(gateway.id)}" title="Xóa" aria-label="Xóa"><svg class="app-icon"><use href="#icon-alert-circle"></use></svg><span class="visually-hidden">Xóa</span></button>
              </div>
            </article>
          \`;
        }).join("");
      }

      if (el("homeFocusGatewayName")) renderHomeFocus(gateways[0]);
      renderHomeModules();
      applyAdminLanguage(el("homeView"));
    }

    function renderHomeFocus(gateway) {
      const status = gateway?.status || "offline";
      el("homeFocusGatewayName").textContent = gateway ? (gateway.name || gateway.id) : "Chưa chọn gateway";
      el("homeFocusStatus").className = "badge " + status;
      el("homeFocusStatus").textContent = statusLabel(status);
      el("homeFocusHeartbeat").textContent = formatDateTime(gateway?.lastSeenAt);
      el("homeFocusConfig").textContent = gateway ? String(gateway.appliedConfigVersion || "-") : "-";
      el("homeFocusId").textContent = gateway?.id || "-";
      el("homeFocusSite").textContent = [gateway?.site, gateway?.name].filter(Boolean).join(" / ") || "-";
      el("homeFocusApp").textContent = gateway?.appVersion || "-";
      el("homeFocusConfigStatus").textContent = gateway?.lastConfigStatus || "-";
      el("homeFocusCreated").textContent = formatDateTime(gateway?.createdAt);
    }

    function statusLabel(status) {
      const labels = {
        online: "Online",
        offline: "Offline",
        error: "Cảnh báo",
        waiting: "Waiting",
      };
      return labels[status] || status || "-";
    }

    function syncLabel(status) {
      const labels = {
        applied: "Đồng bộ",
        failed: "Lỗi",
        offline: "--",
      };
      return labels[status] || status || "-";
    }

    function homeFleetMetrics() {
      let powerKw = 0;
      let todayKwh = 0;
      let yesterdayKwh = 0;
      let queueRecords = 0;
      let hasPower = false;
      let hasToday = false;
      let hasYesterday = false;
      let hasQueue = false;

      for (const gateway of gateways) {
        const records = homeTelemetry.get(gateway.id) || [];
        const metrics = homeGatewayMetrics(records);
        if (metrics.powerKw !== null) {
          powerKw += metrics.powerKw;
          hasPower = true;
        }
        if (metrics.todayKwh !== null) {
          todayKwh += metrics.todayKwh;
          hasToday = true;
        }
        if (metrics.yesterdayKwh !== null) {
          yesterdayKwh += metrics.yesterdayKwh;
          hasYesterday = true;
        }
        if (metrics.queueRecords !== null) {
          queueRecords += metrics.queueRecords;
          hasQueue = true;
        }
      }

      return {
        powerKw: hasPower ? powerKw : null,
        todayKwh: hasToday ? todayKwh : null,
        yesterdayKwh: hasYesterday ? yesterdayKwh : null,
        queueRecords: hasQueue ? queueRecords : null,
      };
    }

    function homeGatewayMetrics(records) {
      const devices = telemetryRecordsToDevices(records || []);
      const power = firstMetricFromReadings(devices, ["active_power_kw", "active_power_w", "meter_active_power_kw", "grid_export_power_kw", "export_power_kw", "p_out_kw"], { prefer: "meter" })
        || aggregateMetricFromReadings(devices, ["active_power_kw", "active_power_w", "active_power_total_kw", "ac_power_kw", "output_power_kw", "inverter_active_power_kw"], { prefer: "inverter", unit: "kW" });
      const today = firstMetricFromReadings(devices, ["daily_energy_yield_kwh", "daily_energy_kwh", "energy_today_kwh", "yield_today_kwh", "today_energy_kwh"], { prefer: "meter" })
        || aggregateMetricFromReadings(devices, ["daily_energy_yield_kwh", "daily_energy_kwh", "energy_today_kwh", "yield_today_kwh", "today_energy_kwh"], { prefer: "inverter", unit: "kWh" });
      const yesterday = firstMetricFromReadings(devices, [
        "site_yesterday_energy_kwh",
        "yesterday_energy_kwh",
        "ainv_d_minus_1_kwh",
        "ainv_d_1_kwh",
        "inverter_yesterday_energy_kwh",
        "previous_day_energy_kwh",
        "daily_energy_yield_d_minus_1_kwh",
      ], {});
      const queue = firstMetricFromReadings(devices, ["queue_records", "pending_records", "queue_size", "pending_count"], {});

      return {
        powerKw: metricNumber(power, "kW"),
        todayKwh: metricNumber(today, "kWh"),
        yesterdayKwh: metricNumber(yesterday, "kWh"),
        queueRecords: metricNumber(queue, ""),
      };
    }

    function metricNumber(metric, preferredUnit = "") {
      const value = normalizeMetricValue(metric, preferredUnit)?.value;
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    }

    function renderHomeModules() {
      renderHomeGatewayModule();
      renderHomeTelemetryModule();
      renderHomeConfigModule();
      renderHomeDevicesModule();
      renderHomeTemplatesModule();
      renderHomeIec104Module();
      renderHomeControlModule();
      renderHomeStorageModule();
      renderHomeLogsModule();
      renderHomeReportsModule();
      renderHomeSystemModule();
    }

    function renderHomeGatewayModule() {
      const body = el("homeGatewayFullBody");
      if (!body) return;
      if (!gateways.length) {
        body.innerHTML = '<tr><td colspan="8" class="empty-state">Chưa có gateway.</td></tr>';
        return;
      }
      body.innerHTML = gateways.map((gateway) => {
        const status = gateway.status || "offline";
        const configText = (gateway.appliedConfigVersion || "-") + " / " + (gateway.desiredConfigVersion || gateway.latestConfigVersion || "-");
        const cloudStatus = gateway.lastConfigStatus === "failed" ? "failed" : status === "online" ? "applied" : "offline";
        return '<tr>' +
          '<td><a href="#" class="id-link" data-remote-gateway="' + escapeHtml(gateway.id) + '">' + escapeHtml(gateway.id) + '</a></td>' +
          '<td>' + escapeHtml([gateway.site, gateway.name].filter(Boolean).join(" / ") || "-") + '</td>' +
          '<td><span class="badge ' + escapeHtml(status) + '">' + escapeHtml(statusLabel(status)) + '</span></td>' +
          '<td>' + escapeHtml(formatDateTime(gateway.lastSeenAt)) + '</td>' +
          '<td>' + escapeHtml(gateway.appVersion || "-") + '</td>' +
          '<td>' + escapeHtml(configText) + '</td>' +
          '<td><span class="badge ' + escapeHtml(cloudStatus) + '">' + escapeHtml(syncLabel(cloudStatus)) + '</span></td>' +
          '<td><button class="subtle" type="button" data-remote-gateway="' + escapeHtml(gateway.id) + '">Mở</button></td>' +
        '</tr>';
      }).join("");
    }

    function renderHomeTelemetryModule() {
      const body = el("homeTelemetryBody");
      if (!body) return;
      const rows = [];
      for (const gateway of gateways) {
        const devices = telemetryRecordsToDevices(homeTelemetry.get(gateway.id) || []);
        if (!devices.length) {
          rows.push('<tr><td>' + escapeHtml(gateway.id) + '</td><td colspan="4" class="empty-state">Chưa có telemetry</td><td><button class="subtle" type="button" data-remote-gateway="' + escapeHtml(gateway.id) + '">Mở</button></td></tr>');
          continue;
        }
        for (const device of devices) {
          const measurementKeys = Object.keys(device.measurements || {}).slice(0, 5);
          rows.push('<tr>' +
            '<td>' + escapeHtml(gateway.id) + '</td>' +
            '<td>' + escapeHtml(device.name || "-") + '</td>' +
            '<td><span class="badge ' + escapeHtml(device.status || "waiting") + '">' + escapeHtml(statusLabel(device.status || "waiting")) + '</span></td>' +
            '<td>' + escapeHtml(formatDateTime(device.lastSeenAt)) + '</td>' +
            '<td>' + escapeHtml(measurementKeys.map((key) => key + "=" + formatMeasurement(device.measurements[key])).join(" | ") || "-") + '</td>' +
            '<td><button class="subtle" type="button" data-remote-gateway="' + escapeHtml(gateway.id) + '">Mở</button></td>' +
          '</tr>');
        }
      }
      body.innerHTML = rows.join("") || '<tr><td colspan="6" class="empty-state">Chưa có telemetry.</td></tr>';
    }

    function renderHomeConfigModule() {
      const body = el("homeConfigBody");
      if (!body) return;
      body.innerHTML = gateways.map((gateway) => {
        const payload = homeConfigs.get(gateway.id);
        const config = payload?.config || {};
        return '<tr>' +
          '<td>' + escapeHtml(gateway.id) + '</td>' +
          '<td>' + escapeHtml(hostFromUrl(config.server?.url || "")) + '</td>' +
          '<td>' + escapeHtml(hostFromUrl(config.remoteConfig?.url || "")) + '</td>' +
          '<td>' + escapeHtml(String(Object.keys(config.ports || {}).length)) + '</td>' +
          '<td>' + escapeHtml(String((config.devices || []).length)) + '</td>' +
          '<td>' + escapeHtml((gateway.appliedConfigVersion || "-") + " / " + (gateway.desiredConfigVersion || payload?.version || gateway.latestConfigVersion || "-")) + '</td>' +
          '<td><button class="subtle" type="button" data-remote-gateway="' + escapeHtml(gateway.id) + '">Cấu hình</button></td>' +
        '</tr>';
      }).join("") || '<tr><td colspan="7" class="empty-state">Chưa có cấu hình gateway.</td></tr>';
    }

    function renderHomeDevicesModule() {
      const body = el("homeDevicesBody");
      if (!body) return;
      const rows = [];
      for (const gateway of gateways) {
        const config = homeConfigs.get(gateway.id)?.config || {};
        for (const device of config.devices || []) {
          const isTcp = device.protocol === "modbus-tcp";
          const model = [device.manufacturer, device.model].filter(Boolean).join(" - ") || device.type || "-";
          rows.push('<tr>' +
            '<td>' + escapeHtml(gateway.id) + '</td>' +
            '<td>' + escapeHtml(device.name || "-") + '</td>' +
            '<td>' + escapeHtml(device.protocol || "modbus-rtu") + '</td>' +
            '<td>' + escapeHtml(isTcp ? ((device.host || "-") + ":" + (device.tcpPort || 502)) : (device.port || "-")) + '</td>' +
            '<td>' + escapeHtml(String(isTcp ? (device.unitId || device.slaveId || "-") : (device.slaveId || "-"))) + '</td>' +
            '<td>' + escapeHtml(String((device.registers || []).length)) + '</td>' +
            '<td>' + escapeHtml(model) + '</td>' +
            '<td><button class="subtle" type="button" data-remote-gateway="' + escapeHtml(gateway.id) + '">Mở</button></td>' +
          '</tr>');
        }
      }
      body.innerHTML = rows.join("") || '<tr><td colspan="8" class="empty-state">Chưa có thiết bị trong config.</td></tr>';
    }

    function renderHomeTemplatesModule() {
      const body = el("homeTemplatesBody");
      if (!body) return;
      body.innerHTML = templates.map((template) => '<tr>' +
        '<td>' + escapeHtml(template.id || "-") + '</td>' +
        '<td>' + escapeHtml(template.label || "-") + '</td>' +
        '<td>' + escapeHtml(template.type || template.category || "-") + '</td>' +
        '<td>' + escapeHtml(template.protocol || "modbus-rtu") + '</td>' +
        '<td>' + escapeHtml(String((template.registers || []).length)) + '</td>' +
        '<td>' + escapeHtml(template.version || "1.0.0") + '</td>' +
      '</tr>').join("") || '<tr><td colspan="6" class="empty-state">Chưa có template.</td></tr>';
    }

    function renderHomeIec104Module() {
      const body = el("homeIec104Body");
      if (!body) return;
      body.innerHTML = gateways.map((gateway) => {
        const iec104 = homeConfigs.get(gateway.id)?.config?.iec104 || {};
        const mode = iec104.mode || "server";
        const endpoint = mode === "server"
          ? (iec104.host || "0.0.0.0") + ":" + (iec104.port || 2404)
          : (iec104.remoteHost || "-") + ":" + (iec104.remotePort || 2404);
        return '<tr>' +
          '<td>' + escapeHtml(gateway.id) + '</td>' +
          '<td><span class="badge ' + (iec104.enabled ? "online" : "offline") + '">' + escapeHtml(String(Boolean(iec104.enabled))) + '</span></td>' +
          '<td>' + escapeHtml(mode) + '</td>' +
          '<td>' + escapeHtml(endpoint) + '</td>' +
          '<td>' + escapeHtml((iec104.commonAddress || 1) + " / " + (iec104.originatorAddress || 0)) + '</td>' +
          '<td>' + escapeHtml(String((iec104.points || []).length)) + '</td>' +
          '<td>' + escapeHtml(String((iec104.controls || []).length)) + '</td>' +
          '<td><button class="subtle" type="button" data-remote-gateway="' + escapeHtml(gateway.id) + '">IEC104</button></td>' +
        '</tr>';
      }).join("") || '<tr><td colspan="8" class="empty-state">Chưa có gateway.</td></tr>';
    }

    function renderHomeControlModule() {
      const body = el("homeControlBody");
      if (!body) return;
      body.innerHTML = gateways.map((gateway) => {
        const commandsForGateway = homeCommands.get(gateway.id) || [];
        const count = (status) => commandsForGateway.filter((command) => command.status === status).length;
        const latest = commandsForGateway[0];
        return '<tr>' +
          '<td>' + escapeHtml(gateway.id) + '</td>' +
          '<td>' + count("queued") + '</td>' +
          '<td>' + count("running") + '</td>' +
          '<td>' + count("done") + '</td>' +
          '<td>' + count("failed") + '</td>' +
          '<td>' + escapeHtml(latest ? actionLabel(latest.action) + " | " + (latest.status || "queued") : "-") + '</td>' +
          '<td><button class="subtle" type="button" data-remote-gateway="' + escapeHtml(gateway.id) + '">Điều khiển</button></td>' +
        '</tr>';
      }).join("") || '<tr><td colspan="7" class="empty-state">Chưa có lệnh điều khiển.</td></tr>';
    }

    function renderHomeStorageModule() {
      const body = el("homeStorageBody");
      if (!body) return;
      body.innerHTML = gateways.map((gateway) => {
        const config = homeConfigs.get(gateway.id)?.config || {};
        const queue = config.storage?.queue || {};
        const pending = homeGatewayMetrics(homeTelemetry.get(gateway.id) || []).queueRecords;
        return '<tr>' +
          '<td>' + escapeHtml(gateway.id) + '</td>' +
          '<td>' + escapeHtml(config.storage?.queuePath || "-") + '</td>' +
          '<td>' + escapeHtml(String(queue.maxRecords || "-")) + '</td>' +
          '<td>' + escapeHtml(queue.maxBytes ? formatBytes(queue.maxBytes) : "-") + '</td>' +
          '<td>' + escapeHtml(queue.retentionMs ? formatMs(queue.retentionMs) : "-") + '</td>' +
          '<td>' + escapeHtml(pending === null ? "-" : formatCompactNumber(pending)) + '</td>' +
          '<td>' + escapeHtml(config.mongo?.enabled ? "MongoDB" : "HTTP") + '</td>' +
        '</tr>';
      }).join("") || '<tr><td colspan="7" class="empty-state">Chưa có dữ liệu lưu trữ.</td></tr>';
    }

    function renderHomeLogsModule() {
      const body = el("homeLogsBody");
      if (!body) return;
      const rows = [];
      for (const gateway of gateways) {
        rows.push({ time: gateway.lastSeenAt, gateway: gateway.id, type: "Heartbeat", text: statusLabel(gateway.status || "offline"), status: gateway.status || "offline" });
        if (gateway.lastConfigStatus) rows.push({ time: gateway.updatedAt, gateway: gateway.id, type: "Config", text: gateway.lastConfigMessage || ("Config " + gateway.lastConfigStatus), status: gateway.lastConfigStatus });
        for (const command of (homeCommands.get(gateway.id) || []).slice(0, 3)) {
          rows.push({ time: command.createdAt, gateway: gateway.id, type: "Command", text: actionLabel(command.action) + " " + commandDetail(command), status: command.status || "queued" });
        }
      }
      rows.sort((a, b) => Date.parse(b.time || 0) - Date.parse(a.time || 0));
      body.innerHTML = rows.slice(0, 100).map((row) => '<tr>' +
        '<td>' + escapeHtml(formatDateTime(row.time)) + '</td>' +
        '<td>' + escapeHtml(row.gateway) + '</td>' +
        '<td>' + escapeHtml(row.type) + '</td>' +
        '<td>' + escapeHtml(row.text || "-") + '</td>' +
        '<td><span class="badge ' + escapeHtml(row.status || "waiting") + '">' + escapeHtml(row.status || "-") + '</span></td>' +
      '</tr>').join("") || '<tr><td colspan="5" class="empty-state">Chưa có sự kiện.</td></tr>';
    }

    function renderHomeReportsModule() {
      const body = el("homeReportsBody");
      if (!body) return;
      body.innerHTML = gateways.map((gateway) => {
        const records = homeTelemetry.get(gateway.id) || [];
        const devices = telemetryRecordsToDevices(records);
        const metrics = homeGatewayMetrics(records);
        const lastTelemetry = devices.map((device) => Date.parse(device.lastSeenAt || "")).filter(Number.isFinite).sort((a, b) => b - a)[0];
        return '<tr>' +
          '<td>' + escapeHtml(gateway.id) + '</td>' +
          '<td>' + escapeHtml(metrics.powerKw === null ? "-" : formatPowerKw(metrics.powerKw)) + '</td>' +
          '<td>' + escapeHtml(metrics.todayKwh === null ? "-" : formatEnergyKwh(metrics.todayKwh)) + '</td>' +
          '<td>' + escapeHtml(metrics.yesterdayKwh === null ? "-" : formatEnergyKwh(metrics.yesterdayKwh)) + '</td>' +
          '<td>' + escapeHtml(String(devices.length)) + '</td>' +
          '<td>' + escapeHtml(lastTelemetry ? formatDateTime(new Date(lastTelemetry).toISOString()) : "-") + '</td>' +
        '</tr>';
      }).join("") || '<tr><td colspan="6" class="empty-state">Chưa có báo cáo.</td></tr>';
    }

    function renderHomeSystemModule() {
      if (el("homeSystemGateways")) el("homeSystemGateways").textContent = String(gateways.length);
      if (el("homeSystemTemplates")) el("homeSystemTemplates").textContent = String(templates.length);
      if (el("homeSystemTelemetry")) el("homeSystemTelemetry").textContent = String(homeTelemetry.size);
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
      applyRemoteTelemetry(gatewayId, telemetryPayload);
      commands = commandPayload.commands || [];

      setText("topGatewayId", gatewayId);
      setText("topConfigVersion", selectedConfigVersion || "-");
      render();
      showTab("generalInformation", false, "stationDeviceOverviewSubtab");
      setStatus("Remote config loaded", "ok");
    }

    function applyRemoteTelemetry(gatewayId, payload) {
      const records = payload.records || [];
      homeTelemetry.set(gatewayId, records);
      telemetry = {
        time: records[0]?.createdAt || null,
        devices: telemetryRecordsToDevices(records),
      };
    }

    async function refreshRemoteTelemetry() {
      if (!selectedId) return;

      const payload = await requestJson("/api/gateways/" + encodeURIComponent(selectedId) + "/telemetry/latest");
      applyRemoteTelemetry(selectedId, payload);
      renderDashboard();
      renderMonitoring();
      renderRemoteStorage();
      renderRemoteEvents();
      renderConnectivityStatus();
      applyAdminLanguage(el("remoteView"));
      setStatus("ÄÃ£ lÃ m má»›i telemetry", "ok");
    }

    async function refreshRemoteRuntime() {
      if (!selectedId) return;

      const [telemetryPayload, commandPayload] = await Promise.all([
        requestJson("/api/gateways/" + encodeURIComponent(selectedId) + "/telemetry/latest"),
        requestJson("/api/gateways/" + encodeURIComponent(selectedId) + "/commands"),
      ]);

      applyRemoteTelemetry(selectedId, telemetryPayload);
      commands = commandPayload.commands || [];
      renderDashboard();
      renderMonitoring();
      renderCommandHistory();
      renderRemoteStorage();
      renderRemoteEvents();
      renderRemoteSystem();
      renderConnectivityStatus();
      applyAdminLanguage(el("remoteView"));
      setStatus("ÄÃ£ lÃ m má»›i runtime", "ok");
    }

    async function deleteGateway(gatewayId) {
      const gateway = gateways.find((item) => item.id === gatewayId) || { id: gatewayId };
      const label = gateway.site || gateway.name || gateway.id;
      if (!confirm("Xóa trạm/site " + label + "? Dữ liệu cấu hình, telemetry và lịch sử lệnh của gateway này sẽ bị xóa khỏi server.")) {
        return;
      }

      await requestJson("/api/gateways/" + encodeURIComponent(gatewayId), {
        method: "DELETE",
      });
      gateways = gateways.filter((item) => item.id !== gatewayId);
      homeTelemetry.delete(gatewayId);
      homeConfigs.delete(gatewayId);
      homeCommands.delete(gatewayId);
      renderHome();
      setStatus("Đã xóa trạm/site " + label, "ok");
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
        iec104: {
          enabled: true,
          mode: "server",
          remoteHost: "",
          remotePort: 2404,
          localAddress: "",
          localPort: 0,
          host: "0.0.0.0",
          port: 2404,
          commonAddress: 1,
          originatorAddress: 0,
          staleAfterMs: 600000,
          maxClientConnections: 4,
          reconnectMs: 5000,
          keepAliveMs: 30000,
          periodicMs: 300000,
          spontaneous: true,
          points: [],
          controls: [],
        },
        storage: {
          queuePath: "/data/queue.jsonl",
          archive: {
            enabled: true,
            path: "/data/telemetry-5m.sqlite",
            intervalMs: 300000,
            retentionMs: 604800000,
            compactIntervalMs: 60000,
          },
          queue: {
            maxRecords: 100000,
            maxBytes: 52428800,
            retentionMs: 604800000,
            compactIntervalMs: 60000,
            corruptPath: "/data/queue.jsonl.corrupt",
          },
        },
        stations: [],
        ports: {},
        devices: [],
      };
    }

    function render() {
      if (!state) return;

      state.stations = Array.isArray(state.stations) ? state.stations : [];
      state.devices = Array.isArray(state.devices) ? state.devices : [];
      state.ports = state.ports || {};
      state.iec104 = state.iec104 || {};
      state.iec104.points = Array.isArray(state.iec104.points) ? state.iec104.points : [];
      state.iec104.controls = Array.isArray(state.iec104.controls) ? state.iec104.controls : [];

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
      el("iec104Enabled").checked = state.iec104?.enabled ?? true;
      el("iec104Mode").value = "server";
      el("iec104Host").value = state.iec104?.host || "0.0.0.0";
      el("iec104Port").value = state.iec104?.port ?? 2404;
      el("iec104RemoteHost").value = "";
      el("iec104RemotePort").value = 2404;
      el("iec104LocalAddress").value = "";
      el("iec104LocalPort").value = 0;
      el("iec104CommonAddress").value = state.iec104?.commonAddress ?? 1;
      el("iec104OriginatorAddress").value = state.iec104?.originatorAddress ?? 0;
      el("iec104StaleAfterMs").value = state.iec104?.staleAfterMs ?? 600000;
      el("iec104ReconnectMs").value = 5000;
      el("iec104KeepAliveMs").value = state.iec104?.keepAliveMs ?? 30000;
      el("iec104PeriodicMs").value = state.iec104?.periodicMs ?? 300000;
      el("iec104Spontaneous").value = "true";
      el("iec104MaxClientConnections").value = state.iec104?.maxClientConnections ?? 4;
      el("queuePath").value = state.storage?.queuePath || "/data/queue.jsonl";
      el("rawYaml").value = stringifyConfig(state);

      renderSummary();
      renderDashboard();
      renderMonitoring();
      renderInverterControl();
      renderTemplatePicker();
      renderTemplateLibrary();
      renderPorts();
      renderStations();
      renderDevices();
      renderIec104();
      renderRemoteStorage();
      renderRemoteEvents();
      renderRemoteSystem();
      renderConnectivityStatus();
      applyAdminLanguage(el("remoteView"));
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
      const devices = state.devices || [];
      const readings = telemetryDeviceMap();
      const statusCounts = countRuntimeStatuses(devices, readings);
      const okCount = statusCounts.good;
      const warningCount = statusCounts.warning;
      const errorCount = statusCounts.bad;
      const lossCount = statusCounts.loss;

      setText("dashboardGoodInline", String(okCount));
      setText("dashboardWarningInline", String(warningCount));
      setText("dashboardBadInline", String(errorCount));
      setText("dashboardLossInline", String(lossCount));
      setText("topOkCount", String(okCount));
      setText("topErrorCount", String(errorCount));
      setText("topWarningCount", String(warningCount));
      setText("topLossCount", String(lossCount));

      const topology = el("dashboardTopology");
      const configurationTopology = el("configurationTopology");
      const topologyHtml = renderTopology(readings);

      if (topology) topology.innerHTML = topologyHtml;
      if (configurationTopology) configurationTopology.innerHTML = topologyHtml;
    }

    function countRuntimeStatuses(devices, readings) {
      return (devices || []).reduce((counts, device) => {
        const status = runtimeStatus(readings.get(device.name), device);
        counts[status.kind] = (counts[status.kind] || 0) + 1;
        return counts;
      }, {
        good: 0,
        warning: 0,
        bad: 0,
        loss: 0,
      });
    }

    function renderTopology(readings) {
      const groups = topologyStationGroups();
      const ports = Object.keys(state.ports || {});

      if (!groups.length && !ports.length) {
        return '<div class="topology-empty">Chưa cấu hình trạm, IPC, RS485/COM, Ethernet TCP hoặc thiết bị</div>';
      }

      return groups.map((group) => renderTopologyStation(group, readings)).join("");
    }

    function topologyStationGroups() {
      const devices = state.devices || [];
      const stations = state.stations || [];

      if (!stations.length) {
        if (!devices.length && !Object.keys(state.ports || {}).length) return [];
        return [{
          id: "default",
          name: "Trạm",
          meta: devices.length ? devices.length + " thiết bị" : "Chưa cấu hình trạm",
          devices,
          portNames: Object.keys(state.ports || {}),
        }];
      }

      const assigned = new Set();
      const groups = stations.map((station, index) => {
        const names = new Set(stationDeviceNamesForUi(station));
        const stationDevices = devices.filter((device) => {
          const matched = (device.name && names.has(device.name)) || device.stationId === station.id;
          if (matched && device.name) assigned.add(device.name);
          return matched;
        });

        return {
          id: station.id || "station_" + (index + 1),
          name: station.name || station.id || "Trạm " + (index + 1),
          meta: station.capacityKw ? station.capacityKw + " kW" : stationDevices.length + " thiết bị",
          devices: stationDevices,
          portNames: [],
        };
      });

      const unassigned = devices.filter((device) => device.name && !assigned.has(device.name));
      if (unassigned.length) {
        groups.push({
          id: "unassigned",
          name: "Thiết bị chưa gán trạm",
          meta: unassigned.length + " thiết bị",
          devices: unassigned,
          portNames: [],
        });
      }

      return groups;
    }

    function stationDeviceNamesForUi(station) {
      const names = new Set(Array.isArray(station?.devices) ? station.devices.filter(Boolean) : []);
      for (const device of state.devices || []) {
        if (device.stationId && device.stationId === station?.id && device.name) {
          names.add(device.name);
        }
      }
      return [...names];
    }

    function renderTopologyStation(group, readings) {
      const deviceStatuses = group.devices.map((device) => runtimeStatus(readings.get(device.name), device));
      const stationStatus = statusFromChildren(deviceStatuses, group.devices.length ? "loss" : "warning");
      const ipcStatus = statusFromChildren(deviceStatuses, group.devices.length ? "loss" : "warning");
      const portGroups = topologyPortGroups(group);
      const portHtml = portGroups.length
        ? portGroups.map((portGroup) => renderTopologyPort(portGroup, readings)).join("")
        : '<div class="topology-empty">Chưa gán RS485/COM, Ethernet TCP hoặc thiết bị cho trạm này</div>';

      return \`
        <article class="topology-station">
          \${renderTopologyNode({
            icon: "icon-home",
            type: "Trạm",
            title: group.name,
            meta: group.meta || "-",
            status: stationStatus,
          })}
          <div class="topology-level">
            \${renderTopologyNode({
              icon: "icon-server",
              type: "IPC",
              title: state.gateway?.id || selectedId || "IPC Gateway",
              meta: hostFromUrl(state.server?.url || "") || "-",
              status: ipcStatus,
            })}
            <div class="topology-level">\${portHtml}</div>
          </div>
        </article>
      \`;
    }

    function topologyPortGroups(group) {
      const groups = new Map();

      for (const name of group.portNames || []) {
        if (!groups.has(name)) groups.set(name, { name, devices: [] });
      }

      for (const device of group.devices || []) {
        const name = topologyPortName(device);
        if (!groups.has(name)) groups.set(name, { name, devices: [] });
        groups.get(name).devices.push(device);
      }

      return [...groups.values()].sort((left, right) => left.name.localeCompare(right.name));
    }

    function topologyPortName(device) {
      if (device.protocol === "modbus-tcp") return "TCP";
      return device.port || "Chưa chọn cổng";
    }

    function renderTopologyPort(portGroup, readings) {
      const statuses = portGroup.devices.map((device) => runtimeStatus(readings.get(device.name), device));
      const portStatus = statusFromChildren(statuses, portGroup.devices.length ? "loss" : "warning");
      const port = state.ports?.[portGroup.name] || {};
      const isTcp = portGroup.name === "TCP";
      const metaFull = topologyPortMeta(portGroup.name, port) + " | " + topologyComLabel(portGroup, port) + " | " + topologyComMeta(portGroup, port);
      const deviceHtml = portGroup.devices.length
        ? portGroup.devices.map((device) => renderTopologyDevice(device, readings.get(device.name))).join("")
        : '<div class="topology-empty">Chưa có thiết bị trên RS485/COM này</div>';

      return \`
        <div class="topology-station">
          \${renderTopologyNode({
            icon: isTcp ? "icon-server" : "icon-network",
            type: isTcp ? "Ethernet TCP" : "RS485 / COM",
            title: isTcp ? "Modbus TCP" : portGroup.name,
            meta: topologyPortMetaShort(portGroup, port),
            metaFull,
            status: portStatus,
          })}
          <div class="topology-level">\${deviceHtml}</div>
        </div>
      \`;
    }

    function renderTopologyDevice(device, reading) {
      const status = runtimeStatus(reading, device);
      const slave = device.protocol === "modbus-tcp"
        ? "unit " + (device.unitId || device.slaveId || 3)
        : "slave " + (device.slaveId || 1);
      const registers = (device.registers || []).length + " thanh ghi";

      return renderTopologyNode({
        icon: monitoringDeviceIcon(device),
        type: "Thiết bị",
        title: device.name || "Thiết bị chưa đặt tên",
        meta: topologyDeviceMetaShort(device),
        metaFull: deviceSubtitle(device) + " | " + slave + " | " + registers,
        status,
      });
    }

    function renderTopologyNode({ icon, type, title, meta, metaFull, status }) {
      const kind = status?.kind || "loss";
      const label = status?.label || statusFromKind(kind).label;
      const detail = metaFull || meta || "-";
      const tooltip = [title || "-", detail].filter((item) => item && item !== "-").join(" | ");

      return \`
        <div class="topology-node \${escapeHtml(kind)}" title="\${escapeHtml(tooltip)}">
          <span class="topology-icon"><svg class="app-icon"><use href="#\${escapeHtml(icon)}"></use></svg></span>
          <div class="topology-copy">
            <span class="topology-kicker">\${escapeHtml(type)}</span>
            <strong title="\${escapeHtml(title || "-")}">\${escapeHtml(title || "-")}</strong>
            <p title="\${escapeHtml(detail)}">\${escapeHtml(meta || "-")}</p>
          </div>
          <span class="topology-state \${escapeHtml(kind)}" title="\${escapeHtml(label)}"><i class="topology-dot \${escapeHtml(kind)}"></i>\${escapeHtml(label)}</span>
        </div>
      \`;
    }

    function topologyPortMeta(portName, port) {
      if (portName === "TCP") return "Modbus TCP";
      if (portName === "Chưa chọn cổng") return "Thiết bị chưa chọn cổng RS485";
      return [
        port.baudRate ? port.baudRate + " bps" : "",
        port.parity || "",
        port.dataBits ? port.dataBits + " data bits" : "",
        port.stopBits ? port.stopBits + " stop" : "",
      ].filter(Boolean).join(" | ") || "Chưa có thiết lập serial";
    }

    function topologyPortMetaShort(portGroup, port) {
      const count = portGroup.devices.length;
      const suffix = count + " device" + (count === 1 ? "" : "s");

      if (portGroup.name === "TCP") {
        const tcpPorts = [...new Set(portGroup.devices.map((device) => device.tcpPort || 502))];
        return "TCP " + (tcpPorts.length ? tcpPorts.join(",") : "502") + " | " + suffix;
      }

      const baudRate = port.baudRate ? port.baudRate + " bps" : "Serial";
      return baudRate + " | " + suffix;
    }

    function topologyComLabel(portGroup, port) {
      if (portGroup.name === "TCP") {
        const hosts = [...new Set(portGroup.devices.map((device) => device.host).filter(Boolean))];
        return hosts.length ? hosts.join(", ") : "TCP host";
      }
      return port.path || (port.pathCandidates || [])[0] || "Chưa có đường dẫn COM";
    }

    function topologyComMeta(portGroup, port) {
      if (portGroup.name === "TCP") {
        const tcpPorts = [...new Set(portGroup.devices.map((device) => device.tcpPort || 502))];
        return "TCP port " + (tcpPorts.length ? tcpPorts.join(", ") : "502");
      }
      if (port.autoDiscover) return "Đang bật tự dò COM";
      if ((port.pathCandidates || []).length) return (port.pathCandidates || []).length + " đường dẫn dự phòng";
      return "Đường dẫn COM thủ công";
    }

    function topologyDeviceMetaShort(device) {
      const slave = device.protocol === "modbus-tcp"
        ? "unit " + (device.unitId || device.slaveId || 3)
        : "slave " + (device.slaveId || 1);
      const count = (device.registers || []).length;

      return slave + " | " + count + " reg";
    }

    function statusFromChildren(statuses, emptyKind = "warning") {
      const kinds = statuses.map((status) => status.kind);
      if (!kinds.length) return statusFromKind(emptyKind);
      if (kinds.includes("bad")) return statusFromKind("bad");
      if (kinds.includes("loss")) return statusFromKind("loss");
      if (kinds.includes("warning")) return statusFromKind("warning");
      return statusFromKind("good");
    }

    function renderMonitoring() {
      const container = el("monitoringDevices");
      const devices = state.devices || [];
      const readings = telemetryDeviceMap();
      const statusCounts = countRuntimeStatuses(devices, readings);
      const openDetails = openMonitoringDetails(container);

      el("monitoringSummary").textContent =
        "Tốt " + statusCounts.good + ", Cảnh báo " + statusCounts.warning + ", Lỗi " + statusCounts.bad + ", Mất liên lạc " + statusCounts.loss;
      el("monitoringUpdated").textContent = "Cập nhật lần cuối: " + formatDateTime(telemetry.time);

      if (!devices.length) {
        container.innerHTML = '<div class="empty-state">Chưa cấu hình thiết bị</div>';
        return;
      }

      container.innerHTML = devices.map((device) => renderMonitoringDevice(device, readings.get(device.name))).join("");
      restoreMonitoringDetails(container, openDetails);
    }

    function openMonitoringDetails(container) {
      return new Set([...container.querySelectorAll(".monitor-detail[open][data-monitor-detail]")]
        .map((detail) => detail.dataset.monitorDetail));
    }

    function restoreMonitoringDetails(container, openDetails) {
      if (!openDetails.size) return;

      container.querySelectorAll(".monitor-detail[data-monitor-detail]").forEach((detail) => {
        detail.open = openDetails.has(detail.dataset.monitorDetail);
      });
    }

    function renderMonitoringDevice(device, reading) {
      const status = runtimeStatus(reading, device);
      const statusClass = status.badgeClass || status.kind || "loss";
      const statusText = monitoringStatusText(status);
      const deviceIcon = monitoringDeviceIcon(device);
      const modelFull = [device.manufacturer, device.model].filter(Boolean).join(" - ") || device.type || "modbus";
      const model = conciseDeviceModel(device, modelFull);
      const registers = (device.registers || []).filter(isPollableRegister);
      const metricItems = monitoringMetricItems(device, reading, status);
      const updatedAt = formatDateTime(reading?.collectedAt || reading?.updatedAt);
      const isTcp = (device.protocol || reading?.protocol) === "modbus-tcp";
      const endpointLabel = isTcp ? "TCP" : "Cổng";
      const endpointValue = isTcp
        ? (device.host || reading?.host || "-") + ":" + (device.tcpPort || reading?.tcpPort || 502)
        : (device.port || reading?.port || "-");
      const idLabel = isTcp ? "Unit ID" : "Slave ID";
      const idValue = isTcp
        ? (device.unitId ?? device.slaveId ?? reading?.unitId ?? reading?.slaveId ?? "-")
        : (device.slaveId ?? reading?.slaveId ?? "-");
      const rows = registers.length
        ? registers.map((register) => renderMeasurementRow(register, reading)).join("")
        : '<tr><td colspan="4">Chưa cấu hình thanh ghi</td></tr>';
      const protocol = (device.protocol || reading?.protocol || "modbus-rtu").toUpperCase();
      const pollMs = device.pollIntervalMs || state?.gateway?.pollIntervalMs;
      const detailItems = [
        { label: "Protocol", value: protocol },
        { label: "Model", value: modelFull },
        { label: endpointLabel, value: endpointValue },
        { label: idLabel, value: idValue },
        { label: "Registers", value: String(registers.length) },
        { label: "Poll", value: pollMs ? formatMs(pollMs) : "-" },
        { label: "Updated", value: updatedAt },
      ];
      const error = reading?.lastError?.message
        ? \`<div class="monitor-error">\${escapeHtml(reading.lastError.message)}</div>\`
        : "";

      return \`
        <article class="monitor-card status-\${escapeHtml(statusClass)}">
          <div class="monitor-head">
            <span class="monitor-status-icon \${escapeHtml(statusClass)}" title="\${escapeHtml(statusText)}" aria-label="\${escapeHtml(statusText)}" data-no-i18n>
              <svg class="app-icon"><use href="#\${escapeHtml(deviceIcon)}"></use></svg>
            </span>
            <div class="monitor-title">
              <strong title="\${escapeHtml(device.name || "-")}">\${escapeHtml(device.name || "-")}</strong>
              <span title="\${escapeHtml(modelFull)}">\${escapeHtml(model)}</span>
            </div>
            <span class="monitor-status-chip \${escapeHtml(statusClass)}" data-no-i18n>\${escapeHtml(statusText)}</span>
          </div>
          <div class="monitor-meta" hidden>
            <div><span>\${escapeHtml(endpointLabel)}</span><strong>\${escapeHtml(endpointValue)}</strong></div>
            <div><span>\${escapeHtml(idLabel)}</span><strong>\${escapeHtml(idValue)}</strong></div>
            <div><span>Updated</span><strong>\${escapeHtml(formatDateTime(reading?.collectedAt || reading?.updatedAt))}</strong></div>
          </div>
          <div class="monitor-key-grid">
            \${metricItems.map(renderMonitoringMetricItem).join("")}
          </div>
          <details class="monitor-detail" data-monitor-detail="\${escapeHtml(device.name || "-")}">
            <summary>
              <span>Detail</span>
              <svg class="app-icon"><use href="#icon-chevron-down"></use></svg>
            </summary>
            <div class="monitor-detail-grid">
              \${detailItems.map((item) => \`<div><span>\${escapeHtml(item.label)}</span><strong>\${escapeHtml(item.value || "-")}</strong></div>\`).join("")}
            </div>
            \${error}
            <div class="table-wrap monitor-table-wrap">
          <table class="monitor-table">
            <thead>
              <tr>
                <th>Register</th>
                <th>Value</th>
                <th>UOM</th>
                <th>Raw</th>
              </tr>
            </thead>
            <tbody>\${rows}</tbody>
          </table>
            </div>
          </details>
        </article>
      \`;
    }

    function isPollableRegister(register) {
      return register?.poll !== false && register?.access !== "wo";
    }

    function monitoringStatusText(status) {
      const labels = {
        good: "Good",
        warning: "Warning",
        bad: "Error",
        loss: "Offline",
      };

      return labels[status?.kind] || status?.label || "Offline";
    }

    function monitoringDeviceIcon(device) {
      const icons = {
        meter: "icon-meter",
        inverter: "icon-inverter",
        weather: "icon-weather",
        device: "icon-device",
      };

      return icons[monitoringDeviceCategory(device)] || "icon-device";
    }

    function monitoringMetricItems(device, reading, status) {
      const activePower = findMonitoringMetricValue(device, reading, monitoringMetricNames.activePower, isActivePowerMetric);
      const ratedPower = findMonitoringMetricValue(device, reading, monitoringMetricNames.ratedPower, isRatedPowerMetric);
      const dailyEnergy = findMonitoringMetricValue(device, reading, monitoringMetricNames.dailyEnergy, isDailyEnergyMetric);
      const reactivePower = findMonitoringMetricValue(device, reading, monitoringMetricNames.reactivePower, isReactivePowerMetric);
      const deviceStatus = findMonitoringMetricValue(device, reading, monitoringMetricNames.deviceStatus, isDeviceStatusMetric);
      const category = monitoringDeviceCategory(device);

      if (category === "weather") {
        const ambientTemperature = findMonitoringMetricValue(device, reading, monitoringMetricNames.ambientTemperature, isAmbientTemperatureMetric);
        const moduleTemperature = findMonitoringMetricValue(device, reading, monitoringMetricNames.moduleTemperature, isModuleTemperatureMetric);
        const irradiance = findMonitoringMetricValue(device, reading, monitoringMetricNames.irradiance, isIrradianceMetric);

        return [
          ...(ambientTemperature ? [{ label: "Ambient Temp", value: formatMonitoringMetricValue(ambientTemperature) }] : []),
          { label: "Module Temp", value: formatMonitoringMetricValue(moduleTemperature) },
          { label: "Irradiation", value: formatMonitoringMetricValue(irradiance) },
          ...(deviceStatus ? [{ label: "Run State", value: formatMonitoringMetricValue(deviceStatus), className: "status" }] : []),
        ];
      }

      if (category === "meter") {
        const voltage = findMonitoringMetricValue(device, reading, monitoringMetricNames.voltage, isVoltageMetric);
        const frequency = findMonitoringMetricValue(device, reading, monitoringMetricNames.frequency, isFrequencyMetric);
        const powerFactor = findMonitoringMetricValue(device, reading, monitoringMetricNames.powerFactor, isPowerFactorMetric);

        return [
          { label: "Active Power", value: formatMonitoringMetricValue(activePower), className: "power" },
          { label: "Voltage", value: formatMonitoringMetricValue(voltage) },
          { label: "Frequency", value: formatMonitoringMetricValue(frequency) },
          { label: "Power Factor", value: formatMonitoringMetricValue(powerFactor) },
          ...(deviceStatus ? [{ label: "Run State", value: formatMonitoringMetricValue(deviceStatus), className: "status" }] : []),
        ];
      }

      return [
        { label: "Active / Rated", value: formatMonitoringMetricPair(activePower, ratedPower), className: "power" },
        { label: "Daily Energy", value: formatMonitoringMetricValue(dailyEnergy) },
        { label: "Reactive Power", value: formatMonitoringMetricValue(reactivePower) },
        ...(deviceStatus ? [{ label: "Run State", value: formatMonitoringMetricValue(deviceStatus), className: "status" }] : []),
      ];

    }

    function renderMonitoringMetricItem(item) {
      const className = item.className ? " " + item.className : "";

      return \`
        <div class="monitor-key-item\${escapeHtml(className)}" title="\${escapeHtml(item.label + ": " + (item.value || "-"))}">
          <span>\${escapeHtml(item.label)}</span>
          <strong>\${escapeHtml(item.value || "-")}</strong>
        </div>
      \`;
    }

    function renderMeasurementRow(register, reading) {
      const measurements = reading?.measurements || {};
      const units = reading?.units || {};
      const raw = reading?.raw || {};
      const hasValue = Object.prototype.hasOwnProperty.call(measurements, register.name);
      const rawValue = Array.isArray(raw[register.name]) ? raw[register.name].join(", ") : "-";

      return \`
        <tr>
          <td>\${escapeHtml(register.name || "-")}</td>
          <td class="monitor-value">\${escapeHtml(hasValue ? formatMeasurement(measurements[register.name]) : "-")}</td>
          <td class="monitor-unit">\${escapeHtml(units[register.name] || register.unit || "-")}</td>
          <td class="monitor-raw">\${escapeHtml(rawValue)}</td>
        </tr>
      \`;
    }

    function deviceModelText(device, reading) {
      const configuredModel = [device.manufacturer, device.model].filter(Boolean).join(" - ");
      if (configuredModel) return configuredModel;

      const measuredModel = findMonitoringMetricValue(device, reading, monitoringMetricNames.model, isModelMetric);
      if (measuredModel) return formatMonitoringMetricValue(measuredModel);

      return device.type || "modbus";
    }

    function monitoringDeviceCategory(device) {
      const key = [device?.category, device?.type, device?.manufacturer, device?.model, device?.name].filter(Boolean).join(" ").toLowerCase();

      if (key.includes("weather") || key.includes("irradiance") || key.includes("kipp")) return "weather";
      if (key.includes("meter") || key.includes("dtsu")) return "meter";
      if (key.includes("inverter") || key.includes("sungrow")) return "inverter";
      return "device";
    }

    function conciseDeviceModel(device, fallback) {
      if (device?.model) return device.model;
      if (device?.manufacturer) return device.manufacturer;
      return fallback || device?.type || "modbus";
    }

    function findMonitoringMetricValue(device, reading, exactNames, matchesName) {
      const registers = device.registers || [];
      const measurements = reading?.measurements || {};
      const units = reading?.units || {};

      for (const name of exactNames) {
        if (Object.prototype.hasOwnProperty.call(measurements, name)) {
          return { name, value: measurements[name], unit: units[name] || inferredUnit(name) };
        }
      }

      for (const register of registers) {
        const name = register.name || "";
        if (!matchesName(name)) continue;
        if (Object.prototype.hasOwnProperty.call(measurements, name)) {
          return { name, value: measurements[name], unit: units[name] || register.unit || inferredUnit(name) };
        }
      }

      for (const [name, value] of Object.entries(measurements)) {
        if (matchesName(name)) return { name, value, unit: units[name] || inferredUnit(name) };
      }

      return null;
    }

    function formatMonitoringMetricPair(current, rated) {
      if (!current && !rated) return "-";
      if (!current) return "- / " + formatMonitoringMetricValue(rated);
      if (!rated) return formatMonitoringMetricValue(current);

      return formatMonitoringMetricValue(current) + " / " + formatMonitoringMetricValue(rated);
    }

    function formatMonitoringMetricValue(metric) {
      if (!metric) return "-";
      const value = Number(metric.value);
      if (!Number.isFinite(value)) return String(metric.value ?? "-");

      const unit = metric.unit || inferredUnit(metric.name);
      const lowerUnit = unit.toLowerCase();
      if (lowerUnit === "w" && Math.abs(value) >= 1000) return formatCompactNumber(value / 1000) + " kW";
      if (lowerUnit === "var" && Math.abs(value) >= 1000) return formatCompactNumber(value / 1000) + " kVAr";
      if (lowerUnit === "wh" && Math.abs(value) >= 1000) return formatCompactNumber(value / 1000) + " kWh";
      return formatCompactNumber(value) + (unit ? " " + unit : "");
    }

    function isModelMetric(name) {
      const key = normalizedName(name);
      return key.includes("model");
    }

    function isActivePowerMetric(name) {
      const key = normalizedName(name);
      return key.includes("activepower") || key.includes("acpower") || key.includes("gridportpower") || key.includes("outputpower");
    }

    function isRatedPowerMetric(name) {
      const key = normalizedName(name);
      return key.includes("ratedpower") || key.includes("nominalpower") || key.includes("maxactivepower") || key.includes("limitactivepowerrated");
    }

    function isDailyEnergyMetric(name) {
      const key = normalizedName(name);
      return key.includes("daily") && (key.includes("energy") || key.includes("yield"));
    }

    function isReactivePowerMetric(name) {
      const key = normalizedName(name);
      return key.includes("reactivepower") || key.includes("qout");
    }

    function isDeviceStatusMetric(name) {
      const key = normalizedName(name);
      return key.includes("status") || key.includes("running");
    }

    function isAmbientTemperatureMetric(name) {
      const key = normalizedName(name);
      return key.includes("ambienttemperature") || key.includes("ambienttemp") || key.includes("airtemperature");
    }

    function isModuleTemperatureMetric(name) {
      const key = normalizedName(name);
      return key.includes("moduletemperature") || key.includes("moduletemp") || key.includes("pvmoduletemperature") || key.includes("paneltemperature");
    }

    function isIrradianceMetric(name) {
      const key = normalizedName(name);
      return key.includes("irradiance") || key.includes("irradiation");
    }

    function isVoltageMetric(name) {
      const key = normalizedName(name);
      return key.includes("voltage") || key.includes("uav") || key.includes("ubv") || key.includes("ucv");
    }

    function isFrequencyMetric(name) {
      const key = normalizedName(name);
      return key.includes("frequency") || key.includes("freq");
    }

    function isPowerFactorMetric(name) {
      const key = normalizedName(name);
      return key.includes("powerfactor") || key === "pf";
    }

    function renderInverterControl() {
      const deviceSelect = el("controlDeviceName");
      const devices = inverterControlDevices();
      const disabled = !devices.length;

      if (disabled) {
        deviceSelect.innerHTML = '<option value="">Chưa có thiết bị inverter</option>';
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
      document.querySelectorAll("#controlScheduleMode, #controlScheduleAt, #controlScheduleUntil, #controlScheduleTime, #controlScheduleEndTime, #controlScheduleMaxRuns, #controlScheduleEndAt, [data-schedule-weekday]").forEach((input) => {
        input.disabled = disabled;
      });
      updateControlScheduleFields();
      renderCommandHistory();
    }

    function updateControlScheduleFields() {
      const mode = el("controlScheduleMode")?.value || "now";
      document.querySelectorAll(".schedule-now-field").forEach((node) => {
        node.classList.toggle("hidden", mode !== "now");
      });
      document.querySelectorAll(".schedule-once-field").forEach((node) => {
        node.classList.toggle("hidden", mode !== "once");
      });
      document.querySelectorAll(".schedule-repeat-field").forEach((node) => {
        node.classList.toggle("hidden", !["daily", "weekly"].includes(mode));
      });
      document.querySelectorAll(".schedule-weekly-field").forEach((node) => {
        node.classList.toggle("hidden", mode !== "weekly");
      });
      updateControlScheduleSummary();
    }

    function inverterControlDevices() {
      const devices = state.devices || [];
      return devices.filter((device) => {
        const text = [device.category, device.type, device.manufacturer, device.model, device.templateId].filter(Boolean).join(" ").toLowerCase();
        const hasConfiguredControls = device.controls && typeof device.controls === "object" && Object.keys(device.controls).length > 0;
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

        return text.includes("inverter") || text.includes("sun2000") || text.includes("huawei") || hasConfiguredControls || hasControlRegister;
      });
    }

    function renderCommandHistory() {
      const body = el("controlHistoryBody");
      if (!commands.length) {
        body.innerHTML = '<tr><td colspan="7">Chưa có lệnh.</td></tr>';
        return;
      }

      body.innerHTML = commands.map((command) => \`
        <tr>
          <td>\${escapeHtml(formatDateTime(command.createdAt))}</td>
          <td>\${escapeHtml(actionLabel(command.action))}</td>
          <td><span class="badge \${escapeHtml(command.status || "queued")}">\${escapeHtml(command.status || "queued")}</span></td>
          <td class="command-detail">\${escapeHtml(commandScheduleLabel(command))}</td>
          <td class="command-detail">\${escapeHtml(commandDetail(command))}</td>
          <td>\${escapeHtml(formatDateTime(command.completedAt || command.updatedAt || command.deliveredAt))}</td>
          <td class="actions-cell">\${commandActionHtml(command)}</td>
        </tr>
      \`).join("");
    }

    function commandActionHtml(command) {
      if (!canCancelCommand(command)) return "";

      const label = ["daily", "weekly"].includes(command.schedule?.mode) ? "Hủy lịch" : "Hủy";
      return '<button type="button" class="danger" data-cancel-command="' + escapeHtml(command.id) + '">' + escapeHtml(label) + '</button>';
    }

    function canCancelCommand(command) {
      if (!command?.id || command.status === "cancelled" || command.seriesCancelledAt) return false;
      if (["queued", "scheduled", "running", "delivered"].includes(command.status || "")) return true;
      return Boolean(command.scheduleId && ["daily", "weekly"].includes(command.schedule?.mode));
    }

    async function cancelCommand(commandId) {
      if (!selectedId || !commandId) return;

      const command = commands.find((item) => item.id === commandId);
      const label = ["daily", "weekly"].includes(command?.schedule?.mode) ? "hủy toàn bộ lịch lặp này" : "hủy lệnh này";
      if (!confirm("Xác nhận " + label + "?")) return;

      const payload = await requestJson("/api/gateways/" + encodeURIComponent(selectedId) + "/commands/" + encodeURIComponent(commandId), {
        method: "DELETE",
      });

      const byId = new Map(commands.map((item) => [item.id, item]));
      for (const cancelled of payload.cancelled || []) {
        byId.set(cancelled.id, cancelled);
      }
      if (payload.command) {
        byId.set(payload.command.id, payload.command);
      }
      commands = Array.from(byId.values())
        .sort((left, right) => Date.parse(right.createdAt || 0) - Date.parse(left.createdAt || 0))
        .slice(0, 100);
      renderCommandHistory();
      renderRemoteEvents();
      setStatus(payload.series ? "Đã hủy lịch lặp" : "Đã hủy lệnh", "ok");
    }

    function renderRemoteStorage() {
      const body = el("storageSyncBody");
      if (!body || !state) return;

      const queue = state.storage?.queue || {};
      const archive = state.storage?.archive || {};
      const mongo = state.mongo || {};
      const remoteConfig = state.remoteConfig || {};
      const records = homeTelemetry.get(selectedId) || [];
      const pending = homeGatewayMetrics(records).queueRecords;
      setText("queueRecords", pending === null ? "-" : formatCompactNumber(pending));
      setText("queueBytes", queue.maxBytes ? formatBytes(queue.maxBytes) : "-");
      setText("runtimeCloudMode", mongo.enabled ? "MongoDB" : "HTTP");
      setText("runtimeIec104", state.iec104?.enabled ? ((state.iec104.mode || "server") + " / enabled") : "Tắt");
      const rows = [
        ["Đường dẫn queue", state.storage?.queuePath || "-", "File queue local trên IPC"],
        ["Đường dẫn archive 5 phút", archive.path || "-", "SQLite local lưu snapshot 5 phút để xuất CSV trên gateway"],
        ["Chu kỳ archive", formatMs(archive.intervalMs || 300000), "Chu kỳ lấy mẫu CSV"],
        ["Thời gian giữ archive", formatMs(archive.retentionMs || 604800000), "Tự xóa dữ liệu archive quá thời gian này"],
        ["Đường dẫn điện năng D-1", state.storage?.stationEnergyPath || "-", "File chốt điện năng hôm qua cho IEC104 EVN"],
        ["Max records", queue.maxRecords || "-", "Giới hạn số bản ghi queue"],
        ["Max bytes", queue.maxBytes ? formatBytes(queue.maxBytes) : "-", "Giới hạn dung lượng queue"],
        ["Retention", queue.retentionMs ? formatMs(queue.retentionMs) : "-", "Thời gian giữ dữ liệu local"],
        ["Pending records", pending === null ? "-" : formatCompactNumber(pending), "Metric do gateway gửi lên nếu có"],
        ["Remote config", remoteConfig.enabled ? "Enable" : "Disable", hostFromUrl(remoteConfig.url || "") || "-"],
        ["Mongo sync", mongo.enabled ? "Enable" : "Disable", mongo.dbName || mongo.dbNameEnv || "-"],
        ["Runtime IEC104", state.iec104?.enabled ? ((state.iec104.mode || "server") + " / enabled") : "Tắt", "Trạng thái endpoint IEC104"],
      ];

      body.innerHTML = rows.map((row) => '<tr>' +
        '<td>' + escapeHtml(row[0]) + '</td>' +
        '<td>' + escapeHtml(row[1]) + '</td>' +
        '<td>' + escapeHtml(row[2]) + '</td>' +
      '</tr>').join("");
    }

    function renderRemoteEvents() {
      const body = el("logsEventsBody");
      if (!body) return;

      const gateway = selectedGateway || {};
      const rows = [
        {
          time: gateway.lastSeenAt,
          type: "Heartbeat",
          text: statusLabel(gateway.status || "offline"),
          status: gateway.status || "offline",
        },
      ];

      if (gateway.lastConfigStatus) {
        rows.push({
          time: gateway.updatedAt,
          type: "Config",
          text: gateway.lastConfigMessage || ("Config " + gateway.lastConfigStatus),
          status: gateway.lastConfigStatus,
        });
      }

      for (const command of commands.slice(0, 25)) {
        rows.push({
          time: command.createdAt,
          type: "Command",
          text: actionLabel(command.action) + " | " + commandDetail(command),
          status: command.status || "queued",
        });
      }

      rows.sort((a, b) => Date.parse(b.time || 0) - Date.parse(a.time || 0));
      body.innerHTML = rows.map((row) => '<tr>' +
        '<td>' + escapeHtml(formatDateTime(row.time)) + '</td>' +
        '<td>' + escapeHtml(row.type) + '</td>' +
        '<td>' + escapeHtml(row.text || "-") + '</td>' +
        '<td><span class="badge ' + escapeHtml(row.status || "waiting") + '">' + escapeHtml(row.status || "-") + '</span></td>' +
      '</tr>').join("") || '<tr><td colspan="4" class="empty-state">Chưa có sự kiện.</td></tr>';
    }

    function renderRemoteSystem() {
      if (!state) return;
      const setText = (id, value) => {
        const node = el(id);
        if (node) node.textContent = value;
      };

      setText("systemGatewayId", selectedId || state.gateway?.id || "-");
      setText("systemDeviceCount", String((state.devices || []).length));
      setText("systemPortCount", String(Object.keys(state.ports || {}).length));
      setText("systemTemplateCount", String(templates.length));
    }

    function renderConnectivityStatus() {
      updateConnectivityTile("sidebarLanStatus", lanConnectivityStatus());
      updateConnectivityTile("sidebarInternetStatus", internetConnectivityStatus());
      updateConnectivityTile("sidebarCloudStatus", cloudConnectivityStatus());
    }

    function updateConnectivityTile(id, status) {
      const node = el(id);
      if (!node) return;

      node.classList.remove("status-online", "status-warning", "status-error", "status-waiting");
      node.classList.add("status-" + (status.kind || "waiting"));
      node.title = status.title || "";
      node.setAttribute("aria-label", status.title || "");
    }

    function lanConnectivityStatus() {
      const gateway = selectedGateway || {};
      if (gateway.status === "online") {
        return {
          kind: "online",
          title: "LAN connected: " + (gateway.id || selectedId || "gateway"),
        };
      }

      if (selectedId) {
        return {
          kind: "warning",
          title: "Gateway offline or no heartbeat",
        };
      }

      return {
        kind: "waiting",
        title: "LAN waiting for gateway",
      };
    }

    function internetConnectivityStatus() {
      const serverUrl = state?.server?.url || "";
      if (selectedGateway?.status === "online" && serverUrl) {
        return {
          kind: "online",
          title: "Internet route configured: " + hostFromUrl(serverUrl),
        };
      }

      if (serverUrl) {
        return {
          kind: "warning",
          title: "Server URL configured, gateway not online",
        };
      }

      return {
        kind: "waiting",
        title: "No server URL configured",
      };
    }

    function cloudConnectivityStatus() {
      const mongo = state?.mongo || {};
      if (!mongo.enabled) {
        return {
          kind: "waiting",
          title: "MongoDB disabled",
        };
      }

      if (selectedGateway?.status === "online") {
        return {
          kind: "online",
          title: "MongoDB enabled: " + (mongo.dbName || mongo.dbNameEnv || "database"),
        };
      }

      return {
        kind: "warning",
        title: "MongoDB enabled, gateway not online",
      };
    }

    async function refreshCommands() {
      if (!selectedId) return;
      const payload = await requestJson("/api/gateways/" + encodeURIComponent(selectedId) + "/commands");
      commands = payload.commands || [];
      renderCommandHistory();
      renderRemoteEvents();
      setStatus("Đã làm mới lịch sử lệnh", "ok");
    }

    async function queueInverterControl(action, extra = {}) {
      if (!selectedId) return;
      const deviceName = el("controlDeviceName").value;
      if (!deviceName) {
        setStatus("Chưa chọn thiết bị inverter", "error");
        return;
      }

      const schedule = collectControlSchedule();
      setStatus((schedule ? "Đang hẹn " : "Đang queue ") + actionLabel(action) + "...");
      const payload = await requestJson("/api/gateways/" + encodeURIComponent(selectedId) + "/control", {
        method: "POST",
        body: JSON.stringify({
          deviceName,
          action,
          ...extra,
          ...(schedule ? { schedule } : {}),
        }),
      });

      commands = [payload.command, ...commands.filter((command) => command.id !== payload.command.id)].slice(0, 100);
      renderCommandHistory();
      setStatus((payload.command.status === "scheduled" ? "Đã hẹn " : "Đã queue ") + actionLabel(payload.command.action), "ok");
    }

    function collectControlSchedule() {
      const mode = el("controlScheduleMode")?.value || "now";
      if (mode === "now") return null;

      const timezone = browserTimezone();
      const schedule = { mode, timezone };

      if (mode === "once") {
        const localValue = el("controlScheduleAt").value;
        if (!localValue) throw new Error("Hãy chọn thời điểm chạy");
        schedule.scheduledAt = localDateTimeToIso(localValue);
        const untilValue = el("controlScheduleUntil").value;
        if (untilValue) schedule.scheduledUntil = localDateTimeToIso(untilValue);
        return schedule;
      }

      if (!["daily", "weekly"].includes(mode)) {
        throw new Error("Kiểu hẹn không hợp lệ");
      }

      schedule.timeOfDay = el("controlScheduleTime").value || "08:00";
      schedule.endTimeOfDay = el("controlScheduleEndTime").value || "17:00";
      const maxRuns = Number(el("controlScheduleMaxRuns").value);
      if (Number.isFinite(maxRuns) && maxRuns > 0) schedule.maxRuns = Math.trunc(maxRuns);

      const endAt = el("controlScheduleEndAt").value;
      if (endAt) schedule.endAt = dateEndLocalToIso(endAt);

      if (mode === "weekly") {
        schedule.daysOfWeek = [...document.querySelectorAll("[data-schedule-weekday]:checked")]
          .map((input) => Number(input.dataset.scheduleWeekday))
          .filter((day) => Number.isInteger(day));
        if (!schedule.daysOfWeek.length) throw new Error("Hãy chọn ít nhất một ngày trong tuần");
      }

      return schedule;
    }

    function localDateTimeToIso(value) {
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) throw new Error("Thời điểm chạy không hợp lệ");
      return date.toISOString();
    }

    function dateEndLocalToIso(value) {
      const date = new Date(value + "T23:59:59");
      if (!Number.isFinite(date.getTime())) throw new Error("Ngày kết thúc không hợp lệ");
      return date.toISOString();
    }

    function browserTimezone() {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bangkok";
    }

    function collectPowerLimitTiming() {
      const schedule = collectControlSchedule();
      const mode = el("controlScheduleMode")?.value || "now";

      if (mode === "now") {
        return {
          durationMinutes: Number(el("powerLimitDurationMinutes").value),
          schedule: null,
          window: null,
        };
      }

      if (mode === "once") {
        const startValue = el("controlScheduleAt").value;
        const endValue = el("controlScheduleUntil").value;
        if (!startValue || !endValue) throw new Error("Hãy chọn thời điểm bắt đầu và kết thúc");
        const start = new Date(startValue);
        const end = new Date(endValue);
        if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
          throw new Error("Thời điểm bắt đầu hoặc kết thúc không hợp lệ");
        }
        const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
        if (durationMinutes <= 0) throw new Error("Thời điểm kết thúc phải sau thời điểm bắt đầu");
        return {
          durationMinutes,
          schedule,
          window: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
        };
      }

      const startTime = el("controlScheduleTime").value || "08:00";
      const endTime = el("controlScheduleEndTime").value || "";
      if (!endTime) throw new Error("Hãy chọn giờ kết thúc");
      return {
        durationMinutes: durationBetweenTimes(startTime, endTime),
        schedule,
        window: {
          startTime,
          endTime,
          timezone: schedule.timezone,
        },
      };
    }

    function updateControlScheduleSummary() {
      const summary = el("controlScheduleSummary");
      if (!summary) return;

      try {
        const mode = el("controlScheduleMode")?.value || "now";
        if (mode === "now") {
          const minutes = Number(el("powerLimitDurationMinutes")?.value || 0);
          summary.textContent = minutes > 0 ? "Chạy ngay trong " + minutes + " phút." : "Chạy ngay khi bấm áp dụng.";
          return;
        }
        const timing = collectPowerLimitTiming();
        const schedule = timing.schedule || {};
        const parts = [];
        if (mode === "once") parts.push("Một lần " + formatDateTime(schedule.scheduledAt));
        if (mode === "daily") parts.push("Hằng ngày " + schedule.timeOfDay + " - " + schedule.endTimeOfDay);
        if (mode === "weekly") parts.push("Hằng tuần " + weekdayLabel(schedule.daysOfWeek) + " " + schedule.timeOfDay + " - " + schedule.endTimeOfDay);
        parts.push("thời lượng " + timing.durationMinutes + " phút");
        summary.textContent = parts.join(" | ");
      } catch (error) {
        summary.textContent = error.message;
      }
    }

    function durationBetweenTimes(startTime, endTime) {
      const start = timeToMinutes(startTime);
      const end = timeToMinutes(endTime);
      let duration = end - start;
      if (duration <= 0) duration += 1440;
      return duration;
    }

    function timeToMinutes(value) {
      const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
      if (!match) throw new Error("Giờ phải dùng định dạng HH:mm");
      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      if (hours > 23 || minutes > 59) throw new Error("Giờ không hợp lệ");
      return hours * 60 + minutes;
    }

    function submitPowerLimitForm() {
      const mode = el("powerLimitMode").value;
      const value = Number(el("powerLimitValue").value);

      if (!["percent", "kw", "watts"].includes(mode)) {
        setStatus("Kiểu giới hạn không hợp lệ", "error");
        return;
      }
      if (!Number.isFinite(value) || value < 0) {
        setStatus("Giá trị giới hạn phải lớn hơn hoặc bằng 0", "error");
        return;
      }
      if (mode === "percent" && value > 100) {
        setStatus("Phần trăm giới hạn phải từ 0 đến 100", "error");
        return;
      }

      let timing;
      try {
        timing = collectPowerLimitTiming();
      } catch (error) {
        setStatus(error.message, "error");
        return;
      }

      if (!Number.isFinite(timing.durationMinutes) || timing.durationMinutes <= 0 || timing.durationMinutes > 1440) {
        setStatus("Thời lượng phải từ 1 đến 1440 phút", "error");
        return;
      }

      queueInverterControl("limit_power", {
        [mode]: value,
        durationMinutes: timing.durationMinutes,
        ...(timing.window ? { scheduleWindow: timing.window } : {}),
        ...(timing.schedule ? { schedule: timing.schedule } : {}),
      }).catch((error) => setStatus(error.message, "error"));
    }

    function updatePowerLimitValueConstraints() {
      const input = el("powerLimitValue");
      const mode = el("powerLimitMode")?.value || "percent";
      if (!input) return;

      if (mode === "percent") {
        input.max = "100";
        input.placeholder = "0 - 100";
        const value = Number(input.value);
        if (Number.isFinite(value) && value > 100) input.value = "100";
      } else {
        input.removeAttribute("max");
        input.placeholder = "";
      }
    }

    function actionLabel(action) {
      const labels = {
        start: "Khởi động",
        stop: "Dừng",
        reboot: "Khởi động lại",
        limit_power: "Giới hạn công suất",
        clear_power_limit: "Xóa giới hạn",
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
      if (payload.scheduleWindow?.startTime && payload.scheduleWindow?.endTime) {
        parts.push(payload.scheduleWindow.startTime + " - " + payload.scheduleWindow.endTime);
      }
      if (payload.scheduleWindow?.start && payload.scheduleWindow?.end) {
        parts.push(formatDateTime(payload.scheduleWindow.start) + " - " + formatDateTime(payload.scheduleWindow.end));
      }
      if (command.message) parts.push(command.message);
      return parts.join(" | ") || "-";
    }

    function commandScheduleLabel(command) {
      const schedule = command.schedule || {};
      if (!schedule.mode) return "Chạy ngay";

      const nextRunAt = command.nextRunAt || command.scheduledAt;
      const parts = [];
      if (schedule.mode === "once") parts.push("Một lần");
      if (schedule.mode === "daily") parts.push("Hằng ngày " + (schedule.timeOfDay || "") + (schedule.endTimeOfDay ? " - " + schedule.endTimeOfDay : ""));
      if (schedule.mode === "weekly") parts.push("Hằng tuần " + weekdayLabel(schedule.daysOfWeek) + " " + (schedule.timeOfDay || "") + (schedule.endTimeOfDay ? " - " + schedule.endTimeOfDay : ""));
      if (nextRunAt && ["scheduled", "queued", "delivered"].includes(command.status || "")) {
        parts.push("lần tới " + formatDateTime(nextRunAt));
      }
      if (Number.isInteger(command.runIndex) && command.runIndex > 0) {
        parts.push("lần " + (command.runIndex + 1));
      }
      return parts.filter(Boolean).join(" | ") || "-";
    }

    function weekdayLabel(days) {
      const labels = {
        1: "T2",
        2: "T3",
        3: "T4",
        4: "T5",
        5: "T6",
        6: "T7",
        7: "CN",
      };
      return (days || []).map((day) => labels[day] || day).join(", ");
    }

    function renderTemplatePicker() {
      el("newDeviceTemplate").innerHTML = '<option value="">Thiết bị trống</option>' +
        templates.map((template) => option(template.id, template.id, template.label)).join("");
    }

    function renderTemplateLibrary() {
      const container = el("templateLibrary");
      container.innerHTML = "";

      if (!templates.length) {
        container.innerHTML = '<div class="empty-state">Chưa có mẫu thiết bị</div>';
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
              '<p>' + escapeHtml(template.id || "-") + ' | ' + (template.registers || []).length + ' thanh ghi</p>' +
            '</div>' +
            '<button type="button" class="danger icon-only" data-remove-template="' + index + '" title="Xóa mẫu" aria-label="Xóa mẫu"><svg class="app-icon"><use href="#icon-trash"></use></svg><span class="visually-hidden">Xóa mẫu</span></button>' +
          '</div>' +
          '<div class="grid">' +
            '<label>ID <input data-template="' + index + '" data-field="id" value="' + escapeHtml(template.id || "") + '" autocomplete="off"></label>' +
            '<label>Nhãn <input data-template="' + index + '" data-field="label" value="' + escapeHtml(template.label || "") + '" autocomplete="off"></label>' +
            '<label>Hãng <input data-template="' + index + '" data-field="manufacturer" value="' + escapeHtml(template.manufacturer || "") + '"></label>' +
            '<label>Model <input data-template="' + index + '" data-field="model" value="' + escapeHtml(template.model || "") + '"></label>' +
            '<label>Nhóm <input data-template="' + index + '" data-field="category" value="' + escapeHtml(template.category || "") + '"></label>' +
            '<label>Kiểu <select data-template="' + index + '" data-field="type">' + templateTypeOptionsHtml(template.type, template.category) + '</select></label>' +
            '<label>Giao thức <select data-template="' + index + '" data-field="protocol">' + ["modbus-rtu", "modbus-tcp"].map((name) => option(name, template.protocol || "modbus-rtu")).join("") + '</select></label>' +
            '<label>Chu kỳ poll ms <input data-template="' + index + '" data-field="pollIntervalMs" type="number" min="500" value="' + (template.pollIntervalMs || 5000) + '"></label>' +
            '<label class="wide">Ghi chú <input data-template="' + index + '" data-field="notes" value="' + escapeHtml(template.notes || "") + '"></label>' +
          '</div>' +
          '<div class="registers-head">' +
            '<span class="pill">' + (template.registers || []).length + ' thanh ghi</span>' +
            '<div class="register-actions">' +
              '<button class="subtle icon-only" type="button" data-toggle-template-registers="' + index + '" title="' + (registersExpanded ? "Ẩn thanh ghi" : "Sửa thanh ghi") + '" aria-label="' + (registersExpanded ? "Ẩn thanh ghi" : "Sửa thanh ghi") + '"><svg class="app-icon"><use href="#icon-settings"></use></svg><span class="visually-hidden">' + (registersExpanded ? "Ẩn thanh ghi" : "Sửa thanh ghi") + '</span></button>' +
              (registersExpanded ? '<button class="subtle icon-only" type="button" data-add-template-register="' + index + '" title="Thêm thanh ghi" aria-label="Thêm thanh ghi"><svg class="app-icon"><use href="#icon-plus"></use></svg><span class="visually-hidden">Thêm thanh ghi</span></button>' : "") +
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
              '<th>Tên</th>' +
              '<th>Hàm</th>' +
              '<th>Quyền</th>' +
              '<th>Đọc</th>' +
              '<th>Địa chỉ</th>' +
              '<th>Độ dài</th>' +
              '<th>Kiểu</th>' +
              '<th>Thứ tự word</th>' +
              '<th>Hệ số</th>' +
              '<th>Độ lệch</th>' +
              '<th>Đơn vị</th>' +
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
        '<td><input data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="address" type="number" min="0" max="65535" value="' + (register.address || 0) + '"></td>' +
        '<td><input data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="length" type="number" min="1" max="125" value="' + (register.length || 1) + '"></td>' +
        '<td><select data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="type">' + ["uint16", "int16", "uint32", "int32", "uint64", "int64", "float32", "float64", "string", "bytes", "bitfield16", "bitfield32"].map((item) => option(item, register.type || "uint16")).join("") + '</select></td>' +
        '<td><select data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="wordOrder">' + ["", "be", "le", "high-low", "low-high"].map((item) => option(item, register.wordOrder || "", item || "mặc định")).join("") + '</select></td>' +
        '<td><input data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="scale" type="number" step="any" value="' + (register.scale ?? 1) + '"></td>' +
        '<td><input data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="offset" type="number" step="any" value="' + (register.offset ?? "") + '"></td>' +
        '<td><input data-template="' + templateIndex + '" data-template-register="' + registerIndex + '" data-field="unit" value="' + escapeHtml(register.unit || "") + '"></td>' +
        '<td><button type="button" class="danger icon-only" data-remove-template-register="' + templateIndex + ':' + registerIndex + '" title="Xóa" aria-label="Xóa"><svg class="app-icon"><use href="#icon-trash"></use></svg><span class="visually-hidden">Xóa</span></button></td>' +
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

    function renderStations() {
      const body = el("stationsBody");
      if (!body) return;

      const stations = state.stations || [];
      if (!stations.length) {
        body.innerHTML = '<tr><td colspan="6" class="empty-state">Chưa cấu hình trạm</td></tr>';
        return;
      }

      body.innerHTML = stations.map((station, index) => \`
        <tr data-station-row="\${index}">
          \${renderStationRow(index, station)}
        </tr>
      \`).join("");
    }

    function renderStationRow(index, station) {
      const devices = state.devices || [];
      const selectedNames = new Set(stationDeviceNamesForUi(station));
      const size = Math.min(Math.max(devices.length, 2), 6);
      const deviceOptions = devices.length
        ? devices.map((device) => {
          const name = device.name || "";
          return \`<option value="\${escapeHtml(name)}" \${selectedNames.has(name) ? "selected" : ""}>\${escapeHtml(name || "Thiết bị chưa đặt tên")}</option>\`;
        }).join("")
        : '<option value="" disabled>Chưa cấu hình thiết bị</option>';

      return \`
        <td><input data-station="\${index}" data-field="id" value="\${escapeHtml(station.id || "")}" placeholder="station_1"></td>
        <td><input data-station="\${index}" data-field="name" value="\${escapeHtml(station.name || "")}" placeholder="Tên trạm"></td>
        <td><input data-station="\${index}" data-field="capacityKw" type="number" min="0" step="0.1" value="\${station.capacityKw ?? ""}"></td>
        <td>
          <select data-station="\${index}" data-field="devices" multiple size="\${size}">
            \${deviceOptions}
          </select>
        </td>
        <td><input data-station="\${index}" data-field="evnEnabled" type="checkbox" \${station.evnProfile?.enabled ? "checked" : ""} title="Bật profile trạm EVN"></td>
        <td><button type="button" data-remove-station="\${index}" class="danger icon-only" title="Xóa" aria-label="Xóa"><svg class="app-icon"><use href="#icon-trash"></use></svg><span class="visually-hidden">Xóa</span></button></td>
      \`;
    }

    function renderPorts() {
      const body = el("portsBody");
      body.innerHTML = "";

      for (const [name, port] of Object.entries(state.ports || {})) {
        const row = document.createElement("tr");
        row.innerHTML = \`
          <td><input data-port="\${escapeHtml(name)}" data-field="name" value="\${escapeHtml(name)}"></td>
          <td><input data-port="\${escapeHtml(name)}" data-field="path" value="\${escapeHtml(port.path || "")}"></td>
          <td><input data-port="\${escapeHtml(name)}" data-field="baudRate" type="number" min="1" step="1" value="\${port.baudRate || 9600}"></td>
          <td><select data-port="\${escapeHtml(name)}" data-field="parity">\${["none", "even", "odd", "mark", "space"].map((item) => option(item, port.parity || "none")).join("")}</select></td>
          <td><input data-port="\${escapeHtml(name)}" data-field="dataBits" type="number" min="5" max="8" step="1" value="\${port.dataBits || 8}"></td>
          <td><input data-port="\${escapeHtml(name)}" data-field="stopBits" type="number" min="1" max="2" step="1" value="\${port.stopBits || 1}"></td>
          <td><input data-port="\${escapeHtml(name)}" data-field="timeoutMs" type="number" min="100" step="100" value="\${port.timeoutMs || 1000}"></td>
          <td><button type="button" data-remove-port="\${escapeHtml(name)}" class="danger icon-only" title="Xóa" aria-label="Xóa"><svg class="app-icon"><use href="#icon-trash"></use></svg><span class="visually-hidden">Xóa</span></button></td>
        \`;
        body.appendChild(row);
      }
    }

    function renderDevices() {
      const container = el("devices");
      container.innerHTML = "";

      if (!(state.devices || []).length) {
        container.innerHTML = '<div class="empty-state">Chưa cấu hình thiết bị</div>';
        return;
      }

      (state.devices || []).forEach((device, index) => {
        const ports = Object.keys(state.ports || {});
        const protocolMode = device.protocol || "modbus-rtu";
        const registersExpanded = expandedDeviceRegisters.has(String(index));
        const stationOptions = (state.stations || []).map((station) => option(station.id || "", device.stationId || "", station.name || station.id || "Trạm")).join("");
        const section = document.createElement("div");
        section.className = "device";
        section.dataset.protocolMode = protocolMode;
        section.innerHTML = \`
          <div class="device-head">
            <div class="device-title">
              <strong>\${escapeHtml(device.name || "device_" + (index + 1))}</strong>
              <p>\${escapeHtml(deviceSubtitle(device))}</p>
            </div>
            <button type="button" class="danger icon-only" data-remove-device="\${index}" title="Xóa thiết bị" aria-label="Xóa thiết bị"><svg class="app-icon"><use href="#icon-trash"></use></svg><span class="visually-hidden">Xóa thiết bị</span></button>
          </div>
          <div class="grid">
            <label class="wide">Mẫu
              <div class="inline-field">
                <select data-device="\${index}" data-field="templateId">
                  <option value="">Thiết bị tùy chỉnh</option>
                  \${templates.map((template) => option(template.id, selectedTemplateId(device), template.label)).join("")}
                </select>
                <button class="subtle icon-only" type="button" data-apply-template="\${index}" title="Áp dụng" aria-label="Áp dụng"><svg class="app-icon"><use href="#icon-check-circle"></use></svg><span class="visually-hidden">Áp dụng</span></button>
              </div>
            </label>
            <label>Tên <input data-device="\${index}" data-field="name" value="\${escapeHtml(device.name || "")}"></label>
            <label>Kiểu <input data-device="\${index}" data-field="type" value="\${escapeHtml(device.type || "")}"></label>
            <label>Trạm
              <select data-device="\${index}" data-field="stationId">
                <option value="">Không gán trạm</option>
                \${stationOptions}
              </select>
            </label>
            <label>Công suất kW <input data-device="\${index}" data-field="capacityKw" type="number" min="0" step="0.1" value="\${device.capacityKw ?? ""}"></label>
            <label>Hãng <input data-device="\${index}" data-field="manufacturer" value="\${escapeHtml(device.manufacturer || "")}"></label>
            <label>Model <input data-device="\${index}" data-field="model" value="\${escapeHtml(device.model || "")}"></label>
            <label>Nhóm <input data-device="\${index}" data-field="category" value="\${escapeHtml(device.category || "")}"></label>
            <label>Giao thức <select data-device="\${index}" data-field="protocol">\${["modbus-rtu", "modbus-tcp"].map((name) => option(name, device.protocol || "modbus-rtu")).join("")}</select></label>
            <label class="rtu-field">Cổng <select data-device="\${index}" data-field="port"><option value="">Không chọn</option>\${ports.map((name) => option(name, device.port)).join("")}</select></label>
            <label class="rtu-field">Slave ID <input data-device="\${index}" data-field="slaveId" type="number" min="1" max="247" value="\${device.slaveId || 1}"></label>
            <label class="tcp-field">Host TCP <input data-device="\${index}" data-field="host" value="\${escapeHtml(device.host || "")}" placeholder="192.168.1.50 hoặc hostname"></label>
            <label class="tcp-field">Cổng TCP <input data-device="\${index}" data-field="tcpPort" type="number" min="1" max="65535" value="\${device.tcpPort || 502}"></label>
            <label class="tcp-field">Unit ID <input data-device="\${index}" data-field="unitId" type="number" min="1" max="247" value="\${device.unitId || device.slaveId || 3}"></label>
            <label>Chu kỳ poll ms <input data-device="\${index}" data-field="pollIntervalMs" type="number" min="500" value="\${device.pollIntervalMs || 5000}"></label>
          </div>
          <div class="registers-head">
            <span class="pill">\${(device.registers || []).length} thanh ghi</span>
            <div class="register-actions">
              <button class="subtle icon-only" type="button" data-toggle-device-registers="\${index}" title="\${registersExpanded ? "Ẩn thanh ghi" : "Sửa thanh ghi"}" aria-label="\${registersExpanded ? "Ẩn thanh ghi" : "Sửa thanh ghi"}"><svg class="app-icon"><use href="#icon-settings"></use></svg><span class="visually-hidden">\${registersExpanded ? "Ẩn thanh ghi" : "Sửa thanh ghi"}</span></button>
              \${registersExpanded ? \`<button class="subtle icon-only" type="button" data-add-register="\${index}" title="Thêm thanh ghi" aria-label="Thêm thanh ghi"><svg class="app-icon"><use href="#icon-plus"></use></svg><span class="visually-hidden">Thêm thanh ghi</span></button>\` : ""}
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
                <th>Tên</th>
                <th>Hàm</th>
                <th>Quyền</th>
                <th>Đọc</th>
                <th>Địa chỉ</th>
                <th>Độ dài</th>
                <th>Kiểu</th>
                <th>Hệ số</th>
                <th>Đơn vị</th>
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
          <td><input data-device="\${deviceIndex}" data-register="\${registerIndex}" data-field="address" type="number" min="0" max="65535" value="\${register.address || 0}"></td>
          <td><input data-device="\${deviceIndex}" data-register="\${registerIndex}" data-field="length" type="number" min="1" max="125" value="\${register.length || 1}"></td>
          <td><select data-device="\${deviceIndex}" data-register="\${registerIndex}" data-field="type">\${["uint16", "int16", "uint32", "int32", "uint64", "int64", "float32", "float64", "string", "bytes", "bitfield16", "bitfield32"].map((item) => option(item, register.type || "uint16")).join("")}</select></td>
          <td><input data-device="\${deviceIndex}" data-register="\${registerIndex}" data-field="scale" type="number" step="any" value="\${register.scale ?? 1}"></td>
          <td><input data-device="\${deviceIndex}" data-register="\${registerIndex}" data-field="unit" value="\${escapeHtml(register.unit || "")}"></td>
          <td><button type="button" class="danger icon-only" data-remove-register="\${deviceIndex}:\${registerIndex}" title="Xóa" aria-label="Xóa"><svg class="app-icon"><use href="#icon-trash"></use></svg><span class="visually-hidden">Xóa</span></button></td>
        </tr>
      \`;
    }

    function renderRegisterPreview(registers) {
      if (!registers.length) return '<div class="register-preview"><span class="register-chip">Chưa có thanh ghi</span></div>';
      const visible = registers.slice(0, 8);
      const remaining = registers.length - visible.length;
      return \`
        <div class="register-preview">
          \${visible.map((register) => \`<span class="register-chip">\${escapeHtml(register.name || "-")}</span>\`).join("")}
          \${remaining > 0 ? \`<span class="register-chip">+\${remaining} more</span>\` : ""}
        </div>
      \`;
    }

    function renderIec104() {
      renderEvnStationPicker();
      renderEvnSourceMappings();
      renderIec104Points();
    }

    function renderEvnStationPicker() {
      const picker = el("iec104EvnStation");
      const stations = state.stations || [];
      const generateButton = el("generateEvnIec104Btn");

      if (!picker) return;

      if (!stations.length) {
        picker.innerHTML = '<option value="">Chưa có trạm</option>';
        picker.disabled = true;
        if (generateButton) generateButton.disabled = true;
        return;
      }

      picker.disabled = false;
      if (generateButton) generateButton.disabled = false;
      const selected = picker.value || state.iec104?.evnMapping?.stationId || stations.find((station) => station.evnProfile?.enabled)?.id || stations[0].id || "";
      picker.innerHTML = stations.map((station) => option(station.id || "", selected, station.name || station.id || "Trạm")).join("");
    }

    const evnSourceRows = [
      { key: "pOut", ioa: "1", label: "P-out", source: "meter", mode: "single", kind: "meter", required: true },
      { key: "pinvOut", ioa: "2", label: "Pinv-out total", source: "inverter_total", mode: "multi", kind: "inverter", required: true },
      { key: "ainvD1", ioa: "3", label: "Ainv_D-1 total", source: "snapshot", mode: "multi", kind: "inverter", required: true, snapshot: true },
      { key: "qOut", ioa: "4", label: "Q-out", source: "inverter_total", mode: "multi", kind: "inverter" },
      { key: "ua", ioa: "5", label: "Ua", source: "meter", mode: "single", kind: "meter" },
      { key: "ub", ioa: "6", label: "Ub", source: "meter", mode: "single", kind: "meter" },
      { key: "uc", ioa: "7", label: "Uc", source: "meter", mode: "single", kind: "meter" },
      { key: "ia", ioa: "8", label: "Ia", source: "meter", mode: "single", kind: "meter" },
      { key: "ib", ioa: "9", label: "Ib", source: "meter", mode: "single", kind: "meter" },
      { key: "ic", ioa: "10", label: "Ic", source: "meter", mode: "single", kind: "meter" },
      { key: "frequency", ioa: "11", label: "Frequency", source: "meter", mode: "single", kind: "meter" },
      { key: "powerFactor", ioa: "12", label: "Power factor", source: "meter", mode: "single", kind: "meter" },
      { key: "inverterPoints", ioa: "13/14 +2", label: "Per inverter P / D-1", source: "snapshot", mode: "inverterPoints", kind: "inverter", snapshot: true },
    ];

    function renderEvnSourceMappings() {
      const body = el("iec104EvnSourcesBody");
      if (!body) return;

      const station = selectedEvnStation();
      if (!station) {
        body.innerHTML = '<tr><td colspan="7" class="empty-state">Chưa có trạm EVN. Tạo trạm trước khi chọn nguồn tín hiệu.</td></tr>';
        return;
      }

      const mapping = mergedClientEvnMapping(station, state.iec104?.evnMapping);
      body.innerHTML = evnSourceRows.map((row) => renderEvnSourceRow(row, mapping[row.key] || {}, station)).join("");
    }

    function renderEvnSourceRow(row, signal, station) {
      const enabled = signal.enabled === undefined ? true : Boolean(signal.enabled);
      const required = row.required ? '<span class="badge online">Bắt buộc</span>' : '<span class="badge">Khuyến nghị</span>';

      return '' +
        '<tr data-evn-source-row data-evn-key="' + escapeHtml(row.key) + '" data-evn-mode="' + escapeHtml(row.mode) + '" data-evn-source="' + escapeHtml(row.source) + '">' +
          '<td><input data-evn-field="enabled" type="checkbox" ' + (enabled ? "checked" : "") + ' ' + (row.required ? "disabled" : "") + '><input data-evn-field="requiredEnabled" type="hidden" value="' + (row.required ? "true" : "") + '"></td>' +
          '<td><strong>' + escapeHtml(row.ioa) + '</strong></td>' +
          '<td>' + escapeHtml(row.label) + ' ' + required + '</td>' +
          '<td>' + escapeHtml(evnSourceLabel(row.source)) + '</td>' +
          '<td>' + renderEvnDeviceSelector(row, signal, station) + '</td>' +
          '<td>' + renderEvnRegisterSelector(row, signal, station) + '</td>' +
          '<td>' + (row.snapshot ? '<input data-evn-field="snapshotStrategy" type="hidden" value="daily_register_eod">Snapshot cuối ngày' : '-') + '</td>' +
        '</tr>';
    }

    function renderEvnDeviceSelector(row, signal, station) {
      const devices = evnDevicesForRow(row, station);
      if (row.mode === "single") {
        const selected = signal.device || devices[0]?.name || "";
        return '<select data-evn-field="device">' + devices.map((device) => option(device.name || "", selected, device.name || "Thiết bị")).join("") + '</select>';
      }

      const selected = new Set(signal.devices || devices.map((device) => device.name).filter(Boolean));
      const size = Math.min(Math.max(devices.length, 2), 6);
      return '<select data-evn-field="devices" multiple size="' + size + '">' + devices.map((device) => {
        const name = device.name || "";
        return '<option value="' + escapeHtml(name) + '" ' + (selected.has(name) ? "selected" : "") + '>' + escapeHtml(name || "Thiết bị") + '</option>';
      }).join("") + '</select>';
    }

    function renderEvnRegisterSelector(row, signal, station) {
      const devices = selectedEvnDevices(row, signal, station);
      if (row.mode === "inverterPoints") {
        return '<div class="evn-register-stack">' +
          '<div class="inline-field">' +
            '<select data-evn-field="powerRegister">' + evnRegisterOptions(devices, signal.powerRegister) + '</select>' +
            '<select data-evn-field="energyRegister">' + evnRegisterOptions(devices, signal.energyRegister) + '</select>' +
          '</div>' +
          renderEvnDeviceOverrides(row, signal, devices) +
        '</div>';
      }

      return '<div class="evn-register-stack">' +
        '<select data-evn-field="register">' + evnRegisterOptions(devices, signal.register) + '</select>' +
        renderEvnDeviceOverrides(row, signal, devices) +
      '</div>';
    }

    function renderEvnDeviceOverrides(row, signal, devices) {
      if (row.mode === "single" || !devices.length) return "";

      const overrideRows = devices.map((device) => {
        const deviceName = device.name || "";
        const override = signal.overrides?.[deviceName] || {};
        if (row.mode === "inverterPoints") {
          return '<div class="evn-override-row multi-register" data-evn-override-device="' + escapeHtml(deviceName) + '">' +
            '<span title="' + escapeHtml(deviceName || "Thiết bị") + '">' + escapeHtml(deviceName || "Thiết bị") + '</span>' +
            '<select data-evn-override-field="powerRegister">' + evnRegisterOptions([device], override.powerRegister || "", { blankLabel: "Power mặc định" }) + '</select>' +
            '<select data-evn-override-field="energyRegister">' + evnRegisterOptions([device], override.energyRegister || "", { blankLabel: "D-1 mặc định" }) + '</select>' +
          '</div>';
        }

        return '<div class="evn-override-row" data-evn-override-device="' + escapeHtml(deviceName) + '">' +
          '<span title="' + escapeHtml(deviceName || "Thiết bị") + '">' + escapeHtml(deviceName || "Thiết bị") + '</span>' +
          '<select data-evn-override-field="register">' + evnRegisterOptions([device], override.register || "", { blankLabel: "Mặc định chung" }) + '</select>' +
        '</div>';
      }).join("");

      return '<details class="evn-device-overrides">' +
        '<summary>Register từng thiết bị</summary>' +
        '<div class="evn-override-list">' + overrideRows + '</div>' +
      '</details>';
    }

    function collectEvnMapping() {
      const picker = el("iec104EvnStation");
      const station = selectedEvnStation();
      const mapping = {
        ...(state.iec104?.evnMapping || {}),
        stationId: picker?.value || station?.id || "",
      };

      document.querySelectorAll("[data-evn-source-row]").forEach((row) => {
        const key = row.dataset.evnKey;
        const mode = row.dataset.evnMode;
        const required = row.querySelector("[data-evn-field='requiredEnabled']")?.value === "true";
        const enabled = required || Boolean(row.querySelector("[data-evn-field='enabled']")?.checked);
        const value = (field) => row.querySelector("[data-evn-field='" + field + "']")?.value?.trim?.() || "";
        const selectedValues = (field) => [...row.querySelector("[data-evn-field='" + field + "']")?.selectedOptions || []].map((item) => item.value).filter(Boolean);

        if (mode === "single") {
          mapping[key] = {
            enabled,
            source: row.dataset.evnSource,
            device: value("device"),
            register: value("register"),
            scale: Number(mapping[key]?.scale ?? 1),
          };
          return;
        }

        if (mode === "inverterPoints") {
          const overrides = collectEvnOverrides(row);
          mapping[key] = {
            enabled,
            devices: selectedValues("devices"),
            powerRegister: value("powerRegister"),
            energyRegister: value("energyRegister"),
            snapshotStrategy: "daily_register_eod",
            powerScale: Number(mapping[key]?.powerScale ?? 1),
            energyScale: Number(mapping[key]?.energyScale ?? 1),
            ...(Object.keys(overrides).length ? { overrides } : {}),
          };
          return;
        }

        const overrides = collectEvnOverrides(row);
        mapping[key] = {
          enabled,
          source: row.dataset.evnSource,
          devices: selectedValues("devices"),
          register: value("register"),
          ...(row.dataset.evnSource === "snapshot" ? { snapshotStrategy: "daily_register_eod" } : {}),
          scale: Number(mapping[key]?.scale ?? 1),
          ...(Object.keys(overrides).length ? { overrides } : {}),
        };
      });

      return mapping;
    }

    function collectEvnOverrides(row) {
      const overrides = {};
      row.querySelectorAll("[data-evn-override-device]").forEach((overrideRow) => {
        const deviceName = overrideRow.dataset.evnOverrideDevice || "";
        if (!deviceName) return;

        const override = {};
        overrideRow.querySelectorAll("[data-evn-override-field]").forEach((input) => {
          const value = input.value?.trim?.() || "";
          if (value) override[input.dataset.evnOverrideField] = value;
        });

        if (Object.keys(override).length) overrides[deviceName] = override;
      });

      return overrides;
    }

    function renderIec104Points() {
      const body = el("iec104PointsBody");
      const points = state.iec104?.points || [];
      body.innerHTML = "";

      if (!points.length) {
        const emptyText = (state.stations || []).length
          ? "Chưa có mapping EVN. Chọn trạm rồi bấm Cập nhật mapping EVN."
          : "Chưa có trạm EVN. Tạo trạm trước khi cập nhật mapping.";
        body.innerHTML = '<tr><td colspan="7" class="empty-state">' + escapeHtml(emptyText) + '</td></tr>';
        return;
      }

      points.forEach((point, index) => {
        const row = document.createElement("tr");
        row.dataset.iec104PointRow = String(index);
        row.innerHTML = renderIec104PointRow(index, point);
        body.appendChild(row);
      });
    }

    function renderIec104PointRow(index, point) {
      const source = point.source || (point.station || point.stationId ? "station" : "device");
      const target = source === "station" ? (point.station || point.stationId || "") : (point.device || "");
      const type = point.type || "float";

      return '' +
        '<td><input data-field="ioa" type="hidden" value="' + escapeHtml(point.ioa || "") + '"><strong>' + escapeHtml(point.ioa || "") + '</strong></td>' +
        '<td><input data-field="name" type="hidden" value="' + escapeHtml(point.name || "") + '">' + escapeHtml(point.name || "-") + '</td>' +
        '<td><input data-field="source" type="hidden" value="' + escapeHtml(source) + '">' + escapeHtml(source === "station" ? "Trạm" : "Thiết bị") + '</td>' +
        '<td><input data-field="' + (source === "station" ? "station" : "device") + '" type="hidden" value="' + escapeHtml(target) + '">' + escapeHtml(target || "-") + '</td>' +
        '<td><input data-field="measurement" type="hidden" value="' + escapeHtml(point.measurement || "") + '">' + escapeHtml(point.measurement || "-") + '</td>' +
        '<td><input data-field="type" type="hidden" value="' + escapeHtml(type) + '">' + escapeHtml(type) + '</td>' +
        '<td><input data-field="inverted" type="checkbox" ' + (point.inverted ? "checked" : "") + ' disabled><input data-field="invertedValue" type="hidden" value="' + (point.inverted ? "true" : "") + '"></td>';
    }

    function collectIec104Points() {
      return [...document.querySelectorAll("[data-iec104-point-row]")].map((row, index) => {
        const previous = state.iec104?.points?.[index] || {};
        const value = (field) => row.querySelector("[data-field='" + field + "']")?.value?.trim?.() || "";
        const checked = (field) => Boolean(row.querySelector("[data-field='" + field + "']")?.checked);
        const source = value("source") || (value("station") ? "station" : "device");
        const point = {
          ...previous,
          ioa: Number(value("ioa")),
          source,
          measurement: value("measurement"),
          type: value("type") || "float",
        };

        const name = value("name");
        if (name) point.name = name;
        else delete point.name;

        if (source === "station") {
          point.station = value("station");
          delete point.device;
          delete point.deviceName;
        } else {
          point.device = value("device");
          delete point.station;
          delete point.stationId;
        }

        if (checked("inverted")) point.inverted = true;
        else delete point.inverted;

        return point;
      }).filter((point) => point.ioa || point.device || point.station || point.measurement || point.name);
    }

    function applyEvnIec104Defaults() {
      state.iec104 = {
        ...(state.iec104 || {}),
        enabled: true,
        mode: "server",
        host: "0.0.0.0",
        port: 2404,
        remoteHost: "",
        remotePort: 2404,
        localAddress: "",
        localPort: 0,
        commonAddress: 1,
        originatorAddress: 0,
        staleAfterMs: 600000,
        maxClientConnections: 4,
        reconnectMs: 5000,
        keepAliveMs: 30000,
        periodicMs: 300000,
        spontaneous: true,
      };
      render();
      setStatus("Đã áp dụng mặc định IEC104 EVN", "ok");
    }

    function generateEvnIec104Mapping() {
      collectConfig();
      const requestedStationId = el("iec104EvnStation").value || state.stations?.[0]?.id || "";
      const station = (state.stations || []).find((item) => item.id === requestedStationId);

      if (!station) {
        setStatus("Hãy tạo trạm trước khi cập nhật mapping EVN", "error");
        return;
      }

      const evnMapping = mergedClientEvnMapping(station, state.iec104?.evnMapping);
      const mapping = buildClientEvnIec104Mapping(station, evnMapping);
      state.iec104 = {
        ...(state.iec104 || {}),
        evnMapping,
        points: mapping.points,
        controls: mapping.controls,
      };
      station.evnProfile = {
        ...(station.evnProfile || {}),
        enabled: true,
        autoGenerateIoa: true,
      };

      renderStations();
      renderEvnStationPicker();
      renderEvnSourceMappings();
      renderIec104Points();
      setStatus("Đã cập nhật mapping EVN cho " + (station.name || station.id), "ok");
    }

    function buildClientEvnIec104Mapping(station, evnMapping) {
      const stationId = station?.id || "";
      const mapping = mergedClientEvnMapping(station, evnMapping);
      const inverterDevices = mapping.inverterPoints?.enabled === false
        ? []
        : selectedDevicesByName(mapping.inverterPoints?.devices).filter(isClientInverterDevice);
      const optionalPoints = [
        ["qOut", 4, "q_out_kvar", "reactive_power_kvar"],
        ["ua", 5, "phase_a_voltage_v", "phase_a_voltage_v"],
        ["ub", 6, "phase_b_voltage_v", "phase_b_voltage_v"],
        ["uc", 7, "phase_c_voltage_v", "phase_c_voltage_v"],
        ["ia", 8, "phase_a_current_a", "phase_a_current_a"],
        ["ib", 9, "phase_b_current_a", "phase_b_current_a"],
        ["ic", 10, "phase_c_current_a", "phase_c_current_a"],
        ["frequency", 11, "grid_frequency_hz", "grid_frequency_hz"],
        ["powerFactor", 12, "power_factor", "power_factor"],
      ]
        .filter(([key]) => mapping[key]?.enabled !== false)
        .map(([, ioa, name, measurement]) => stationPoint(ioa, name, stationId, measurement));

      return {
        points: [
          stationPoint(1, "p_out_kw", stationId, "active_power_kw"),
          stationPoint(2, "pinv_out_kw", stationId, "inverter_total_active_power_kw"),
          stationPoint(3, "ainv_d_minus_1_kwh", stationId, "inverter_total_yesterday_energy_kwh"),
          ...optionalPoints,
          ...inverterDevices.flatMap((device, index) => clientInverterPoints(device, index, mapping.inverterPoints)),
        ],
        controls: [
          {
            ioa: 11,
            name: "enable_p_out_control",
            type: "single",
            station: stationId,
            actionOn: "clear_power_limit",
            selectBeforeExecute: true,
          },
          {
            ioa: 12,
            name: "setpoint_p_out_percent",
            type: "setpoint",
            station: stationId,
            action: "limit_power",
            valueField: "percent",
            durationSeconds: 86400,
            selectBeforeExecute: true,
          },
          {
            ioa: 13,
            name: "setpoint_p_out_kw",
            type: "setpoint",
            station: stationId,
            action: "limit_power",
            valueField: "kw",
            durationSeconds: 86400,
            selectBeforeExecute: true,
          },
        ],
      };
    }

    function stationPoint(ioa, name, stationId, measurement) {
      return {
        ioa,
        name,
        source: "station",
        station: stationId,
        measurement,
        type: "float",
      };
    }

    function clientInverterPoints(device, index, inverterMapping = {}) {
      const firstIoa = 13 + (index * 2);
      const inverterNumber = index + 1;
      const override = inverterMapping.overrides?.[device.name] || {};
      const powerMeasurement = override.powerRegister || inverterMapping.powerRegister || clientMeasurementName(device, ["active_power_kw", "active_power_total_kw", "ac_power_kw", "output_power_kw", "inverter_active_power_kw"]);

      return [
        {
          ioa: firstIoa,
          name: "inverter_" + inverterNumber + "_active_power_kw",
          source: "device",
          device: device.name || "",
          measurement: powerMeasurement,
          type: "float",
          ...(Number.isFinite(Number(inverterMapping.powerScale)) ? { scale: Number(inverterMapping.powerScale) } : {}),
        },
        {
          ioa: firstIoa + 1,
          name: "inverter_" + inverterNumber + "_yesterday_energy_kwh",
          source: "device",
          device: device.name || "",
          measurement: "evn_yesterday_energy_kwh",
          type: "float",
        },
      ];
    }

    function selectedEvnStation() {
      const stationId = el("iec104EvnStation")?.value || state.iec104?.evnMapping?.stationId || state.stations?.[0]?.id || "";
      return (state.stations || []).find((item) => item.id === stationId) || null;
    }

    function mergedClientEvnMapping(station, current = {}) {
      const defaults = defaultClientEvnMapping(station);
      const merged = {
        ...defaults,
        ...current,
        stationId: current?.stationId || station?.id || defaults.stationId || "",
      };

      for (const key of ["pOut", "pinvOut", "ainvD1", "qOut", "ua", "ub", "uc", "ia", "ib", "ic", "frequency", "powerFactor"]) {
        merged[key] = {
          ...(defaults[key] || {}),
          ...(current?.[key] || {}),
        };
      }

      merged.inverterPoints = {
        ...defaults.inverterPoints,
        ...(current?.inverterPoints || {}),
      };

      return merged;
    }

    function defaultClientEvnMapping(station) {
      const stationDevices = devicesForStationConfig(station);
      const meterDevice = stationDevices.find(isClientMeterDevice) || stationDevices.find((device) => !isClientInverterDevice(device)) || {};
      const inverterDevices = stationDevices.filter(isClientInverterDevice);
      const inverterNames = inverterDevices.map((device) => device.name).filter(Boolean);
      const firstInverter = inverterDevices[0] || {};

      return {
        stationId: station?.id || "",
        pOut: { enabled: true, source: "meter", device: meterDevice.name || "", register: clientMeasurementName(meterDevice, ["active_power_kw", "meter_active_power_kw", "grid_export_power_kw", "export_power_kw", "p_out_kw"]), scale: 1 },
        pinvOut: { enabled: true, source: "inverter_total", devices: inverterNames, register: clientMeasurementName(firstInverter, ["active_power_kw", "active_power_total_kw", "ac_power_kw", "output_power_kw", "inverter_active_power_kw"]), scale: 1 },
        ainvD1: { enabled: true, source: "snapshot", devices: inverterNames, register: clientMeasurementName(firstInverter, ["daily_energy_yield_kwh", "daily_energy_kwh", "energy_today_kwh", "yield_today_kwh", "inverter_daily_energy_kwh"]), snapshotStrategy: "daily_register_eod", scale: 1 },
        qOut: { enabled: true, source: "inverter_total", devices: inverterNames, register: clientMeasurementName(firstInverter, ["reactive_power_kvar", "reactive_power_total_kvar", "q_out_kvar", "reactive_power_var"]), scale: 1 },
        ua: { enabled: true, source: "meter", device: meterDevice.name || "", register: clientMeasurementName(meterDevice, ["phase_a_voltage_v", "ua_v", "voltage_l1_v"]), scale: 1 },
        ub: { enabled: true, source: "meter", device: meterDevice.name || "", register: clientMeasurementName(meterDevice, ["phase_b_voltage_v", "ub_v", "voltage_l2_v"]), scale: 1 },
        uc: { enabled: true, source: "meter", device: meterDevice.name || "", register: clientMeasurementName(meterDevice, ["phase_c_voltage_v", "uc_v", "voltage_l3_v"]), scale: 1 },
        ia: { enabled: true, source: "meter", device: meterDevice.name || "", register: clientMeasurementName(meterDevice, ["phase_a_current_a", "ia_a", "current_l1_a"]), scale: 1 },
        ib: { enabled: true, source: "meter", device: meterDevice.name || "", register: clientMeasurementName(meterDevice, ["phase_b_current_a", "ib_a", "current_l2_a"]), scale: 1 },
        ic: { enabled: true, source: "meter", device: meterDevice.name || "", register: clientMeasurementName(meterDevice, ["phase_c_current_a", "ic_a", "current_l3_a"]), scale: 1 },
        frequency: { enabled: true, source: "meter", device: meterDevice.name || "", register: clientMeasurementName(meterDevice, ["grid_frequency_hz", "frequency_hz", "freq_hz"]), scale: 1 },
        powerFactor: { enabled: true, source: "meter", device: meterDevice.name || "", register: clientMeasurementName(meterDevice, ["power_factor", "pf", "total_power_factor"]), scale: 1 },
        inverterPoints: {
          enabled: true,
          devices: inverterNames,
          powerRegister: clientMeasurementName(firstInverter, ["active_power_kw", "active_power_total_kw", "ac_power_kw", "output_power_kw", "inverter_active_power_kw"]),
          energyRegister: clientMeasurementName(firstInverter, ["daily_energy_yield_kwh", "daily_energy_kwh", "energy_today_kwh", "yield_today_kwh", "inverter_daily_energy_kwh"]),
          snapshotStrategy: "daily_register_eod",
          powerScale: 1,
          energyScale: 1,
        },
      };
    }

    function evnDevicesForRow(row, station) {
      const devices = devicesForStationConfig(station);
      if (row.kind === "inverter") return devices.filter(isClientInverterDevice);
      if (row.kind === "meter") return devices.filter(isClientMeterDevice);
      return devices;
    }

    function selectedEvnDevices(row, signal, station) {
      const devices = evnDevicesForRow(row, station);
      if (row.mode === "single") {
        const selected = signal.device || devices[0]?.name || "";
        return devices.filter((device) => device.name === selected);
      }

      const selected = new Set(signal.devices || devices.map((device) => device.name).filter(Boolean));
      return devices.filter((device) => selected.has(device.name));
    }

    function evnRegisterOptions(devices, selected, options = {}) {
      const names = new Set();
      for (const device of devices || []) {
        for (const register of device.registers || []) {
          if (register.name) names.add(register.name);
        }
      }
      if (selected) names.add(selected);
      if (!names.size) names.add("");

      const entries = options.blankLabel ? [option("", selected || "", options.blankLabel)] : [];
      if (options.blankLabel) names.delete("");
      return entries.concat([...names].map((name) => option(name, selected || "", name || "Chưa có register"))).join("");
    }

    function selectedDevicesByName(names = []) {
      const selected = new Set(names || []);
      return (state.devices || []).filter((device) => device.name && selected.has(device.name));
    }

    function evnSourceLabel(source) {
      return {
        meter: "Meter",
        device: "Device",
        inverter_total: "Tổng inverter",
        snapshot: "Snapshot cuối ngày",
      }[source] || source || "-";
    }

    function devicesForStationConfig(station) {
      const selected = new Set(Array.isArray(station?.devices) ? station.devices : []);
      return (state.devices || []).filter((device) => (
        device.name && (selected.has(device.name) || device.stationId === station?.id)
      ));
    }

    function isClientInverterDevice(device) {
      const text = [device.name, device.category, device.type, device.manufacturer, device.model, device.templateId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !isClientMeterDevice(device) && (
        text.includes("inverter")
        || text.includes("sun2000")
        || text.includes("huawei")
        || text.includes("sungrow")
        || text.includes("goodwe")
        || text.includes("sma")
      );
    }

    function isClientMeterDevice(device) {
      const text = [device.name, device.category, device.type, device.manufacturer, device.model, device.templateId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes("meter")
        || text.includes("dtsu")
        || text.includes("smart meter")
        || text.includes("power meter")
        || text.includes("sdm")
        || text.includes("powerlogic")
        || text.includes("acrel")
        || text.includes("pm5")
        || text.includes("pm2");
    }

    function clientMeasurementName(device, preferredNames) {
      const registers = device.registers || [];
      const registerNames = registers.map((register) => register.name).filter(Boolean);
      for (const name of preferredNames) {
        if (registerNames.includes(name)) return name;
      }

      return preferredNames[0];
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

    function collectStations() {
      return [...document.querySelectorAll("[data-station-row]")].map((row, index) => {
        const value = (field) => row.querySelector("[data-field='" + field + "']")?.value?.trim?.() || "";
        const checked = (field) => Boolean(row.querySelector("[data-field='" + field + "']")?.checked);
        const selectedDevices = [...row.querySelectorAll("[data-field='devices'] option:checked")]
          .map((optionEl) => optionEl.value)
          .filter(Boolean);
        const id = value("id") || "station_" + (index + 1);
        const capacityKw = Number(value("capacityKw"));
        const station = {
          id,
          name: value("name") || id,
          devices: [...new Set(selectedDevices)],
        };

        if (Number.isFinite(capacityKw) && capacityKw > 0) {
          station.capacityKw = capacityKw;
        }

        if (checked("evnEnabled")) {
          station.evnProfile = {
            enabled: true,
            autoGenerateIoa: true,
          };
        }

        return station;
      }).filter((station) => station.id || station.name || station.devices.length);
    }

    function syncStationDeviceMembership() {
      const stations = state.stations || [];
      const devices = state.devices || [];
      const stationIds = new Set(stations.map((station) => station.id).filter(Boolean));
      const deviceNames = new Set(devices.map((device) => device.name).filter(Boolean));
      const stationById = new Map(stations.map((station) => [station.id, station]));
      const assignments = new Map();

      for (const station of stations) {
        station.devices = [...new Set((station.devices || []).filter((name) => deviceNames.has(name)))];
        for (const deviceName of station.devices) {
          assignments.set(deviceName, station.id);
        }
      }

      for (const device of devices) {
        if (!device.name) continue;

        if (assignments.has(device.name)) {
          device.stationId = assignments.get(device.name);
          continue;
        }

        if (device.stationId && stationIds.has(device.stationId)) {
          const station = stationById.get(device.stationId);
          station.devices = [...new Set([...(station.devices || []), device.name])];
          assignments.set(device.name, device.stationId);
          continue;
        }

        delete device.stationId;
      }

      for (const station of stations) {
        station.devices = [...new Set((station.devices || []).filter((name) => {
          const device = devices.find((item) => item.name === name);
          return device && device.stationId === station.id;
        }))];
      }
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
      state.iec104 = {
        ...(state.iec104 || {}),
        enabled: el("iec104Enabled").checked,
        mode: "server",
        host: el("iec104Host").value.trim() || "0.0.0.0",
        port: numberValue("iec104Port"),
        remoteHost: "",
        remotePort: 2404,
        localAddress: "",
        localPort: 0,
        commonAddress: numberValue("iec104CommonAddress"),
        originatorAddress: numberValue("iec104OriginatorAddress"),
        staleAfterMs: numberValue("iec104StaleAfterMs"),
        maxClientConnections: numberValue("iec104MaxClientConnections"),
        reconnectMs: 5000,
        keepAliveMs: numberValue("iec104KeepAliveMs"),
        periodicMs: numberValue("iec104PeriodicMs"),
        spontaneous: true,
        evnMapping: collectEvnMapping(),
        points: collectIec104Points(),
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

      state.stations = collectStations();
      syncStationDeviceMembership();

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
      setText("topConfigVersion", selectedConfigVersion || "-");
      el("rawYaml").value = stringifyConfig(state);
      setStatus("Config version " + payload.version + " created", "ok");
      await loadGateways();
    }

    async function restartGateway() {
      if (!selectedId) return;
      await saveConfig();
      setStatus("Đã gửi yêu cầu khởi động lại gateway", "ok");
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

    function addStation() {
      collectConfig();
      state.stations = state.stations || [];
      let index = state.stations.length + 1;
      let id = "station_" + index;
      while (state.stations.some((station) => station.id === id)) {
        index += 1;
        id = "station_" + index;
      }
      state.stations.push({
        id,
        name: "Trạm " + index,
        devices: [],
      });
      renderStations();
      setStatus("Đã thêm trạm", "ok");
    }

    function removeStation(index) {
      collectConfig();
      state.stations = state.stations || [];
      state.stations.splice(Number(index), 1);
      renderStations();
      setStatus("Đã xóa trạm", "ok");
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
        setStatus("Chọn mẫu trước khi áp dụng", "error");
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
      setStatus("Đã xóa mẫu", "ok");
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

    async function syncTemplateLibrary() {
      setStatus("Đang đồng bộ thư viện mẫu từ server...");
      const payload = await requestJson("/api/device-templates");
      templates = payload.templates || [];
      expandedTemplateRegisters.clear();
      renderTemplatePicker();
      renderTemplateLibrary();
      setStatus("Đã đồng bộ " + templates.length + " mẫu từ server", "ok");
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
      const controls = cloneControls(template.controls ?? existing.controls);
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
        ...(controls ? { controls } : {}),
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

    function cloneControls(controls) {
      if (!controls || typeof controls !== "object" || Array.isArray(controls)) return null;
      return JSON.parse(JSON.stringify(controls));
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

      const label = pageLabels[activeSubtab || activeTab] || pageLabels.stationDeviceOverviewSubtab;
      el("activePageTitle").textContent = label[0];
      el("activePageSubtitle").textContent = label[1];

      const nextHash = activeSubtab || activeTab;
      if (updateHash && location.hash !== "#" + nextHash) history.replaceState(null, "", "#" + nextHash);
    }

    function mountStandaloneIec104Tab() {
      const tabPanel = el("iec104Tab");
      const iec104Panel = el("iec104Subtab");

      if (tabPanel && iec104Panel && iec104Panel.parentElement !== tabPanel) {
        tabPanel.appendChild(iec104Panel);
      }
    }

    function showHomePage(panelId) {
      const nextPanelId = homePageLabels[panelId] ? panelId : "homeOverviewPanel";
      document.querySelectorAll("[data-home-panel]").forEach((panel) => {
        panel.classList.toggle("active", panel.id === nextPanelId);
      });
      document.querySelectorAll("[data-home-target]").forEach((target) => {
        target.classList.toggle("active", target.dataset.homeTarget === nextPanelId);
      });
      const label = homePageLabels[nextPanelId] || homePageLabels.homeOverviewPanel;
      el("homePageTitle").textContent = label[0];
      el("homePageSubtitle").textContent = label[1];
      renderHomeModules();
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
          type: device.type || "",
          category: device.category || "",
          manufacturer: device.manufacturer || "",
          model: device.model || "",
          templateId: device.templateId || "",
          stationId: device.stationId || "",
          protocol: device.protocol || "",
          port: device.port || "",
          host: device.host || "",
          tcpPort: device.tcpPort ?? device.tcp_port ?? null,
          unitId: device.unitId ?? device.unit_id ?? null,
          slaveId: device.slaveId ?? device.slave_id ?? null,
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

    function networkModeLabel() {
      const parts = [];
      if (state.iec104?.enabled) parts.push("IEC104");
      parts.push("HTTP");
      if (state.mongo?.enabled) parts.push("Mongo");
      return parts.join(" + ");
    }

    function setHealth(id, label, className = "") {
      const node = el(id);
      node.textContent = label;
      node.className = className;
    }

    function firstTelemetryMetric(names, { prefer = "" } = {}) {
      return firstMetricFromReadings(telemetry.devices || [], names, { prefer });
    }

    function aggregateTelemetryMetric(names, { prefer = "", unit = "" } = {}) {
      return aggregateMetricFromReadings(telemetry.devices || [], names, { prefer, unit });
    }

    function firstMetricFromReadings(sourceReadings, names, { prefer = "" } = {}) {
      const preferredReadings = (sourceReadings || []).filter((reading) => metricDeviceMatches(reading, prefer));
      const readings = preferredReadings.length ? preferredReadings : sourceReadings || [];

      for (const reading of readings) {
        const metric = measurementFromReading(reading, names);
        if (metric) return metric;
      }

      return null;
    }

    function aggregateMetricFromReadings(sourceReadings, names, { prefer = "", unit = "" } = {}) {
      const preferredReadings = (sourceReadings || []).filter((reading) => metricDeviceMatches(reading, prefer));
      const readings = preferredReadings.length ? preferredReadings : sourceReadings || [];
      let total = 0;
      let count = 0;

      for (const reading of readings) {
        const metric = measurementFromReading(reading, names);
        const normalized = normalizeMetricValue(metric, unit);
        if (Number.isFinite(normalized?.value)) {
          total += normalized.value;
          count += 1;
        }
      }

      return count ? { value: total, unit } : null;
    }

    function metricDeviceMatches(reading, prefer) {
      if (!prefer) return true;
      const device = (state?.devices || []).find((item) => item.name === reading?.name) || {};
      const identity = [
        reading?.name,
        reading?.type,
        reading?.category,
        reading?.manufacturer,
        reading?.model,
        reading?.templateId,
        device.name,
        device.type,
        device.category,
        device.manufacturer,
        device.model,
        device.templateId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (prefer === "inverter") {
        return identity.includes("inverter") || identity.includes("sun2000") || identity.includes("sungrow") || identity.includes("goodwe") || identity.includes("sma") || identity.includes("growatt");
      }
      if (prefer === "meter") {
        return identity.includes("meter") || identity.includes("dtsu") || identity.includes("powerlogic") || identity.includes("pm5") || identity.includes("sdm") || identity.includes("acrel");
      }
      return true;
    }

    function measurementFromReading(reading, names) {
      const measurements = reading?.measurements || {};
      const units = reading?.units || {};

      for (const name of names) {
        if (Object.prototype.hasOwnProperty.call(measurements, name)) {
          return { name, value: measurements[name], unit: units[name] || inferredUnit(name) };
        }
      }

      for (const [name, value] of Object.entries(measurements)) {
        if (names.some((expected) => normalizedName(name) === normalizedName(expected))) {
          return { name, value, unit: units[name] || inferredUnit(name) };
        }
      }

      return null;
    }

    function normalizedName(value) {
      return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    function inferredUnit(name) {
      const key = String(name || "").toLowerCase();
      if (key.includes("power_factor") || key === "pf" || key.includes("factor")) return "";
      if (key.includes("frequency") || key.includes("freq")) return "Hz";
      if (key.includes("voltage") || key.endsWith("_v") || key.includes("ua_") || key.includes("ub_") || key.includes("uc_")) return "V";
      if (key.includes("current") || key.endsWith("_a")) return "A";
      if (key.includes("energy") || key.includes("yield") || key.includes("kwh")) return "kWh";
      if (key.includes("reactive") || key.includes("q_out")) return key.includes("_var") ? "var" : "kVAr";
      if (key.includes("power") || key.includes("p_out")) return key.includes("_w") ? "W" : "kW";
      return "";
    }

    function normalizeMetricValue(metric, preferredUnit = "") {
      if (!metric) return null;
      const value = Number(metric.value);
      if (!Number.isFinite(value)) return { value: metric.value, unit: metric.unit || preferredUnit || "" };

      let unit = metric.unit || preferredUnit || "";
      const unitKey = unit.toLowerCase();
      if (preferredUnit === "kW" && unitKey === "w") return { value: value / 1000, unit: "kW" };
      if (preferredUnit === "kVAr" && (unitKey === "var" || unitKey === "vAr".toLowerCase())) return { value: value / 1000, unit: "kVAr" };
      if (preferredUnit === "kWh" && unitKey === "wh") return { value: value / 1000, unit: "kWh" };
      return { value, unit: preferredUnit || unit };
    }

    function formatMetricValue(metric, preferredUnit = "") {
      const normalized = normalizeMetricValue(metric, preferredUnit);
      if (!normalized) return "-";
      if (typeof normalized.value === "number" && Number.isFinite(normalized.value)) {
        return formatCompactNumber(normalized.value) + (normalized.unit ? " " + normalized.unit : "");
      }
      return escapeHtml(normalized.value) + (normalized.unit ? " " + normalized.unit : "");
    }

    function formatCompactNumber(value) {
      if (!Number.isFinite(value)) return "-";
      const abs = Math.abs(value);
      if (abs >= 1000) return value.toFixed(1).replace(/\.0$/, "");
      if (abs >= 100) return value.toFixed(1).replace(/\.0$/, "");
      if (abs >= 10) return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
      return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
    }

    function formatPowerKw(value) {
      if (!Number.isFinite(value)) return "-";
      if (Math.abs(value) >= 1000) return formatCompactNumber(value / 1000) + " MW";
      return formatCompactNumber(value) + " kW";
    }

    function formatEnergyKwh(value) {
      if (!Number.isFinite(value)) return "-";
      if (Math.abs(value) >= 1000) return formatCompactNumber(value / 1000) + " MWh";
      return formatCompactNumber(value) + " kWh";
    }

    function formatBytes(bytes) {
      const value = Number(bytes);
      if (!Number.isFinite(value) || value <= 0) return "-";
      const units = ["B", "KB", "MB", "GB", "TB"];
      let size = value;
      let index = 0;
      while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index += 1;
      }
      return formatCompactNumber(size) + " " + units[index];
    }

    function formatMs(ms) {
      const value = Number(ms);
      if (!Number.isFinite(value)) return "-";
      if (value < 1000) return value + " ms";
      return formatCompactNumber(value / 1000) + "s";
    }

    function statusFromKind(kind) {
      const labels = {
        good: "Tốt",
        warning: "Cảnh báo",
        bad: "Lỗi",
        loss: "Mất liên lạc",
      };
      const classNames = {
        good: "online",
        warning: "warning",
        bad: "error",
        loss: "waiting",
      };
      const normalized = Object.prototype.hasOwnProperty.call(labels, kind) ? kind : "loss";
      return {
        kind: normalized,
        label: labels[normalized],
        className: classNames[normalized],
        badgeClass: normalized,
      };
    }

    function runtimeStatus(reading, device = {}) {
      if (reading?.status === "online") {
        if (isReadingStale(reading, device)) return statusFromKind("loss");
        if (!hasReadableMeasurements(reading)) return statusFromKind("warning");
        return statusFromKind("good");
      }
      if (reading?.status === "error") return statusFromKind("bad");
      return statusFromKind("loss");
    }

    function isReadingStale(reading, device = {}) {
      const rawTime = reading?.collectedAt || reading?.updatedAt || reading?.lastSeenAt;
      const timestamp = Date.parse(rawTime || "");
      if (!Number.isFinite(timestamp)) return false;
      const pollMs = Number(device.pollIntervalMs) || 5000;
      const staleAfterMs = Math.max(pollMs * 3, 15000);
      return Date.now() - timestamp > staleAfterMs;
    }

    function hasReadableMeasurements(reading) {
      return Object.keys(reading?.measurements || {}).length > 0;
    }

    function deviceSubtitle(device) {
      const makeModel = [device.manufacturer, device.model].filter(Boolean).join(" - ");
      const identity = makeModel || device.type || "modbus";
      if (device.protocol === "modbus-tcp") {
        return identity + " | TCP " + (device.host || "-") + " | unit " + (device.unitId || device.slaveId || 3);
      }
      return identity + " | RTU cổng " + (device.port || "-") + " | slave " + (device.slaveId || 1);
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
        event.preventDefault();
        openRemote(target.dataset.remoteGateway).catch((error) => setStatus(error.message, "error"));
        return;
      }
      if (target.dataset.deleteGateway) {
        event.preventDefault();
        deleteGateway(target.dataset.deleteGateway).catch((error) => setStatus(error.message, "error"));
        return;
      }
      if (target.dataset.homeTarget) {
        event.preventDefault();
        showHomePage(target.dataset.homeTarget);
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
      if (target.id === "refreshTelemetryBtn" && selectedId) refreshRemoteTelemetry().catch((error) => setStatus(error.message, "error"));
      if (target.id === "refreshRuntimeBtn" && selectedId) refreshRemoteRuntime().catch((error) => setStatus(error.message, "error"));
      if (target.id === "remoteRefreshBtn" && selectedId) refreshRemoteRuntime().catch((error) => setStatus(error.message, "error"));
      if (target.id === "remoteDisconnectBtn") {
        backHome();
        return;
      }
      if (target.id === "homeLogoutBtn") logout().catch((error) => console.error(error));
      if (target.id === "addManualGatewayBtn" || target.id === "addManualGatewayBtn2") el("manualGatewayPanel").classList.toggle("hidden");
      if (target.id === "homeTelemetryRefreshBtn") loadHomeTelemetry().catch((error) => console.error(error));
      if (target.id === "homeConfigRefreshBtn") loadHomeDetails().catch((error) => console.error(error));
      if (target.id === "refreshTemplatesHomeBtn") loadGateways().catch((error) => console.error(error));
      if (target.dataset.saveConfig !== undefined) saveConfig().catch((error) => setStatus(error.message, "error"));
      if (target.dataset.restartGateway !== undefined) restartGateway().catch((error) => setStatus(error.message, "error"));
      if (target.dataset.controlAction) {
        const action = target.dataset.controlAction;
        if (["stop", "reboot"].includes(action) && !confirm("Queue " + actionLabel(action) + " for " + (el("controlDeviceName").value || "selected inverter") + "?")) return;
        queueInverterControl(action).catch((error) => setStatus(error.message, "error"));
      }
      if (target.dataset.cancelCommand) {
        cancelCommand(target.dataset.cancelCommand).catch((error) => setStatus(error.message, "error"));
      }
      if (target.id === "addStationBtn") addStation();
      if (target.id === "addPortBtn") addPort();
      if (target.id === "addDeviceBtn") addDevice();
      if (target.id === "applyEvnIec104DefaultsBtn") applyEvnIec104Defaults();
      if (target.id === "generateEvnIec104Btn") generateEvnIec104Mapping();
      if (target.id === "addTemplateBtn") addTemplate();
      if (target.id === "saveTemplatesBtn") saveTemplateLibrary().catch((error) => setStatus(error.message, "error"));
      if (target.id === "syncTemplatesBtn") syncTemplateLibrary().catch((error) => setStatus(error.message, "error"));
      if (target.dataset.applyTemplate) applyTemplate(Number(target.dataset.applyTemplate));
      if (target.dataset.removeStation) removeStation(Number(target.dataset.removeStation));
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
      if (target?.id === "adminLanguageSelect") {
        currentLanguage = target.value === "en" ? "en" : "vi";
        localStorage.setItem("adminLanguage", currentLanguage);
        localStorage.setItem("loginLanguage", currentLanguage);
        applyAdminLanguage();
        return;
      }
      if (target?.id === "controlDeviceName") {
        selectedControlDevice = target.value;
        return;
      }
      if (target?.id === "controlScheduleMode") {
        updateControlScheduleFields();
        return;
      }
      if (target?.id === "powerLimitMode") {
        updatePowerLimitValueConstraints();
        return;
      }
      if (["controlScheduleAt", "controlScheduleUntil", "controlScheduleTime", "controlScheduleEndTime", "controlScheduleMaxRuns", "controlScheduleEndAt"].includes(target?.id)
        || target?.matches?.("[data-schedule-weekday]")) {
        updateControlScheduleSummary();
        return;
      }
      if (target?.id === "iec104EvnStation") {
        state.iec104 = {
          ...(state.iec104 || {}),
          evnMapping: mergedClientEvnMapping(selectedEvnStation(), { stationId: target.value }),
        };
        renderEvnSourceMappings();
        return;
      }
      if (target?.matches?.("[data-evn-source-row] [data-evn-field]")) {
        state.iec104 = {
          ...(state.iec104 || {}),
          evnMapping: collectEvnMapping(),
        };
        renderEvnSourceMappings();
        return;
      }
      if (target?.matches?.("[data-iec104-point-row] [data-field='source'], [data-iec104-point-row] [data-field='device'], [data-iec104-point-row] [data-field='station']")) {
        collectConfig();
        renderIec104();
        return;
      }
      if (!target?.matches?.("[data-device][data-field='protocol']")) return;
      const deviceCard = target.closest(".device");
      if (deviceCard) deviceCard.dataset.protocolMode = target.value || "modbus-rtu";
    });

    document.addEventListener("input", (event) => {
      if (["powerLimitDurationMinutes", "controlScheduleAt", "controlScheduleUntil", "controlScheduleTime", "controlScheduleEndTime", "controlScheduleMaxRuns", "controlScheduleEndAt"].includes(event.target?.id)) {
        updateControlScheduleSummary();
      }
      if (event.target?.id === "powerLimitValue") {
        updatePowerLimitValueConstraints();
      }
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
      updatePowerLimitValueConstraints();
      submitPowerLimitForm();
    });
    mountStandaloneIec104Tab();
    updatePowerLimitValueConstraints();

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
