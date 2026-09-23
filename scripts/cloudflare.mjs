import nextEnv from "@next/env";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

nextEnv.loadEnvConfig(process.cwd());

const bindingVariable =
  "CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE";

if (process.env.DATABASE_URL && !process.env[bindingVariable]) {
  process.env[bindingVariable] = process.env.DATABASE_URL;
}

const cli = fileURLToPath(
  new URL(
    "../node_modules/@opennextjs/cloudflare/dist/cli/index.js",
    import.meta.url,
  ),
);

const child = spawn(process.execPath, [cli, ...process.argv.slice(2)], {
  env: process.env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});
