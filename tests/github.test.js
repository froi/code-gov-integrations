const expect = require('chai').expect;
const nock = require('nock');
const { rateLimitResponse,
  getReadmeResponse,
  getRepoLanguagesResponse,
  getRepoContributorsResponse,
  getUsersResponse } = require('./nock_responses/github');

const Github = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

const { getData,
  getRateLimit,
  getRepoReadme,
  getRepoData,
  getRepoIssues,
  getRepoLanguages,
  getGithubClient,
  getContributors } = require('../libs/github/github');

describe('Test Github Integration', () => {
  let github;

  before(() => {
    const owner = 'gsa';
    const repo = 'code-gov-api';
    const user = 'froi'

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
      .reply(200, getUsersResponse);

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
      return getContributors({owner: 'gsa', repo: 'code-gov-api', client: github })
        .then(data => {
          expect(data[0].gh_profile).to.be.equal('https://github.com/froi')
        });
    });
  });
});
