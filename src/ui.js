export function renderLoginPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Electric Bird Hardware Server</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #172026;
      background: linear-gradient(135deg, #f5f7f8, #e7eef1 55%, #f4efe6);
    }
    main {
      width: min(420px, calc(100vw - 32px));
      padding: 28px;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid #d7e0e4;
      border-radius: 8px;
      box-shadow: 0 18px 45px rgba(23, 32, 38, 0.14);
    }
    h1 { margin: 0 0 6px; font-size: 22px; letter-spacing: 0; }
    p { margin: 0 0 22px; color: #60717b; }
    label { display: grid; gap: 7px; margin-top: 14px; font-size: 13px; font-weight: 650; color: #33434b; }
    input {
      width: 100%;
      height: 42px;
      border: 1px solid #c9d5da;
      border-radius: 6px;
      padding: 0 12px;
      font: inherit;
      color: #172026;
      background: #ffffff;
    }
    button {
      width: 100%;
      height: 42px;
      margin-top: 20px;
      border: 0;
      border-radius: 6px;
      background: #116466;
      color: #ffffff;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .error { min-height: 20px; margin-top: 12px; color: #b42318; font-size: 13px; }
  </style>
</head>
<body>
  <main>
    <h1>Hardware Server</h1>
    <p>Electric Bird gateway fleet management</p>
    <form id="loginForm">
      <label>Username<input name="username" autocomplete="username" required></label>
      <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
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
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #162026;
      background: #f4f7f8;
    }
    button, input, textarea { font: inherit; }
    .app {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
    }
    aside {
      border-right: 1px solid #d6e0e4;
      background: #ffffff;
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      min-height: 100vh;
    }
    .brand {
      padding: 18px 18px 14px;
      border-bottom: 1px solid #e3eaed;
    }
    .brand strong { display: block; font-size: 17px; }
    .brand span { display: block; margin-top: 4px; color: #697b84; font-size: 12px; overflow-wrap: anywhere; }
    .addBox {
      padding: 14px;
      border-bottom: 1px solid #e3eaed;
      display: grid;
      gap: 8px;
    }
    .addBox input {
      height: 34px;
      border: 1px solid #c9d5da;
      border-radius: 6px;
      padding: 0 9px;
      background: #ffffff;
    }
    .gatewayList {
      min-height: 0;
      overflow: auto;
      padding: 10px;
      display: grid;
      align-content: start;
      gap: 8px;
    }
    .gatewayItem {
      width: 100%;
      text-align: left;
      border: 1px solid #d6e0e4;
      border-radius: 8px;
      padding: 10px;
      background: #ffffff;
      cursor: pointer;
    }
    .gatewayItem.active { border-color: #116466; box-shadow: inset 3px 0 0 #116466; }
    .gatewayItem strong { display: block; font-size: 14px; overflow-wrap: anywhere; }
    .gatewayItem span { display: block; margin-top: 4px; color: #687a83; font-size: 12px; }
    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
      background: #9aa8ae;
    }
    .dot.online { background: #138a48; }
    main {
      min-width: 0;
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
    }
    header {
      min-height: 70px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 22px;
      border-bottom: 1px solid #d6e0e4;
      background: #ffffff;
    }
    header h1 { margin: 0; font-size: 20px; letter-spacing: 0; overflow-wrap: anywhere; }
    header p { margin: 4px 0 0; color: #657780; font-size: 13px; }
    .toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    button {
      height: 34px;
      border: 1px solid #bfccd2;
      border-radius: 6px;
      padding: 0 12px;
      color: #1f3037;
      background: #ffffff;
      cursor: pointer;
      font-weight: 650;
    }
    button.primary { border-color: #116466; background: #116466; color: #ffffff; }
    button.danger { border-color: #c2410c; color: #9a3412; }
    nav {
      display: flex;
      gap: 8px;
      padding: 10px 22px;
      border-bottom: 1px solid #d6e0e4;
      background: #edf3f5;
      overflow-x: auto;
    }
    nav button.active { background: #20343b; color: #ffffff; border-color: #20343b; }
    .content {
      min-height: 0;
      overflow: auto;
      padding: 18px 22px 28px;
      display: grid;
      gap: 16px;
      align-content: start;
    }
    .panel {
      background: #ffffff;
      border: 1px solid #d6e0e4;
      border-radius: 8px;
      padding: 16px;
    }
    .panel h2 { margin: 0 0 14px; font-size: 16px; letter-spacing: 0; }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(150px, 1fr));
      gap: 12px;
    }
    .metric {
      border: 1px solid #e0e7ea;
      border-radius: 8px;
      padding: 12px;
      background: #fbfcfc;
    }
    .metric span { display: block; color: #657780; font-size: 12px; }
    .metric strong { display: block; margin-top: 6px; font-size: 17px; overflow-wrap: anywhere; }
    .formGrid {
      display: grid;
      grid-template-columns: repeat(3, minmax(160px, 1fr));
      gap: 12px;
    }
    label { display: grid; gap: 6px; color: #43535b; font-size: 12px; font-weight: 700; }
    label input {
      height: 36px;
      border: 1px solid #c9d5da;
      border-radius: 6px;
      padding: 0 10px;
      color: #172026;
      background: #ffffff;
    }
    textarea {
      width: 100%;
      min-height: 520px;
      resize: vertical;
      border: 1px solid #c9d5da;
      border-radius: 8px;
      padding: 14px;
      font-family: "Cascadia Code", Consolas, monospace;
      font-size: 13px;
      line-height: 1.45;
      color: #14242b;
      background: #fbfcfc;
      tab-size: 2;
    }
    pre {
      margin: 0;
      overflow: auto;
      padding: 14px;
      border: 1px solid #dbe4e8;
      border-radius: 8px;
      background: #fbfcfc;
      font-family: "Cascadia Code", Consolas, monospace;
      font-size: 12px;
      line-height: 1.45;
    }
    .statusLine {
      min-height: 24px;
      padding: 0 22px;
      display: flex;
      align-items: center;
      color: #53666f;
      background: #ffffff;
      border-bottom: 1px solid #d6e0e4;
      font-size: 13px;
    }
    .ok { color: #137547; }
    .error { color: #b42318; }
    .hidden { display: none; }
    @media (max-width: 900px) {
      .app { grid-template-columns: 1fr; }
      aside { min-height: auto; border-right: 0; border-bottom: 1px solid #d6e0e4; }
      .gatewayList { max-height: 260px; }
      .grid, .formGrid { grid-template-columns: 1fr; }
      header { align-items: flex-start; flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside>
      <div class="brand">
        <strong>Hardware Server</strong>
        <span>${escapeHtml(publicUrl)}</span>
      </div>
      <form class="addBox" id="gatewayForm">
        <input name="id" placeholder="Gateway ID" required>
        <input name="name" placeholder="Name">
        <input name="site" placeholder="Site">
        <input name="token" placeholder="Gateway token" required>
        <button class="primary" type="submit">Save Gateway</button>
      </form>
      <div class="gatewayList" id="gatewayList"></div>
    </aside>
    <main>
      <header>
        <div>
          <h1 id="title">No gateway selected</h1>
          <p id="subtitle">Create or select a gateway to manage remote config.</p>
        </div>
        <div class="toolbar">
          <button id="refreshBtn" type="button">Refresh</button>
          <button id="logoutBtn" type="button">Logout</button>
        </div>
      </header>
      <nav>
        <button class="active" type="button" data-tab="overview">Dashboard</button>
        <button type="button" data-tab="config">Setting Communication</button>
        <button type="button" data-tab="telemetry">Telemetry</button>
      </nav>
      <div class="statusLine" id="status"></div>
      <section class="content" id="overviewTab">
        <div class="grid">
          <div class="metric"><span>Status</span><strong id="metricStatus">-</strong></div>
          <div class="metric"><span>Last seen</span><strong id="metricSeen">-</strong></div>
          <div class="metric"><span>Desired config</span><strong id="metricDesired">-</strong></div>
          <div class="metric"><span>Applied config</span><strong id="metricApplied">-</strong></div>
        </div>
        <div class="panel">
          <h2>Gateway Registry</h2>
          <form class="formGrid" id="selectedGatewayForm">
            <label>Gateway ID<input name="id" readonly></label>
            <label>Name<input name="name"></label>
            <label>Site<input name="site"></label>
            <label>New Token<input name="token" placeholder="Leave blank to keep current token"></label>
            <div class="toolbar"><button class="primary" type="submit">Save</button></div>
          </form>
        </div>
        <div class="panel">
          <h2>Last Config Status</h2>
          <pre id="statusDetails">-</pre>
        </div>
      </section>
      <section class="content hidden" id="configTab">
        <div class="panel">
          <h2>Remote Config JSON</h2>
          <textarea id="configEditor" spellcheck="false"></textarea>
          <div class="toolbar" style="margin-top: 12px;">
            <button class="primary" id="saveConfigBtn" type="button">Save New Version</button>
            <button id="loadDefaultConfigBtn" type="button">Load Default</button>
          </div>
        </div>
      </section>
      <section class="content hidden" id="telemetryTab">
        <div class="panel">
          <h2>Latest Telemetry</h2>
          <pre id="telemetryOutput">-</pre>
        </div>
      </section>
    </main>
  </div>
  <script>
    const publicUrl = ${JSON.stringify(publicUrl)};
    let gateways = [];
    let selectedId = "";
    let selectedConfig = null;

    const els = {
      gatewayList: document.getElementById("gatewayList"),
      gatewayForm: document.getElementById("gatewayForm"),
      selectedGatewayForm: document.getElementById("selectedGatewayForm"),
      title: document.getElementById("title"),
      subtitle: document.getElementById("subtitle"),
      status: document.getElementById("status"),
      metricStatus: document.getElementById("metricStatus"),
      metricSeen: document.getElementById("metricSeen"),
      metricDesired: document.getElementById("metricDesired"),
      metricApplied: document.getElementById("metricApplied"),
      statusDetails: document.getElementById("statusDetails"),
      configEditor: document.getElementById("configEditor"),
      telemetryOutput: document.getElementById("telemetryOutput")
    };

    function setStatus(message, type) {
      els.status.textContent = message || "";
      els.status.className = "statusLine " + (type || "");
    }

    async function requestJson(url, options) {
      const response = await fetch(url, options || {});
      if (response.status === 401) {
        location.href = "/login";
        return {};
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || "Request failed");
      }
      return payload;
    }

    async function loadGateways() {
      const payload = await requestJson("/api/gateways");
      gateways = payload.gateways || [];
      if (!selectedId && gateways.length > 0) selectedId = gateways[0].id;
      renderGateways();
      await loadSelected();
    }

    function renderGateways() {
      els.gatewayList.innerHTML = "";
      if (gateways.length === 0) {
        const empty = document.createElement("div");
        empty.className = "gatewayItem";
        empty.textContent = "No gateways";
        els.gatewayList.appendChild(empty);
        return;
      }

      for (const gateway of gateways) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gatewayItem" + (gateway.id === selectedId ? " active" : "");
        button.innerHTML =
          "<strong>" + escapeHtml(gateway.name || gateway.id) + "</strong>" +
          "<span><i class=\\"dot " + escapeHtml(gateway.status || "") + "\\"></i>" +
          escapeHtml(gateway.id) + "</span>";
        button.addEventListener("click", async () => {
          selectedId = gateway.id;
          renderGateways();
          await loadSelected();
        });
        els.gatewayList.appendChild(button);
      }
    }

    async function loadSelected() {
      const gateway = gateways.find((item) => item.id === selectedId);
      if (!gateway) {
        els.title.textContent = "No gateway selected";
        els.subtitle.textContent = "Create or select a gateway to manage remote config.";
        els.configEditor.value = "";
        return;
      }

      els.title.textContent = gateway.name || gateway.id;
      els.subtitle.textContent = (gateway.site || "No site") + " | " + gateway.id;
      els.metricStatus.textContent = gateway.status || "-";
      els.metricSeen.textContent = gateway.lastSeenAt || "-";
      els.metricDesired.textContent = gateway.desiredConfigVersion || gateway.latestConfigVersion || "-";
      els.metricApplied.textContent = gateway.appliedConfigVersion || "-";
      els.statusDetails.textContent = JSON.stringify({
        lastConfigStatus: gateway.lastConfigStatus,
        lastConfigMessage: gateway.lastConfigMessage,
        appVersion: gateway.appVersion
      }, null, 2);

      els.selectedGatewayForm.elements.id.value = gateway.id;
      els.selectedGatewayForm.elements.name.value = gateway.name || "";
      els.selectedGatewayForm.elements.site.value = gateway.site || "";
      els.selectedGatewayForm.elements.token.value = "";

      const configPayload = await requestJson("/api/gateways/" + encodeURIComponent(gateway.id) + "/config");
      selectedConfig = configPayload.config || null;
      els.configEditor.value = JSON.stringify(selectedConfig || defaultConfig(gateway.id), null, 2);

      const telemetryPayload = await requestJson("/api/gateways/" + encodeURIComponent(gateway.id) + "/telemetry/latest");
      els.telemetryOutput.textContent = JSON.stringify(telemetryPayload.records || [], null, 2);
    }

    function defaultConfig(gatewayId) {
      return {
        gateway: { id: gatewayId, pollLoopDelayMs: 250 },
        server: {
          url: publicUrl.replace(/\\/+$/, "") + "/api/telemetry",
          tokenEnv: "SERVER_TOKEN",
          timeoutMs: 10000,
          batchSize: 100,
          uploadIntervalMs: 5000
        },
        remoteConfig: {
          enabled: true,
          url: publicUrl.replace(/\\/+$/, "") + "/api/gateway",
          tokenEnv: "GATEWAY_TOKEN",
          checkIntervalMs: 30000,
          timeoutMs: 10000,
          statePath: "/data/remote-config-state.json"
        },
        storage: { queuePath: "/data/queue.jsonl" },
        ports: {},
        devices: []
      };
    }

    els.gatewayForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      await requestJson("/api/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.get("id"),
          name: form.get("name"),
          site: form.get("site"),
          token: form.get("token")
        })
      });
      selectedId = String(form.get("id"));
      event.currentTarget.reset();
      setStatus("Gateway saved", "ok");
      await loadGateways();
    });

    els.selectedGatewayForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!selectedId) return;
      const form = new FormData(event.currentTarget);
      await requestJson("/api/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedId,
          name: form.get("name"),
          site: form.get("site"),
          token: form.get("token")
        })
      });
      setStatus("Gateway updated", "ok");
      await loadGateways();
    });

    document.getElementById("saveConfigBtn").addEventListener("click", async () => {
      if (!selectedId) return;
      const config = JSON.parse(els.configEditor.value);
      await requestJson("/api/gateways/" + encodeURIComponent(selectedId) + "/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, restart_required: true })
      });
      setStatus("Config version created. Waiting for gateway pull.", "ok");
      await loadGateways();
    });

    document.getElementById("loadDefaultConfigBtn").addEventListener("click", () => {
      if (!selectedId) return;
      els.configEditor.value = JSON.stringify(defaultConfig(selectedId), null, 2);
    });

    document.getElementById("refreshBtn").addEventListener("click", () => {
      loadGateways().then(() => setStatus("Refreshed", "ok")).catch((error) => setStatus(error.message, "error"));
    });

    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await fetch("/api/logout", { method: "POST" });
      location.href = "/login";
    });

    document.querySelectorAll("nav button").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("nav button").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        document.querySelectorAll("section.content").forEach((section) => section.classList.add("hidden"));
        document.getElementById(button.dataset.tab + "Tab").classList.remove("hidden");
      });
    });

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    loadGateways().catch((error) => setStatus(error.message, "error"));
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
