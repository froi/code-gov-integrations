# Code.gov Integrations

Small module to house Code.gov integrations with third party services.

## How to use this module

All integrations found in the `libs` folder are accesible through the `getModule` function that is exported from the `libs` module. Just pass the module name and you're ready to use it.

```javascript
const getModule = require('code-gov-integrations');

const github = getModule('github');
const githubClientParams = {
    type: 'token',
    token: '<your-gh-token>'
};
github.getData('gsa', 'code-gov-integrations', githubClientParams)
    .then(data => console.log(data))
    .catch(error => console.error(error));
```

## How to add a module / integration

All you have to do is add a folder with an `index.js` file that exports your integration's API.

The included integration(s) export an object with a getData function. We recomend following the same pattern with your integrations.

Contributing integrations to this module must follow the pattern mentioned for it to be considered for inclusion.