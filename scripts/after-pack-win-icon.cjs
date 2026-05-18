const fs = require("fs");
const path = require("path");
const { NtExecutable, NtExecutableResource } = require("pe-library");
const ResEdit = require("resedit");

function resolveIconPath(projectDir, outDir) {
  const candidates = [
    path.join(projectDir, "icon.ico"),
    path.join(outDir, ".icon-ico", "icon.ico"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to find a Windows icon. Checked: ${candidates.join(", ")}`
  );
}

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") {
    return;
  }

  const projectDir = context.packager.projectDir || process.cwd();
  const iconPath = resolveIconPath(projectDir, context.outDir);
  const exePath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.exe`
  );

  const exe = NtExecutable.from(fs.readFileSync(exePath), {
    ignoreCert: true,
  });
  const resources = NtExecutableResource.from(exe);
  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(iconPath));
  const iconGroups = ResEdit.Resource.IconGroupEntry.fromEntries(
    resources.entries
  );
  const targetGroup = iconGroups[0];

  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    resources.entries,
    targetGroup?.id ?? 101,
    targetGroup?.lang ?? 1033,
    iconFile.icons.map((item) => item.data)
  );

  resources.outputResource(exe);
  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
};
