import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { once } from "node:events";
import fs from "node:fs/promises";
import os from "node:os";

const cliEnv = function () {
  const env = {...process.env};
  delete env.pm_exec_path;
  delete env.NODE_TEST_CONTEXT;
  return env;
};

test("cli stays running until terminated", async () => {
  const projectRoot = path.resolve(process.cwd());
  const executable = await fs.realpath(path.join(projectRoot, "node_modules/.bin/teq"));
  const child = spawn(executable, ["alarisa:start", "--port=0"], {
    cwd: projectRoot,
    stdio: ["ignore", "inherit", "inherit"],
    env: cliEnv(),
  });

  const exitPromise = once(child, "exit");
  const startedPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 250);
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`CLI exited before startup with code ${code}`));
    });
  });

  await startedPromise;

  if (child.exitCode !== null) {
    assert.fail(`CLI exited before shutdown with code ${child.exitCode}`);
  }

  child.kill("SIGKILL");
  const [code, signal] = await exitPromise;

  assert.equal(code, null);
  assert.equal(signal, "SIGKILL");
});

test("cli issues one short-lived enrollment URL without starting the server", async () => {
  const projectRoot = path.resolve(process.cwd());
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), "alarisa-cli-enrollment-"));
  const outputFile = path.join(dataRoot, "cli-output.log");
  const outputHandle = await fs.open(outputFile, "w");
  const executable = await fs.realpath(path.join(projectRoot, "node_modules/.bin/teq"));
  const child = spawn(executable, [
    "auth:enroll",
    "--surface=mob",
    "--label=Phone",
    "--ttl-minutes=10",
    `--data-root=${dataRoot}`,
  ], {cwd: projectRoot, stdio: ["ignore", outputHandle.fd, outputHandle.fd], env: cliEnv()});

  const [code] = await once(child, "exit");
  await outputHandle.close();
  const output = await fs.readFile(outputFile, "utf8");

  assert.equal(code, 0, output);
  assert.match(output, /Enrollment URL: http:\/\/localhost:3000\/mob\/\?enrollment=/);
  assert.match(output, /Expires at:/);
  assert.equal((await fs.readdir(path.join(dataRoot, "authentication", "enrollments"))).length, 1);
});
