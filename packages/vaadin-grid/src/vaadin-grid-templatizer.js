/**
 * @license
 * Copyright (c) 2021 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import { templatize } from '@polymer/polymer/lib/utils/templatize.js';

/**
 * `vaadin-grid-templatizer` is a helper element for the `vaadin-grid` that is preparing and
 * stamping instances of cells and columns templates
 *
 * @extends HTMLElement
 * @private
 */
class GridTemplatizer extends PolymerElement {
  static get is() {
    return 'vaadin-grid-templatizer';
  }

  static get properties() {
    return {
      dataHost: Object,

      template: Object,

      _templateInstances: {
        type: Array,
        value: function () {
          return [];
        }
      },

      _parentPathValues: {
        value: function () {
          return {};
        }
      },

      _grid: Object
    };
  }

  static get observers() {
    return ['_templateInstancesChanged(_templateInstances.*, _parentPathValues.*)'];
  }

  constructor() {
    super();

    this._instanceProps = {
      detailsOpened: true,
      index: true,
      item: true,
      selected: true,
      expanded: true,
      level: true
    };
  }

  createInstance() {
    this._ensureTemplatized();
    const instance = new this._TemplateClass({});
    this.addInstance(instance);

    return instance;
  }

  addInstance(instance) {
    if (this._templateInstances.indexOf(instance) === -1) {
      this._templateInstances.push(instance);
      requestAnimationFrame(() => this.notifyPath('_templateInstances.*', this._templateInstances));
    }
  }

  removeInstance(instance) {
    const index = this._templateInstances.indexOf(instance);
    this.splice('_templateInstances', index, 1);
  }

  _ensureTemplatized() {
    if (!this._TemplateClass) {
      this._TemplateClass = templatize(this.template, this, {
        instanceProps: this._instanceProps,
        parentModel: true,

        forwardHostProp: function (prop, value) {
          this._forwardParentProp(prop, value);

          if (this._templateInstances) {
            this._templateInstances.forEach((inst) => inst.notifyPath(prop, value));
          }
        },

        notifyInstanceProp: function (inst, prop, value) {
          if (prop === 'index' || prop === 'item') {
            // We don’t need a change notification for these.
            return;
          }

          const originalProp = `__${prop}__`;

          // Notify for only user-action changes, not for scrolling updates. E. g.,
          // if `detailsOpened` is different from `__detailsOpened__`, which was set during render.
          if (inst[originalProp] === value) {
            return;
          }
          inst[originalProp] = value;

          const row = Array.from(this._grid.$.items.children).filter((row) =>
            this._grid._itemsEqual(row._item, inst.item)
          )[0];
          if (row) {
            Array.from(row.children).forEach((cell) => {
              if (cell._instance) {
                cell._instance[originalProp] = value;
                cell._instance.notifyPath(prop, value);
              }
            });
          }

          const itemPrefix = 'item.';
          if (Array.isArray(this._grid.items) && prop.indexOf(itemPrefix) === 0) {
            const itemsIndex = this._grid.items.indexOf(inst.item);
            const path = prop.slice(itemPrefix.length);
            this._grid.notifyPath(`items.${itemsIndex}.${path}`, value);
          }

          const gridCallback = `_${prop}InstanceChangedCallback`;
          if (this._grid && this._grid[gridCallback]) {
            this._grid[gridCallback](inst, value);
          }
        }
      });
    }
  }

  _forwardParentProp(prop, value) {
    this._parentPathValues[prop] = value;
    this._templateInstances.forEach((inst) => inst.notifyPath(prop, value));
  }

  _templateInstancesChanged(t) {
    let index, count;
    if (t.path === '_templateInstances') {
      // Iterate all instances
      index = 0;
      count = this._templateInstances.length;
    } else if (t.path === '_templateInstances.splices') {
      // Iterate only new instances
      index = t.value.index;
      count = t.value.addedCount;
    } else {
      return;
    }
    Object.keys(this._parentPathValues || {}).forEach((keyName) => {
      for (let i = index; i < index + count; i++) {
        this._templateInstances[i].set(keyName, this._parentPathValues[keyName]);
      }
    });
  }
}

customElements.define(GridTemplatizer.is, GridTemplatizer);

export { GridTemplatizer as Templatizer };
