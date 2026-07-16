import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { once } from "node:events";
import fs from "node:fs/promises";
import os from "node:os";

test("cli stays running until terminated", async () => {
  const projectRoot = path.resolve(process.cwd());
  const child = spawn(process.execPath, [path.join(projectRoot, "bin/cli.mjs"), "--port=0"], {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env },
  });

  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  const exitPromise = once(child, "exit");
  const startedPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for server startup\n${output}`));
    }, 10000);

    const onOutput = () => {
      if (output.includes("Starting server in HTTP/1 mode on ")) {
        clearTimeout(timer);
        child.stdout.off("data", onOutput);
        child.stderr.off("data", onOutput);
        resolve();
      }
    };

    child.stdout.on("data", onOutput);
    child.stderr.on("data", onOutput);
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`CLI exited before startup with code ${code}\n${output}`));
    });
  });

  await startedPromise;

  if (child.exitCode !== null) {
    assert.fail(`CLI exited before shutdown with code ${child.exitCode}\n${output}`);
  }

  child.kill("SIGTERM");
  const [code, signal] = await exitPromise;

  assert.equal(code, 0);
  assert.equal(signal, null);
});

test("cli issues one short-lived enrollment URL without starting the server", async () => {
  const projectRoot = path.resolve(process.cwd());
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), "alarisa-cli-enrollment-"));
  const child = spawn(process.execPath, [
    path.join(projectRoot, "bin/cli.mjs"),
    "auth:enroll",
    "--surface=mob",
    "--label=Phone",
    "--ttl-minutes=10",
    `--data-root=${dataRoot}`,
  ], {cwd: projectRoot, stdio: ["ignore", "pipe", "pipe"], env: {...process.env}});
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });

  const [code] = await once(child, "exit");

  assert.equal(code, 0, output);
  assert.match(output, /Enrollment URL: http:\/\/localhost:3000\/mob\/\?enrollment=/);
  assert.match(output, /Expires at:/);
  assert.equal((await fs.readdir(path.join(dataRoot, "authentication", "enrollments"))).length, 1);
});
