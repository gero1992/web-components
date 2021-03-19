import { arrowDown, fixtureSync, nextRender, oneEvent } from '@vaadin/testing-helpers';
import { visualDiff } from '@web/test-runner-visual-regression';
import '@vaadin/vaadin-lumo-styles/icons.js';
import '@polymer/iron-icon/iron-icon.js';
import '../../../theme/lumo/vaadin-menu-bar.js';

describe('menu-bar', () => {
  let div, element;

  ['ltr', 'rtl'].forEach((dir) => {
    describe(dir, () => {
      before(() => {
        document.documentElement.setAttribute('dir', dir);
      });

      after(() => {
        document.documentElement.removeAttribute('dir');
      });

      describe('basic', () => {
        beforeEach(() => {
          div = document.createElement('div');
          div.style.padding = '10px';

          element = fixtureSync('<vaadin-menu-bar></vaadin-menu-bar>', div);
          element.items = [
            { text: 'Home' },
            {
              text: 'Reports',
              children: [{ text: 'View Reports' }, { text: 'Generate Report' }]
            },
            { text: 'Dashboard', disabled: true },
            { text: 'Help' }
          ];
        });

        it('basic', async () => {
          await visualDiff(document.body, `menu-bar:${dir}-basic`);
        });

        it('opened', async () => {
          element.shadowRoot.querySelectorAll('vaadin-menu-bar-button')[1].click();
          await nextRender(element);
          await visualDiff(document.body, `menu-bar:${dir}-opened`);
        });
      });

      describe('theme', () => {
        function makeIcon(img) {
          const item = document.createElement('vaadin-context-menu-item');
          const icon = document.createElement('iron-icon');
          icon.setAttribute('icon', img);
          item.appendChild(icon);
          item.setAttribute('theme', 'menu-bar-item');
          return item;
        }

        beforeEach(() => {
          div = document.createElement('div');
          div.style.padding = '10px';

          element = fixtureSync('<vaadin-menu-bar></vaadin-menu-bar>', div);
          element.items = [
            { component: 'u', text: 'Home' },
            {
              component: makeIcon('lumo:chevron-down'),
              children: [{ text: 'Notifications' }, { text: 'Mark as read' }]
            },
            { text: 'Manage', disabled: true },
            {
              text: 'Reports',
              children: [{ text: 'View Reports' }, { text: 'Generate Report' }]
            },
            { text: 'Help' }
          ];
        });

        it('primary', async () => {
          div.style.width = '320px';
          element.setAttribute('theme', 'primary');
          element.notifyResize();
          arrowDown(element.shadowRoot.querySelectorAll('vaadin-menu-bar-button')[1]);
          await oneEvent(element._subMenu.$.overlay, 'vaadin-overlay-open');
          await visualDiff(document.body, `menu-bar:${dir}-primary`);
        });

        it('secondary', async () => {
          div.style.width = '320px';
          element.setAttribute('theme', 'secondary');
          element.notifyResize();
          arrowDown(element.shadowRoot.querySelectorAll('vaadin-menu-bar-button')[1]);
          await oneEvent(element._subMenu.$.overlay, 'vaadin-overlay-open');
          await visualDiff(document.body, `menu-bar:${dir}-secondary`);
        });

        it('tertiary', async () => {
          div.style.width = '265px';
          element.setAttribute('theme', 'tertiary');
          element.notifyResize();
          arrowDown(element.shadowRoot.querySelectorAll('vaadin-menu-bar-button')[1]);
          await oneEvent(element._subMenu.$.overlay, 'vaadin-overlay-open');
          await visualDiff(document.body, `menu-bar:${dir}-tertiary`);
        });

        it('tertiary-inline', async () => {
          div.style.width = '200px';
          element.setAttribute('theme', 'tertiary-inline');
          element.notifyResize();
          arrowDown(element.shadowRoot.querySelectorAll('vaadin-menu-bar-button')[1]);
          await oneEvent(element._subMenu.$.overlay, 'vaadin-overlay-open');
          await visualDiff(document.body, `menu-bar:${dir}-tertiary-inline`);
        });

        it('small', async () => {
          div.style.width = '265px';
          element.setAttribute('theme', 'small');
          element.notifyResize();
          arrowDown(element.shadowRoot.querySelectorAll('vaadin-menu-bar-button')[1]);
          await oneEvent(element._subMenu.$.overlay, 'vaadin-overlay-open');
          await visualDiff(document.body, `menu-bar:${dir}-small`);
        });
      });
    });
  });
});
