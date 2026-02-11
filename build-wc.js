const fs = require("fs-extra");
const concat = require("concat");
const path = require("path");

const build = async () => {
  const dest = "web-component/assets/quml-player/";
  const files = [
    "./dist/quml-player-wc/runtime.js",
    "./dist/quml-player-wc/polyfills.js",
    "./dist/quml-player-wc/scripts.js",
    "./dist/quml-player-wc/vendor.js",
    "./dist/quml-player-wc/main.js",
  ];

  await fs.ensureDir("dist/quml-player-wc");
  await fs.ensureDir(dest);
  await concat(files, path.join(dest, "sunbird-quml-player.js"));
  await fs.copy("./dist/quml-player-wc/assets", path.join(dest, "assets"));
  await fs.copy("./dist/quml-player-wc/styles.css", path.join(dest, "styles.css"));
  await fs.copy("README.md", path.join(dest, "README.md"));
  await fs.copy("web-component-examples/vanilla-js/index.html", path.join(dest, "index.html"));
  
  // Update the documentation link in the copied index.html
  const indexPath = path.join(dest, "index.html");
  let indexContent = fs.readFileSync(indexPath, "utf8");
  indexContent = indexContent.replace(
    "web-component-examples/vanilla-js/index.html",
    "web-component/assets/quml-player/index.html"
  ).replace(
    "The example will load the latest build from ../web-component/sunbird-quml-player.js",
    "The example will load the latest build from the same directory."
  );
  fs.writeFileSync(indexPath, indexContent);

  await fs.copy("projects/quml-library/src/lib/assets/", path.join(dest, "assets"));

  const filesNames = fs.readdirSync("dist/quml-player-wc");
  const allowedFiles = [".ttf", ".woff", ".woff2"];

  filesNames.forEach((file) => {
    if (allowedFiles.includes(path.extname(file))) {
      fs.copySync(`dist/quml-player-wc/${file}`, path.join(dest, file));
    }
  });
  console.log("Files concatenated successfully!!!");

  // Cleanup old files from root if they exist to reflect the "move" operation
  const filesToRemove = [
    "sunbird-quml-player.js",
    "styles.css",
    "README.md"
  ];
  filesToRemove.forEach(file => {
    const filePath = path.join("web-component", file);
    if (fs.existsSync(filePath)) {
      fs.removeSync(filePath);
    }
  });

  // Also remove old font files from root
  const rootFiles = fs.readdirSync("web-component");
  rootFiles.forEach(file => {
    if (allowedFiles.includes(path.extname(file))) {
      fs.removeSync(path.join("web-component", file));
    }
  });

  // Cleanup redundant assets from web-component/assets/ if they exist
  const assetsRoot = "web-component/assets";
  if (fs.existsSync(assetsRoot)) {
    const assetsFiles = fs.readdirSync(assetsRoot);
    assetsFiles.forEach(file => {
      if (file !== "quml-player") {
        fs.removeSync(path.join(assetsRoot, file));
      }
    });
  }
};
build();
