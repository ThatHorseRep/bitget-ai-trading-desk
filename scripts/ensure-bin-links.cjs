const fs = require("fs");
const path = require("path");

const binDir = path.join(__dirname, "..", "node_modules", ".bin");
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const nm = path.join(__dirname, "..", "node_modules");
if (!fs.existsSync(nm)) process.exit(0);

const dirs = fs.readdirSync(nm);
for (const d of dirs) {
  if (d.startsWith("@")) {
    const sub = fs.readdirSync(path.join(nm, d));
    for (const s of sub) {
      linkPkg(path.join(nm, d, s));
    }
  } else {
    linkPkg(path.join(nm, d));
  }
}

function linkPkg(pkgDir) {
  const pkgJsonPath = path.join(pkgDir, "package.json");
  if (!fs.existsSync(pkgJsonPath)) return;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    if (pkg.bin) {
      if (typeof pkg.bin === "string") {
        createSymlink(pkg.name.split("/").pop(), path.join(pkgDir, pkg.bin));
      } else if (typeof pkg.bin === "object") {
        for (const [binName, binRel] of Object.entries(pkg.bin)) {
          createSymlink(binName, path.join(pkgDir, binRel));
        }
      }
    }
  } catch (e) {}
}

function createSymlink(name, target) {
  const linkPath = path.join(binDir, name);
  try {
    if (fs.existsSync(linkPath)) fs.unlinkSync(linkPath);
    const relTarget = path.relative(binDir, target);
    fs.symlinkSync(relTarget, linkPath);
    try {
      fs.chmodSync(target, 0o755);
    } catch (e) {}
  } catch (err) {}
}
