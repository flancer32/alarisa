import test from "node:test";
import assert from "node:assert/strict";

import Runtime, { Factory } from "../../../../src/Config/Runtime.mjs";

test("runtime configuration is read-only and frozen with defaults", () => {
  const webCalls = [];
  const factory = new Factory({
    webRuntimeFactory: {
      configure(params) {
        webCalls.push(params);
      },
      freeze() {
        return { frozen: true };
      },
    },
  });
  const runtime = new Runtime();

  assert.throws(() => runtime.host, /not initialized/);
  factory.configure({ host: "127.0.0.1", httpPort: 3042, serverType: "http", dataRoot: "var/data" });
  const frozen = factory.freeze();

  assert.equal(frozen.host, "127.0.0.1");
  assert.equal(frozen.httpPort, 3042);
  assert.equal(frozen.web.frozen, true);
  assert.equal(webCalls[0].host, "127.0.0.1");
  assert.throws(() => { frozen.host = "0.0.0.0"; }, /immutable/);
  assert.throws(() => factory.configure({ host: "example.com" }), /already frozen/);
  assert.equal(factory.freeze(), frozen);
});
