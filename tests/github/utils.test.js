const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const nock = require('nock');


const { getRateLimit, handleError, parseRateLimit, handleRateLimit } = require('../../libs/github/utils');
const Github = require('@octokit/rest');

const { rateLimitResponse } = require('../nock_responses/github');

describe('utils', () => {
  let client;
  let nockScope;

  before(() => {
    client = new Github();
    nockScope = nock('https://api.github.com');
  });

  describe('getRateLimit', () => {
    it('returns a rate limit object', async () => {
      nockScope.get('/rate_limit').reply(200, rateLimitResponse);
      const rateLimit = await getRateLimit(client);
      expect(rateLimit.limit).to.equal(60);
    });
    it('throws an error', () => {
      nockScope.get('/rate_limit').reply(500, 'oh no!!!');
      expect(getRateLimit(client)).to.eventually.be.rejected;
    });
  });

  describe('handleError', () => {
    it('should parse and return error and rateLimit objects', () => {
      const errorResponse = {
        code: 404,
        status: "Not Found",
        message: "Not Found Error",
        headers: {
          "x-ratelimit-limit": 60,
          "x-ratelimit-remaining": 59,
          "x-ratelimit-reset": 123456
        }
      };

      const result = handleError(errorResponse);

      expect(result).to.haveOwnProperty('error');
      expect(result).to.haveOwnProperty('rateLimit');
      expect(Object.keys(result.error)).to.deep.equals(['code','status', 'message']);
      expect(Object.keys(result.rateLimit)).to.deep.equals(['limit', 'remaining', 'reset']);
    });
  });
  describe('parseRateLimit', () => {
    it('should return rate limit object', () => {
      const response = {
        data1: 'data1',
        data2: 'data2',
        data3: 'data3',
        headers: {
          'x-ratelimit-limit': 60,
          'x-ratelimit-remaining': 59,
          'x-ratelimit-reset': 123456
        }
      };

      const rateLimit = parseRateLimit(response);
      expect(Object.keys(rateLimit)).to.deep.equals(['limit', 'remaining', 'reset']);

      const { limit, remaining, reset } = rateLimit;
      expect(limit).to.be.equal(60);
      expect(remaining).to.be.equal(59);
      expect(reset).to.be.equal(123456);
    });
    it('should return an empty object', () => {
      const response = {
        data1: 'data1',
        data2: 'data2',
        data3: 'data3'
      };
      const rateLimit = parseRateLimit(response);
      expect(rateLimit).to.be.empty;
    })
  });

  describe('handleRateLimit', () => {
    it('should handle rate limit object with over 15% remaining', () => {
      nockScope.get('/rate_limit').reply(200, rateLimitResponse);
      let date = new Date();
      date.setSeconds(date.getSeconds() + 100);
      const rateLimit = {
        limit: 60,
        remaining: 59,
        reset: date.getMilliseconds()
      }
      expect(handleRateLimit({ rateLimit, client })).to.eventually.be.a('object');
    });
    it('should handle rate limit object with 15% or less remaining', () => {
      let date = new Date();
      date.setSeconds(date.getSeconds() + 100);
      const rateLimit = {
        limit: 60,
        remaining: 4,
        reset: date.getMilliseconds()
      };

      nockScope.get('/rate_limit').reply(200, rateLimitResponse);
      expect(handleRateLimit({ rateLimit, client })).to.eventually.be.a('object');
    });
  });
});
