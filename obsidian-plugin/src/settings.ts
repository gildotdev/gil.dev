import { App, PluginSettingTab, Setting } from "obsidian";
import type GilPublisherPlugin from "./main";

export interface PluginSettings {
  targetRepoPath: string;
  publishFolder: string;
  ignoredFolders: string[];
  imageTargetSubpath: string;
  notesTargetSubpath: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  targetRepoPath: "",
  publishFolder: "",
  ignoredFolders: [],
  imageTargetSubpath: "src/assets",
  notesTargetSubpath: "src/content/notes",
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
          .setPlaceholder("src/content/notes")
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
          .setPlaceholder("src/assets")
          .setValue(this.plugin.settings.imageTargetSubpath)
          .onChange(async (value) => {
            this.plugin.settings.imageTargetSubpath = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Ignored folders")
      .setDesc(
        "Comma-separated list of vault folder names to skip (e.g. Templates, Archive, Private)"
      )
      .addText((text) =>
        text
          .setPlaceholder("Templates, Archive, Private")
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
