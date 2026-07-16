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
  const path = {
    join: (root, name) => `${root}/${name}`,
    resolve: (root, value) => value.startsWith("/") ? value : `${root}/${value}`,
  };
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
    dataRoot: "/tmp/app/var",
    authOrigin: "http://localhost:3000",
    authRpId: "localhost",
    authRpName: "Alarisa",
    authChallengeTtlMs: 300_000,
    authEnrollmentTtlMs: 900_000,
    authMobSessionTtlMs: 7_776_000_000,
    authDeskSessionTtlMs: 15_552_000_000,
    authStepUpTtlMs: 1_800_000,
  });
  assert.equal(result.frozen, true);
});

test("parses supported values, comments, and quotes", async () => {
  const { loader, calls } = createLoader({
    "/tmp/app/.env": "HOST='127.0.0.1'\nPORT=3042\nSERVER_TYPE=https\nALARISA_DATA_ROOT=var/data\nALARISA_AUTH_ORIGIN=https://alarisa.test\nALARISA_AUTH_RP_ID=alarisa.test\nALARISA_AUTH_RP_NAME='My Alarisa'\nALARISA_AUTH_CHALLENGE_MINUTES=7\nALARISA_AUTH_ENROLLMENT_MINUTES=20\nALARISA_AUTH_MOB_SESSION_DAYS=91\nALARISA_AUTH_DESK_SESSION_DAYS=181\nALARISA_AUTH_STEP_UP_MINUTES=31\n# ignored\nUNKNOWN=value\n",
  });
  await loader.load({ projectRoot: "/tmp/app" });

  assert.deepEqual(calls[0], {
    host: "127.0.0.1",
    httpPort: 3042,
    serverType: "https",
    dataRoot: "/tmp/app/var/data",
    authOrigin: "https://alarisa.test",
    authRpId: "alarisa.test",
    authRpName: "My Alarisa",
    authChallengeTtlMs: 420_000,
    authEnrollmentTtlMs: 1_200_000,
    authMobSessionTtlMs: 7_862_400_000,
    authDeskSessionTtlMs: 15_638_400_000,
    authStepUpTtlMs: 1_860_000,
  });
});

test("rejects invalid port and server type", async () => {
  const invalidPort = createLoader({ "/tmp/app/.env": "PORT=0\n" }).loader.load({ projectRoot: "/tmp/app" });
  await assert.rejects(invalidPort, /PORT/);

  const invalidType = createLoader({ "/tmp/app/.env": "SERVER_TYPE=socket\n" }).loader.load({ projectRoot: "/tmp/app" });
  await assert.rejects(invalidType, /SERVER_TYPE/);
});

test("rejects invalid WebAuthn origin, RP ID, and lifetimes", async () => {
  await assert.rejects(createLoader({"/tmp/app/.env": "ALARISA_AUTH_ORIGIN=https://example.test/path\n"}).loader.load({projectRoot: "/tmp/app"}), /ALARISA_AUTH_ORIGIN/);
  await assert.rejects(createLoader({"/tmp/app/.env": "ALARISA_AUTH_RP_ID=https:\/\/example.test\n"}).loader.load({projectRoot: "/tmp/app"}), /ALARISA_AUTH_RP_ID/);
  await assert.rejects(createLoader({"/tmp/app/.env": "ALARISA_AUTH_MOB_SESSION_DAYS=0\n"}).loader.load({projectRoot: "/tmp/app"}), /ALARISA_AUTH_MOB_SESSION_DAYS/);
});

test("allows an explicit ephemeral port override for local diagnostics", async () => {
  const { loader, calls } = createLoader({ "/tmp/app/.env": "PORT=3042\n" });
  await loader.load({ projectRoot: "/tmp/app", overrides: { httpPort: 0 } });
  assert.equal(calls[0].httpPort, 0);
});
