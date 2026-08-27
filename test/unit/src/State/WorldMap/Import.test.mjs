import assert from "node:assert/strict";
import {test} from "node:test";
import {tableName, validate} from "../../../../../src/State/WorldMap/Import.mjs";

test("World Map resolves current State entity paths through the transaction", () => {
  const entities = [];
  const trx = {getTableName(meta) { entities.push(meta.getEntityName()); return "resolved_table"; }};
  assert.equal(tableName(trx, "object/extension"), "resolved_table");
  assert.deepEqual(entities, ["@flancer32/alarisa-back-state/alarisa/state/object/extension"]);
});

test("World Map validation accepts components and relations with known references", () => {
  const map = [{ref: "one", components: [{type: "Case", properties: {title: "One"}}], relations: [{type: "part-of", target: "two"}]}, {ref: "two", components: [{type: "Case"}]}];
  assert.equal(validate(map), map);
});

test("World Map validation rejects duplicate refs and unknown relation targets", () => {
  assert.throws(() => validate([{ref: "one", components: [{type: "Case"}]}, {ref: "one", components: [{type: "Case"}]}]), /duplicated/);
  assert.throws(() => validate([{ref: "one", components: [{type: "Case"}], relations: [{type: "part-of", target: "missing"}]}]), /unknown target/);
});

test("World Map validation permits one acyclic case-parent hierarchy only", () => {
  const map = [
    {ref: "root", components: [{type: "case"}]},
    {ref: "child", components: [{type: "case"}], relations: [{type: "case-parent", target: "root"}]},
  ];
  assert.equal(validate(map), map);
  assert.throws(() => validate([
    {ref: "one", components: [{type: "case"}]},
    {ref: "two", components: [{type: "case"}]},
    {ref: "child", components: [{type: "case"}], relations: [{type: "case-parent", target: "one"}, {type: "case-parent", target: "two"}]},
  ]), /more than one/);
  assert.throws(() => validate([
    {ref: "one", components: [{type: "case"}], relations: [{type: "case-parent", target: "two"}]},
    {ref: "two", components: [{type: "case"}], relations: [{type: "case-parent", target: "one"}]},
  ]), /cycle/);
});
