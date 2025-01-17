/**
 * @license
 * Copyright (c) 2021 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { FlattenedNodesObserver } from '@polymer/polymer/lib/utils/flattened-nodes-observer.js';
import { DirMixin } from '@vaadin/vaadin-element-mixin/vaadin-dir-mixin.js';
import { Templatizer } from './vaadin-grid-templatizer.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { animationFrame } from '@polymer/polymer/lib/utils/async.js';

/**
 * @polymerMixin
 */
export const ColumnBaseMixin = (superClass) =>
  class ColumnBaseMixin extends superClass {
    static get properties() {
      return {
        /**
         * When set to true, the column is user-resizable.
         * @default false
         */
        resizable: {
          type: Boolean,
          value: function () {
            if (this.localName === 'vaadin-grid-column-group') {
              return;
            }

            const parent = this.parentNode;
            if (parent && parent.localName === 'vaadin-grid-column-group') {
              return parent.resizable || false;
            } else {
              return false;
            }
          }
        },

        /**
         * @type {HTMLTemplateElement}
         * @protected
         */
        _headerTemplate: {
          type: Object
        },

        /**
         * @type {HTMLTemplateElement}
         * @protected
         */
        _footerTemplate: {
          type: Object
        },

        /**
         * When true, the column is frozen. When a column inside of a column group is frozen,
         * all of the sibling columns inside the group will get frozen also.
         * @type {boolean}
         */
        frozen: {
          type: Boolean,
          value: false
        },

        /**
         * When set to true, the cells for this column are hidden.
         */
        hidden: {
          type: Boolean,
          value: false
        },

        /**
         * Text content to display in the header cell of the column.
         */
        header: {
          type: String
        },

        /**
         * Aligns the columns cell content horizontally.
         * Supported values: "start", "center" and "end".
         * @attr {start|center|end} text-align
         * @type {GridColumnTextAlign | null | undefined}
         */
        textAlign: {
          type: String
        },

        /**
         * @type {boolean}
         * @protected
         */
        _lastFrozen: {
          type: Boolean,
          value: false
        },

        /** @protected */
        _order: Number,

        /** @private */
        _reorderStatus: Boolean,

        /**
         * @type {Array<!HTMLElement>}
         * @protected
         */
        _emptyCells: Array,

        /** @private */
        _headerCell: Object,

        /** @private */
        _footerCell: Object,

        /** @protected */
        _grid: Object,

        /**
         * Custom function for rendering the header content.
         * Receives two arguments:
         *
         * - `root` The header cell content DOM element. Append your content to it.
         * - `column` The `<vaadin-grid-column>` element.
         *
         * @type {GridHeaderFooterRenderer | null | undefined}
         */
        headerRenderer: Function,

        /**
         * Custom function for rendering the footer content.
         * Receives two arguments:
         *
         * - `root` The footer cell content DOM element. Append your content to it.
         * - `column` The `<vaadin-grid-column>` element.
         *
         * @type {GridHeaderFooterRenderer | null | undefined}
         */
        footerRenderer: Function
      };
    }

    static get observers() {
      return [
        '_widthChanged(width, _headerCell, _footerCell, _cells.*)',
        '_frozenChanged(frozen, _headerCell, _footerCell, _cells.*)',
        '_flexGrowChanged(flexGrow, _headerCell, _footerCell, _cells.*)',
        '_pathOrHeaderChanged(path, header, _headerCell, _footerCell, _cells.*, renderer, headerRenderer, _bodyTemplate, _headerTemplate)',
        '_textAlignChanged(textAlign, _cells.*, _headerCell, _footerCell)',
        '_orderChanged(_order, _headerCell, _footerCell, _cells.*)',
        '_lastFrozenChanged(_lastFrozen)',
        '_setBodyTemplateOrRenderer(_bodyTemplate, renderer, _cells, _cells.*)',
        '_setHeaderTemplateOrRenderer(_headerTemplate, headerRenderer, _headerCell)',
        '_setFooterTemplateOrRenderer(_footerTemplate, footerRenderer, _footerCell)',
        '_resizableChanged(resizable, _headerCell)',
        '_reorderStatusChanged(_reorderStatus, _headerCell, _footerCell, _cells.*)',
        '_hiddenChanged(hidden, _headerCell, _footerCell, _cells.*)'
      ];
    }

    /** @protected */
    connectedCallback() {
      super.connectedCallback();

      this._bodyTemplate && (this._bodyTemplate.templatizer._grid = this._grid);
      this._headerTemplate && (this._headerTemplate.templatizer._grid = this._grid);
      this._footerTemplate && (this._footerTemplate.templatizer._grid = this._grid);

      this._templateObserver.flush();
      if (!this._bodyTemplate) {
        // The observer might not have triggered if the tag is empty. Run manually.
        this._templateObserver.callback();
      }

      requestAnimationFrame(() => {
        this._allCells.forEach((cell) => {
          if (!cell._content.parentNode) {
            this._grid && this._grid.appendChild(cell._content);
          }
        });
      });
    }

    /** @protected */
    disconnectedCallback() {
      super.disconnectedCallback();

      requestAnimationFrame(() => {
        if (!this._findHostGrid()) {
          this._allCells.forEach((cell) => {
            if (cell._content.parentNode) {
              cell._content.parentNode.removeChild(cell._content);
            }
          });
        }
      });

      this._gridValue = undefined;
    }

    /**
     * @return {!GridElement | undefined}
     * @protected
     */
    _findHostGrid() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let el = this;
      // Custom elements extending grid must have a specific localName
      while (el && !/^vaadin.*grid(-pro)?$/.test(el.localName)) {
        el = el.assignedSlot ? el.assignedSlot.parentNode : el.parentNode;
      }
      return el || undefined;
    }

    /**
     * @return {!GridElement | undefined}
     * @protected
     */
    get _grid() {
      if (!this._gridValue) {
        this._gridValue = this._findHostGrid();
      }
      return this._gridValue;
    }

    /**
     * @return {!Array<!HTMLElement>}
     * @protected
     */
    get _allCells() {
      return []
        .concat(this._cells || [])
        .concat(this._emptyCells || [])
        .concat(this._headerCell)
        .concat(this._footerCell)
        .filter((cell) => cell);
    }

    constructor() {
      super();

      this._templateObserver = new FlattenedNodesObserver(this, () => {
        this._headerTemplate = this._prepareHeaderTemplate();
        this._footerTemplate = this._prepareFooterTemplate();
        this._bodyTemplate = this._prepareBodyTemplate();
      });
    }

    /**
     * @return {HTMLTemplateElement}
     * @protected
     */
    _prepareHeaderTemplate() {
      return this._prepareTemplatizer(this._findTemplate(true) || null, {});
    }

    /**
     * @return {HTMLTemplateElement}
     * @protected
     */
    _prepareFooterTemplate() {
      return this._prepareTemplatizer(this._findTemplate(false, true) || null, {});
    }

    /**
     * @return {HTMLTemplateElement}
     * @protected
     */
    _prepareBodyTemplate() {
      return this._prepareTemplatizer(this._findTemplate() || null);
    }

    /**
     * @param {HTMLTemplateElement} template
     * @param {object} instanceProps
     * @return {HTMLTemplateElement}
     * @protected
     */
    _prepareTemplatizer(template, instanceProps) {
      if (template && !template.templatizer) {
        const templatizer = new Templatizer();
        templatizer._grid = this._grid;
        templatizer.dataHost = this.dataHost;
        templatizer._instanceProps = instanceProps || templatizer._instanceProps;
        templatizer.template = template;
        template.templatizer = templatizer;
      }

      return template;
    }

    /** @protected */
    _renderHeaderAndFooter() {
      if (this.headerRenderer && this._headerCell) {
        this.__runRenderer(this.headerRenderer, this._headerCell);
      }
      if (this.footerRenderer && this._footerCell) {
        this.__runRenderer(this.footerRenderer, this._footerCell);
      }
    }

    /** @private */
    __runRenderer(renderer, cell, model) {
      const args = [cell._content, this];
      if (model && model.item) {
        args.push(model);
      }
      renderer.apply(this, args);
    }

    /** @private */
    __setColumnTemplateOrRenderer(template, renderer, cells) {
      // no renderer or template needed in a hidden column
      if (this.hidden || !this._grid) {
        return;
      }

      if (template && renderer) {
        throw new Error('You should only use either a renderer or a template');
      }

      cells.forEach((cell) => {
        const model = this._grid.__getRowModel(cell.parentElement);

        if (renderer) {
          cell._renderer = renderer;

          if (model.item || renderer === this.headerRenderer || renderer === this.footerRenderer) {
            this.__runRenderer(renderer, cell, model);
          }
        } else if (cell._template !== template) {
          cell._template = template;

          cell._content.innerHTML = '';
          template.templatizer._grid = template.templatizer._grid || this._grid;
          const inst = template.templatizer.createInstance();
          cell._content.appendChild(inst.root);
          cell._instance = inst;
          if (model.item) {
            cell._instance.setProperties(model);
          }
        }
      });
    }

    /** @private */
    _setBodyTemplateOrRenderer(template, renderer, cells) {
      if ((template || renderer) && cells) {
        this.__setColumnTemplateOrRenderer(template, renderer, cells);
      }
    }

    /** @private */
    _setHeaderTemplateOrRenderer(headerTemplate, headerRenderer, headerCell) {
      if ((headerTemplate || headerRenderer) && headerCell) {
        this.__setColumnTemplateOrRenderer(headerTemplate, headerRenderer, [headerCell]);
      }
    }

    /** @private */
    _setFooterTemplateOrRenderer(footerTemplate, footerRenderer, footerCell) {
      if ((footerTemplate || footerRenderer) && footerCell) {
        this.__setColumnTemplateOrRenderer(footerTemplate, footerRenderer, [footerCell]);
        this._grid.__updateHeaderFooterRowVisibility(footerCell.parentElement);
      }
    }

    /**
     * @param {boolean} header
     * @param {boolean} footer
     * @return {HTMLTemplateElement}
     * @protected
     */
    _selectFirstTemplate(header = false, footer = false) {
      return FlattenedNodesObserver.getFlattenedNodes(this).filter(
        (node) =>
          node.localName === 'template' &&
          node.classList.contains('header') === header &&
          node.classList.contains('footer') === footer
      )[0];
    }

    /**
     * @param {boolean} header
     * @param {boolean} footer
     * @return {HTMLTemplateElement}
     * @protected
     */
    _findTemplate(header, footer) {
      const template = this._selectFirstTemplate(header, footer);
      if (template) {
        if (this.dataHost) {
          // set dataHost to the context where template has been defined
          template._rootDataHost = this.dataHost._rootDataHost || this.dataHost;
        }
      }
      return template;
    }

    /** @private */
    _flexGrowChanged(flexGrow) {
      if (this.parentElement && this.parentElement._columnPropChanged) {
        this.parentElement._columnPropChanged('flexGrow');
      }

      this._allCells.forEach((cell) => (cell.style.flexGrow = flexGrow));
    }

    /** @private */
    _orderChanged(order) {
      this._allCells.forEach((cell) => (cell.style.order = order));
    }

    /** @private */
    _widthChanged(width) {
      if (this.parentElement && this.parentElement._columnPropChanged) {
        this.parentElement._columnPropChanged('width');
      }

      this._allCells.forEach((cell) => (cell.style.width = width));

      // Force a reflow to workaround browser issues causing double scrollbars to grid
      // https://github.com/vaadin/vaadin-grid/issues/1586
      if (this._grid && this._grid.__forceReflow) {
        this._grid.__forceReflow();
      }
    }

    /** @private */
    _frozenChanged(frozen) {
      if (this.parentElement && this.parentElement._columnPropChanged) {
        this.parentElement._columnPropChanged('frozen', frozen);
      }

      this._allCells.forEach((cell) => this._toggleAttribute('frozen', frozen, cell));

      this._grid && this._grid._frozenCellsChanged && this._grid._frozenCellsChanged();
    }

    /** @private */
    _lastFrozenChanged(lastFrozen) {
      this._allCells.forEach((cell) => this._toggleAttribute('last-frozen', lastFrozen, cell));

      if (this.parentElement && this.parentElement._columnPropChanged) {
        this.parentElement._lastFrozen = lastFrozen;
      }
    }

    /**
     * @param {string | undefined} path
     * @param {string | undefined} header
     * @param {!HTMLTableCellElement | undefined} headerCell
     * @param {!HTMLTableCellElement | undefined} footerCell
     * @param {!object | undefined} cells
     * @param {GridBodyRenderer | undefined} renderer
     * @param {GridHeaderFooterRenderer | undefined} headerRenderer
     * @param {HTMLTemplateElement | undefined} bodyTemplate
     * @param {HTMLTemplateElement | undefined} headerTemplate
     * @protected
     */
    _pathOrHeaderChanged(
      path,
      header,
      headerCell,
      footerCell,
      cells,
      renderer,
      headerRenderer,
      bodyTemplate,
      headerTemplate
    ) {
      const hasHeaderText = header !== undefined;
      if (!headerRenderer && !headerTemplate && hasHeaderText && headerCell) {
        this.__setTextContent(headerCell._content, header);
      }

      if (path && cells.value) {
        if (!renderer && !bodyTemplate) {
          const pathRenderer = (root, owner, { item }) => this.__setTextContent(root, this.get(path, item));
          this.__setColumnTemplateOrRenderer(undefined, pathRenderer, cells.value);
        }

        if (!headerRenderer && !headerTemplate && !hasHeaderText && headerCell && header !== null) {
          this.__setTextContent(headerCell._content, this._generateHeader(path));
        }
      }

      if (headerCell && this._grid) {
        this._grid.__updateHeaderFooterRowVisibility(headerCell.parentElement);
      }
    }

    /** @private */
    __setTextContent(node, textContent) {
      node.textContent !== textContent && (node.textContent = textContent);
    }

    /**
     * @param {string} path
     * @return {string}
     * @protected
     */
    _generateHeader(path) {
      return path
        .substr(path.lastIndexOf('.') + 1)
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/-/g, ' ')
        .replace(/^./, (match) => match.toUpperCase());
    }

    /**
     * @param {string} name
     * @param {boolean} bool
     * @param {!Element} node
     * @protected
     */
    _toggleAttribute(name, bool, node) {
      if (node.hasAttribute(name) === !bool) {
        if (bool) {
          node.setAttribute(name, '');
        } else {
          node.removeAttribute(name);
        }
      }
    }

    /** @private */
    _reorderStatusChanged(reorderStatus) {
      this._allCells.forEach((cell) => cell.setAttribute('reorder-status', reorderStatus));
    }

    /** @private */
    _resizableChanged(resizable, headerCell) {
      if (resizable === undefined || headerCell === undefined) {
        return;
      }

      if (headerCell) {
        [headerCell].concat(this._emptyCells).forEach((cell) => {
          if (cell) {
            const existingHandle = cell.querySelector('[part~="resize-handle"]');
            if (existingHandle) {
              cell.removeChild(existingHandle);
            }

            if (resizable) {
              const handle = document.createElement('div');
              handle.setAttribute('part', 'resize-handle');
              cell.appendChild(handle);
            }
          }
        });
      }
    }

    /** @private */
    _textAlignChanged(textAlign) {
      if (textAlign === undefined) {
        return;
      }
      if (['start', 'end', 'center'].indexOf(textAlign) === -1) {
        console.warn('textAlign can only be set as "start", "end" or "center"');
        return;
      }

      let textAlignFallback;
      if (getComputedStyle(this._grid).direction === 'ltr') {
        if (textAlign === 'start') {
          textAlignFallback = 'left';
        } else if (textAlign === 'end') {
          textAlignFallback = 'right';
        }
      } else {
        if (textAlign === 'start') {
          textAlignFallback = 'right';
        } else if (textAlign === 'end') {
          textAlignFallback = 'left';
        }
      }

      this._allCells.forEach((cell) => {
        cell._content.style.textAlign = textAlign;
        if (getComputedStyle(cell._content).textAlign !== textAlign) {
          cell._content.style.textAlign = textAlignFallback;
        }
      });
    }

    /** @private */
    _hiddenChanged(hidden) {
      if (this.parentElement && this.parentElement._columnPropChanged) {
        this.parentElement._columnPropChanged('hidden', hidden);
      }

      if (!!hidden !== !!this._previousHidden && this._grid) {
        if (hidden === true) {
          this._allCells.forEach((cell) => {
            if (cell._content.parentNode) {
              cell._content.parentNode.removeChild(cell._content);
            }
          });
        }
        this._grid._debouncerHiddenChanged = Debouncer.debounce(
          this._grid._debouncerHiddenChanged,
          animationFrame,
          () => {
            if (this._grid && this._grid._renderColumnTree) {
              this._grid._renderColumnTree(this._grid._columnTree);
            }
          }
        );

        this._grid._updateLastFrozen && this._grid._updateLastFrozen();
        this._grid.notifyResize && this._grid.notifyResize();
        this._grid._resetKeyboardNavigation && this._grid._resetKeyboardNavigation();
      }
      this._previousHidden = hidden;
    }
  };

