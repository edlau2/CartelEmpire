module.exports = {
  // I hope these three are self-explanatory?
  "api_key": "",
  "discordWebhookUrl": "https://discord.com/api/webhooks/....",
  "myCartelId": 84,

  // This can be set to true to use cross-fetch instead of node-fetch,
  // when running Node.js versions prior to version 18
  "requireCrossFetch": false,

  // Will make an API call every checkAttackIntervalSecs seconds, for any new
  // attacks since those returned in the last check.
  "checkAttackIntervalSecs": 120,

  // Every membersUpdateIntervalHrs hours, a new API call to get our cartel members
  // and cache their id => name relationship.
  "membersUpdateIntervalHrs": 24,

  // These are strictly for development and testing purposes. Can force an API call
  // to be made every time the program starts up, and can also always get the last
  // 100 attacks and not filter by the last date/time checked.
  "forceMemberUpdate": false,
  "ignoreCreateDate": false,

  "getMembersUrl": "https://cartelempire.online/api/cartel?type=members&key=",
  "getAttacksUrl": "https://cartelempire.online/api/cartel?type=attacks",

  // Log output can go to the console or to a log. When logged, can write to rotating logs,
  // kept for 'maxDays' and saved in the specified directory.
  "logging": {
    "console": true,
    "file": false,
    "directory": "./logs",
    "maxDays": 7
  }
};
