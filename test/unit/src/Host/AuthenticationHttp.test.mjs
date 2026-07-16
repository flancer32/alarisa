import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {once} from "node:events";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import test from "node:test";

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
  const child = spawn(process.execPath, [path.join(projectRoot, "bin/cli.mjs"), `--port=${port}`], {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: {...process.env},
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });
  const exitPromise = once(child, "exit");

  try {
    const started = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for authentication HTTP test server\n${output}`)), 10_000);
      const inspect = () => {
        if (!output.includes("Starting server in HTTP/1 mode on ")) return;
        clearTimeout(timer);
        resolve();
      };
      child.stdout.on("data", inspect);
      child.stderr.on("data", inspect);
    });
    await started;

    const session = await fetch(`http://127.0.0.1:${port}/api/v1/auth/session`);
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
    child.kill("SIGTERM");
    await exitPromise;
  }
});
