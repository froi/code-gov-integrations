const Octokit = require('@octokit/rest')
  .plugin(require('@octokit/plugin-throttling'))
const { parseRateLimit, handleRateLimit, getRateLimit, handleError } = require('./utils');

/**
 * Get an instance of the API client.
 *
 * @param {object} options Object with client creation options.
 * For details on Github client creation visit: https://www.npmjs.com/package/@octokit/rest
 * @returns {object} An initialized API client.
 *
 * @example getClient({ token: 'this-is-not-a-token' })
 */
function getClient(options) {
  return new Octokit({
    auth: `token ${options.token}`,
    throttle: {
      onRateLimit: (retryAfter, options) => {
        console.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`)

        if (options.request.retryCount === 3) { // only retries once
          console.log(`Retrying after ${retryAfter} seconds!`)
          return true;
        }
      },
      onAbuseLimit: (retryAfter, options) => {
        // does not retry, only logs a warning
        console.warn(`Abuse detected for request ${options.method} ${options.url}`)
      }
    }
  });
}

/**
 * Fetch README file contents for the supplied repository.
 *
 * @async
 * @param {object} params Parameters needed by the API client and the client itself.
 * @param {string} params.owner Repository owner
 * @param {string} params.repo Repository name
 * @param {object} params.client API client
 * @returns {Promise<{ readme: string, rateLimit: object, error: object }>} Object with readme text, rate limit object, and error object.
 *
 * @example getRepoReadme({ owner: 'gsa', repo: 'code-gov-integrations', client: apiClient })
 */
async function getRepoReadme({ owner, repo, client }) {
  let readme;
  let rateLimit = {};
  let error = {};

  try {
    rateLimit = await getRateLimit(client);
    rateLimit = await handleRateLimit({ rateLimit, client });

    const response = await client.repos.getReadme({
      owner,
      repo,
      ref: 'master'
    });
    readme = response.data;
  } catch(err) {
    const result = handleError(err);
    rateLimit = result.rateLimit;
    error = result.error;
  }

  return { readme, rateLimit, error };
}
/**
 * Fetch data for the supplied repository.
 *
 * @async
 * @param {object} params Parameters needed by the API client and the client itself.
 * @param {string} params.owner Repository owner
 * @param {string} params.repo Repository name
 * @param {object} params.client API client
 * @returns {Promise<{ repo: object, rateLimit: object, error: object }>} Object with repo data, rate limit, and error objects.
 *
 * @example getRepoData({ owner: 'gsa', repo: 'code-gov-integrations', client: apiClient })
 */
async function getRepoData({ owner, repo, client }) {
  let repoData = {};
  let rateLimit = {};
  let error = {};

  try {
    rateLimit = await getRateLimit(client);
    rateLimit = await handleRateLimit({ rateLimit, client });

    const response = await client.repos.get({ owner, repo });

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

    rateLimit = await handleRateLimit({
      rateLimit: parseRateLimit(response),
      client
    });
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

/**
 * Fetch all issues for a suplied repository.
 *
 * @async
 * @param {object} params Parameters needed by the API client and the client itself.
 * @param {string} params.owner Repository owner
 * @param {string} params.repo Repository name
 * @param {string} [params.state="open"] Indicates the state of the issues to return. Can be either open, closed, or all
 * @param {string} [params.labels="help wanted, code.gov"] A list of comma separated label names. Example: help wanted, code.gov, good first issue
 * @param {string} [params.since] Only issues updated at or after this time are returned. This is a timestamp in ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ.
 * @param {number} [params.per_page=100] Results per page (max 100). Defaults to 10
 * @param {number} [params.page=1] Page number of the results to fetch.
 * @param {object} params.client API client
 * @returns {Promise<{ issues: Array, rateLimit: object, error: object }>} Object with issues array, rate limit object, and error object.
 *
 * @example getRepoIssues({ owner: 'gsa', repo: 'code-gov-integrations', client: apiClient })
 * @example getRepoIssues({ owner: 'gsa', repo: 'code-gov-integrations', labels: 'help wanted,code.gov', client: apiClient })
 */
async function getRepoIssues({ owner, repo, state='open', labels='help wanted', since, per_page=100, page=1, client }) {
  let requestParams = { owner, repo, state, labels, per_page, page};
  let issues = [];
  let rateLimit = {};
  let error = {};

  if(since) {
    requestParams = Object.assign(requestParams, {since});
  }

  try {
    const data = await client.paginate(client.issues.listForRepo.endpoint(requestParams));

    // List have to be filtered to remove Pull Requests.
    // Github API v3 considers all Pull Requests issues. See: https://developer.github.com/v3/issues/#list-issues-for-a-repository
    const repoIssues = data.filter(issue => issue.hasOwnProperty('pull_request') === false);

    issues = repoIssues.map(issue => {
      return {
        url: issue.html_url,
        state: issue.state,
        title: issue.title,
        description: issue.description,
        body: issue.body,
        labels: issue.labels.map(label => label.name),
        updated_at: issue.updated_at,
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

/**
 * Fetch all languages used in the supplied repository.
 *
 * @async
 * @param {Object} params Parameters needed by the API client and the client itself.
 * @param {string} params.owner Repository owner
 * @param {string} params.repo Repository name
 * @param {object} params.client API client
 * @returns {Promise<{languages: Array, rateLimit: object, error: object}>} Object with langauges array, rate limit object, and error object.
 *
 * @example getRepoLanguages({ owner: 'gsa', repo: 'code-gov-integrations', client: apiClient })
 */
async function getRepoLanguages({ owner, repo, client }){
  let languages = [];
  let rateLimit = {};
  let error = {};

  try {
    const response = await client.repos.listLanguages({ owner, repo });
    languages = Object.keys(response.data);
    rateLimit = parseRateLimit(response);
  } catch(err) {
    const result = handleError(err);
    rateLimit = result.rateLimit;
    error = result.error;
  }

  return { languages, rateLimit, error };
}

/**
 * Fetch all contributors for the supplied repository.
 *
 * @async
 * @param {object} params Parameters needed by the API client and the client itself.
 * @param {string} params.owner Repository owner
 * @param {string} params.repo Repository name
 * @param {boolean} params.anon Include anonymous contributors. Defaults to false.
 * @param {number} params.per_page Results per page (max 100). Defaults to 10
 * @param {number} params.page Page number of the results to fetch.
 * @param {object} params.client Github API client
 * @returns {Promise<{contributors: Array, rateLimit: object, error: object }>} List of contributors to the passed repository
 *
 * @example getRepoContributors({ owner: 'gsa', repo: 'code-gov-integrations', client: apiClient })
 * @example getRepoContributors({ owner: 'gsa', repo: 'code-gov-integrations', per_page: 100, client: apiClient })
 */
async function getRepoContributors({ owner, repo, anon=false, per_page=10, page=1, client}) {
  const requestParams = { owner, repo, anon, per_page, page };

  let contributors = [];
  let rateLimit = {};
  let error = {};

  try {
    const results = await client.paginate(client.repos.listContributors.endpoint(requestParams));
    contributors = await Promise.all(
      results.map(async contributor => {
        const username = contributor.login;

        rateLimit = await getRateLimit(client);
        rateLimit = await handleRateLimit({ rateLimit, client });

        const user = await client.users.getByUsername({ username });

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
 * Fetch all data for the supplied repository.
 * This includes general repository data, issues, contributors, languages, and README file.
 *
 * @param {object} params Parameters needed by the API client and the client itself.
 * @param {string} params.owner Repository owner
 * @param {string} params.repoName Repository name
 * @param {object} params.client API client instance.
 * @returns {Promise<object>} Object with repository data, repository issues, repository README, and repository contributors
 *
 * @example getAllDataForRepo({ owner: 'gsa', repo: 'code-gov-integrations', client: apiClient })
 */
async function getAllDataForRepo({ owner, repoName, client }) {
  let rateLimit;
  let repo;

  try {
    rateLimit = await handleRateLimit({
      rateLimit: await getRateLimit(client),
      client
    });
  } catch(error) {
    rateLimit = {};
  }

  try {
    const repoData = await getRepoData({ owner, repo: repoName, client });
    repo = repoData.repo;
    rateLimit = await handleRateLimit({
      rateLimit: repoData.rateLimit,
      client
    });
  } catch(error) {
    throw error;
  }

  try {
    const readmeData = await getRepoReadme({ owner, repoName, client });
    repo.readMe = readmeData.readme;
    rateLimit = await handleRateLimit({
      rateLimit: readmeData.rateLimit,
      client
    });
  } catch(error) {
    repo.readMe = '';
  }

  try {
    const repoLanguages = await getRepoLanguages({ owner, repoName, client });
    repo.languages = repoLanguages.languages;
    rateLimit = await handleRateLimit({
      rateLimit: repoLanguages.rateLimit,
      client
    });
  } catch(error) {
    repo.languages = [];
  }

  if(repo.has_issues) {
    try {
      const issuesData = await getRepoIssues({ owner, repo: repoName, per_page:10, client });
      rateLimit = await handleRateLimit({
        rateLimit: issuesData.rateLimit,
        client
      });
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
  getAllDataForRepo,
  getRepoReadme,
  getRepoData,
  getRepoIssues,
  getRepoLanguages,
  getClient,
  getRepoContributors
};
