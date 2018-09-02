const rateLimitResponse = {
  resources: {
    core: {
      limit: 60,
      remaining: 59,
      reset: 1535752663
    },
    search: {
      limit: 10,
      remaining: 10,
      reset: 1535749141
    },
    graphql: {
      limit: 0,
      remaining: 0,
      reset: 1535752681
    }
  },
  rate: {
    limit: 60,
    remaining: 59,
    reset: 1535752663
  }
};
const getReadmeResponse = 'Mock Readme.';
const getRepoLanguagesResponse = {
  JavaScript: 179061,
  HTML: 8723,
  CSS: 804,
  Dockerfile: 352
};

const getRepoContributorsResponse = [
  {
    login: "froi",
    id: 1918027,
    node_id: "MDQ6VXNlcjE5MTgwMjc=",
    avatar_url: "https://avatars0.githubusercontent.com/u/1918027?v=4",
    gravatar_id: "",
    url: "https://api.github.com/users/froi",
    html_url: "https://github.com/froi",
    followers_url: "https://api.github.com/users/froi/followers",
    following_url: "https://api.github.com/users/froi/following{/other_user}",
    gists_url: "https://api.github.com/users/froi/gists{/gist_id}",
    starred_url: "https://api.github.com/users/froi/starred{/owner}{/repo}",
    subscriptions_url: "https://api.github.com/users/froi/subscriptions",
    organizations_url: "https://api.github.com/users/froi/orgs",
    repos_url: "https://api.github.com/users/froi/repos",
    events_url: "https://api.github.com/users/froi/events{/privacy}",
    received_events_url: "https://api.github.com/users/froi/received_events",
    type: "User",
    site_admin: false,
    contributions: 368
  }
]

const getUsersResponse = {
  "login": "froi",
  "id": 1918027,
  "node_id": "MDQ6VXNlcjE5MTgwMjc=",
  "avatar_url": "https://avatars0.githubusercontent.com/u/1918027?v=4",
  "gravatar_id": "",
  "url": "https://api.github.com/users/froi",
  "html_url": "https://github.com/froi",
  "followers_url": "https://api.github.com/users/froi/followers",
  "following_url": "https://api.github.com/users/froi/following{/other_user}",
  "gists_url": "https://api.github.com/users/froi/gists{/gist_id}",
  "starred_url": "https://api.github.com/users/froi/starred{/owner}{/repo}",
  "subscriptions_url": "https://api.github.com/users/froi/subscriptions",
  "organizations_url": "https://api.github.com/users/froi/orgs",
  "repos_url": "https://api.github.com/users/froi/repos",
  "events_url": "https://api.github.com/users/froi/events{/privacy}",
  "received_events_url": "https://api.github.com/users/froi/received_events",
  "type": "User",
  "site_admin": false,
  "name": "Froilan Irizarry",
  "company": "@fullstacknights ",
  "blog": "http://froilanirizarry.me",
  "location": "Washington, DC",
  "email": null,
  "hireable": null,
  "bio": "Tech lead @ Code.gov | Co-founder @fullstacknights \r\n\r\ncode.gov specific questions or feedback please take a look at https://github.com/GSA/code-gov",
  "public_repos": 59,
  "public_gists": 40,
  "followers": 76,
  "following": 90,
  "created_at": "2012-07-03T12:31:20Z",
  "updated_at": "2018-08-28T16:26:23Z"
}

module.exports = {
  rateLimitResponse,
  getReadmeResponse,
  getRepoLanguagesResponse,
  getRepoContributorsResponse,
  getUsersResponse
}
