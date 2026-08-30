import {
  ItemView,
  MarkdownView,
  Menu,
  TAbstractFile,
  TFile,
  ViewStateResult,
  WorkspaceLeaf,
} from 'obsidian';
import { INode } from 'markmap-common';
import { Markmap } from 'markmap-view';
import { IMarkmapOptions } from 'markmap-view/types/types';
import { copyImageToClipboard } from './copy-image';
import { MM_VIEW_TYPE } from './constants';
import { createSVG, getComputedCss, removeExistingSVG } from './markmap-svg';
import { transformMindMapMarkdown } from './markdown-transform';
import ObsidianMarkmap from './obsidian-markmap-plugin';
import { MindMapSettings } from './settings';

interface MindmapViewState {
  file?: string;
  pinned: boolean;
}

export default class MindmapView extends ItemView {
  private filePath?: string;
  private fileName?: string;
  private displayText = 'Mind Map';
  private currentMd = '';
  private emptyDiv?: HTMLDivElement;
  private svg?: SVGElement;
  private markmap?: Markmap;
  private obsMarkmap?: ObsidianMarkmap;
  private isLeafPinned = false;
  private pinAction?: HTMLElement;
  private lastOpenedMarkdownPath?: string;
  private eventCleanups: Array<() => void> = [];
  private opened = false;

  constructor(private readonly settings: MindMapSettings, leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return MM_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.displayText;
  }

  getIcon(): string {
    return 'dot-network';
  }

