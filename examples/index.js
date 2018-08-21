const integrations = require('@code.gov/code-gov-integrations');

/**
 *  Change the following to have this work
 * [your-token] for your Github personal access token
 * [owner] for the owner of the repo your want to query
 * [repoName] for the name of the repositoty you want to query
 *
 * Remember that Github URL are https://github.com/:owner/:repoName.
 * So as long as you have that you can substitute the values here as needed
 */

const searchObjects = [{
    integration: {
      name: 'github',
      params: {
        type: 'token',
        token: '[your-token]'
      },
    },
    owner: '[owner]',
    repo: '[repo-name]'
  },
  {
    integration: {
      name: 'github',
      params: {
        type: 'token',
        token: '[your-token]'
      },
    },
    owner: '[owner]',
    repo: '[repo-name]'
  }
];

Promise.all(
  searchObjects.map(async searchObject => {
      return await integrations[searchObject.integration.name].getData(searchObject.owner, searchObject.repo,
        searchObject.integration.params)
    })
  )
  .then(values => console.log(JSON.stringify(values, null, 2)))
  .catch(error => console.error(error));