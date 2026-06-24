import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";

import { renderDashboardPage, renderLoginPage } from "../src/ui.js";

test("login page posts to the admin login API", () => {
  const html = renderLoginPage();

  assert.match(html, /<html lang="vi">/);
  assert.match(html, /Tài khoản/);
  assert.match(html, /Mật khẩu/);
  assert.match(html, /Đăng nhập/);
  assert.match(html, /\/api\/login/);
  assert.doesNotMatch(html, /Forgot password|Request access|Sign in/);
});

test("dashboard inline browser script is valid JavaScript", () => {
  const html = renderDashboardPage({ publicUrl: "https://example.test" });
  const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];

  assert.ok(script);
  assert.doesNotThrow(() => new vm.Script(script, { filename: "dashboard-inline.js" }));
});

test("dashboard is only a Tailscale gateway directory", () => {
  const html = renderDashboardPage({ publicUrl: "https://example.test" });

  assert.match(html, /Danh bạ gateway Tailscale/);
  assert.match(html, /id="gatewayGrid"/);
  assert.match(html, /id="manualGatewayPanel"/);
  assert.match(html, /name="tailscaleHost"/);
  assert.match(html, /name="tailscaleIp"/);
  assert.match(html, /\/api\/gateways/);
  assert.match(html, /\/api\/tailscale\/sync/);
  assert.match(html, /\/gateways\/" \+ encodeURIComponent\(gateway\.id\) \+ "\/remote\//);
  assert.match(html, /window\.open\(url, "_blank", "noopener"\)/);
  assert.match(html, /id="icon-tailscale"/);

  assert.doesNotMatch(html, /remoteView/);
  assert.doesNotMatch(html, /templateLibrary/);
  assert.doesNotMatch(html, /\/api\/device-templates/);
  assert.doesNotMatch(html, /\/telemetry\/latest/);
  assert.doesNotMatch(html, /\/config/);
  assert.doesNotMatch(html, /\/tailscale\/control/);
  assert.doesNotMatch(html, /inverterControlTab/);
});
