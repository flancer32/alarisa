import test from "node:test";
import assert from "node:assert/strict";

const createRuntime = async (config = {}) => {
  const module = await import(`../../../../src/Config/Runtime.mjs?test=${Math.random()}`);
  const calls = [];
  const backRuntimeFactory = {
    configure(params) { calls.push(params); },
    freeze() { return {}; },
  };
  const factory = new module.Factory({
    path: {resolve: (root, value) => value.startsWith("/") ? value : `${root}/${value}`},
    reader: {get: (namespace) => config[namespace] ?? {}},
    backRuntimeFactory,
  });
  return {factory, calls};
};

test("reads ALARISA after configuration sources are ready and freezes the result", async () => {
  const {factory, calls} = await createRuntime({
    TEQFW_WEB: {PORT: "3042"},
    ALARISA: {DATA_ROOT: "var/data", AUTH_ORIGIN: "https://alarisa.test", AUTH_RP_ID: "alarisa.test", AUTH_RP_NAME: "My Alarisa", AUTH_CHALLENGE_MINUTES: "7", AUTH_ENROLLMENT_MINUTES: "20", AUTH_MOB_SESSION_DAYS: "91", AUTH_DESK_SESSION_DAYS: "181", AUTH_STEP_UP_MINUTES: "31"},
  });
  factory.configure({projectRoot: "/tmp/app"});
  const config = factory.freeze();

  assert.equal(config.dataRoot, "/tmp/app/var/data");
  assert.equal(config.authOrigin, "https://alarisa.test");
  assert.equal(config.authRpId, "alarisa.test");
  assert.equal(config.authRpName, "My Alarisa");
  assert.equal(config.authChallengeTtlMs, 420_000);
  assert.equal(config.authEnrollmentTtlMs, 1_200_000);
  assert.equal(config.authMobSessionTtlMs, 7_862_400_000);
  assert.equal(config.authDeskSessionTtlMs, 15_638_400_000);
  assert.equal(config.authStepUpTtlMs, 1_860_000);
  assert.equal(calls[0].httpPort, 3042);
  assert.throws(() => { config.authRpName = "Changed"; }, /immutable/);
});

test("requires a project root and validates namespace values", async () => {
  const missingRoot = await createRuntime();
  assert.throws(() => missingRoot.factory.freeze(), /projectRoot/);

  const invalidOrigin = await createRuntime({ALARISA: {AUTH_ORIGIN: "https://alarisa.test/path"}});
  invalidOrigin.factory.configure({projectRoot: "/tmp/app"});
  assert.throws(() => invalidOrigin.factory.freeze(), /ALARISA__AUTH_ORIGIN/);
});
