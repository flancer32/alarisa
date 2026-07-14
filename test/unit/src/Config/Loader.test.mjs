import test from "node:test";
import assert from "node:assert/strict";

import Loader from "../../../../src/Config/Loader.mjs";

const createLoader = (files = {}) => {
  const fs = {
    async readFile(filePath) {
      if (!(filePath in files)) {
        const error = new Error("missing");
        error.code = "ENOENT";
        throw error;
      }
      return files[filePath];
    },
  };
  const path = { join: (root, name) => `${root}/${name}` };
  const calls = [];
  const factory = {
    configure(params) {
      calls.push(params);
    },
    freeze() {
      return { frozen: true, ...calls.at(-1) };
    },
  };
  return { loader: new Loader({ fs, path, appCfgRuntimeFactory: factory }), calls };
};

test("loads defaults when project .env is absent", async () => {
  const { loader, calls } = createLoader();
  const result = await loader.load({ projectRoot: "/tmp/app" });

  assert.deepEqual(calls[0], {
    host: "127.0.0.1",
    httpPort: 3000,
    serverType: "http",
    dataRoot: "var",
  });
  assert.equal(result.frozen, true);
});

test("parses supported values, comments, and quotes", async () => {
  const { loader, calls } = createLoader({
    "/tmp/app/.env": "HOST='127.0.0.1'\nPORT=3042\nSERVER_TYPE=https\nALARISA_DATA_ROOT=var/data\nALARISA_CONFIG_ROOT=\"/etc/alarisa\"\n# ignored\nUNKNOWN=value\n",
  });
  await loader.load({ projectRoot: "/tmp/app" });

  assert.deepEqual(calls[0], {
    host: "127.0.0.1",
    httpPort: 3042,
    serverType: "https",
    dataRoot: "var/data",
  });
});

test("rejects invalid port and server type", async () => {
  const invalidPort = createLoader({ "/tmp/app/.env": "PORT=0\n" }).loader.load({ projectRoot: "/tmp/app" });
  await assert.rejects(invalidPort, /PORT/);

  const invalidType = createLoader({ "/tmp/app/.env": "SERVER_TYPE=socket\n" }).loader.load({ projectRoot: "/tmp/app" });
  await assert.rejects(invalidType, /SERVER_TYPE/);
});

test("allows an explicit ephemeral port override for local diagnostics", async () => {
  const { loader, calls } = createLoader({ "/tmp/app/.env": "PORT=3042\n" });
  await loader.load({ projectRoot: "/tmp/app", overrides: { httpPort: 0 } });
  assert.equal(calls[0].httpPort, 0);
});
