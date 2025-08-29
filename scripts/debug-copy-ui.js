import { $ } from "bun";
import path from "path";
import fs from "fs";

await $`bun run ui:build`;

const modPath = ".versions/5.66.1/mod/app/yandexMusicMod/";
const sourcesPath = "src/mod/dist/";

// Ensure the modPath directory exists
fs.mkdirSync(modPath, { recursive: true });

// Copy all files from sources to modPath
const files = fs.readdirSync(sourcesPath);
console.log(`Copying ${files.length} files from ${sourcesPath} to ${modPath}`);

for (const file of files) {
  const sourcePath = path.join(sourcesPath, file);
  const destPath = path.join(modPath, file);

  if (fs.statSync(sourcePath).isFile()) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied: ${file}`);
  }
}

// Wrap renderer.js with async function
const rendererPath = path.join(modPath, "renderer.js");
if (fs.existsSync(rendererPath)) {
  console.log("Wrapping renderer.js with async function...");

  const originalContent = fs.readFileSync(rendererPath, "utf8");
  const wrappedContent = `(async function() {
${originalContent}
})();`;

  fs.writeFileSync(rendererPath, wrappedContent, "utf8");
  console.log("Successfully wrapped renderer.js with async function");
} else {
  console.error("renderer.js not found in modPath after copying");
}

console.log("Copy and wrap operation completed!");
