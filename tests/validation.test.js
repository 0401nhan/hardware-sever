import test from "node:test";
import assert from "node:assert/strict";

import { createDefaultGatewayConfig, validateGatewayConfig } from "../src/validation.js";

test("creates a valid default remote config for a gateway", () => {
  const config = createDefaultGatewayConfig("EB-ANHUNG-001", "https://server.eletricbird.vn");

  assert.doesNotThrow(() => validateGatewayConfig(config, "EB-ANHUNG-001"));
  assert.equal(config.server.url, "https://server.eletricbird.vn/api/telemetry");
  assert.equal(config.remoteConfig.url, "https://server.eletricbird.vn/api/gateway");
});

test("rejects config for the wrong gateway id", () => {
  const config = createDefaultGatewayConfig("EB-OTHER-001", "https://server.eletricbird.vn");

  assert.throws(
    () => validateGatewayConfig(config, "EB-ANHUNG-001"),
    /gateway.id must be EB-ANHUNG-001/,
  );
});
