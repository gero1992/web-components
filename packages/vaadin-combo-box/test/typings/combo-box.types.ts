import '../../vaadin-combo-box.js';
import {
  ComboBoxFilterChangedEvent,
  ComboBoxInvalidChangedEvent,
  ComboBoxOpenedChangedEvent,
  ComboBoxValueChangedEvent,
  ComboBoxCustomValueSetEvent,
  ComboBoxSelectedItemChangedEvent
} from '../../vaadin-combo-box.js';

import '../../vaadin-combo-box-light.js';

const assertType = <TExpected>(actual: TExpected) => actual;

const comboBox = document.createElement('vaadin-combo-box');

comboBox.addEventListener('custom-value-set', (event) => {
  assertType<ComboBoxCustomValueSetEvent>(event);
  assertType<string>(event.detail);
});

comboBox.addEventListener('opened-changed', (event) => {
  assertType<ComboBoxOpenedChangedEvent>(event);
  assertType<boolean>(event.detail.value);
});

comboBox.addEventListener('invalid-changed', (event) => {
  assertType<ComboBoxInvalidChangedEvent>(event);
  assertType<boolean>(event.detail.value);
});

comboBox.addEventListener('value-changed', (event) => {
  assertType<ComboBoxValueChangedEvent>(event);
  assertType<string>(event.detail.value);
});

comboBox.addEventListener('filter-changed', (event) => {
  assertType<ComboBoxFilterChangedEvent>(event);
  assertType<string>(event.detail.value);
});

comboBox.addEventListener(
  'selected-item-changed',
  (event: ComboBoxSelectedItemChangedEvent<{ label: string; value: string }>) => {
    assertType<{ label: string; value: string }>(event.detail.value);
  }
);

const light = document.createElement('vaadin-combo-box-light');

light.addEventListener('custom-value-set', (event) => {
  assertType<ComboBoxCustomValueSetEvent>(event);
  assertType<string>(event.detail);
});

light.addEventListener('opened-changed', (event) => {
  assertType<ComboBoxOpenedChangedEvent>(event);
  assertType<boolean>(event.detail.value);
});

light.addEventListener('invalid-changed', (event) => {
  assertType<ComboBoxInvalidChangedEvent>(event);
  assertType<boolean>(event.detail.value);
});

light.addEventListener('value-changed', (event) => {
  assertType<ComboBoxValueChangedEvent>(event);
  assertType<string>(event.detail.value);
});

light.addEventListener('filter-changed', (event) => {
  assertType<ComboBoxFilterChangedEvent>(event);
  assertType<string>(event.detail.value);
});

light.addEventListener(
  'selected-item-changed',
  (event: ComboBoxSelectedItemChangedEvent<{ label: string; value: string }>) => {
    assertType<{ label: string; value: string }>(event.detail.value);
  }
);
