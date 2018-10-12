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
    let response = await method(params);
    let rateLimit = await handleRateLimit({
      rateLimit: parseRateLimit(response),
      client
    });

    let {data} = response;
    while (client.hasNextPage(response)) {
      response = await client.getNextPage(response);
      rateLimit = await handleRateLimit({
        rateLimit: parseRateLimit(response),
        client
      });
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