/**
 * A `<vaadin-grid-column>` is used to configure how a column in `<vaadin-grid>`
 * should look like.
 *
 * See [`<vaadin-grid>`](#/elements/vaadin-grid) documentation for instructions on how
 * to configure the `<vaadin-grid-column>`.
 *
 * @extends HTMLElement
 * @mixes ColumnBaseMixin
 */
class GridColumnElement extends ColumnBaseMixin(DirMixin(PolymerElement)) {
  static get is() {
    return 'vaadin-grid-column';
  }

  static get properties() {
    return {
      /**
       * Width of the cells for this column.
       */
      width: {
        type: String,
        value: '100px'
      },

      /**
       * Flex grow ratio for the cell widths. When set to 0, cell width is fixed.
       * @attr {number} flex-grow
       * @type {number}
       */
      flexGrow: {
        type: Number,
        value: 1
      },

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
       *
       * @type {GridBodyRenderer | null | undefined}
       */
      renderer: Function,

      /**
       * Path to an item sub-property whose value gets displayed in the column body cells.
       * The property name is also shown in the column header if an explicit header or renderer isn't defined.
       */
      path: {
        type: String
      },

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
       * @type {boolean}
       */
      autoWidth: {
        type: Boolean,
        value: false
      },

      /**
       * @type {HTMLTemplateElement}
       * @protected
       */
      _bodyTemplate: {
        type: Object
      },

      /**
       * @type {Array<!HTMLElement>}
       * @protected
       */
      _cells: Array
    };
  }
}

customElements.define(GridColumnElement.is, GridColumnElement);

export { GridColumnElement };
