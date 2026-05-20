import assert from "node:assert/strict";
import test from "node:test";

import { renderDashboardPage } from "../src/ui.js";

test("dashboard renders inverter control actions", () => {
  const html = renderDashboardPage({ publicUrl: "https://example.test" });

  assert.match(html, /data-tab-target="inverterControlTab"/);
  assert.match(html, /id="inverterControlTab"/);
  assert.match(html, /data-control-action="start"/);
  assert.match(html, /data-control-action="stop"/);
  assert.match(html, /data-control-action="reboot"/);
  assert.match(html, /data-control-action="clear_power_limit"/);
  assert.match(html, /id="powerLimitForm"/);
  assert.match(html, /\/api\/gateways\/" \+ encodeURIComponent\(selectedId\) \+ "\/control/);
  assert.match(html, /\/api\/gateways\/" \+ encodeURIComponent\(selectedId\) \+ "\/commands/);
});
