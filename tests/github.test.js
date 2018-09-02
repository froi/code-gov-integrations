const expect = require('chai').expect;
const nock = require('nock');
const { rateLimitResponse,
  getReadmeResponse,
  getRepoLanguagesResponse,
  getRepoContributorsResponse,
  getUsersResponse,
  getRepoIssuesResponse,
  getRepoDataResposne } = require('./nock_responses/github');

const Github = require('@octokit/rest');

const { getData,
  getRateLimit,
  getRepoReadme,
  getRepoData,
  getRepoIssues,
  getRepoLanguages,
  getRepoContributors } = require('../libs/github/github');

describe('Test Github Integration', () => {
  let github;

  beforeEach(() => {
    const owner = 'gsa';
    const repo = 'code-gov-api';
    const user = 'froi';

    nock('https://api.github.com')
      .get('/rate_limit').reply(200, rateLimitResponse)
      .get(`/repos/${owner}/${repo}/readme`)
      .reply(200, { data: getReadmeResponse })
      .get(`/repos/${owner}/${repo}/languages`)
      .reply(200, getRepoLanguagesResponse)
      .get(`/repos/${owner}/${repo}/contributors`)
      .query({ anon: false, per_page: 10, page: 0 })
      .reply(200, getRepoContributorsResponse)
      .get(`/users/${user}`)
      .reply(200, getUsersResponse)
      .get(`/repos/${owner}/${repo}/issues`)
      .query({ state: 'open', labels: 'help wanted', per_page: 10, page: 0 })
      .reply(200, getRepoIssuesResponse)
      .get(`/repos/${owner}/${repo}`)
      .reply(200, getRepoDataResposne);

    github = new Github();
  });

  describe('get the rate limit', () => {
    it('returns a rate limit object', () => {
      return getRateLimit(github)
        .then(rateLimit => expect(rateLimit.limit).to.equal(60));
    });
  });

  describe('get the readme for a repo', () => {
    it('should return the repo readme text', () => {
      return getRepoReadme('gsa', 'code-gov-api', github)
        .then(data => expect(data.readme).to.deep.equal({ data: 'Mock Readme.' }));
    });
  });

  describe('get the languages for a repo', () => {
    it('should return the repo languages', () => {
      return getRepoLanguages('gsa', 'code-gov-api', github)
        .then(data => expect(data.languages).includes('JavaScript'));
    });
  });

  describe('get the contributors for a repo', () => {
    it('should return the contributors array', () => {
      return getRepoContributors({owner: 'gsa', repo: 'code-gov-api', client: github })
        .then(data => {
          expect(data[0].gh_profile).to.be.equal('https://github.com/froi');
        });
    });
  });

  describe('get the issues for a repo', () => {
    it('should return an array of issues', () => {
      return getRepoIssues({ owner: 'gsa', repo: 'code-gov-api', per_page:10, page: 0, client: github})
        .then(data => {
          const issues = data.issues;
          expect(data).to.haveOwnProperty('issues');
          expect(issues).to.be.instanceOf(Array);
          expect(issues[0]).to.haveOwnProperty('issue_url');
          expect(issues[0].issue_url).to.be.equal('https://github.com/GSA/code-gov-api/issues/243');
        });
    });
  });

  describe('get data for a repo', () => {
    it('should return repo data object', () => {
      return getRepoData('gsa', 'code-gov-api', github)
        .then(data => {
          expect(data).to.haveOwnProperty('repo');
          expect(data.repo).to.haveOwnProperty('full_name');
          expect(data.repo.full_name).to.be.equal('GSA/code-gov-api');
        });
    });
  });

  describe('get data for a repo', () => {
    it('should return repo data object', () => {
      return getData('gsa', 'code-gov-api', github)
        .then(data => {
          expect(data).to.haveOwnProperty('full_name');
          expect(data.full_name).to.be.equal('GSA/code-gov-api');
        });
    });
  });
});
