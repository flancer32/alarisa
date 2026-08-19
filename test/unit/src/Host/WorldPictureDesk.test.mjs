import assert from "node:assert/strict";
import test from "node:test";

import WorldPictureHandler from "../../../../node_modules/@flancer32/alarisa-comm/src/Back/Handler/WorldPicture.mjs";
import WorldPictureContract from "../../../../node_modules/@flancer32/alarisa-comm/src/Contract/WorldPicture.mjs";
import {createWorldPictureController} from "../../../../node_modules/@flancer32/alarisa-desk/web/world-picture.js";

const STAGE = {PROCESS: "PROCESS"};
const dtoInfoFactory = {create: (value) => Object.freeze(value)};

function response() {
  return {
    body: undefined,
    headers: undefined,
    status: undefined,
    end(body) { this.body = body; },
    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
    },
  };
}

test("Desk reads the State World Picture through the protected shared HTTP contract", async () => {
  const contract = new WorldPictureContract();
  const treePicture = {
    version: 1,
    selection: {kind: "tree"},
    tree: [{objectId: 11, children: [{objectId: 12, children: [], crossLinkRelationIds: []}], crossLinkRelationIds: []}],
    objects: [{id: 11, components: []}, {id: 12, components: []}],
    componentTypes: [], propertyTypes: [], relationTypes: [], relations: [],
  };
  const nodePicture = {
    version: 1,
    selection: {kind: "node", objectId: 12},
    objects: [{id: 12, components: []}],
    componentTypes: [], propertyTypes: [], relationTypes: [], relations: [],
  };
  const readCalls = [];
  const handler = new WorldPictureHandler({
    dtoInfoFactory,
    STAGE,
    contract,
    read: {
      async tree(input) {
        readCalls.push({method: "tree", input});
        return treePicture;
      },
      async node(input) {
        readCalls.push({method: "node", input});
        return nodePicture;
      },
    },
  });
  const requests = [];
  const fetchImpl = async function (url, options) {
    requests.push({url, options});
    const result = response();
    const context = {request: {method: "GET", url, headers: {}}, response: result, completed: false};
    await handler.handle(context);
    assert.equal(context.completed, true);
    return new Response(result.body, {headers: result.headers, status: result.status});
  };
  const rendered = {detail: undefined, tree: undefined};
  const view = {
    clearPicture() {},
    renderDetail(picture, objectId) { rendered.detail = {objectId, picture}; },
    renderTree(picture, objectId) { rendered.tree = {objectId, picture}; },
    setLoading() {},
    showStatus() {},
  };
  const desk = createWorldPictureController({fetchImpl, view});

  await desk.loadTree();
  assert.deepEqual(rendered.tree, {objectId: undefined, picture: treePicture});

  await desk.selectObject(12);
  assert.deepEqual(rendered.tree, {objectId: 12, picture: treePicture});
  assert.deepEqual(rendered.detail, {objectId: 12, picture: nodePicture});
  assert.deepEqual(readCalls, [
    {method: "tree", input: {focusObjectId: undefined}},
    {method: "tree", input: {focusObjectId: 12}},
    {method: "node", input: {objectId: 12}},
  ]);
  assert.deepEqual(requests.map(({url}) => url), [
    "/api/v1/world-picture/tree",
    "/api/v1/world-picture/tree?focus=12",
    "/api/v1/world-picture/node/12",
  ]);
  for (const {options} of requests) {
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.headers.Accept, "application/json");
  }
});
