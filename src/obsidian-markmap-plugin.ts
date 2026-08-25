import { INode } from 'markmap-common';
import { getLinkpath, Vault } from 'obsidian';
import { rewriteInternalLinks } from './markdown-transform';

export default class ObsidianMarkmap {
    vaultName: string;

    constructor(vault: Vault) {
        this.vaultName = vault.getName();
    }

    updateInternalLinks(node: INode) {
        rewriteInternalLinks(node, this.vaultName, getLinkpath);
    }

}
