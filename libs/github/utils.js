/**
 * Fetch API rate limit information.
 * @param {object} client Api client.
 * @returns {Promise<object>} Rate limit object.
 */
async function getRateLimit(client) {
  try {
    const response = await client.rateLimit.get();
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


 * Handle errors from the API client and transform them into the package error object.
 * @param {object} error API client error object.
 * @returns {object} Object with the package's error object and the current rateLimit information.
 */
function handleError(error) {
  const rateLimit = parseRateLimit(error);

  return {
    error: Object.assign({}, {
      status: error.status,
      message: error.message
    }),
    rateLimit
  };

}

module.exports = {
  parseRateLimit,
  handleRateLimit,
  getRateLimit,
  handleError
};
