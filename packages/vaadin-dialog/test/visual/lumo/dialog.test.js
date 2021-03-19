import { fixtureSync } from '@vaadin/testing-helpers/dist/fixture.js';
import { visualDiff } from '@web/test-runner-visual-regression';
import '../../../theme/lumo/vaadin-dialog.js';

describe('dialog', () => {
  let div, element;

  beforeEach(() => {
    div = document.createElement('div');
    div.style.height = '100%';

    element = fixtureSync(
      `
        <vaadin-dialog opened>
          <template>
            <div>Simple dialog with text</div>
          </template>
        </vaadin-dialog>
      `,
      div
    );
  });

  it('basic', async () => {
    await visualDiff(div, 'dialog:basic');
  });

  it('modeless', async () => {
    element.modeless = true;
    await visualDiff(div, 'dialog:modeless');
  });
});
