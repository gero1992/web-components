import { GridElement } from './vaadin-grid.js';

import { GridBodyRenderer, GridColumnTextAlign, GridHeaderFooterRenderer, GridDefaultItem } from './interfaces';

declare function ColumnBaseMixin<TItem, T extends new (...args: any[]) => {}>(
  base: T
): T & ColumnBaseMixinConstructor<TItem>;

export interface ColumnBaseMixinConstructor<TItem> {
  new (...args: any[]): ColumnBaseMixin<TItem>;
}

interface ColumnBaseMixin<TItem> {
  readonly _grid: GridElement<TItem> | undefined;
  readonly _allCells: HTMLElement[];

  /**
   * When set to true, the column is user-resizable.
   */
  resizable: boolean | null | undefined;

  _headerTemplate: HTMLTemplateElement | null;

  _footerTemplate: HTMLTemplateElement | null;

  /**
   * When true, the column is frozen. When a column inside of a column group is frozen,
   * all of the sibling columns inside the group will get frozen also.
   */
  frozen: boolean;

  /**
   * When set to true, the cells for this column are hidden.
   */
  hidden: boolean;

  /**
   * Text content to display in the header cell of the column.
   */
  header: string | null | undefined;

  /**
   * Aligns the columns cell content horizontally.
   * Supported values: "start", "center" and "end".
   * @attr {start|center|end} text-align
   */
  textAlign: GridColumnTextAlign | null | undefined;

  _lastFrozen: boolean;

  _order: number | null | undefined;

  _emptyCells: HTMLElement[] | null;

  /**
   * Custom function for rendering the header content.
   * Receives two arguments:
   *
   * - `root` The header cell content DOM element. Append your content to it.
   * - `column` The `<vaadin-grid-column>` element.
   */
  headerRenderer: GridHeaderFooterRenderer<TItem> | null | undefined;

  /**
   * Custom function for rendering the footer content.
   * Receives two arguments:
   *
   * - `root` The footer cell content DOM element. Append your content to it.
   * - `column` The `<vaadin-grid-column>` element.
   */
  footerRenderer: GridHeaderFooterRenderer<TItem> | null | undefined;

  _findHostGrid(): GridElement<TItem> | undefined;

  _prepareHeaderTemplate(): HTMLTemplateElement | null;

  _prepareFooterTemplate(): HTMLTemplateElement | null;

  _prepareBodyTemplate(): HTMLTemplateElement | null;

  _prepareTemplatizer(template: HTMLTemplateElement | null, instanceProps: object | null): HTMLTemplateElement | null;

  _renderHeaderAndFooter(): void;

  _selectFirstTemplate(header?: boolean, footer?: boolean): HTMLTemplateElement | null;

  _findTemplate(header: boolean, footer: boolean): HTMLTemplateElement | null;

  _pathOrHeaderChanged(
    path: string | undefined,
    header: string | undefined,
    headerCell: HTMLTableCellElement | undefined,
    footerCell: HTMLTableCellElement | undefined,
    cells: object | undefined,
    renderer: GridBodyRenderer<TItem> | null | undefined,
    headerRenderer: GridHeaderFooterRenderer<TItem> | null | undefined,
    bodyTemplate: HTMLTemplateElement | null | undefined,
    headerTemplate: HTMLTemplateElement | null | undefined
  ): void;

  _generateHeader(path: string): string;

  _toggleAttribute(name: string, bool: boolean, node: Element): void;
}

/**
 * A `<vaadin-grid-column>` is used to configure how a column in `<vaadin-grid>`
 * should look like.
 *
 * See [`<vaadin-grid>`](#/elements/vaadin-grid) documentation for instructions on how
 * to configure the `<vaadin-grid-column>`.
 */
declare class GridColumnElement<TItem = GridDefaultItem> extends HTMLElement {
  /**
   * Width of the cells for this column.
   */
  width: string | null | undefined;

  /**
   * Flex grow ratio for the cell widths. When set to 0, cell width is fixed.
   * @attr {number} flex-grow
   */
  flexGrow: number;

  /**
   * Custom function for rendering the cell content.
   * Receives three arguments:
   *
   * - `root` The cell content DOM element. Append your content to it.
   * - `column` The `<vaadin-grid-column>` element.
   * - `model` The object with the properties related with
   *   the rendered item, contains:
   *   - `model.index` The index of the item.
   *   - `model.item` The item.
   *   - `model.expanded` Sublevel toggle state.
   *   - `model.level` Level of the tree represented with a horizontal offset of the toggle button.
   *   - `model.selected` Selected state.
   */
  renderer: GridBodyRenderer<TItem> | null | undefined;

  /**
   * Path to an item sub-property whose value gets displayed in the column body cells.
   * The property name is also shown in the column header if an explicit header or renderer isn't defined.
   */
  path: string | null | undefined;

  /**
   * Automatically sets the width of the column based on the column contents when this is set to `true`.
   *
   * For performance reasons the column width is calculated automatically only once when the grid items
   * are rendered for the first time and the calculation only considers the rows which are currently
   * rendered in DOM (a bit more than what is currently visible). If the grid is scrolled, or the cell
   * content changes, the column width might not match the contents anymore.
   *
   * Hidden columns are ignored in the calculation and their widths are not automatically updated when
   * you show a column that was initially hidden.
   *
   * You can manually trigger the auto sizing behavior again by calling `grid.recalculateColumnWidths()`.
   *
   * The column width may still grow larger when `flexGrow` is not 0.
   * @attr {boolean} auto-width
   */
  autoWidth: boolean;

  _bodyTemplate: HTMLTemplateElement | null;

  _cells: HTMLElement[] | null;
}

interface GridColumnElement<TItem = GridDefaultItem> extends ColumnBaseMixin<TItem> {}

declare global {
  interface HTMLElementTagNameMap {
    'vaadin-grid-column': GridColumnElement<GridDefaultItem>;
  }
}

export { ColumnBaseMixin, GridColumnElement };
