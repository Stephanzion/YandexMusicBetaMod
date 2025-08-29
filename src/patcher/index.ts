import { getStableBuild, downloadBuild } from "./api";
import { processBuild } from "./patcher";

const stableBuild = await getStableBuild();

if (stableBuild.isErr()) {
  console.error(stableBuild.error);
  process.exit(1);
}

const files = stableBuild.value;

for (const file of files) {
  await processBuild(file);
}
