import { Notice, Plugin } from "obsidian";
import {
  DEFAULT_SETTINGS,
  GilPublisherSettingTab,
  type PluginSettings,
} from "./settings";
import { publishAll, publishFileWithRelated } from "./publisher";
import { syncFromRepo } from "./syncer";

export default class GilPublisherPlugin extends Plugin {
  settings!: PluginSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new GilPublisherSettingTab(this.app, this));

    // Command: publish all notes
    this.addCommand({
      id: "publish-all-notes",
      name: "Publish all notes to site",
      callback: async () => {
        if (!this.settings.targetRepoPath) {
          new Notice(
            "Gil Publisher: Set the Astro repo path in plugin settings first.",
            5000
          );
          return;
        }

        new Notice("Gil Publisher: Starting full publish…");
        const result = await publishAll(this.app, this.settings, (msg) => {
          console.log("[GilPublisher]", msg);
        });

        const summary =
          `Published ${result.published.length} notes` +
          (result.skipped.length ? `, skipped ${result.skipped.length}` : "") +
          (result.errors.length ? `, ${result.errors.length} error(s)` : "") +
          ".";

        new Notice(`Gil Publisher: ${summary}`, 8000);

        if (result.errors.length) {
          console.error("[GilPublisher] Errors:", result.errors);
        }
      },
    });

    // Command: publish current note
    this.addCommand({
      id: "publish-current-note",
      name: "Publish current note to site",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") return false;
        if (checking) return true;

        if (!this.settings.targetRepoPath) {
          new Notice(
            "Gil Publisher: Set the Astro repo path in plugin settings first.",
            5000
          );
          return;
        }

        publishFileWithRelated(this.app, file, this.settings)
          .then((result) => {
            if (result.errors.length) {
              new Notice(
                `Gil Publisher: Published ${result.published.length} note(s) with ${result.errors.length} error(s).`,
                8000
              );
              console.error("[GilPublisher] Errors:", result.errors);
              return;
            }

            const relatedCount = Math.max(0, result.published.length - 1);
            const relatedSummary = relatedCount
              ? ` and ${relatedCount} related note(s)`
              : "";
            new Notice(
              `Gil Publisher: Published "${file.basename}"${relatedSummary}.`
            );
          })
          .catch((err: unknown) => {
            new Notice(`Gil Publisher: Error publishing "${file.basename}": ${String(err)}`, 8000);
            console.error("[GilPublisher]", err);
          });
      },
    });

    // Command: sync notes from repo back to vault
    this.addCommand({
      id: "sync-from-repo",
      name: "Sync notes from Astro repo",
      callback: async () => {
        if (!this.settings.targetRepoPath) {
          new Notice(
            "Gil Publisher: Set the Astro repo path in plugin settings first.",
            5000
          );
          return;
        }

        new Notice("Gil Publisher: Syncing from repo…");
        const result = await syncFromRepo(this.app, this.settings, (msg) => {
          console.log("[GilPublisher]", msg);
        });

        const summary =
          `Synced ${result.synced.length} note(s)` +
          (result.skipped.length ? `, skipped ${result.skipped.length}` : "") +
          (result.errors.length ? `, ${result.errors.length} error(s)` : "") +
          (result.imagesSynced ? `, ${result.imagesSynced} image(s)` : "") +
          ".";

        new Notice(`Gil Publisher: ${summary}`, 8000);

        if (result.errors.length) {
          console.error("[GilPublisher] Sync errors:", result.errors);
        }
      },
    });

    // Ribbon icon for quick single-file publish
    this.addRibbonIcon("upload", "Publish current note", async () => {
      const file = this.app.workspace.getActiveFile();
      if (!file || file.extension !== "md") {
        new Notice("Gil Publisher: Open a markdown note first.");
        return;
      }

      if (!this.settings.targetRepoPath) {
        new Notice(
          "Gil Publisher: Set the Astro repo path in plugin settings first.",
          5000
        );
        return;
      }

      try {
        const result = await publishFileWithRelated(this.app, file, this.settings);
        if (result.errors.length) {
          new Notice(
            `Gil Publisher: Published ${result.published.length} note(s) with ${result.errors.length} error(s).`,
            8000
          );
          console.error("[GilPublisher] Errors:", result.errors);
          return;
        }

        const relatedCount = Math.max(0, result.published.length - 1);
        const relatedSummary = relatedCount
          ? ` and ${relatedCount} related note(s)`
          : "";
        new Notice(`Gil Publisher: Published "${file.basename}"${relatedSummary}.`);
      } catch (err) {
        new Notice(`Gil Publisher: Error — ${String(err)}`, 8000);
        console.error("[GilPublisher]", err);
      }
    });
  }

  onunload() {}

  async loadSettings() {
    const saved = (await this.loadData()) as Partial<PluginSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
    let migrated = false;

    // Migrate the original single-package paths to the monorepo layout.
    if (saved?.notesTargetSubpath === "src/content/notes") {
      this.settings.notesTargetSubpath = DEFAULT_SETTINGS.notesTargetSubpath;
      migrated = true;
    }
    if (saved?.imageTargetSubpath === "src/assets") {
      this.settings.imageTargetSubpath = DEFAULT_SETTINGS.imageTargetSubpath;
      migrated = true;
    }

    if (migrated) {
      await this.saveSettings();
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
