import { $ } from "bun";
import path from "path";
import fs from "fs";

await $`bun run ui:build`;

const modPath = ".versions/5.86.0/mod/app/yandexMusicMod/";
const sourcesPath = "src/mod/dist/";

// Ensure the modPath directory exists
fs.mkdirSync(modPath, { recursive: true });

// Recursive function to copy all files and directories
function copyRecursively(src, dest) {
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    // Create directory if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    // Get all items in the directory
    const items = fs.readdirSync(src);

    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      copyRecursively(srcPath, destPath);
    }
  } else if (stats.isFile()) {
    // Copy file
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${path.relative(sourcesPath, src)}`);
  }
}

// Copy all files and directories from sources to modPath
console.log(`Copying all files and directories from ${sourcesPath} to ${modPath}`);
copyRecursively(sourcesPath, modPath);

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
