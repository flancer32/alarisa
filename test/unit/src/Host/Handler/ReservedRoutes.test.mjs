import assert from "node:assert/strict";
import test from "node:test";

import ReservedRoutes from "../../../../../src/Host/Handler/ReservedRoutes.mjs";

const STAGE = {PROCESS: "PROCESS"};
const dtoInfoFactory = {create: (value) => Object.freeze(value)};

function response() {
  return {
    status: undefined,
    body: undefined,
    writeHead(status) { this.status = status; },
    end(body) { this.body = body; },
  };
}

test("protects every host-owned reserved zone", async () => {
  const handler = new ReservedRoutes({dtoInfoFactory, STAGE});
  for (const url of ["/hooks/provider/binding", "/.well-known/example", "/_ops/health"]) {
    const context = {request: {url}, response: response(), completed: false};
    await handler.handle(context);
    assert.equal(context.response.status, 404);
    assert.equal(context.completed, true);
  }
});

test("leaves browser and API routes to their owners", async () => {
  const handler = new ReservedRoutes({dtoInfoFactory, STAGE});
  for (const url of ["/", "/desk/", "/mob/", "/api/v1/ingress/human"]) {
    const context = {request: {url}, response: response(), completed: false};
    await handler.handle(context);
    assert.equal(context.completed, false);
  }
});
