// Most of this file is ripped from esbuild
// @see https://github.com/evanw/esbuild/blob/master/lib/npm/node-install.ts
// This file is MIT licensed.

const nodePlatform = require('./node-platform');
const fs = require('fs');
const os = require('os');
const path = require('path');
const child_process = require('child_process');
const { pkgAndSubpathForCurrentPlatform } = nodePlatform;
const VERSION = require('./package.json').version;

const toPath = path.join(__dirname, 'bin.js');

function validateBinaryVersion(...command) {
  command.push('--version');

  const stdout = child_process
    .execFileSync(command.shift(), command, { stdio: 'pipe' })
    .toString()
    .trim();

  if (stdout !== VERSION) {
    throw new Error(
      `Expected ${JSON.stringify(VERSION)} but got ${JSON.stringify(stdout)}`
    );
  }
}

function isYarn() {
  const { npm_config_user_agent } = process.env;
  if (npm_config_user_agent) {
    return /\byarn\//.test(npm_config_user_agent);
  }
  return false;
}

function maybeOptimizePackage(binPath) {
  // Everything else that this installation does is fine, but the optimization
  // step rewrites existing files. We need to make sure that this does not
  // happen during development. We determine that by looking for a file in
  // the package that is not published in the `npm` registry.
  if (fs.existsSync(path.join(__dirname, '.dev-mode'))) {
    return;
  }

  // This package contains a "bin/turbo" JavaScript file that finds and runs
  // the appropriate binary executable. However, this means that running the
  // "turbo" command runs another instance of "node" which is way slower than
  // just running the binary executable directly.
  //
  // Here we optimize for this by replacing the JavaScript file with the binary
  // executable at install time. This optimization does not work on Windows
  // because on Windows the binary executable must be called "turbo.exe"
  // instead of "turbo".
  //
  // This also doesn't work with Yarn both because of lack of support for binary
  // files in Yarn 2+ (see https://github.com/yarnpkg/berry/issues/882) and
  // because Yarn (even Yarn 1?) may run the same install scripts in the same
  // place multiple times from different platforms, especially when people use
  // Docker. Avoid idempotency issues by just not optimizing when using Yarn.
  //
  // This optimization also doesn't apply when npm's "--ignore-scripts" flag is
  // used since in that case this install script will not be run.
  if (os.platform() !== 'win32' && !isYarn()) {
    const optimizeBin = (from, to, temp) => {
      const tempPath = path.join(__dirname, temp);
      try {
        // First link the binary with a temporary file. If this fails and throws an
        // error, then we'll just end up doing nothing. This uses a hard link to
        // avoid taking up additional space on the file system.
        fs.linkSync(from, tempPath);

        // Then use rename to atomically replace the target file with the temporary
        // file. If this fails and throws an error, then we'll just end up leaving
        // the temporary file there, which is harmless.
        fs.renameSync(tempPath, to);

        // If we get here, then we know that the target location is now a binary
        // executable instead of a JavaScript file.
        isToPathJS = false;

        // If this install script is being re-run, then "renameSync" will fail
        // since the underlying inode is the same (it just returns without doing
        // anything, and without throwing an error). In that case we should remove
        // the file manually.
        fs.unlinkSync(tempPath);
      } catch {
        // Ignore errors here since this optimization is optional
      }
    };
    const goBinPath = path.join(path.dirname(binPath), 'go-turbo');
    optimizeBin(goBinPath, goToPath, 'bin-go-turbo');
    optimizeBin(binPath, toPath, 'bin-turbo');
  }
}

async function checkAndPreparePackage() {
  const { pkg, subpath } = pkgAndSubpathForCurrentPlatform();

  let binPath;
  try {
    // First check for the binary package from our "optionalDependencies". This
    // package should have been installed alongside this package at install time.
    binPath = require.resolve(`${pkg}/${subpath}`);
  } catch (e) {
    console.error(`Failed to find package "${pkg}" on the file system

This can happen if you use the "--no-optional" flag. The "optionalDependencies"
package.json feature is used by turbo to install the correct binary executable
for your current platform. This install script will now attempt to work around
this. If that fails, you need to remove the "--no-optional" flag to use turbo.
`);
  }

  // maybeOptimizePackage(binPath);
}

checkAndPreparePackage().then(() => {
  validateBinaryVersion('node', toPath);
});
