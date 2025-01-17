import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';

import { ElementMixin } from '@vaadin/vaadin-element-mixin/vaadin-element-mixin.js';

export type VirtualListItem = unknown;

export interface VirtualListItemModel {
  index: number;
  item: VirtualListItem;
}

export type VirtualListRenderer = (
  root: HTMLElement,
  virtualList: VirtualListElement,
  model: VirtualListItemModel
) => void;

/**
 * `<vaadin-virtual-list>` is a Web Component for displaying a virtual/infinite list or items.
 *
 * ```html
 * <vaadin-virtual-list></vaadin-virtual-list>
 * ```
 *
 * ```js
 * const list = document.querySelector('vaadin-virtual-list');
 * list.items = items; // An array of data items
 * list.renderer = (root, list, {item, index}) => {
 *   root.textContent = `#${index}: ${item.name}`
 * }
 * ```
 *
 * See [Virtual List](https://vaadin.com/docs/latest/ds/components/virtual-list) documentation.
 *
 * @extends HTMLElement
 * @mixes ElementMixin
 * @mixes ThemableMixin
 */
declare class VirtualListElement extends ElementMixin(ThemableMixin(HTMLElement)) {
  /**
   * Custom function for rendering the content of every item.
   * Receives three arguments:
   *
   * - `root` The render target element representing one item at a time.
   * - `virtualList` The reference to the `<vaadin-virtual-list>` element.
   * - `model` The object with the properties related with the rendered
   *   item, contains:
   *   - `model.index` The index of the rendered item.
   *   - `model.item` The item.
   */
  renderer: VirtualListRenderer | undefined;

  /**
   * An array containing items determining how many instances to render.
   */
  items: Array<VirtualListItem> | undefined;

  /**
   * Scroll to a specific index in the virtual list.
   */
  scrollToIndex(index: number): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'vaadin-virtual-list': VirtualListElement;
  }
}

export { VirtualListElement };
