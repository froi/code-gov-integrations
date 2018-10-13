async function getRateLimit(client) {
  try {
    const response = await client.misc.getRateLimit();
    return response.data.resources.core;
  } catch(error) {
    throw error;
  }
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

function delay(time, value) {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(null, value), time);
  });
}

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

async function paginate (client, method, params) {
  try {
    let rateLimit = await getRateLimit(client);

    rateLimit = await handleRateLimit({ rateLimit, client });

    let response = await method(params);
    let {data} = response;

    while (client.hasNextPage(response)) {

      rateLimit = await getRateLimit(client);
      rateLimit = await handleRateLimit({ rateLimit, client });
      response = await client.getNextPage(response);
      data = data.concat(response.data);

    }

    return { data, rateLimit };
  } catch(error) {
    throw error;
  }
}

function handleError(error) {
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
