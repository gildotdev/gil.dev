import { App, PluginSettingTab, Setting } from "obsidian";
import type GilPublisherPlugin from "./main";

export interface PluginSettings {
  targetRepoPath: string;
  publishFolder: string;
  ignoredFolders: string[];
  imageTargetSubpath: string;
  notesTargetSubpath: string;
}

export const DEFAULT_IGNORED_FOLDERS = [
  "Clients",
  "ai-work",
  "daily-notes",
  "codecraft-works",
  "codceraft-works",
];

export const DEFAULT_SETTINGS: PluginSettings = {
  targetRepoPath: "",
  publishFolder: "",
  ignoredFolders: DEFAULT_IGNORED_FOLDERS,
  imageTargetSubpath: "apps/gil.dev/src/assets",
  notesTargetSubpath: "apps/gil.dev/src/content/notes",
};

export class GilPublisherSettingTab extends PluginSettingTab {
  plugin: GilPublisherPlugin;

  constructor(app: App, plugin: GilPublisherPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Astro repo path")
      .setDesc(
        "Absolute path to the root of your Astro site repository (e.g. /Users/you/projects/gil.dev)"
      )
      .addText((text) =>
        text
          .setPlaceholder("/Users/you/projects/gil.dev")
          .setValue(this.plugin.settings.targetRepoPath)
          .onChange(async (value) => {
            this.plugin.settings.targetRepoPath = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Publish folder")
      .setDesc(
        "Only publish notes inside this vault folder (e.g. Published). Leave blank to publish all notes."
      )
      .addText((text) =>
        text
          .setPlaceholder("Published")
          .setValue(this.plugin.settings.publishFolder)
          .onChange(async (value) => {
            this.plugin.settings.publishFolder = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Notes output path")
      .setDesc("Subpath within the repo where notes are written.")
      .addText((text) =>
        text
          .setPlaceholder("apps/gil.dev/src/content/notes")
          .setValue(this.plugin.settings.notesTargetSubpath)
          .onChange(async (value) => {
            this.plugin.settings.notesTargetSubpath = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Images output path")
      .setDesc("Subpath within the repo where images are copied.")
      .addText((text) =>
        text
          .setPlaceholder("apps/gil.dev/src/assets")
          .setValue(this.plugin.settings.imageTargetSubpath)
          .onChange(async (value) => {
            this.plugin.settings.imageTargetSubpath = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Ignored folders")
      .setDesc(
        "Comma-separated vault folder names that recursive publishing must never enter. Matching ignores case and treats spaces, underscores, and hyphens alike."
      )
      .addText((text) =>
        text
          .setPlaceholder("Clients, ai-work, daily-notes, codecraft-works")
          .setValue(this.plugin.settings.ignoredFolders.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.ignoredFolders = value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            await this.plugin.saveSettings();
          })
      );
  }
}
