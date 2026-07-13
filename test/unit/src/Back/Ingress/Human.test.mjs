import test from "node:test";
import assert from "node:assert/strict";

import HumanIngress from "../../../../../src/Back/Ingress/Human.mjs";

test("rejects PWA transport until host signal creation is implemented", async () => {
  const ingress = new HumanIngress();

  await assert.rejects(
    ingress.accept({ text: "Hello", channel: "pwa" }),
    /not available yet/,
  );
});
