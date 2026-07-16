import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

test("root page requires an explicit desk or mob choice", async () => {
  const html = await fs.readFile(new URL("../../../../web/index.html", import.meta.url), "utf8");

  assert.match(html, /<html lang="en">/);
  assert.match(html, /rel="icon" href="\/favicon\.ico"/);
  assert.match(html, /href="\/desk\/"/);
  assert.match(html, /href="\/mob\/"/);
  assert.doesNotMatch(html, /[\u0400-\u04FF]/);
  assert.doesNotMatch(html, /http-equiv=["']refresh/i);
  assert.doesNotMatch(html, /<script\b/i);
});

test("root page favicon is an ICO resource", async () => {
  const icon = await fs.readFile(new URL("../../../../web/favicon.ico", import.meta.url));

  assert.deepEqual([...icon.subarray(0, 4)], [0, 0, 1, 0]);
});
