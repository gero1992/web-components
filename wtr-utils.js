/* eslint-env node */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ALLOWED_WARNINGS = [
  '<vaadin-crud> Unable to autoconfigure form because the data structure is unknown. Either specify `include` or ensure at least one item is available beforehand.',
  'The <vaadin-grid> needs the total number of items in order to display rows. Set the total number of items to the `size` property, or provide the total number of items in the second argument of the `dataProvider`’s `callback` call.',
  'PositionMixin is not considered stable and might change any time'
];

const filterBrowserLogs = (log) => ALLOWED_WARNINGS.includes(log.args[0]) === false;

const group = process.argv.indexOf('--group') !== -1;

const NO_UNIT_TESTS = ['vaadin-icons', 'vaadin-lumo-styles', 'vaadin-material-styles'];

const NO_VISUAL_TESTS = [
  'vaadin-icon',
  'vaadin-icons',
  'vaadin-lumo-styles',
  'vaadin-material-styles',
  'vaadin-template-renderer',
  'vaadin-virtual-list'
];

/**
 * Check if lockfile has changed.
 */
const isLockfileChanged = () => {
  const log = execSync('git diff --name-only origin/master HEAD').toString();
  return log.split('\n').some((line) => line.includes('yarn.lock'));
};

/**
 * Get packages changed since master.
 */
const getChangedPackages = () => {
  const output = execSync('./node_modules/.bin/lerna ls --since origin/master --json --loglevel silent');
  return JSON.parse(output.toString());
};

/**
 * Get all available packages.
 */
const getAllPackages = () => {
  return fs
    .readdirSync('packages')
    .filter((dir) => fs.statSync(`packages/${dir}`).isDirectory() && fs.existsSync(`packages/${dir}/test`));
};

/**
 * Get all available packages with visual tests.
 */
const getAllVisualPackages = () => {
  return fs
    .readdirSync('packages')
    .filter((dir) => fs.statSync(`packages/${dir}`).isDirectory() && fs.existsSync(`packages/${dir}/test/visual`));
};

/**
 * Get packages for running unit tests.
 */
const getUnitTestPackages = () => {
  // If --group flag is passed, return all packages.
  if (group || isLockfileChanged()) {
    return getAllPackages();
  }

  let packages = getChangedPackages()
    .map((project) => project.name.replace('@vaadin/', ''))
    .filter((project) => NO_UNIT_TESTS.indexOf(project) === -1);

  if (packages.length == 0) {
    // When running in GitHub Actions, do nothing.
    if (process.env.GITHUB_REF) {
      console.log(`No local packages have changed, exiting.`);
      process.exit(0);
    } else {
      console.log(`No local packages have changed, testing all packages.`);
      packages = getAllPackages();
    }
  } else {
    console.log(`Running tests for changed packages:\n${packages.join('\n')}`);
  }

  return packages;
};

/**
 * Get packages for running visual tests.
 */
const getVisualTestPackages = () => {
  // If --group flag is passed, return all packages.
  if (group || isLockfileChanged()) {
    return getAllVisualPackages();
  }

  let packages = getChangedPackages()
    .map((project) => project.name.replace('@vaadin/', ''))
    .filter((project) => NO_VISUAL_TESTS.indexOf(project) === -1 && project.indexOf('mixin') === -1);

  if (packages.length == 0) {
    // When running in GitHub Actions, do nothing.
    if (process.env.GITHUB_REF) {
      console.log(`No local packages have changed, exiting.`);
      process.exit(0);
    } else {
      console.log(`No local packages have changed, testing all packages.`);
      packages = getAllVisualPackages();
    }
  } else {
    // Filter out possible duplicates from packages list
    packages = packages.filter((v, i, a) => a.indexOf(v) === i);
    console.log(`Running tests for changed packages:\n${packages.join('\n')}`);
  }

  return packages;
};

/**
 * Get unit test groups based on packages.
 */
const getUnitTestGroups = (packages) => {
  return packages.map((pkg) => {
    return {
      name: pkg,
      files: `packages/${pkg}/test/*.test.js`
    };
  });
};

/**
 * Get visual test groups based on packages.
 */
const getVisualTestGroups = (packages, theme) => {
  return packages.map((pkg) => {
    return {
      name: pkg,
      files: `packages/${pkg}/test/visual/${theme}/*.test.js`
    };
  });
};

const testRunnerHtml = (testFramework) => `
  <!DOCTYPE html>
  <html>
    <body>
      <style>
        html,
        body {
          height: 100%;
        }

        body {
          margin: 0;
          padding: 0;
        }

        html {
          --vaadin-user-color-0: #df0b92;
          --vaadin-user-color-1: #650acc;
          --vaadin-user-color-2: #097faa;
          --vaadin-user-color-3: #ad6200;
          --vaadin-user-color-4: #bf16f3;
          --vaadin-user-color-5: #084391;
          --vaadin-user-color-6: #078836;
        }
      </style>
      <script>
        /* Disable Roboto for Material theme tests */
        window.polymerSkipLoadingFontRoboto = true;

        /* Force development mode for element-mixin */
        localStorage.setItem('vaadin.developmentmode.force', true);

        /* Prevent license checker popup for Pro */
        const now = new Date().getTime();
        localStorage.setItem('vaadin.licenses.vaadin-board.lastCheck', now);
        localStorage.setItem('vaadin.licenses.vaadin-charts.lastCheck', now);
        localStorage.setItem('vaadin.licenses.vaadin-confirm-dialog.lastCheck', now);
        localStorage.setItem('vaadin.licenses.vaadin-cookie-consent.lastCheck', now);
        localStorage.setItem('vaadin.licenses.vaadin-crud.lastCheck', now);
        localStorage.setItem('vaadin.licenses.vaadin-grid-pro.lastCheck', now);
        localStorage.setItem('vaadin.licenses.vaadin-rich-text-editor.lastCheck', now);
      </script>
      <script type="module" src="${testFramework}"></script>
    </body>
  </html>
`;

const getScreenshotFileName = ({ name }, type, diff) => {
  const [meta, test] = name.split('_');
  const { pathname } = new URL(meta);
  const match = pathname.match(/\/packages\/(.+)\.test\.js/);
  const folder = match[1].replace(/(lumo|material)/, '$1/screenshots');
  return path.join(folder, type, diff ? `${test}-diff` : test);
};

const getBaselineScreenshotName = (args) => getScreenshotFileName(args, 'baseline');

const getDiffScreenshotName = (args) => getScreenshotFileName(args, 'failed', true);

const getFailedScreenshotName = (args) => getScreenshotFileName(args, 'failed');

exports.getTestGroups = (theme) => {
  const dir = `./test/visual/${theme}/`;

  return fs
    .readdirSync(dir)
    .filter((file) => file.includes('test.js'))
    .map((file) => {
      return {
        name: file.replace('.test.js', ''),
        files: `${dir}${file}`
      };
    });
};

module.exports = {
  filterBrowserLogs,
  getBaselineScreenshotName,
  getDiffScreenshotName,
  getFailedScreenshotName,
  getUnitTestGroups,
  getUnitTestPackages,
  getVisualTestGroups,
  getVisualTestPackages,
  testRunnerHtml
};
