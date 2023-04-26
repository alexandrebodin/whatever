'use strict';

const os = require('os');

const knownWindowsPackages = {
  'win32 arm64 LE': 'turbo-windows-arm64',
  'win32 x64 LE': 'turbo-windows-64',
};

const knownUnixlikePackages = {
  'darwin arm64 LE': '@alexandrebodin/whatever-darwin-arm64',
  'darwin x64 LE': '@alexandrebodin/whatever-darwin-x64',
  'linux arm64 LE': 'turbo-linux-arm64',
  'linux x64 LE': 'turbo-linux-64',
};

function pkgAndSubpathForCurrentPlatform() {
  let pkg;
  let subpath;
  let platformKey = `${process.platform} ${os.arch()} ${os.endianness()}`;

  if (platformKey in knownWindowsPackages) {
    pkg = knownWindowsPackages[platformKey];
    subpath = 'bin/whatever.exe';
  } else if (platformKey in knownUnixlikePackages) {
    pkg = knownUnixlikePackages[platformKey];
    subpath = 'bin/whatever';
  } else {
    throw new Error(`Unsupported platform: ${platformKey}`);
  }
  return { pkg, subpath };
}

function generateBinPath() {
  const { pkg, subpath } = pkgAndSubpathForCurrentPlatform();
  let binPath;

  try {
    // First check for the binary package from our "optionalDependencies". This
    // package should have been installed alongside this package at install time.
    binPath = require.resolve(`${pkg}/${subpath}`);
  } catch (e) {
    throw e;
  }

  return binPath;
}

module.exports = {
  generateBinPath,
  pkgAndSubpathForCurrentPlatform,
};
