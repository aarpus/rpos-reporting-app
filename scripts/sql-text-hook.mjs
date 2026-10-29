import { readFile } from "node:fs/promises";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith(".sql")) {
    return {
      url: new URL(specifier, context.parentURL).href,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".sql")) {
    const source = await readFile(new URL(url), "utf8");
    return {
      format: "module",
      source: `export default ${JSON.stringify(source)};\n`,
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
