import test from "node:test";
import assert from "node:assert/strict";

import { gatewayTailscaleBaseUrl, gatewayTailscaleBaseUrls } from "../src/tailscaleGatewayClient.js";

test("builds IP and MagicDNS fallback URLs for a Tailscale gateway", () => {
  const gateway = {
    remoteAccess: {
      enabled: true,
      ip: "100.77.152.66",
      host: "moxa.tailnet.test",
      uiPort: 8080,
    },
  };

  assert.equal(gatewayTailscaleBaseUrl(gateway), "http://100.77.152.66:8080");
  assert.deepEqual(gatewayTailscaleBaseUrls(gateway), [
    "http://100.77.152.66:8080",
    "http://moxa.tailnet.test:8080",
  ]);
});
