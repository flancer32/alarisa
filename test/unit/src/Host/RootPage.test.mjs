import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

test("root page requires an explicit desk or mob choice", async () => {
  const html = await fs.readFile(new URL("../../../../web/index.html", import.meta.url), "utf8");

  assert.match(html, /href="\/desk\/"/);
  assert.match(html, /href="\/mob\/"/);
  assert.doesNotMatch(html, /http-equiv=["']refresh/i);
  assert.doesNotMatch(html, /<script\b/i);
});
