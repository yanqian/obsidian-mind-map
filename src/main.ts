import { MarkdownView, Plugin, SplitDirection, TFile, WorkspaceLeaf } from 'obsidian';
import MindmapView from './mindmap-view';
import { MM_VIEW_TYPE } from './constants';
import { MindMapSettings } from './settings';
import { MindMapSettingsTab } from './settings-tab';

const DEFAULT_SETTINGS: MindMapSettings = {
  splitDirection: 'horizontal',
  nodeMinHeight: 16,
  lineHeight: '1em',
  spacingVertical: 5,
  spacingHorizontal: 80,
  paddingX: 8,
};

export default class MindMap extends Plugin {
  settings: MindMapSettings;

  async onload(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.registerView(
      MM_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new MindmapView(this.settings, leaf),
    );

    this.addCommand({
      id: 'app:markmap-preview',
      name: 'Preview the current note as a Mind Map',
      checkCallback: (checking) => {
        const file = this.currentMarkdownFile();
        if (!file) return false;
        if (!checking) void this.openPreview(file);
        return true;
      },
    });

    this.addSettingTab(new MindMapSettingsTab(this.app, this));
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(MM_VIEW_TYPE);
  }

  private currentMarkdownFile(): TFile | null {
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (markdownView?.file) return markdownView.file;

    const file = this.app.workspace.getActiveFile();
    return file?.extension === 'md' ? file : null;
  }

  private async openPreview(file: TFile): Promise<void> {
    let leaf = this.app.workspace.getLeavesOfType(MM_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf('split', this.splitDirection());
    }

    await leaf.setViewState({
      type: MM_VIEW_TYPE,
      active: true,
      state: { file: file.path },
    });
    await this.app.workspace.revealLeaf(leaf);
  }

  private splitDirection(): SplitDirection {
    return this.settings.splitDirection === 'vertical' ? 'vertical' : 'horizontal';
  }
}
