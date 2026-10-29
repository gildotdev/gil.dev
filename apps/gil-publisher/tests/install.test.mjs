import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  completePath,
  parseVaultArgument,
  readVaultConfig,
  resolveVaultPath,
  VAULT_ENV_VAR,
} from "../scripts/install.mjs";

test("parses explicit and interactive vault arguments", () => {
  assert.deepEqual(parseVaultArgument(["--vault", "/tmp/vault"]), {
    present: true,
    value: "/tmp/vault",
  });
  assert.deepEqual(parseVaultArgument(["--vault"]), {
    present: true,
    value: undefined,
  });
  assert.deepEqual(parseVaultArgument([]), {
    present: false,
    value: undefined,
  });
});

test("resolves CLI, environment, and dotfile paths in precedence order", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gil-publisher-test-"));
  const configPath = path.join(tempDir, ".gil-publisher-vault");
  fs.writeFileSync(configPath, "# local vault\n./from-config\n");

  assert.equal(readVaultConfig(configPath), "./from-config");
  assert.equal(
    await resolveVaultPath({
      args: ["--vault", "./from-cli"],
      env: { [VAULT_ENV_VAR]: "./from-env" },
      configPath,
    }),
    path.resolve("./from-cli")
  );
  assert.equal(
    await resolveVaultPath({
      args: [],
      env: { [VAULT_ENV_VAR]: "./from-env" },
      configPath,
    }),
    path.resolve("./from-env")
  );
  assert.equal(
    await resolveVaultPath({ args: [], env: {}, configPath }),
    path.resolve("./from-config")
  );
});

test("completes filesystem paths and marks directories", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gil-publisher-test-"));
  fs.mkdirSync(path.join(tempDir, "second-brain"));
  fs.writeFileSync(path.join(tempDir, "settings.txt"), "");

  const [matches] = completePath("se", tempDir);
  assert.deepEqual(matches.sort(), [`second-brain${path.sep}`, "settings.txt"]);
});
