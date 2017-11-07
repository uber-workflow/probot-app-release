/** Copyright (c) 2017 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const parseTitle = require('./parse-title.js');
const exec = require('child_process').exec;

module.exports = robot => {
  robot.on('pull_request.closed', landed);

  async function landed(context) {
    const pr = context.payload.pull_request;

    if (!pr.merged) {
      return;
    }

    const {github} = context;
    const labels = await github.issues.getIssueLabels(context.issue());

    const isRelease = labels.data.some(
      label => label.name.toLowerCase() === 'release',
    );

    if (!isRelease) {
      return;
    }

    const {version: tag_name, prerelease} = parseTitle(pr.title);

    github.repos.createRelease(
      context.repo({
        body: pr.body,
        tag_name,
        prerelease,
        name: tag_name,
        target_commitish: pr.merge_commit_sha,
      }),
    );

    // Kick off a deployment through buildkite
    const {name, ssh_url} = context.payload.repository;
    const curlCommand = `curl \
      -H "Authorization: Bearer ${process.env.BUILDKITE_TOKEN}" \
      -X POST "https://api.buildkite.com/v2/organizations/uberopensource/pipelines/npm-deploy/builds" \
        -d '{
          "commit": "HEAD",
          "branch": "master",
          "message": "Deploy ${name}",
          "author": {
            "name": "${pr.user.login}"
          },
          "env": {
            "PUBLISH_REPO": "${ssh_url}"
          }
        }'`;

    exec(curlCommand, error => {
      if (error !== null) {
        // eslint-disable-next-line no-console
        console.warn('exec error: ' + error);
      }
    });
  }
};
