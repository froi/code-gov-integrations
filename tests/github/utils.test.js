const expect = require('chai').expect;
const nock = require('nock');

const { getRateLimit, handleError, parseRateLimit } = require('../../libs/github/utils');
const Github = require('@octokit/rest');

const { rateLimitResponse } = require('../nock_responses/github');

describe('utils', () => {
  let ghClient;
  beforeEach(() => {
    ghClient = new Github();

    nock('https://api.github.com')
      .get('/rate_limit').reply(200, rateLimitResponse);
  });

  describe('get the rate limit', () => {
    it('returns a rate limit object', () => {
      return getRateLimit(ghClient)
        .then(rateLimit => expect(rateLimit.limit).to.equal(60));
    });
  });

  describe('handleError', () => {
    it('should return rate limit object', () => {
      const errorResponse = {
        code: 404,
        status: 'Not Found',
        message: 'Not Found Error',
        headers: {
          'x-ratelimit-limit': 60,
          'x-ratelimit-remaining': 59,
          'x-ratelimit-reset': 123456
        }
      };

      const result = handleError(errorResponse);

      expect(result).to.haveOwnProperty('error');
      expect(result).to.haveOwnProperty('rateLimit');

      const { error, rateLimit } = result;

      expect(Object.keys(error)).to.deep.equals(['code','status', 'message']);
      expect(Object.keys(rateLimit)).to.deep.equals(['limit', 'remaining', 'reset']);

      const { code, status, message } = error;
      expect(code).to.be.equal(404);
      expect(status).to.be.equal('Not Found');
      expect(message).to.be.equal('Not Found Error');

      const { limit, remaining, reset } = rateLimit;
      expect(limit).to.be.equal(60);
      expect(remaining).to.be.equal(59);
      expect(reset).to.be.equal(123456);

    });
  });
  describe('parseRateLimit', () => {
    it('should return rate limit object', () => {
      const ghResponse = {
        data1: 'data1',
        data2: 'data2',
        data3: 'data3',
        headers: {
          'x-ratelimit-limit': 60,
          'x-ratelimit-remaining': 59,
          'x-ratelimit-reset': 123456
        }
      };

      const rateLimit = parseRateLimit(ghResponse);
      expect(Object.keys(rateLimit)).to.deep.equals(['limit', 'remaining', 'reset']);

      const { limit, remaining, reset } = rateLimit;
      expect(limit).to.be.equal(60);
      expect(remaining).to.be.equal(59);
      expect(reset).to.be.equal(123456);
    });
  });
});
