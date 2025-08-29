import * as fs from "node:fs";
import * as path from "node:path";
import prettier from "prettier";

export async function prettifyDirectory(directory: string): Promise<void> {
  const files = fs.readdirSync(directory, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(directory, file.name);

    if (file.isDirectory()) {
      if (file.name === "node_modules") {
        continue;
      }
      await prettifyDirectory(fullPath);
    } else {
      const extension = path.extname(fullPath);
      if ([".html", ".js", ".css", ".ts", ".tsx", ".jsx", ".json"].includes(extension)) {
        const fileInfo = await prettier.getFileInfo(fullPath);
        if (fileInfo.ignored) {
          continue;
        }

        const options = (await prettier.resolveConfig(fullPath)) || {};
        const content = fs.readFileSync(fullPath, "utf8");

        try {
          const formatted = await prettier.format(content, {
            ...options,
            filepath: fullPath,
          });

          fs.writeFileSync(fullPath, formatted, "utf8");
        } catch (ex) {
          console.warn("Failed to prettify file", fullPath, ex);
          continue;
        }
      }
    }
  }
}
