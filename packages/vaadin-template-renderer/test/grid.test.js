// import sinon from 'sinon';
import { expect } from '@esm-bundle/chai';
import { fixtureSync, nextRender } from '@vaadin/testing-helpers';

import { Templatizer } from '../src/vaadin-template-renderer-templatizer.js';

import '../vaadin-template-renderer.js';

import './fixtures/mock-grid-host.js';

describe('grid', () => {
  let host, grid;

  function getCell(row, index = 0) {
    return row.querySelectorAll('[part~="cell"]')[index];
  }

  beforeEach(async () => {
    host = fixtureSync(`<mock-grid-host></mock-grid-host>`);
    grid = host.$.grid;

    await nextRender(grid);
  });

  ['header', 'footer'].forEach((templateName) => {
    describe(`${templateName} template`, () => {
      let cell;

      beforeEach(() => {
        cell = getCell(grid.$[templateName], 0);
      });

      it(`should process the ${templateName} template`, () => {
        const template = grid.querySelector(`template.${templateName}`);
        const templatizer = template.__templatizer;

        expect(templatizer).to.be.instanceOf(Templatizer);
        expect(templatizer.__templateInstances).to.have.lengthOf(1);
        expect(templatizer.__templateInstances).to.include(cell._content.__templateInstance);
      });

      it(`should render the ${templateName} template`, () => {
        expect(cell._content.textContent).to.equal(templateName);
      });
    });
  });

  describe('content template', () => {
    it('should process the content template', () => {
      const cell = getCell(grid.$.items.children[0], 0);

      const template = grid.querySelector('template.content');
      const templatizer = template.__templatizer;

      expect(templatizer).to.be.instanceOf(Templatizer);
      expect(templatizer.__templateInstances).to.have.lengthOf(2);
      expect(templatizer.__templateInstances).to.include(cell._content.__templateInstance);
    });
  });
});
