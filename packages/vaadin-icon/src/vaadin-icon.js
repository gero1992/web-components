/**
 * @license
 * Copyright (c) 2021 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 */
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';
import { ElementMixin } from '@vaadin/vaadin-element-mixin/vaadin-element-mixin.js';
import { IconsetElement, getIconId } from './vaadin-iconset.js';
import { renderSvg } from './vaadin-icon-svg.js';

const DEFAULT_ICONSET = 'vaadin';

/**
 * `<vaadin-icon>` is a Web Component for creating SVG icons.
 *
 * @extends HTMLElement
 * @mixes ThemableMixin
 * @mixes ElementMixin
 */
class IconElement extends ThemableMixin(ElementMixin(PolymerElement)) {
  static get template() {
    return html`
      <style>
        :host {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          vertical-align: middle;
          width: 24px;
          height: 24px;
        }

        :host([hidden]) {
          display: none !important;
        }

        svg {
          display: block;
          width: 100%;
          height: 100%;
        }
      </style>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 [[size]] [[size]]"
        preserveAspectRatio="xMidYMid meet"
      ></svg>
    `;
  }

  static get is() {
    return 'vaadin-icon';
  }

  static get version() {
    return '21.0.0-alpha2';
  }

  static get properties() {
    return {
      /**
       * The name of the icon to use. The name should be of the form:
       * `iconset_name:icon_name`.
       */
      icon: {
        type: String,
        observer: '__iconChanged'
      },

      /**
       * The SVG icon wrapped in a Lit template literal.
       */
      svg: {
        type: Object
      },

      /**
       * The size of an icon, used to set the `viewBox` attribute.
       */
      size: {
        type: Number,
        value: 16
      },

      /** @private */
      __svgElement: Object
    };
  }

  static get observers() {
    return ['__svgChanged(svg, __svgElement)'];
  }

  /** @protected */
  ready() {
    super.ready();
    this.__svgElement = this.shadowRoot.querySelector('svg');
  }

  /** @private */
  __iconChanged(icon) {
    if (icon) {
      const parts = icon.split(':');
      const iconName = getIconId(parts.pop());
      const iconsetName = parts.pop() || DEFAULT_ICONSET;
      const iconset = IconsetElement.getIconset(iconsetName);
      this.svg = iconset.applyIcon(iconName);
    } else {
      this.svg = null;
    }
  }

  /** @private */
  __svgChanged(svg, svgElement) {
    if (!svgElement) {
      return;
    }

    renderSvg(svg, svgElement);
  }
}

customElements.define(IconElement.is, IconElement);

export { IconElement };