  getState(): Record<string, unknown> {
    return {
      file: this.filePath,
      pinned: this.isLeafPinned,
    } satisfies MindmapViewState;
  }

  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);
    const restored = this.normalizeState(state);
    this.isLeafPinned = restored.pinned;
    this.setSourcePath(restored.file);
    this.updatePinAction();
    if (this.opened) await this.update();
  }

  onMoreOptionsMenu(menu: Menu): void {
    menu
      .addItem((item) =>
        item
          .setIcon('pin')
          .setTitle(this.isLeafPinned ? 'Unpin mind map' : 'Pin mind map')
          .onClick(() => this.setPinned(!this.isLeafPinned)),
      )
      .addSeparator()
      .addItem((item) =>
        item
          .setIcon('image-file')
          .setTitle('Copy screenshot')
          .onClick(() => {
            void copyImageToClipboard(this.svg);
          }),
      );
  }

  async onOpen(): Promise<void> {
    this.opened = true;
    this.obsMarkmap = new ObsidianMarkmap(this.app.vault);
    this.pinAction = this.addAction('pin', 'Pin mind map', () => {
      this.setPinned(!this.isLeafPinned);
    });
    this.updatePinAction();

    const fileOpenRef = this.app.workspace.on('file-open', (file) => this.handleOpenedFile(file));
    const modifyRef = this.app.vault.on('modify', (file) => this.refreshModifiedFile(file));
    const resizeRef = this.app.workspace.on('resize', () => void this.update());
    const cssRef = this.app.workspace.on('css-change', () => void this.update());
    this.eventCleanups = [
      () => this.app.workspace.offref(fileOpenRef),
      () => this.app.vault.offref(modifyRef),
      () => this.app.workspace.offref(resizeRef),
      () => this.app.workspace.offref(cssRef),
    ];

    if (!this.filePath) this.followActiveMarkdownLeaf();
    await this.update();
  }

  async onClose(): Promise<void> {
    this.opened = false;
    for (const cleanup of this.eventCleanups) cleanup();
    this.eventCleanups = [];
    removeExistingSVG(this.contentEl);
    this.markmap = undefined;
    this.svg = undefined;
  }

  private normalizeState(state: unknown): MindmapViewState {
    const value = state && typeof state === 'object'
      ? state as { file?: unknown; pinned?: unknown }
      : {};
    return {
      file: typeof value.file === 'string' ? value.file : undefined,
      pinned: value.pinned === true,
    };
  }

  private setPinned(pinned: boolean): void {
    this.isLeafPinned = pinned;
    this.updatePinAction();
    if (!pinned) this.followLatestMarkdownFile();
    this.app.workspace.requestSaveLayout();
  }

  private updatePinAction(): void {
    if (!this.pinAction) return;
    this.pinAction.toggleClass('is-active', this.isLeafPinned);
    const label = this.isLeafPinned ? 'Unpin mind map' : 'Pin mind map';
    this.pinAction.setAttribute('aria-label', label);
    this.pinAction.setAttribute('data-tooltip-position', 'bottom');
  }

  private followActiveMarkdownLeaf(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view?.file) this.handleOpenedFile(view.file);
  }

  private handleOpenedFile(file: TFile | null): void {
    if (!file || file.extension !== 'md') return;
    this.lastOpenedMarkdownPath = file.path;
    if (this.isLeafPinned) return;
    const changed = file.path !== this.filePath;
    this.setSourceFile(file);
    if (changed && this.opened) void this.update();
  }

  private followLatestMarkdownFile(): void {
    const latest = this.lastOpenedMarkdownPath
      ? this.app.vault.getAbstractFileByPath(this.lastOpenedMarkdownPath)
      : null;
    if (latest instanceof TFile && latest.extension === 'md') {
      this.handleOpenedFile(latest);
      return;
    }
    this.followActiveMarkdownLeaf();
  }

  private refreshModifiedFile(file: TAbstractFile): void {
    if (file instanceof TFile && file.path === this.filePath && this.opened) {
      void this.update();
    }
  }

  private setSourcePath(path?: string): void {
    const file = path ? this.app.vault.getAbstractFileByPath(path) : null;
    if (file instanceof TFile && file.extension === 'md') {
      this.setSourceFile(file);
      return;
    }
    this.filePath = undefined;
    this.fileName = undefined;
    this.displayText = 'Mind Map';
  }

  private setSourceFile(file: TFile): void {
    this.filePath = file.path;
    this.fileName = file.basename;
    this.displayText = `Mind Map of ${file.basename}`;
    const leafWithHeader = this.leaf as WorkspaceLeaf & { updateHeader?: () => void };
    leafWithHeader.updateHeader?.();
  }

  private async update(): Promise<void> {
    const file = this.filePath
      ? this.app.vault.getAbstractFileByPath(this.filePath)
      : null;
    if (!(file instanceof TFile)) {
      this.displayEmpty('No Markdown note selected');
      return;
    }

    try {
      this.currentMd = await this.app.vault.cachedRead(file);
      if (this.currentMd.trim().length === 0) {
        this.displayEmpty('No content found');
        return;
      }

      const { root } = transformMindMapMarkdown(this.currentMd);
      this.obsMarkmap?.updateInternalLinks(root);
      this.hideEmptyState();
      this.svg = createSVG(this.contentEl, this.settings.lineHeight);
      this.renderMarkmap(root, this.svg);
    } catch (error) {
      console.error('Mind Map: unable to render note', error);
      this.displayEmpty('Unable to render this note as a mind map');
    }
  }

  private renderMarkmap(root: INode, svg: SVGElement): void {
    const { font } = getComputedCss(this.contentEl);
    const options: IMarkmapOptions = {
      autoFit: false,
      duration: 10,
      nodeFont: font,
      nodeMinHeight: this.settings.nodeMinHeight ?? 16,
      spacingVertical: this.settings.spacingVertical ?? 5,
      spacingHorizontal: this.settings.spacingHorizontal ?? 80,
      paddingX: this.settings.paddingX ?? 8,
    };
    this.markmap = Markmap.create(svg, options, root);
  }

  private displayEmpty(message: string): void {
    removeExistingSVG(this.contentEl);
    this.svg = undefined;
    this.markmap = undefined;
    if (!this.emptyDiv) {
      this.emptyDiv = document.createElement('div');
      this.emptyDiv.className = 'pane-empty';
      this.contentEl.appendChild(this.emptyDiv);
    }
    this.emptyDiv.innerText = message;
    this.emptyDiv.toggle(true);
  }

  private hideEmptyState(): void {
    this.emptyDiv?.toggle(false);
  }
}
