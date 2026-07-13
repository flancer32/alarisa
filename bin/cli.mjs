#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Container from "@teqfw/di";
import NamespaceRegistry from "@teqfw/di/src/Config/NamespaceRegistry.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const container = new Container();
// @ts-ignore
const namespaceRegistry = new NamespaceRegistry({ fs, path, appRoot: projectRoot });
const entries = await namespaceRegistry.build();
for (const entry of entries) {
  container.addNamespaceRoot(entry.prefix, entry.dirAbs, entry.ext);
}

const app = await container.get("Alarisa_Back_Bootstrap$");
const cliArgs = process.argv.slice(2);
const portArg = process.env.PORT ?? cliArgs.find((arg) => arg.startsWith("--port="))?.split("=")[1];
const typeArg = process.env.SERVER_TYPE ?? cliArgs.find((arg) => arg.startsWith("--type="))?.split("=")[1];
const port = portArg ? Number.parseInt(portArg, 10) : undefined;
const serverType = typeArg ?? "http";

let exitCode = 1;
let stopping = false;
const stopApp = async () => {
  if (stopping) return;
  stopping = true;
  if (typeof app.stop === "function") await app.stop();
};

const shutdown = async (code = 0) => {
  await stopApp();
  process.exitCode = typeof code === "number" ? code : 1;
};

process.once("SIGINT", () => { void shutdown(0); });
process.once("SIGTERM", () => { void shutdown(0); });

try {
  exitCode = await app.run({ projectRoot, cliArgs, port, serverType });
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  await stopApp();
}

process.exitCode = typeof exitCode === "number" ? exitCode : 1;
