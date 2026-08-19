import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {once} from "node:events";
import fs from "node:fs/promises";
import os from "node:os";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import test from "node:test";

const cliEnv = function () {
  const env = {...process.env};
  delete env.pm_exec_path;
  delete env.NODE_TEST_CONTEXT;
  return env;
};

async function freePort() {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  await new Promise((resolve) => server.close(resolve));
  return address.port;
}

test("HTTP composition exposes auth bootstrap and protects Principal API operations", async () => {
  const projectRoot = path.resolve(process.cwd());
  const port = await freePort();
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), "alarisa-auth-http-"));
  const executable = await fs.realpath(path.join(projectRoot, "node_modules/.bin/teq"));
  const child = spawn(executable, ["alarisa:start", `--port=${port}`, `--data-root=${dataRoot}`], {
    cwd: projectRoot,
    stdio: ["ignore", "inherit", "inherit"],
    env: {...cliEnv(), ALARISA__DATA_ROOT: dataRoot},
  });
  const exitPromise = once(child, "exit");

  try {
    let session;
    const deadline = Date.now() + 10_000;
    while (!session && Date.now() < deadline) {
      try {
        session = await fetch(`http://127.0.0.1:${port}/api/v1/auth/session`);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
    if (!session) throw new Error("Timed out waiting for authentication HTTP test server");
    assert.equal(session.status, 200);
    assert.deepEqual(await session.json(), {authenticated: false});

    const sharedAuthClient = await fetch(`http://127.0.0.1:${port}/_assets/comm/auth.js`);
    assert.equal(sharedAuthClient.status, 200);
    assert.match(await sharedAuthClient.text(), /navigator\.credentials/);

    const ingress = await fetch(`http://127.0.0.1:${port}/api/v1/ingress/human`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({contributionId: "test-contribution-0001", text: "Hello", channel: "mob"}),
    });
    assert.equal(ingress.status, 401);

    const options = await fetch(`http://127.0.0.1:${port}/api/v1/auth/authentication/options`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({surface: "mob"}),
    });
    assert.equal(options.status, 409);
  } finally {
    child.kill("SIGKILL");
    await exitPromise;
    await fs.rm(dataRoot, {recursive: true, force: true});
  }
});
