import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { fixtureSync } from '@vaadin/testing-helpers';
import { getIconId } from '../vaadin-iconset.js';
import { unsafeSvgLiteral } from '../src/vaadin-icon-svg.js';
import '../vaadin-icon.js';

const ANGLE_DOWN = '<path d="M13 4v2l-5 5-5-5v-2l5 5z"></path>';
const ANGLE_UP = '<path d="M3 12v-2l5-5 5 5v2l-5-5z"></path>';

describe('vaadin-icon', () => {
  let icon;

  function expectIcon(content, size = 16) {
    const svgElement = icon.shadowRoot.querySelector('svg');
    expect(svgElement.innerHTML.trim().replace(/<!--[^>]*-->/g, '')).to.equal(content);
    expect(svgElement.getAttribute('viewBox')).to.equal(`0 0 ${size} ${size}`);
  }

  describe('custom element definition', () => {
    beforeEach(() => {
      icon = fixtureSync('<vaadin-icon></vaadin-icon>');
    });

    it('should define a custom element with proper tag name', () => {
      expect(customElements.get('vaadin-icon')).to.be.ok;
    });

    it('should have a valid version number', () => {
      expect(icon.constructor.version).to.match(/^(\d+\.)?(\d+\.)?(\d+)(-(alpha|beta)\d+)?$/);
    });
  });

  describe('svg property', () => {
    beforeEach(() => {
      icon = fixtureSync('<vaadin-icon></vaadin-icon>');
    });

    describe('valid icon', () => {
      it('should set icon defined with SVG literal', () => {
        icon.svg = unsafeSvgLiteral(ANGLE_DOWN);
        expectIcon(ANGLE_DOWN);
      });

      it('should update icon when size property is set', () => {
        icon.size = 24;
        icon.svg = unsafeSvgLiteral(ANGLE_DOWN);
        expectIcon(ANGLE_DOWN, 24);
      });

      it('should update icon when size property is updated', () => {
        icon.svg = unsafeSvgLiteral(ANGLE_DOWN);
        expectIcon(ANGLE_DOWN, 16);
        icon.size = 24;
        expectIcon(ANGLE_DOWN, 24);
      });
    });

    describe('empty icon', () => {
      beforeEach(() => {
        sinon.stub(console, 'error');
      });

      afterEach(() => {
        console.error.restore();
      });

      it('should log error when invalid svg value is set', () => {
        icon.svg = ANGLE_DOWN;
        expect(console.error.calledOnce).to.be.true;
      });

      it('should not render DOM when invalid svg value is set', () => {
        icon.svg = ANGLE_DOWN;
        expectIcon('');
      });

      it('should not log error when svg property is set to null', () => {
        icon.svg = null;
        expect(console.error.calledOnce).to.be.false;
      });

      it('should not render DOM when svg property is set to null', () => {
        icon.svg = null;
        expectIcon('');
      });
    });
  });

  describe('icon property', () => {
    let iconset, icons;

    beforeEach(() => {
      iconset = fixtureSync(`
        <vaadin-iconset name="vaadin">
          <svg xmlns="http://www.w3.org/2000/svg">
            <defs>
              <g id="vaadin-icon:angle-down">${ANGLE_DOWN}</g>
              <g id="vaadin-icon:angle-up">${ANGLE_UP}</g>
            </defs>
          </svg>
        </vaadin-iconset>
      `);
      icons = Array.from(iconset.querySelectorAll('[id]'));
    });

    describe('default', () => {
      beforeEach(() => {
        icon = fixtureSync('<vaadin-icon></vaadin-icon>');
      });

      it('should render icon from the iconset', () => {
        icons.forEach((svgIcon) => {
          icon.icon = getIconId(svgIcon.getAttribute('id'));
          expectIcon(svgIcon.innerHTML);
        });
      });

      it('should clear icon when the value is set to null', () => {
        icon.icon = 'angle-up';
        expectIcon(ANGLE_UP);
        icon.icon = null;
        expectIcon('');
      });

      it('should clear icon when the value is set to undefined', () => {
        icon.icon = 'angle-up';
        expectIcon(ANGLE_UP);
        icon.icon = undefined;
        expectIcon('');
      });
    });

    describe('set before attach', () => {
      beforeEach(() => {
        icon = document.createElement('vaadin-icon');
      });

      afterEach(() => {
        document.body.removeChild(icon);
      });

      it('should clear icon when the value is set to null', () => {
        icon.icon = 'angle-up';
        document.body.appendChild(icon);
        expectIcon(ANGLE_UP);
      });
    });
  });
});
