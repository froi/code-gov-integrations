async function getRateLimit(client) {
  const response = await client.misc.getRateLimit();

  return response.data.resources.core;
}

function parseRateLimit(ghResponse) {
  if(ghResponse.hasOwnProperty('headers')) {
    return {
      limit: ghResponse.headers["x-ratelimit-limit"],
      remaining: ghResponse.headers["x-ratelimit-remaining"],
      reset: ghResponse.headers["x-ratelimit-reset"]
    };
  }

  return {};
}

async function handleRateLimit(rateLimit) {
  const { remaining, limit, reset } = rateLimit;
  const now = new Date().getMilliseconds();
  const waitTime = now - reset;
  const percentRemaining = remaining / limit;

  return percentRemaining <= 0.15
    ? new Promise((resolve) => setTimeout(async () => resolve(await getRateLimit()), waitTime))
    : rateLimit;

}

async function paginate (client, method, params) {
  let response = await method(params);
  let rateLimit = await handleRateLimit(parseRateLimit(response));

  let {data} = response;
  while (client.hasNextPage(response)) {
    response = await client.getNextPage(response);
    rateLimit = handleRateLimit(parseRateLimit(response));
    data = data.concat(response.data);
  }

  return { data, rateLimit };
}

function handleError(error) {
  console.log(error)
  const rateLimit = parseRateLimit(error);

  return {
    error: Object.assign({}, { code: error.code, status: error.status, message: error.message }),
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
