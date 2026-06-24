export function renderLoginPage() {
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Electric Bird Hardware Server</title>
  <style>
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; background: #eef3f7; }
    .login-screen { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .login-card { width: min(420px, 100%); background: #fff; border: 1px solid #d7e1ec; border-radius: 8px; box-shadow: 0 22px 60px rgba(20, 32, 48, .14); padding: 28px; }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .brand img { width: 44px; height: 44px; object-fit: contain; border-radius: 8px; border: 1px solid #f2c399; background: #fff8ef; }
    .brand strong { display: block; font-size: 22px; }
    .brand span { color: #607089; font-weight: 650; }
    label { display: grid; gap: 8px; margin: 14px 0; color: #46566d; font-weight: 750; }
    input { width: 100%; box-sizing: border-box; border: 1px solid #ccd8e6; border-radius: 7px; padding: 12px 14px; font: inherit; color: #172033; }
    button { width: 100%; border: 0; border-radius: 7px; padding: 13px 16px; background: #f97316; color: #fff; font: inherit; font-weight: 850; cursor: pointer; }
    .error { min-height: 22px; margin-top: 12px; color: #b42318; font-weight: 750; }
  </style>
</head>
<body class="login-screen server-login">
  <main class="login-card">
    <div class="brand">
      <img src="/logo/logo-login-mark.png" alt="">
      <div>
        <strong>Electric Bird</strong>
        <span>Hardware Server</span>
      </div>
    </div>
    <form id="loginForm">
      <label>Tài khoản <input name="username" autocomplete="username" required autofocus></label>
      <label>Mật khẩu <input name="password" type="password" autocomplete="current-password" required></label>
      <button type="submit">Đăng nhập</button>
      <div id="loginError" class="error" role="alert"></div>
    </form>
  </main>
  <script>
    document.getElementById("loginForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const error = document.getElementById("loginError");
      error.textContent = "";
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      if (response.ok) {
        location.assign("/");
        return;
      }
      error.textContent = "Sai tài khoản hoặc mật khẩu";
    });
  </script>
</body>
</html>`;
}

export function renderDashboardPage({ publicUrl }) {
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Electric Bird Hardware Server</title>
  <style>
    :root { color-scheme: light; --ink: #172033; --muted: #607089; --line: #d7e1ec; --panel: #fff; --wash: #eef3f7; --accent: #f97316; --good: #16a34a; --warn: #b45309; --bad: #b42318; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ink); background: var(--wash); }
    .icon-sprite { position: absolute; width: 0; height: 0; overflow: hidden; }
    .app-icon { width: 20px; height: 20px; stroke: currentColor; stroke-width: 2.1; fill: none; stroke-linecap: round; stroke-linejoin: round; flex: 0 0 auto; }
    .app-shell { min-height: 100vh; display: grid; grid-template-columns: 270px minmax(0, 1fr); }
    .sidebar { background: #121b27; color: #e8eef5; padding: 24px 16px; border-right: 1px solid rgba(255,255,255,.08); }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
    .brand img { width: 48px; height: 48px; object-fit: contain; border-radius: 8px; border: 1px solid rgba(249,115,22,.45); background: #fff8ef; }
    .brand strong { display: block; font-size: 22px; }
    .brand span { color: #9fb1c7; font-weight: 700; }
    .nav-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 13px 14px; border: 1px solid rgba(249,115,22,.45); border-radius: 8px; background: rgba(249,115,22,.14); color: #fff; font-weight: 850; }
    .main { min-width: 0; }
    .topbar { min-height: 86px; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 18px 24px; background: var(--panel); border-bottom: 1px solid var(--line); }
    .topbar h1 { margin: 0; font-size: 28px; line-height: 1.1; }
    .topbar p { margin: 8px 0 0; color: var(--muted); font-size: 15px; font-weight: 650; }
    .top-actions, .actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    button { min-height: 42px; border: 1px solid var(--line); border-radius: 7px; background: #fff; color: #27364d; font: inherit; font-weight: 850; padding: 9px 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 9px; }
    button.primary { background: var(--accent); border-color: var(--accent); color: #fff; box-shadow: 0 14px 26px rgba(249,115,22,.2); }
    button.danger { color: var(--bad); border-color: #f2c7c3; }
    button:disabled { opacity: .45; cursor: not-allowed; }
    .content { padding: 24px; }
    .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 22px; box-shadow: 0 18px 44px rgba(20, 32, 48, .08); }
    .panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
    .panel-head h2 { margin: 0; font-size: 24px; }
    .panel-head p { margin: 8px 0 0; color: var(--muted); font-weight: 650; }
    .metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
    .metric { border: 1px solid var(--line); border-radius: 8px; padding: 14px; background: #fbfdff; }
    .metric span { display: block; color: var(--muted); font-size: 13px; font-weight: 800; }
    .metric strong { display: block; margin-top: 8px; font-size: 26px; }
    .gateway-grid { display: grid; gap: 14px; }
    .gateway-card { border: 1px solid var(--line); border-left: 5px solid #9aa8bb; border-radius: 8px; padding: 18px; background: #fff; }
    .gateway-card.online { border-left-color: var(--good); }
    .gateway-card.warning, .gateway-card.waiting { border-left-color: var(--warn); }
    .gateway-card.offline { border-left-color: #94a3b8; }
    .gateway-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
    .gateway-head strong { display: block; font-size: 21px; }
    .gateway-head p, .gateway-detail { color: var(--muted); margin: 6px 0 0; font-weight: 700; }
    .badge { display: inline-flex; align-items: center; min-height: 32px; border-radius: 999px; padding: 0 13px; font-weight: 850; border: 1px solid var(--line); background: #f8fafc; color: #475569; }
    .badge.online { color: #166534; background: #ecfdf3; border-color: #bbf7d0; }
    .badge.warning, .badge.waiting { color: #92400e; background: #fff7ed; border-color: #fed7aa; }
    .gateway-meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 16px 0; }
    .gateway-meta div { border: 1px solid var(--line); border-radius: 7px; padding: 12px; min-width: 0; }
    .gateway-meta span { display: block; color: var(--muted); font-size: 13px; font-weight: 800; margin-bottom: 8px; }
    .gateway-meta strong { display: block; overflow-wrap: anywhere; }
    .empty { border: 1px dashed #c9d6e5; border-radius: 8px; padding: 28px; text-align: center; color: var(--muted); font-weight: 750; }
    .form-panel { margin-bottom: 18px; }
    .form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    label { display: grid; gap: 7px; color: #475569; font-weight: 800; }
    input { width: 100%; border: 1px solid #ccd8e6; border-radius: 7px; padding: 10px 12px; font: inherit; color: var(--ink); }
    .check-row { display: flex; align-items: center; gap: 8px; padding-top: 28px; font-weight: 850; color: #27364d; }
    .check-row input { width: auto; }
    .status-line { min-height: 22px; margin-top: 12px; color: var(--muted); font-weight: 750; }
    .status-line.error { color: var(--bad); }
    .status-line.ok { color: var(--good); }
    .hidden { display: none !important; }
    @media (max-width: 900px) {
      .app-shell { grid-template-columns: 1fr; }
      .sidebar { display: none; }
      .topbar, .panel-head, .gateway-head { align-items: stretch; flex-direction: column; }
      .content { padding: 14px; }
      .metrics, .gateway-meta, .form-grid { grid-template-columns: 1fr; }
      .top-actions, .actions { width: 100%; }
      button { width: 100%; }
    }
  </style>
</head>
<body class="server-admin">
  <svg class="icon-sprite" aria-hidden="true">
    <symbol id="icon-home" viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path></symbol>
    <symbol id="icon-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></symbol>
    <symbol id="icon-refresh" viewBox="0 0 24 24"><path d="M20 11a8 8 0 0 0-14.7-4.4L3 9"></path><path d="M3 4v5h5"></path><path d="M4 13a8 8 0 0 0 14.7 4.4L21 15"></path><path d="M21 20v-5h-5"></path></symbol>
    <symbol id="icon-log-out" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5"></path><path d="M15 12H3"></path><path d="M21 19V5a2 2 0 0 0-2-2h-4"></path></symbol>
    <symbol id="icon-monitor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 16v4"></path></symbol>
    <symbol id="icon-trash" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"></path></symbol>
    <symbol id="icon-tailscale" viewBox="0 0 24 24"><path d="M12 3 5 6v5.5c0 4.3 2.8 7.6 7 9.5 4.2-1.9 7-5.2 7-9.5V6l-7-3Z"></path><path d="M9 12h6"></path><path d="M9.5 9.5h5"></path><path d="M9.5 14.5h5"></path><circle cx="8" cy="12" r="1"></circle><circle cx="16" cy="12" r="1"></circle></symbol>
  </svg>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <img src="/logo/logo-smallsize.png" alt="">
        <div>
          <strong>Electric Bird</strong>
          <span>Hardware Server</span>
        </div>
      </div>
      <div class="nav-item"><svg class="app-icon"><use href="#icon-home"></use></svg> Site</div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div>
          <h1>Site</h1>
          <p>Danh bạ gateway Tailscale. Remote sẽ mở UI thật trên IPC/Moxa qua server proxy.</p>
        </div>
        <div class="top-actions">
          <button id="syncBtn" type="button"><svg class="app-icon"><use href="#icon-tailscale"></use></svg> Sync Tailscale</button>
          <button id="refreshBtn" type="button" title="Làm mới" aria-label="Làm mới"><svg class="app-icon"><use href="#icon-refresh"></use></svg></button>
          <button id="logoutBtn" type="button" title="Đăng xuất" aria-label="Đăng xuất"><svg class="app-icon"><use href="#icon-log-out"></use></svg></button>
        </div>
      </header>
      <section class="content">
        <div class="panel">
          <div class="panel-head">
            <div>
              <h2>Gateway</h2>
              <p>Server chỉ lưu gateway và Tailscale IP/host. Cấu hình, telemetry và điều khiển nằm trên IPC.</p>
            </div>
            <button id="addGatewayBtn" type="button"><svg class="app-icon"><use href="#icon-plus"></use></svg> Gateway</button>
          </div>

          <section id="manualGatewayPanel" class="panel form-panel hidden">
            <form id="gatewayForm">
              <div class="form-grid">
                <label>Gateway ID <input name="id" autocomplete="off" required></label>
                <label>Tên <input name="name" autocomplete="off"></label>
                <label>Site <input name="site" autocomplete="off"></label>
                <label>Tailscale host <input name="tailscaleHost" autocomplete="off" placeholder="moxa.tailnet.ts.net"></label>
                <label>Tailscale IP <input name="tailscaleIp" autocomplete="off" placeholder="100.x.x.x"></label>
                <label>UI port <input name="tailscaleUiPort" type="number" min="1" max="65535" value="80"></label>
                <label>SSH port <input name="tailscaleSshPort" type="number" min="1" max="65535" value="22"></label>
                <label>Tag <input name="tailscaleTag" value="tag:gateway" autocomplete="off"></label>
                <label class="check-row"><input name="remoteAccessEnabled" type="checkbox" checked> Bật Tailscale</label>
              </div>
              <div class="actions" style="margin-top:14px">
                <button class="primary" type="submit">Lưu gateway</button>
              </div>
            </form>
          </section>

          <div class="metrics">
            <div class="metric"><span>Tổng gateway</span><strong id="metricTotal">0</strong></div>
            <div class="metric"><span>Online qua Tailscale</span><strong id="metricOnline">0</strong></div>
            <div class="metric"><span>Cần kiểm tra</span><strong id="metricWarning">0</strong></div>
          </div>
          <div id="gatewayGrid" class="gateway-grid"></div>
          <div id="statusLine" class="status-line"></div>
        </div>
      </section>
    </main>
  </div>
  <script>
    const publicUrl = ${JSON.stringify(publicUrl || "")};
    const state = {
      gateways: [],
      health: new Map(),
    };

    const el = (id) => document.getElementById(id);

    function setStatus(message, type = "") {
      const node = el("statusLine");
      node.textContent = message || "";
      node.className = "status-line " + type;
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

    async function loadGateways({ sync = false } = {}) {
      setStatus(sync ? "Đang đồng bộ Tailscale..." : "Đang tải gateway...");
      if (sync) await requestJson("/api/tailscale/sync", { method: "POST" });
      const payload = await requestJson("/api/gateways");
      state.gateways = payload.gateways || [];
      state.health = new Map();
      renderGateways();
      await loadHealth();
      setStatus("Đã cập nhật từ " + (publicUrl || location.origin), "ok");
    }

    async function loadHealth() {
      const targets = state.gateways.filter((gateway) => remoteAccessUiUrl(gateway));
      await Promise.allSettled(targets.map(async (gateway) => {
        try {
          const payload = await requestJson("/api/gateways/" + encodeURIComponent(gateway.id) + "/tailscale/health");
          state.health.set(gateway.id, { ok: true, payload });
        } catch (error) {
          state.health.set(gateway.id, { ok: false, error: error.message });
        }
      }));
      renderGateways();
    }

    function renderGateways() {
      const grid = el("gatewayGrid");
      const statuses = state.gateways.map(gatewayDisplayStatus);
      el("metricTotal").textContent = String(state.gateways.length);
      el("metricOnline").textContent = String(statuses.filter((status) => status.kind === "online").length);
      el("metricWarning").textContent = String(statuses.filter((status) => status.kind === "warning" || status.kind === "offline").length);

      if (!state.gateways.length) {
        grid.innerHTML = '<div class="empty"><strong>Chưa có site.</strong><br>Nhấn Sync Tailscale hoặc tạo gateway thủ công với Tailscale IP/host của IPC.</div>';
        return;
      }

      grid.innerHTML = state.gateways.map((gateway) => {
        const status = gatewayDisplayStatus(gateway);
        const canRemote = Boolean(remoteAccessUiUrl(gateway));
        return \`
          <article class="gateway-card \${escapeHtml(status.kind)}">
            <div class="gateway-head">
              <div>
                <strong>\${escapeHtml(gateway.site || gateway.name || gateway.id)}</strong>
                <p>\${escapeHtml(gateway.name || gateway.id)} | \${escapeHtml(gateway.id)}</p>
              </div>
              <span class="badge \${escapeHtml(status.kind)}" title="\${escapeHtml(status.title)}">\${escapeHtml(status.label)}</span>
            </div>
            <div class="gateway-meta">
              <div><span>Tailscale</span><strong>\${escapeHtml(remoteAccessLabel(gateway))}</strong></div>
              <div><span>Last seen</span><strong>\${escapeHtml(formatDateTime(gateway.lastSeenAt))}</strong></div>
              <div><span>Runtime</span><strong>\${escapeHtml(gateway.appVersion || "-")}</strong></div>
            </div>
            <div class="gateway-detail">\${escapeHtml(status.detail)}</div>
            <div class="actions" style="margin-top:14px">
              <button class="primary" type="button" data-remote-gateway="\${escapeHtml(gateway.id)}"\${canRemote ? "" : " disabled"}><svg class="app-icon"><use href="#icon-monitor"></use></svg> Remote</button>
              <button class="danger" type="button" data-delete-gateway="\${escapeHtml(gateway.id)}"><svg class="app-icon"><use href="#icon-trash"></use></svg></button>
            </div>
          </article>
        \`;
      }).join("");
    }

    function gatewayDisplayStatus(gateway) {
      const health = state.health.get(gateway.id);
      if (health?.ok) {
        return {
          kind: "online",
          label: "Online",
          detail: "Gateway reachable through server Tailscale proxy",
          title: "Reachable through Tailscale",
        };
      }
      if (health && !health.ok) {
        return {
          kind: "warning",
          label: "Warning",
          detail: health.error || "Cannot reach gateway through Tailscale",
          title: health.error || "Tailscale health check failed",
        };
      }
      if (remoteAccessUiUrl(gateway)) {
        return {
          kind: "waiting",
          label: "Checking",
          detail: "Waiting for Tailscale health check",
          title: "Health check pending",
        };
      }
      return {
        kind: gateway.status || "offline",
        label: "Offline",
        detail: "Missing Tailscale host/IP",
        title: "Remote access is not configured",
      };
    }

    function remoteAccessUiUrl(gateway) {
      const remote = gateway?.remoteAccess || {};
      if (!remote.enabled) return "";
      return remote.ip || remote.host ? "/gateways/" + encodeURIComponent(gateway.id) + "/remote/" : "";
    }

    function remoteAccessLabel(gateway) {
      const remote = gateway?.remoteAccess || {};
      if (!remote.enabled) return "Off";
      const endpoint = remote.ip || remote.host;
      if (!endpoint) return "Missing host/IP";
      return endpoint + ":" + (remote.uiPort || 80);
    }

    function openGatewayRemote(gatewayId) {
      const gateway = state.gateways.find((item) => item.id === gatewayId);
      const url = remoteAccessUiUrl(gateway);
      if (!url) {
        setStatus("Gateway chưa có Tailscale host/IP", "error");
        return;
      }
      window.open(url, "_blank", "noopener");
    }

    async function deleteGateway(gatewayId) {
      const gateway = state.gateways.find((item) => item.id === gatewayId) || { id: gatewayId };
      const label = gateway.site || gateway.name || gateway.id;
      if (!confirm("Xóa gateway " + label + " khỏi danh bạ server?")) return;
      await requestJson("/api/gateways/" + encodeURIComponent(gatewayId), { method: "DELETE" });
      state.gateways = state.gateways.filter((item) => item.id !== gatewayId);
      state.health.delete(gatewayId);
      renderGateways();
      setStatus("Đã xóa " + label, "ok");
    }

    function formatDateTime(value) {
      if (!value) return "-";
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return "-";
      return date.toLocaleString("vi-VN");
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    el("addGatewayBtn").addEventListener("click", () => {
      el("manualGatewayPanel").classList.toggle("hidden");
    });

    el("refreshBtn").addEventListener("click", () => {
      loadGateways().catch((error) => setStatus(error.message, "error"));
    });

    el("syncBtn").addEventListener("click", () => {
      loadGateways({ sync: true }).catch((error) => setStatus(error.message, "error"));
    });

    el("logoutBtn").addEventListener("click", async () => {
      await fetch("/api/logout", { method: "POST" });
      location.assign("/login");
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
          remoteAccess: {
            enabled: form.get("remoteAccessEnabled") === "on",
            method: "tailscale",
            host: String(form.get("tailscaleHost") || "").trim(),
            ip: String(form.get("tailscaleIp") || "").trim(),
            uiPort: Number(form.get("tailscaleUiPort") || 80),
            sshPort: Number(form.get("tailscaleSshPort") || 22),
            tag: String(form.get("tailscaleTag") || "tag:gateway").trim(),
          },
        }),
      });
      event.currentTarget.reset();
      el("manualGatewayPanel").classList.add("hidden");
      await loadGateways();
    });

    document.addEventListener("click", (event) => {
      const remoteButton = event.target.closest("[data-remote-gateway]");
      if (remoteButton) {
        openGatewayRemote(remoteButton.dataset.remoteGateway);
        return;
      }
      const deleteButton = event.target.closest("[data-delete-gateway]");
      if (deleteButton) {
        deleteGateway(deleteButton.dataset.deleteGateway).catch((error) => setStatus(error.message, "error"));
      }
    });

    loadGateways().catch((error) => setStatus(error.message, "error"));
  </script>
</body>
</html>`;
}
