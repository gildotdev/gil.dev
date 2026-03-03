import { Notice, Plugin } from "obsidian";
import {
  DEFAULT_SETTINGS,
  GilPublisherSettingTab,
  type PluginSettings,
} from "./settings";
import { buildSlugMap, buildPublishedPaths, publishAll, publishFile } from "./publisher";

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

        const slugMap = buildSlugMap(this.app, this.settings.ignoredFolders);
        const publishedPaths = buildPublishedPaths(this.app, this.settings);
        publishFile(this.app, file, this.settings, slugMap, publishedPaths)
          .then(() => {
            new Notice(`Gil Publisher: Published "${file.basename}".`);
          })
          .catch((err: unknown) => {
            new Notice(`Gil Publisher: Error publishing "${file.basename}": ${String(err)}`, 8000);
            console.error("[GilPublisher]", err);
          });
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

      const slugMap = buildSlugMap(this.app, this.settings.ignoredFolders);
      const publishedPaths = buildPublishedPaths(this.app, this.settings);
      try {
        await publishFile(this.app, file, this.settings, slugMap, publishedPaths);
        new Notice(`Gil Publisher: Published "${file.basename}".`);
      } catch (err) {
        new Notice(`Gil Publisher: Error — ${String(err)}`, 8000);
        console.error("[GilPublisher]", err);
      }
    });
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
