/**
 * @license
 * Copyright (c) 2021 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';
import '@vaadin/vaadin-text-field/src/vaadin-text-field.js';

/**
 * `<vaadin-grid-filter>` is a helper element for the `<vaadin-grid>` that provides out-of-the-box UI controls,
 * and handlers for filtering the grid data.
 *
 * #### Example:
 * ```html
 * <vaadin-grid-column>
 *   <template class="header">
 *     <vaadin-grid-filter path="name.first"></vaadin-grid-filter>
 *   </template>
 *   <template>[[item.name.first]]</template>
 * </vaadin-grid-column>
 * ```
 *
 * @fires {CustomEvent} value-changed - Fired when the `value` property changes.
 *
 * @extends HTMLElement
 */
class GridFilterElement extends class extends PolymerElement {} {
  static get template() {
    return html`
      <style>
        :host {
          display: inline-flex;
          max-width: 100%;
        }

        #filter {
          width: 100%;
          box-sizing: border-box;
        }
      </style>
      <slot name="filter">
        <vaadin-text-field id="filter" value="{{value}}"></vaadin-text-field>
      </slot>
    `;
  }

  static get is() {
    return 'vaadin-grid-filter';
  }

  static get properties() {
    return {
      /**
       * JS Path of the property in the item used for filtering the data.
       */
      path: String,

      /**
       * Current filter value.
       */
      value: {
        type: String,
        notify: true
      },

      /** @private */
      _connected: Boolean
    };
  }

  /** @protected */
  connectedCallback() {
    super.connectedCallback();
    this._connected = true;
  }

  static get observers() {
    return ['_filterChanged(path, value, _connected)'];
  }

  /** @protected */
  ready() {
    super.ready();

    const child = this.firstElementChild;
    if (child && child.getAttribute('slot') !== 'filter') {
      console.warn('Make sure you have assigned slot="filter" to the child elements of <vaadin-grid-filter>');
      child.setAttribute('slot', 'filter');
    }
  }

  /** @private */
  _filterChanged(path, value, connected) {
    if (path === undefined || value === undefined || !connected) {
      return;
    }
    if (this._previousValue === undefined && value === '') {
      return;
    }
    this._previousValue = value;

    this._debouncerFilterChanged = Debouncer.debounce(this._debouncerFilterChanged, timeOut.after(200), () => {
      this.dispatchEvent(new CustomEvent('filter-changed', { bubbles: true }));
    });
  }

  focus() {
    this.$.filter.focus();
  }
}

customElements.define(GridFilterElement.is, GridFilterElement);

export { GridFilterElement };
