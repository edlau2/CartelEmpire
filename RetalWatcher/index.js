
const config = require("./config.js");

const { createWebhookQueue } = require("./webhookQueue");

//const { EmbedBuilder } = require('discord.js');

// Node 18+ has fetch built in. 
// You can comment out the next two lines if running Node v18+
const fetchMod = (config.requireCrossFetch == true) ? 'cross-fetch' : 'node-fetch';
const fetch = global.fetch || require(fetchMod);

const { createLogger } = require("./logger");
const { loadStore, saveStore } = require("./persistentStore");

const logger = createLogger(config.logging);

const CHECK_INTERVAL_MS = config.checkAttackIntervalSecs * 1000;   // Time between API calls
const DISCORD_WEBHOOK_URL = config.discordWebhookUrl;    // Webhook URL

const msInSec = 1000;
const secsInMin = 60;
const minInHr = 60;
const hrsInDay = 24;

// ==========================================================================
// Need to rate limit, otherwise will get 429 errors from Discord
const webhookQueue = createWebhookQueue({
  minIntervalMs: 1200,   // one message per 1.2 seconds
  logger
});

// ==========================================================================
// Load persistent state (timestamps, IDs, etc.)
let store = loadStore();
if (!store.cachedUsers) store.cachedUsers = {};
if (!store.cartelIds) store.cartelIds = {};
if (!store.cartelMembers) store.cartelMembers = {};

const getNameFromId = (id) => { return store.cachedUsers[`${id}`] ? store.cachedUsers[`${id}`].name : null; }
const getRepFromId = (id) => { return store.cachedUsers[`${id}`] ? store.cachedUsers[`${id}`].rep : null; }
const getLvlFromId = (id) => { return store.cachedUsers[`${id}`] ? store.cachedUsers[`${id}`].lvl : null; }
const getFacMemberFromId = (id) => { return store.cartelMembers[`${id}`]; }
const getCartelFromId = (id) => { return "<opponent cartel>"; }

function toShortDateStr(date) {
    if (!date) date = new Date();
    const mediumTime = new Intl.DateTimeFormat("en-GB", {
      timeStyle: "medium",
      hourCycle: "h24",
    });
    const shortDate = new Intl.DateTimeFormat("en-GB", {dateStyle: "short"});

    let dt = shortDate.format(date);
    let parts = dt.split('/');
    let yr = parts[2].slice(2);
    dt = parts[0] + "/" + parts[1] + "/" + yr;

    const formattedDate = dt + ", " + mediumTime.format(date);
    return formattedDate;
}

// ==========================================================================
// Return time as hh:mm:ss, or mm:ss
const nn = function(n) { if (n < 10) return ('0' + n); return n; }
function secsToClock(secsLeft) {
    if (secsLeft > 0) {
        let hrs = parseInt(secsLeft / 3600);
        let remains = secsLeft - (hrs * 3600);
        let mins = parseInt(remains / 60);
        let secs = parseInt(remains % 60);
        if (hrs > 24) hrs = 0;

        return ((+hrs > 0) ? (nn(hrs) + ":") : '') +
            ((+mins > 0) ? (nn(mins)) : '00') + ":" + nn(secs);
    } else {
        return '00:00:00';
    }
}

function buildAttackUrl(lastCreateTime) {
    let url = config.getAttacksUrl + (lastCreateTime ? ("&from=" + lastCreateTime) : '') + "&key=" + config.api_key;
    return url;
}

function buildUserInfoUrl(oppId) {
    const url = `https://cartelempire.online/api/user?id=${oppId}&type=advanced&key=` + config.api_key;
    return url;
}

// ==========================================================================
// This builds a textual message that would display in
// Discord, above the embed.
function buildMsgFromAttack(attack) {
    //logger.log("[buildMsgFromAttack] attack: ", JSON.stringify(attack));
    let oppName = getNameFromId(attack.initiatorId);
    let defName = getFacMemberFromId(attack.targetId);
    let oppCartel = getCartelFromId(attack.initiatorCartelId);

    let now = new Date().getTime();
    let when = attack.created;
    let diffSecs = (now/1000) - Number(when);

    let attTime = toShortDateStr(new Date(Number(when) * 1000));
    let msg = `${oppName} [${attack.initiatorId}] ${attack.attackType}ed `+
        `${defName} [${attack.targetId}]\n${attTime}`; // (${secsToClock(diffSecs)} ago)`;

    //logger.log("[buildMsgFromAttack] attack, msg: ", msg);
    return msg;
}

