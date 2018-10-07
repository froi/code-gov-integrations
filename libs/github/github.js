const Github = require('@octokit/rest');
const { parseRateLimit, handleRateLimit, paginate, getRateLimit, handleError } = require('./utils');

function getClient(options) {
  const client = new Github();
  client.authenticate(options);

  return client;
}

async function getRepoReadme(owner, repo, client) {
  let readme;
  let rateLimit = {};
  let error = {};

  try {
    const response = await client.repos.getReadme({
      owner,
      repo,
      headers: {
        accept: 'application/vnd.github.v3.raw+json'
      }
    });
    readme = response.data;
    rateLimit = await handleRateLimit(parseRateLimit(response));

  } catch(err) {
    const result = handleError(err);
    rateLimit = result.rateLimit;
    error = result.error;
  }

  return { readme, rateLimit, error };
}
async function getRepoData(owner, repo, client) {
  let repoData = {}
  let rateLimit = {};
  let error = {};

  try {
    const response = await client.repos.get({
      owner,
      repo
    });

    repoData = {
      description: response.data.description,
      forks_count: response.data.forks_count,
      watchers_count: response.data.watchers_count,
      stargazers_count: response.data.stargazers_count,
      title: response.data.title,
      topics: response.data.topics,
      full_name: response.data.full_name,
      has_issues: response.data.has_issues,
      organization: {
        login: response.data.organization.login,
        avatar_url: response.data.organization.avatar_url,
        url: response.data.organization.url
      },
      ssh_url: response.data.ssh_url,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at
    };

    rateLimit = await handleRateLimit(parseRateLimit(response));
  } catch(err) {
    const result = handleError(err);
    rateLimit = result.rateLimit;
    error = result.error;
  }

  return {
    repo: repoData,
    rateLimit,
    error
  };
}
async function getRepoIssues({ owner, repo, state='open', labels='help wanted', since, per_page=100, page=0, client }) {
  let requestParams = { owner, repo, state, labels, per_page, page};
  let issues = [];
  let rateLimit = {};
  let error = {};

  if(since) {
    requestParams = Object.assign(requestParams, {since});
  }

  try {
    const result = await paginate(client, client.issues.getForRepo, requestParams);
    const repoIssues = result.data;

    rateLimit = result.rateLimit;

    issues = repoIssues.map(issue => {
      return {
        issue_url: issue.html_url,
        state: issue.state,
        updated_at: issue.updated_at,
        title: issue.title,
        description: issue.description,
        body: issue.body,
        pull_request: issue.pull_request,
        merged_at: issue.merged_at,
        created_at: issue.created_at
      };
    });
  } catch(err) {
    const result = handleError(err);
    rateLimit = result.rateLimit;
    error = result.error;
  }

  return { issues, rateLimit, error };
}
async function getRepoLanguages(owner, repo, client){
  let languages = [];
  let rateLimit = {};
  let error = {};

  try {
    const response = await client.repos.getLanguages({owner, repo});
    languages = Object.keys(response.data);
    rateLimit = parseRateLimit(response);
  } catch(err) {
    const result = handleError(err);
    rateLimit = result.rateLimit;
    error = result.error;
  }

  return { languages, rateLimit, error };
}
async function getRepoContributors({ owner, repo, anon=false, per_page=10, page=0, client}) {
  const requestParams = { owner, repo, anon, per_page, page };

  let contributors = [];
  let rateLimit = {};
  let error = {};

  try {
    const results = await paginate(client, client.repos.getContributors, requestParams);
    rateLimit = results.rateLimit;

    contributors = await Promise.all(
      results.data.map(async contributor => {
        const username = contributor.login;

        rateLimit = await handleRateLimit(rateLimit);
        const user = await client.users.getForUser({ username });

        return {
          username: contributor.login,
          contributions: contributor.contributions,
          full_name: user.data.name,
          email: user.data.email,
          gh_profile: user.data.html_url,
          gh_avatar_url: user.data.avatar_url,
          company: user.data.company
        };
      })
    );
  } catch(err) {
    const result = handleError(err);
    rateLimit = result.rateLimit;
    error = result.error;
  }

  return { contributors, rateLimit, error };
}

/**
 *
 * @param {string} owner Github username for the repository
 * @param {string} repoName Github repository name
 * @param {object} githubOptions Github client creation options.
 * @returns {object} Github repository, repository issues, repository README,  object with
 */
async function getData(owner, repoName, client) {
  let rateLimit;
  let repo;

  try {
    rateLimit = await handleRateLimit(await getRateLimit(client));
  } catch(error) {
    rateLimit = {};
  }

  try {
    const repoData = await getRepoData(owner, repoName, client);
    repo = repoData.repo;
    rateLimit = await handleRateLimit(repoData.rateLimit, client);
  } catch(error) {
    throw error;
  }

  try {
    const readmeData = await getRepoReadme(owner, repoName, client);
    repo.readMe = readmeData.readme;
    rateLimit = await handleRateLimit(readmeData.rateLimit);
  } catch(error) {
    repo.readMe = '';
  }

  try {
    const repoLanguages = await getRepoLanguages(owner, repoName, client);
    repo.languages = repoLanguages.languages;
    rateLimit = await handleRateLimit(repoLanguages.rateLimit);
  } catch(error) {
    repo.languages = [];
  }

  if(repo.has_issues) {
    try {
      const issuesData = await getRepoIssues({ owner, repo: repoName, per_page:10, client });
      rateLimit = await handleRateLimit(issuesData.rateLimit);
      repo.issues = issuesData.issues;
    } catch(error) {
      repo.issues = [];
    }
  }

  try {
    repo.contributors = await getRepoContributors({owner, repo: repoName, per_page:10, client});
  } catch (error) {
    repo.contributions = [];
  }

  return repo;
}

module.exports = {
  getData,
  getRepoReadme,
  getRepoData,
  getRepoIssues,
  getRepoLanguages,
  getClient,
  getRepoContributors
};
