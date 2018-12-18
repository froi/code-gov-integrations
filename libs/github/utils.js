/**
 * Fetch API rate limit information.
 * @param {object} client Api client.
 * @returns {Promise<object>} Rate limit object.
 */
async function getRateLimit(client) {
  try {
    const response = await client.misc.getRateLimit();
    return response.data.resources.core;
  } catch(error) {
    throw new Error(error);
  }
}

/**
 * Parse rate limit information from response headers.
 * @param {object} response Response object from an API request.
 * @returns {object} Object containing current limit, remaining,
 * and reset rate limit values if the correct response headers are present.
 * Defaults to an empty object.
 */
function parseRateLimit(response) {
  if(response.hasOwnProperty('headers')) {
    return {
      limit: response.headers["x-ratelimit-limit"],
      remaining: response.headers["x-ratelimit-remaining"],
      reset: response.headers["x-ratelimit-reset"]
    };
  }

  return {};
}

/**
 * Delay function to be used with Promises.
 * @param {number} time Time to delay in miliseconds
 * @param {*} value Any value to be returned after the delay.
 * @returns {Promise} A resolved Promise with the value passed.
 * @example delay(5000, 'All the delay')
 */
function delay(time, value) {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(null, value), time);
  });
}

/**
 * Handle rate limit objects and apply the correct time delays.
 * @param {object} param0
 * @param {object} param0.rateLimit Rate limit object from the parseRateLimit function
 * @param {object} param0.client API client instance
 * @returns {Promise} Rate limit object ofter the appropiate time delay
 * @example
 * const rateLimit = {limit: 5000, remaining: 4000, reset: 9872343454 }
 * rateLimit = handleRateLimit({ rateLimit, client: apiClient })
 */
async function handleRateLimit({ rateLimit, client }) {
  const { remaining, limit, reset } = rateLimit;
  const now = new Date().getMilliseconds();
  const waitTime = now - reset;
  const percentRemaining = remaining / limit;

  if(percentRemaining <= 0.15) {
    return await delay(waitTime, await getRateLimit(client));
  }

  return await delay(1000, await getRateLimit(client));

}

/**
 * Paginates over the results of the passed method.
 * @param {object} client Api client instance.
 * @param {function} method Function to execute and paginate over.
 * @param {object} params Parameter for the supplied method. Parameters should include page size and offset.
 * @returns {Promise<{data: *, rateLimit: object}>}
 *
 * @example
 * let requestParams = {
 *   owner: 'gsa',
 *   repo: 'code-gov-integrations',
 *   state: 'open',
 *   labels: 'help wanted,code.gov',
 *   per_page: 10,
 *   page: 1};
 * const result = await paginate(client, client.issues.getForRepo, requestParams);
 */
async function paginate (client, method, params) {
  try {
    await handleRateLimit({
      rateLimit: await getRateLimit(client),
      client
    });

    let response = await method(params);
    let {data} = response;

    while (client.hasNextPage(response)) {
      await handleRateLimit({
        rateLimit: await getRateLimit(client),
        client
      });
      response = await client.getNextPage(response);
      data = data.concat(response.data);
    }

    return data;
  } catch(error) {
    throw error;
  }
}

/**
 * Handle errors from the API client and transform them into the package error object.
 * @param {object} error API client error object.
 * @returns {object} Object with the package's error object and the current rateLimit information.
 */
function handleError(error) {
  const rateLimit = parseRateLimit(error);

  return {
    error: Object.assign({}, {
      code: error.code,
      status: error.status,
      message: error.message
    }),
    rateLimit
  };

}

module.exports = {
  parseRateLimit,
  handleRateLimit,
  paginate,
  getRateLimit,
  handleError
};
