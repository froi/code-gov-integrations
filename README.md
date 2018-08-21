# Code.gov Integrations

Small module to house Code.gov integrations with third party services.

## How to use this module

All integrations found in the `libs` folder are accesible when requiring this package.

```javascript
const { github } = require('@code.gov/code-gov-integrations');

const githubClientParams = {
    type: 'token',
    token: '[your-gh-token]'
};
github.getData('gsa', 'code-gov-integrations', githubClientParams)
    .then(data => console.log(data))
    .catch(error => console.error(error));
```

For more examples take a looks at our `examples` folder.

## How to add a module / integration

All you have to do is add a folder with an `index.js` file that exports your integration's API. The folder name will the the name used to export the integration.

```
libs
  |- new_integration
    |- index.js
```

The included integration(s) export an object with a getData function. We recomend following the same pattern with your integrations.

Contributing integrations to this module must follow the pattern mentioned for it to be considered for inclusion.