// Turns a .sql import into a JavaScript string export so Turbopack inlines it
// in the Cloudflare Worker. The Worker has no project filesystem at runtime.
module.exports = function sqlTextLoader(source) {
  const text = Buffer.isBuffer(source) ? source.toString("utf8") : String(source);
  return `export default ${JSON.stringify(text)};\n`;
};
