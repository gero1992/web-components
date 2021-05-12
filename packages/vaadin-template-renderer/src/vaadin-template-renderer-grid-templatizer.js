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
export class GridTemplatizer extends PolymerElement {
  static create(component, template) {
    const templatizer = new GridTemplatizer();
    templatizer.__grid = component._grid;
    templatizer.__template = template;
    return templatizer;
  }

  static get is() {
    return 'vaadin-template-renderer-grid-templatizer';
  }

  static get properties() {
    return {
      dataHost: Object,

      template: Object,

      __templateInstances: {
        type: Array,
        value: function () {
          return [];
        }
      },

      __parentPathValues: {
        value: function () {
          return {};
        }
      },

      __grid: Object
    };
  }

  static get observers() {
    return ['_templateInstancesChanged(__templateInstances.*, __parentPathValues.*)'];
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

  render(element, properties = {}) {
    if (this.__templateInstances.indexOf(element.__templateInstance) !== -1) {
      Object.assign(element.__templateInstance, properties);
      // element.__templateInstance.setProperties(properties);
      return;
    }

    // Otherwise, it instantiates a new template instance
    // with the given properties and then renders the result to the element
    const templateInstance = this.createInstance(properties);
    element.innerHTML = '';
    element.__templateInstance = templateInstance;
    element.appendChild(templateInstance.root);

    Object.assign(element.__templateInstance, properties);
  }

  createInstance() {
    this._ensureTemplatized();
    const instance = new this._TemplateClass({});
    this.addInstance(instance);

    return instance;
  }

  addInstance(instance) {
    if (this.__templateInstances.indexOf(instance) === -1) {
      this.__templateInstances.push(instance);
      requestAnimationFrame(() => this.notifyPath('__templateInstances.*', this.__templateInstances));
    }
  }

  removeInstance(instance) {
    const index = this.__templateInstances.indexOf(instance);
    this.splice('__templateInstances', index, 1);
  }

  _ensureTemplatized() {
    if (!this._TemplateClass) {
      this._TemplateClass = templatize(this.template, this, {
        instanceProps: this._instanceProps,
        parentModel: true,

        forwardHostProp: function (prop, value) {
          this._forwardParentProp(prop, value);

          if (this.__templateInstances) {
            this.__templateInstances.forEach((inst) => inst.notifyPath(prop, value));
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

          const row = Array.from(this.__grid.$.items.children).filter((row) =>
            this.__grid._itemsEqual(row._item, inst.item)
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
          if (Array.isArray(this.__grid.items) && prop.indexOf(itemPrefix) === 0) {
            const itemsIndex = this.__grid.items.indexOf(inst.item);
            const path = prop.slice(itemPrefix.length);
            this.__grid.notifyPath(`items.${itemsIndex}.${path}`, value);
          }

          const gridCallback = `_${prop}InstanceChangedCallback`;
          if (this.__grid && this.__grid[gridCallback]) {
            this.__grid[gridCallback](inst, value);
          }
        }
      });
    }
  }

  _forwardParentProp(prop, value) {
    this.__parentPathValues[prop] = value;
    this.__templateInstances.forEach((inst) => inst.notifyPath(prop, value));
  }

  _templateInstancesChanged(t) {
    let index, count;
    if (t.path === '__templateInstances') {
      // Iterate all instances
      index = 0;
      count = this.__templateInstances.length;
    } else if (t.path === '__templateInstances.splices') {
      // Iterate only new instances
      index = t.value.index;
      count = t.value.addedCount;
    } else {
      return;
    }
    Object.keys(this.__parentPathValues || {}).forEach((keyName) => {
      for (let i = index; i < index + count; i++) {
        this.__templateInstances[i].set(keyName, this.__parentPathValues[keyName]);
      }
    });
  }
}

customElements.define(GridTemplatizer.is, GridTemplatizer);
