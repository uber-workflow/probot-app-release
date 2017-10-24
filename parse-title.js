/** Copyright (c) 2017 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const semver = require('semver');

const prefix = 'Release ';

function parseTitle(title) {
  if (!title.startsWith(prefix)) {
    return false;
  }
  const version = title.substr(prefix.length);
  // enforce v prefix in title
  if (!version.startsWith('v')) {
    return false;
  }
  if (!semver.valid(version)) {
    return false;
  }
  return {
    version,
    prerelease: Boolean(semver.prerelease(version)),
  };
}

module.exports = parseTitle;
