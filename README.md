# Obsidian Mind Map

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/lynchjames/obsidian-mind-map?style=for-the-badge&sort=semver)


This repository contains a plugin for [Obsidian](https://obsidian.md/) for viewing Markdown notes as Mind Maps using [Markmap](https://markmap.js.org/).

A similar plugin is available for [Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=gera2ld.markmap-vscode).

> [!IMPORTANT]
> This repository now has a community-maintained successor: [Mindmap NextGen](https://github.com/james-tindal/obsidian-mindmap-nextgen). New users should evaluate that project first. This repository is retained as an independent compatibility-recovery fork and is not affiliated with the successor project.

## Features

- Preview your current note as a Mind Map
- Mind Map preview updates as you select other panes, similar to the [Local Graph](https://forum.obsidian.md/t/how-to-open-a-local-graph-view-pane-on-the-right-sidebar/7190), [Outline](https://publish.obsidian.md/help/Plugins/Outline) and [Backlink](https://publish.obsidian.md/help/Plugins/Backlinks) panes

![Mind Map Demo Image](https://raw.githubusercontent.com/lynchjames/obsidian-mind-map/main/images/mind-map-demo.png)

## Usage

You can open the Mind Map preview for the current note with a command.

![Mind Map Preview Command](https://raw.githubusercontent.com/lynchjames/obsidian-mind-map/main/images/mind-map-preview-command.png)


### Preview More Options Menu

The Mind Map Preview view has 2 options from the "more options" menu:

![Mind Map Preview More Options](https://raw.githubusercontent.com/lynchjames/obsidian-mind-map/main/images/mind-map-view-more-options.png)

#### Pin

Allows you to pin the Mind Map preview pane to the current note so that you can select other notes with the current Mind Map remaining in place. A pin icon will appear in the header of the Mind Map preview pane. Click the pin icon to unpin.

#### Copy screenshot

Places a copy of the Mind Map SVG on your clipboard allowing you to paste it into a note in Obsidian or into an image editor of your choice.

## Compatibility

This maintained fork requires Obsidian 1.8.9 or newer. Version 2.0.0 has been verified in Obsidian Desktop 1.12.7. The abandoned upstream Community Plugins release is still version 1.1.0 and does not contain these fixes.

## Manual installation

This fork has not been published to Obsidian's official Community Plugins catalog. Installing the upstream catalog entry will install the old 1.1.0 build.

1. Run `npm install` and `npm run release:local` in this repository.
2. Copy the contents of `dist/obsidian-mind-map-2.0.0/` into `<vault>/.obsidian/plugins/obsidian-mind-map/`.
3. Confirm that the plugin folder directly contains `manifest.json` and `main.js` (not another nested release folder).
4. Reload Obsidian, open **Settings → Community plugins**, and enable **Mind Map**. Review Obsidian's trust prompt before enabling a manually installed plugin.

On macOS, press `Command+Shift+Dot` in Finder if `.obsidian` is hidden. Back up an existing `obsidian-mind-map` plugin folder before replacing it.

## For developers
Pull requests are both welcome and appreciated. 😀

If you would like to contribute to the development of this plugin, please follow the guidelines provided in [CONTRIBUTING.md](CONTRIBUTING.md).

From a fresh checkout, run the project recovery entry point:

```bash
./init.sh
```

It verifies the repository Harness, installs or verifies npm dependencies, type-checks the TypeScript source, runs the project tests, and produces `main.js`. The individual development commands are:

```bash
npm run dev       # rebuild on source changes
npm run typecheck # TypeScript validation
npm test          # project-owned Node tests
npm run build     # production main.js bundle
npm run verify    # typecheck, test, and build
npm run release:local # verified versioned directory in dist/
```

## Donating

This plugin is provided free of charge. If you would like to donate something to me, you can via [PayPal](https://paypal.me/lynchjames2020). Thank you!