// ==========================================================================
// This just creates the info to display in Discord,
// formatted as an embed.
function embedFromAttack(attack) {
    let now = new Date().getTime();
    let when = attack.created;
    let diffSecs = (now/1000) - Number(when);

    let fightDate = new Date((Number(when) * 1000));
    let fightTimestamp = toShortDateStr(fightDate); //new Date((Number(when) * 1000)).toISOString();

    let oppName = getNameFromId(attack.initiatorId);
    let oppFullName = oppName + " [" + attack.initiatorId + "]";
    let defName = getFacMemberFromId(attack.targetId);
    let oppCartel = getCartelFromId(attack.initiatorCartelId);

    let atTimeField = {
          "name": `When: ${fightTimestamp}`,
          "value": '',
          "inline": false
          };
    let attackerField = {
          "name": 'Attacker',
          "value": `[${oppFullName}](https://cartelempire.online/user/${attack.initiatorId})`,
          "inline": true
          };
    let defenderField = {
          "name": 'Defender',
          "value": `${defName} [${attack.targetId}]`,
          "inline": true
          };
    let attackerDetails = {
          "name": 'Attacker Details',
          "value": `\u200b\u200b\u200b\u200bRep: ${getRepFromId(attack.initiatorId)}\n` +
                   `\u200b\u200b\u200b\u200bLevel: ${getLvlFromId(attack.initiatorId)}`,
          "inline": false
          };
    let logField = {
          "name": 'Attack Log',
          "value": `[View Log Here](https://cartelempire.online/Fight/${attack.id})`,
          //"value": `https://cartelempire.online/Fight/${attack.id}`,
          "inline": false
          };

    let embedTitle = `Retal Available! Opponent:   ${oppFullName}`;

    let embedData =
    {
      "title": embedTitle,
      //"title": `Retal Available!   [${oppFullName}](https://cartelempire.online/user/${attack.initiatorId})`,
      "description": `[Profile/Attack link: ${oppFullName}](https://cartelempire.online/user/${attack.initiatorId})`,
      "color": 3447003,
      "fields": [
            atTimeField, attackerField, defenderField, attackerDetails, logField
        ],
      //timestamp: new Date().toISOString() 
    };

    return embedData;
}

// ==========================================================================
// Async wrapper around fetch
async function fetchJson(url) {
    const resp = await fetch(url, { method: "GET" });

    if (!resp.ok) {
        throw new Error(`GET failed ${resp.status}: ${await resp.text()}`);
    }

    return resp.json();
}

// ==========================================================================
async function sendDiscordNotification(attack) {
  const embed = embedFromAttack(attack);
  const messageContent = buildMsgFromAttack(attack);

  const payload = {
    //content: messageContent,
    embeds: [embed]
  };

  //logger.log("[sendDiscordNotification] payload: ", JSON.stringify(payload));

  // Push into queue, not directly to Discord
  webhookQueue.enqueue(DISCORD_WEBHOOK_URL, payload);
}

// ==========================================================================
async function processItem(attack) {
    const oppId = attack.initiatorId;
    const userInfoUrl = buildUserInfoUrl(oppId);
    const data = await fetchJson(userInfoUrl);

    // This just caches the data in a smaller format
    processUserInfoData(data);
    logger.log(`[processItem] Cached info for user id: ${oppId}`);
    //logger.log(`[processItem] data: `, JSON.stringify(data));

    await sendDiscordNotification(attack);
}

