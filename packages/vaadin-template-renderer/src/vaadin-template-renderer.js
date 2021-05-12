import './vaadin-template-renderer-templatizer.js';
import './vaadin-template-renderer-grid-templatizer.js';

import { Templatizer } from './vaadin-template-renderer-templatizer.js';
// import { GridTemplatizer } from './vaadin-template-renderer-grid-templatizer.js';

function createRenderer(component, template, TemplatizerClass = Templatizer) {
  const templatizer = TemplatizerClass.create(component, template);

  return (root, _owner, model) => {
    template.__templatizer = templatizer;
    template.__templatizer.render(root, model);
  };
}

function processTemplate(component, template) {
  if (template.classList.contains('header')) {
    component.headerRenderer = createRenderer(component, template);
    return;
  }

  if (template.classList.contains('footer')) {
    component.footerRenderer = createRenderer(component, template);
    return;
  }

  // if (template.parentNode.matches('vaadin-grid-column')) {
  //   component.renderer = createRenderer(component, template, GridTemplatizer);
  //   return;
  // }

  // if (template.classList.contains('row-details')) {
  //   component.rowDetailsRenderer = createRenderer(component, template, GridTemplatizer);
  //   return;
  // }

  component.renderer = createRenderer(component, template);
}

function processTemplates(component) {
  [...component.children]
    .filter((child) => {
      return child instanceof HTMLTemplateElement;
    })
    .forEach((template) => {
      // Ignore templates which have been processed earlier
      if (template.__templatizer) {
        return;
      }

      processTemplate(component, template);
    });
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach(({ target }) => {
    processTemplates(target);
  });
});

window.Vaadin = window.Vaadin || {};
window.Vaadin.templateRendererCallback = (component) => {
  processTemplates(component);

  // The observer stops observing automatically as the component node is removed
  observer.observe(component, { childList: true });
};
