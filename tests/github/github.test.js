const expect = require('chai').expect;
const nock = require('nock');
const {
  rateLimitResponse,
  getReadmeResponse,
  getRepoLanguagesResponse,
  getRepoContributorsResponse,
  getUsersResponse,
  getRepoIssuesResponse,
  getRepoDataResponse } = require('../nock_responses/github');

const Github = require('@octokit/rest');

const {
  getClient,
  getRepoReadme,
  getRepoData,
  getRepoIssues,
  getRepoLanguages,
  getRepoContributors } = require('../../libs/github/github');

describe('Test Github Integration', () => {
  let github;
  let nockScope = nock('https://api.github.com');
  let owner = 'gsa';
  let repo = 'code-gov-api';
  let user = 'froi';
  let nockInterceptor;
  let defaultRateLimit;

  before(() => {
    nockScope.get('/rate_limit').times(Infinity).reply(200, rateLimitResponse);
    owner = 'gsa';
    repo = 'code-gov-api';
    user = 'froi';
    github = new Github();
    defaultRateLimit = {
      "x-ratelimit-limit": 60,
      "x-ratelimit-remaining": 59,
      "x-ratelimit-reset": 123456
    };
  });
  after(() => {
    // Should clean any prepared mocks as to not affect other test files.
    // This is specifically done for the ratelimit mock.
    nock.cleanAll();
  });

  describe('get API client', () => {
    it('should return an API client instance', () => {

      nockScope.get('/', null, {reqheaders: {"Authorization": "token not-a-token"}}).reply(200, {});

      const client = getClient({type:'token', token:'not-a-token'});

      expect(client).to.haveOwnProperty('repos');
      expect(client).to.haveOwnProperty('issues');
      expect(client).to.haveOwnProperty('pullRequests');
      expect(client).to.haveOwnProperty('users');
    })
  });
  describe('get the readme for a repo', () => {
    before(() => {
      nockInterceptor = nockScope.get(`/repos/${owner}/${repo}/readme`);
    });
    it('should return the repo readme text', async () => {
      nockInterceptor.reply(200, getReadmeResponse, defaultRateLimit);
      const { readme, error} = await getRepoReadme({ owner: 'gsa', repo: 'code-gov-api', client: github });

      expect(error).to.be.empty;
      expect(readme).to.deep.equal('Mock Readme.');
    });
    it('should return an error', async () => {
      await errorTests({
        nockInterceptor,
        targetFunction: getRepoReadme,
        targetFunctionParams: {
          owner: 'gsa', repo: 'code-gov-api', client: github
        }
      });
    });
  });

  describe('get the languages for a repo', () => {
    beforeEach(() => {
      nockInterceptor = nockScope.get(`/repos/${owner}/${repo}/languages`);
    });
    it('should return the repo languages', async () => {
      nockInterceptor.reply(200, getRepoLanguagesResponse, defaultRateLimit);

      const { languages } = await getRepoLanguages({
        owner: 'gsa', repo: 'code-gov-api', client: github
      });

      expect(languages).includes('JavaScript');
    });
    it('should return an error', async () => {
      await errorTests({
        nockInterceptor,
        targetFunction: getRepoLanguages,
        targetFunctionParams: {
          owner: 'gsa', repo: 'code-gov-api', client: github
        }
      });
    });
  });

  describe('get the contributors for a repo', () => {
    beforeEach(() => {
      nockInterceptor = nockScope.get(`/users/${user}`)
        .reply(200, getUsersResponse, {
          "x-ratelimit-limit": 60,
          "x-ratelimit-remaining": 59,
          "x-ratelimit-reset": 123456
        })
        .get(`/repos/${owner}/${repo}/contributors`)
        .query({ anon: false, per_page: 10, page: 1 });
    });
    it('should return the contributors array', async () => {
      nockInterceptor.reply(200, getRepoContributorsResponse, defaultRateLimit);
      const data = await getRepoContributors({
        owner: 'gsa', repo: 'code-gov-api', client: github
      });
      const { contributors } = data;
      expect(contributors[0].gh_profile).to.be.equal('https://github.com/froi');
    });
    it('should return an error', async () => {
      await errorTests({
        nockInterceptor,
        targetFunction: getRepoContributors,
        targetFunctionParams: {
          owner: 'gsa', repo: 'code-gov-api', client: github
        }
      });
    });
  });

  describe('get the issues for a repo', () => {
    beforeEach(() => {
      nockInterceptor = nockScope.get(`/repos/${owner}/${repo}/issues`)
        .query({ state: 'open', labels: 'help wanted', per_page: 10, page: 1 })
    });
    it('should return an array of issues', async () => {
      nockInterceptor.reply(200, getRepoIssuesResponse, defaultRateLimit);
      const data = await getRepoIssues({
        owner: 'gsa', repo: 'code-gov-api', per_page:10, page: 1, client: github
      });
      const issues = data.issues;

      expect(data).to.haveOwnProperty('issues');
      expect(issues).to.be.instanceOf(Array);
      expect(issues[0]).to.haveOwnProperty('issue_url');
      expect(issues[0].issue_url).to.be.equal('https://github.com/GSA/code-gov-api/issues/243');
    });
    it('should return an error', async () => {
      await errorTests({
        nockInterceptor,
        targetFunction: getRepoIssues,
        targetFunctionParams: {
          owner: 'gsa', repo: 'code-gov-api', per_page:10, page: 1, client: github
        }
      });
    });
  });

  describe('get data for a repo', () => {
    before(() => {
      nockInterceptor = nockScope.get(`/repos/${owner}/${repo}`);
    });
    it('should return repo data object', async () => {
      nockInterceptor.reply(200, getRepoDataResponse, defaultRateLimit);
      const data = await getRepoData({ owner: 'gsa', repo: 'code-gov-api', client: github });

      expect(data).to.haveOwnProperty('repo');
      expect(data.repo).to.haveOwnProperty('full_name');
      expect(data.repo.full_name).to.be.equal('GSA/code-gov-api');
    });
    it('should return an error', async () => {
      await errorTests({
        nockInterceptor,
        targetFunction: getRepoData,
        targetFunctionParams: { owner: 'gsa', repo: 'code-gov-api', client: github }
      });
    });
  });
});

async function errorTests({ nockInterceptor, targetFunction, targetFunctionParams, rateLimit }) {
  nockInterceptor.reply(404,
    { "message":"Not Found","documentation_url":"https://githubdocs.com.not.real" },
    rateLimit
  );
  const { error } = await targetFunction(targetFunctionParams);
  expect(error).to.haveOwnProperty('code');
  expect(error).to.haveOwnProperty('message');
  expect(error).to.haveOwnProperty('status');
}