// ==========================================================================
async function filterAttackData(data) {
    let filtered = data.attacks.filter(attack => {
        const chkDate = (config.ignoreCreateDate == true ? 0 : parseInt(store.lastCreated));
        return (attack.initiatorCartelId != config.myCartelId &&
                attack.outcome == "Win" &&
                parseInt(attack.created) > parseInt(chkDate));
    });

    //logger.log("[processAttackData] full list, ", data.attacks.length, " attacks, filtered: ", filtered.length);

    // debug test
    // if (!filtered.length) {
    //   logger.log("Putting fake entry onto filter list");
    //     filtered.push(data.attacks[0]);
    // }

    logger.log("Processing ", filtered.length, " attacks");
    for (const attack of filtered) {
        try {
            await processItem(attack);
        } catch (err) {
            logger.error(`Error processing attack: ${err}`);
        }
    }
}

async function runCheck() {
    try {
        let dt = new Date(store.lastCreated * 1000);
        logger.log(`\n\n********** Running check for new attacks since ${toShortDateStr(dt)} **********\n`);
        if (config.ignoreCreateDate == true)
          logger.log("Date will be ignored due to config flag. Will get last 100 attacks");

        let param = (config.ignoreCreateDate == true) ? null: parseInt(store.lastCreated);
        const targetUrl = buildAttackUrl(param);
        const data = await fetchJson(targetUrl);
        let filtered = filterAttackData(data);

        let lastCreated = data.attacks[0] ? data.attacks[0].created : 0;
        logger.log("[runCheck] last entry date: ", lastCreated, "\n", (new Date(lastCreated * 1000).toString()));

        logger.log(`[runCheck] Check for retals complete. Will check again in ${config.checkAttackIntervalSecs} seconds ` + 
          `(${config.checkAttackIntervalSecs / 60} minutes)...`);

        store.lastCreated = lastCreated;
        saveStore(store);

    } catch (err) {
        logger.error(`runCheck failed: ${err}`);
    }
}

// ==========================================================================
async function updateMemberList() {
    // Check to see if we should bother updating the member list
    // The config opt 'forceMemberUpdate' will force an update regardless
    let lastMemberUpdate = store.lastMemberUpdate ?? 0;
    const now = new Date().getTime();
    const diffMin = parseInt((now - lastMemberUpdate) / msInSec / secsInMin);

    // If the diff is less than membersUpdateIntervalHrs, we don't need
    // an update yet, so just set a timer for the next new time.
    if (config.forceMemberUpdate != true && diffMin < (config.membersUpdateIntervalHrs * minInHr)) {
        let whenToCheckMs = lastMemberUpdate + (config.membersUpdateIntervalHrs * minInHr * secsInMin * msInSec);
        let untilCheck = whenToCheckMs - now;
        setTimeout(updateMemberList, untilCheck);
        logger.log("[updateMemberList] member update not required, will check in ", 
            (untilCheck / 1000 / 60), " minutes.");
        return;
    }

    if (config.forceMemberUpdate == true)
        logger.log("[updateMemberList] Forcing update regardless");

    let targetURL = config.getMembersUrl + config.api_key;
    if (!store.cartelMembers) store["cartelMembers"] = {};

    const data = await fetchJson(targetURL);

    if (data) {
        let currMembers = {};
        data.members.forEach(member => {
            currMembers[member.userId] = member.name;
        });
        if (Object.keys(currMembers).length > 1) {
            store.cartelMembers = JSON.parse(JSON.stringify(currMembers));
        }
    }

    store.lastMemberUpdate = now;
    saveStore(store);
    logger.log("[updateMemberList] ", Object.keys(store.cartelMembers).length, " members written to store.");
}

// ==========================================================================
async function processUserInfoData(data) {
    //logger.log("[processUserInfoData] data: ", JSON.stringify(data));
    let oldEntry = store.cachedUsers[data.userId];
    let entry = { "name": data.name, "cartelId": data.cartelId, "rep": data.reputation, "lvl": data.level, "id": data.userUd };
    store.cachedUsers[data.userId] = entry;

    if (data.cartelId)
        store.cartelIds[data.cartelId] = data.cartelName;
}

// ============================ Entry point ==================================
//
logger.log("Checking if cartel member list needs update...");
updateMemberList();

logger.log(`Starting periodic retal checks every ${config.checkAttackIntervalSecs} seconds ` + 
          `(${config.checkAttackIntervalSecs / 60} minutes)...`);

setInterval(runCheck, CHECK_INTERVAL_MS);

runCheck(); // immediate first run.


