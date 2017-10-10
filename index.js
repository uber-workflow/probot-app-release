module.exports = robot => {
  robot.on('pull_request.closed', landed);

  async function landed(context) {
    const pr = context.payload.pull_request;

    if (!pr.merged) {
      return;
    }

    const {github} = context;
    const labels = await github.issues.getIssueLabels(context.issue());

    const isRelease = labels.data.some(label => label.name === 'Release');

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
  }
};
