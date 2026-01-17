// ==UserScript==
// @name         CeQL
// @namespace    http://tampermonkey.net/
// @version      1.05
// @description  Customizes numerous pages, for better quality of life, all configurable...
// @author       xedx [55266]
// @match        https://cartelempire.online/*
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      http://code.jquery.com/ui/1.12.1/jquery-ui.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@latest/dist/chartjs-plugin-zoom.min.js
// @require      https://raw.githubusercontent.com/edlau2/CartelEmpire/master/Helpers/ce_js_utils.js
// @xxrequire      file:////Users/edlau/Documents/Documents - Ed’s MacBook Pro/Tampermonkey Scripts/Helpers/ce_js_utils.js
// @xxrequire      file:///D:/Tampermonkey Scripts/Helpers/ce_js_utils.js
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// ==/UserScript==

// This was once "CE Custom Pages 2.29", just renamed

/*eslint no-unused-vars: 0*/
/*eslint no-undef: 0*/
/*eslint curly: 0*/
/*eslint no-multi-spaces: 0*/
/*eslint dot-notation: 0*/
(function() {
    'use strict';

    // ======================= Configurable Options ==========================

    function initOptions(optObject) {
        $.each(optObject, function(key, value) {
            options[key] = JSON.parse(GM_getValue(key, JSON.stringify(value)));

            debug("[initOptions] ", key, options[key], optObject[key]);
            // Quick check for new properties
            let propKeys = Object.keys(optObject[key]);
            propKeys.forEach(pkey => {
                debug("[initOptions] check key ", pkey, " in ", options[key], ": ", options[key][pkey], isValid((options[key][pkey])));
                if (!isValid((options[key][pkey]))) {
                    debug("[initOptions] adding missing key: ", key, value, "\n", options[key], optObject[key]);
                    options[key][pkey] = optObject[key][pkey];
                }
            });

            GM_setValue(key, JSON.stringify(options[key]));
        });
    }

    const groupIdToId = (optId) => { return (optId + 'Custom'); }
    const groupIds = { "gbl": { "id": "global", "title": "Global Options" },
                       "exp": { "id": "exp", "title": "Expeditions" },
                       "job": { "id": "job", "title": "Jobs" },
                       "twn": { "id": "town", "title": "Town" },
                       "cbt": { "id": "combat", "title": "Combat" },
                       "cas": { "id": "casino", "title": "Casino" },
                       "ctl": { "id": "cartel", "title": "Cartel" },
                       "inv": { "id": "inventory", "title": "Inventory" },
                       "gym": { "id": "gym", "title": "Gym" },
                       "dbs": { "id": "database", "title": "Database Maintenance" },
                       "lnk": { "id": "links", "title": "Quick Links" },
                     };

    const options = {};
    const defOptions = {
        "lockStatusBar":       { "on": true, "desc": "Lock the status bar to the nav bar", "visible": true, "grp": "gbl" },
        "customClock":         { "on": true, "desc": "Put a small clock in LPT time on the nav bar", "visible": true, "grp": "gbl" },
        "displayJobStatus":    { "on": true, "desc": "Display job countdown timer on status bar", "visible": true, "grp": "job" },
        "notifyJobComplete":   { "on": true, "desc": "Alert when a job completes with a browser notification", "visible": true, "grp": "job", "btn": true, "btnTxt": "Test", "fn": "testAlerts" },
        "onJobClickGotoPage":  { "on": true, "desc": "Clicking the alert for a completed job open the job page in a new tab", "visible": true, "grp": "job" },
        "displayExpStatus":    { "on": true, "desc": "Display expedition countdown timer on status bar", "visible": true, "grp": "exp" },
        "notifyExpComplete":   { "on": true, "desc": "Notify via a browser alert when an expedition completes", "visible": true, "grp": "exp" },
        "showExpOverview":     { "on": true, "desc": "Add a table over-view of expedition team composition", "visible": true, "grp": "gbl" },
        "alertTimeoutSecs":    { "on": true, "val": 120, "desc": "Browser alert timeout, in seconds", "visible": false },
        "collapsibleHdrs":     { "on": true, "desc": "Put a small caret on certain headers to be able to collapse content. On some pages, the caret also exposes special options.", "visible": true, "grp": "gbl" },
        "townContextMenu":     { "on": true, "desc": "Add a right-click menu to the Town nav icon", "visible": true, "grp": "twn" },
        "progBarClickToGym":   { "on": true, "desc": "Clicking on the energy bar goes to gym", "visible": true, "grp": "lnk" },
        "invertFightResults":  { "on": true, "desc": "This means availability is enabled, show the menu", "visible": false },
        "showResultsInverted": { "on": true, "desc": "Display fight results with last action on top (sorted descending)", "visible": true, "grp": "cbt" },
        "enemyHospTime":       { "on": true, "desc": "On the Enemies page, show hosp time in status when hosp'd", "visible": true, "grp": "cbt" },
        "enableStakeouts":     { "on": true, "desc": "Add checkboxes to enable hosp time 'stakeouts' for targets", "visible": true, "grp": "cbt" },

        // Can get from API/event log at any time...
        "recordFightHistory":  { "on": true, "desc": "Save previous fight outcomes when you attack", "visible": true, "grp": "cbt" }, // maxFightHist
        "maxFightHist":        { "on": true, "val": 10, "desc": "Fight history to save per user", "visible": false },

        "lastRespectOnEnemiesPage": { "on": true, "desc": "On enemies page, display last respect from successfull attack", "visible": true, "grp": "cbt" },
        "dbgLoggingEnabled":   { "on": false, "desc": "Additional logging for development/debugging purposes.", "visible": true, "grp": "gbl" },
        "testDatabase":        { "on": false, "desc": "true to enable the experimental indexedDB", "visible": false },
        "marketKeepTabOnReload": { "on": true, "desc": "When the game auto-refreshes, say on clicking sell, come back to same tab", "visible": false },
        "expKeepTabOnReload":  { "on": false, "desc": "", "visible": false },
        "linksOnTownImages":   { "on": true, "desc": "Images on the Town page also link to their stores", "visible": false, "grp": "lnk" },
        "bountyPageHospStatus": {"on": true, "desc": "Display user status, bat stats (if available0, etc. on the Bounty page", "visible": true, "grp": "gbl"},
        "bountyPageNoAttackMug": {"on": true, "desc": "When going to a profile from the Bounties page, disable Attack and Mug buttons", "visible": true, "grp": "gbl"},
        "sortableCartelPage":  {"on": true, "desc": "Allow sorting on the Cartel page via column headers", "visible": true, "grp": "ctl"},
        "statEstimates":       {"on": true, "desc": "Attempt to estimate an opponents bat stats, based on previous fight data", "visible": true, "grp": "gbl"},
        "cooldownsOnStatBar":  {"on": false, "desc": "Display cooldowns on status bar", "visible": true, "grp": "gbl"},
        "saveMarketPrices":    {"on": true, "desc": "Collect historical prices from the item market", "visible": true, "grp": "twn"},
        "miniProfiles":        {"on": true, "desc": "Long press pops up mini-profiles on certain player's links, such as on chat", "visible": true, "grp": "lnk"},
        "gymLock":             {"on": true, "desc": "Allows you to specify default values to spend on each stat, or retain what you set over a refresh.", "visible": true, "grp": "gym"},
        "cashOnHandAlert":     {"on": true, "val": 400000, "desc": "Alert you when your cash on hand goes above a threshold, such as when your items sell in the market.", "visible": true, "grp": "gbl"},
        "showExpSuccessRates": {"on": true, "desc": "Show team success chance in team selct dropdowns.", "visible": true, "grp": "exp"},
        "showExpSmallFormat":  {"on": true, "desc": "Show expeditions in smaller format across the screen instead of vertically", "visible": true, "grp": "exp"},
        "installFavoritesMenu": {"on": true, "desc": "Place a 'favorites' menu on the status bar.", "visible": true, "grp": "lnk"},
        "itemHelpInMarket":    {"on": true, "desc": "Show hover help for items in the market showing things such as rank", "visible": true, "grp": "twn"},
        "trackDogTraining":    {"on": true, "desc": "Keep dog training statistics", "visible": true, "grp": "inv"},
        "exportDb":            {"on": true, "desc": "TBD: Export the entire CE database", "visible": true, "grp": "dbs", "btn": true, "btnTxt": "Export", "fn": "exportDb" },
        "importDb":            {"on": true, "desc": "TBD: Import an exported CE database", "visible": true, "grp": "dbs", "btn": true, "btnTxt": "Import", "fn": "importDb"  },
        "clearDb":             {"on": true, "desc": "TBD: Clear the entire CE database", "visible": true, "grp": "dbs", "btn": true, "btnTxt": "Clear", "fn": "clearDb"  },
        "viewDb":              {"on": true, "desc": "TBD: View the contents of the CE database (not yet implemented)", "visible": true, "grp": "dbs", "btn": true, "btnTxt": "View", "fn": "viewDb" },
        "rebuildAttHist":      {"on": true, "desc": "TBD: Rebuild the attack history databse (max 60 days)", "visible": true, "grp": "cbt", "btn": true, "btnTxt": "Rebuild", "fn": "rebuildAttHist" },
        "marketPriceHelper":   {"on": true, "desc": "Provide suggested sell prices in the item market.", "visible": true, "grp": "twn" },

        // Don't need to collect, there is a graph API call...
        "personalStatsGraphs": {"on": true, "desc": "TBD: Collect personal stats over time to display in a graphical format", "visible": false, "grp": "gbl" },

        "refillQuickLinks":    {"on": true, "desc": "Add buttons to the Support page/refills page that go to the gym, pet store, etc.", "visible": true, "grp": "lnk" },
        "fasterStoreSales":    {"on": true, "desc": "Faster Store Sales: Can make selling to stores easier, by collapsing headers and pre-filling some fields. Only for Armed Surplus so far.", "visible": true, "grp": "twn" },
        "fixupProductionPage": {"on": true, "desc": "TBD...", "visible": true, "grp": "gbl" },
        };

    initOptions(defOptions);

    debugLoggingEnabled = options.dbgLoggingEnabled.on;

    // ================================== Globals, misc helper functions ==============================

    const user_id = initUserId();
    const user_name = 'xedx';

    const secsInMin = 60 * 60;
    const secsInHr = secsInMin * 60;
    const secsInDay = secsInHr * 24;

    // Unused, was going to be used for preserving last tab you
    // were viewing on refresh. Using 'history' doesn't give you the URLs
    var prevPage = JSON.parse(GM_getValue("prevPage",
                   JSON.stringify({ "href": null, "time": null})));

    // Database (IndexedDB) support
    const currDbVersion = 21;
    var cartelDB;
    var cartelDBKeys;
    var cartelDBCount;
    var dbReady = false;
    var dbWaitingFns = [];
    const databaseName = "CartelEmpire2";

    // Store namss are here and in the dbStores object to make creating them easier.
    const settingsStoreName = "Settings";
    const expeditionTeamsStoreName = "ExpeditionTeams";
    const casinoResultsStoreName = "CasinoResults";
    const fightResultStoreName = "AttackResults";
    const allItemsStoreName = "AllItems";
    const dogStatsStoreName = "DogStats";
    const privateEventsStoreName = "PrivateEvents";
    const marketPricesStoreName = "MarketPrices";
    const batStatsStoreName = "EstimatedBatStats";
    const eventsAttackStoreName = "AttackEventsStore";
    const eventsJobsStoreName = "JobEventsStore";
    const idToUserStoreName = "KnownUsers";
    const pricesByCatWithStatusStoreName = "MarketPricesItemStatus";

    // Indexes
    const byTypeIdx = { "name": "byType", "key": "type" };
    const byCatIdx = { "name": "byCategory", "key": "category" };
    const byNameIdx = { "name": "byName", "key": "name" };
    const dbStores = {
        "fightResultStore": { "name": fightResultStoreName, "indexes": [], "keypath": "auto, false", "oolKey": "id", "active": true },  // out Of Line key defined for autoIncrement/false
        "settingsStore": { "name": settingsStoreName, "indexes": [], "keypath": "auto, true", "active": false },
        "expeditionTeamsStore": { "name": expeditionTeamsStoreName, "indexes": [], "active": true },
        "casinoResultsStore": { "name": casinoResultsStoreName, "indexes": [], "active": false },
        "allItemsStoreName": { "name": allItemsStoreName, "indexes": [ byTypeIdx ], "keypath": "id", "active": true },
        "dogStatsStore": { "name": dogStatsStoreName, "indexes": [], "keypath": "auto, true", "active": true },
        "marketPricesStore": { "name": marketPricesStoreName, "indexes": [ byNameIdx, byCatIdx ], "keypath": "auto, true", "active": true },
        "batStatsStore": { "name": batStatsStoreName, "oldName": "estimatedBatStats", "indexes": [], "keypath": "userId", "active": true },
        "idToUserStore": { "name": idToUserStoreName, "oldName": "knownUsers", "indexes": [], "keypath": "userId", "active": true },
        "eventsJobsStore": { "name": eventsJobsStoreName, "indexes": [], "keypath": "dateTime", "active": false },
        "eventsAttackStore": { "name": eventsAttackStoreName, "indexes": [], "keypath": "dateTime", "active": false },
        "privateEventsStore": { "name": privateEventsStoreName, "indexes": [], "keypath": "dateTime", "active": true },
        "pricesByCatWithStatusStore": { "name": pricesByCatWithStatusStoreName, "indexes": [], "keypath": "name", "active": true },
    };

    // 'name' must be a property of the stored objects
    function getDbStoreEntryByName(name) {
        let keys = Object.keys(dbStores);
        for (let idx=0; idx<keys.length; idx++) {
            let key = keys[idx];
            let entry = dbStores[key];
            if (entry.name == name) return entry;
        }
    }

    const itemCategories = ['weapon', "thrown", 'armour', 'special', "alcohol", "medical", "drug", 'production',
                            'construction', 'food', 'collectible', 'luxury', 'car', 'enhancement', 'points'];
    const filterNameForDb = (name) => { return name.replaceAll(' ', '_'); }
    const dbNameToRealName = (name) => { return name.replaceAll('_', ' '); }
    const filterPriceForDb = (price) => {  return parseInt(price.replace(/\D/g, '')); }

    var pageIsVisible = true;
    const onVisChange = (isVisible) => { pageIsVisible = isVisible; }

    // Classes that may or may not be instantiated, based on options.
    var theClock;
    var theGymLock;
    var cashWatcher;

    const darkMode = $("html").attr("data-bs-theme") === "dark";
    const caretBtn = `<span class="col-caret"><i class="fa fa-caret-down"></i></span>`;

    const  deepCopy = (src) => { return JSON.parse(JSON.stringify(src)); }

    // Saved time left for expeditions (when 'displayExpStatus' is enabled)
    var expTimers = new Array(3);
    let temp = JSON.parse(GM_getValue('expTimers', JSON.stringify([])));
    if (temp && temp.length)
        expTimers = JSON.parse(JSON.stringify(temp));
    else
        GM_setValue('expTimers', JSON.stringify(expTimers));

    // Page detection
    const thisURL = window.location.pathname.toLowerCase() || "home";  // Returns path only or home if not specified

    // 'undefined' check is temp for a bug in here somewhere...
    const escapeRegExp = (string) => { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('undefined', ''); }
    const hasPath = (txt) => { return new RegExp(`${escapeRegExp(txt)}`, 'gi').test(thisURL); }

    const titleText = () => { return $('Title').text(); }
    const isSettingsPage = () => { return hasPath("/settings"); }
    const isJobsPage = () => { return hasPath("/Job"); }
    const isGymPage = () => { return hasPath("/Gym"); }
    const isTownPage = () => { return hasPath("/Town"); }
    const isExpeditionsPage = () => { return hasPath("expedition"); }
    const isProductionPage = () => { return hasPath("production"); }
    const isMarketPage = () => { return hasPath("market"); }
    const isFightResults = () => { return titleText() ? titleText().indexOf("Fight Report") > -1 : false; }
    const isUserPage = () => { return hasPath("/user"); }
    const isBountyPage = () => { return hasPath("bounty"); }
    const isCartelPage = () => { return hasPath("cartel"); }
    const isInventoryPage = () => { return hasPath("inventory"); }
    const isEstateAgent = () => { return hasPath("estateagent"); }
    const isCalendarPage = () => { return hasPath("/Calendar"); }
    const isSupporterPage = () => { return hasPath("supporter"); }

    // This needs to be checked for friends or enemies...
    const isFriendsEnemiesPage = () => { return hasPath("connections"); }

    const pageTitle = () => { return $($("title")[0]).text() ?? ''; }

    // Some TM menu choices for debugging stuff until in the UI
    if (typeof GM_registerMenuCommand === 'function') {

//         GM_registerMenuCommand('Alert with timeout', function () {
//             debug(`[stakeout][handleTenSecTimer] visible: `, pageIsVisible);
//             let timeout = 30;
//             let id = 42;
//             if ($(`#alert-${id}`).length > 0) return;

//             let msg = "Test Auto-Close, Modeless alert";
//             const opts = { "mainMsg": msg, "timeoutSecs": timeout, "optId": `alert-${id}`, "optBg": 'xalertBg' };
//             alertWithTimeout(opts);
//             $(`#alert-${id} .p1`).after($(`<p class="p2">This alert will go away in ${timeout} seconds.</p>`));
//             setTimeout(updateAlert, 1000, id, --timeout);
//             debug(`[stakeout][handleTenSecTimer]: alert node: `, $(`#alert-${id}`), " opts: ", opts);

//             function updateAlert(id, timeout) {
//                 if (timeout <= 0 || !$(`#alert-${id}`).length) return;
//                 $(`#alert-${id} .p2`).text(`This alert will go away in ${timeout} seconds.`);
//                 setTimeout(updateAlert, 1000, id, --timeout);
//             }
//         });

        // GM_registerMenuCommand('Job Alert', function () {
        //     jobAlerter.setOption("timeout", 60);
        //     jobAlerter.sendAlert();
        // });

        // GM_registerMenuCommand('Export whole IndexedDB', dbExportWholeDB);
        // GM_registerMenuCommand('Export single store', dbExportOneStorePrompt);
        // GM_registerMenuCommand('Import from backup file', dbImportFromFile);
    }

    // ========= some misc debugging aids =================
    // Track API calls active for debugging too many calls. The counts are
    // kept track of in the shared library.
    //
    const logApiCount = (msg) => {
        const apiCount = getCountApiCalls();
        debug("[apiTracker] from: ", msg, " count: ", apiCount);
        return apiCount;
    }

    // For testing other scripts, I sometimes run on only the Calendar
    // page, and may not want this running also. So check for that...
    if (isCalendarPage() && GM_getValue("calendarReserved", false) == true) {
        debug("Calendar page reserved, not running");
        return;
    }

    // =========================

    // Some UI elements for frinds/enemies page
    const repDiv = `<div class='col-1"><div class="rep-ff d-flex align-items-center"></div></div>`;
    const repDivSm = `<div class="rep-ff col-xl-2 d-flex align-items-center"></div>`;
    const repHdr = `<div class="d-none d-xl-inline col-xl-5" style="display: inline-flex !important;">
                        <div class="rep-hdr col-xl-2">Rep/FF</div><div class="col-xl-4">Notes</div>
                    </div>`;

    // Generic checkbox handler. Name of CB must be key/option name in 'options'
    function handleCbChange(e) {
        debug("[handleCbChange]: ", $(this), $(this).attr('type'), $(this).attr('name'), $(this).prop('checked'));
        let key = $(this).attr('name');
        let val = $(this).prop('checked');

        options[key].on = val;
        GM_setValue(key, JSON.stringify(options[key]));
        debug("[handleCbChange] key ", key, " = ", val);
    }

    // ================= Misc helpers, to be moved to the shared lib =================

    // ========================== Hash a URL into a small one ===============================

    async function hashUrlToId(url, length = 7) {
      const textEncoder = new TextEncoder();
      const data = textEncoder.encode(url);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);

      const hashArray = Array.from(new Uint8Array(hashBuffer));
      let num = 0;
      for (let i = 0; i < Math.min(length, hashArray.length); i++) {
        num = (num * 256) + hashArray[i];
      }

      const base62Chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
      let result = "";
      while (num > 0) {
        result = base62Chars[num % 62] + result;
        num = Math.floor(num / 62);
      }

      while (result.length < length) {
        result = "0" + result;
      }

      return result.substring(0, length); // Ensure the final length
    }

    // ============ In an object of objects, find entry by unique key-vale pair =============

    function findEntryByKeyValue(outerObject, keyToMatch, valueToMatch) {
        for (const outerKey in outerObject) {
           if (outerObject.hasOwnProperty(outerKey)) {
               const innerObject = outerObject[outerKey];

              // Ensure the innerObject is indeed an object before checking its properties
              if (typeof innerObject === 'object' && innerObject !== null) {
                if (innerObject[keyToMatch] === valueToMatch) {
                  return innerObject; // Return the entire inner object that matches
                }
              }
            }
          }
          return null; // Return null if no matching entry is found
    }

    // ================================== Long press handler ======================================

    function longPressOnChat(params) {
        debug("[longpress] [longPressOnChat] params: ", params);
        let msg = `Long Press detected!\nName: ${params["name"]}, ID: ${params["id"]}\nhref: ${params["href"]}`;
        alert(msg);
    }

    function showEnemyBatStatEstimate(params) {
        let msg = `Name: ${params["name"]} [${params["id"]}]\nEstimated stats: ${params["stats"]}`;
        alert(msg);
    }

    function addLongPressHandler(element, callback, params) {
        debug("[longpress] adding handler to: ", $(element), "\nparams: ", params);
        let pressTimer;
        const longPressDuration = 500; // milliseconds

        function handleLongPress() { callback(params); }

        $(element).on('mousedown touchstart', (e) => {
          e.preventDefault();
          pressTimer = setTimeout(handleLongPress, longPressDuration);
        });

        $(element).on('mouseup mouseleave touchend touchcancel', () => {
          clearTimeout(pressTimer);
        });
    }

    // ================================== Browser notifications ===================================

    // The options passed to the c-tor define the alert appearance and duration.
    // Only one of a given 'type' can exist, the type prevents mltiple alerts for the same thing.
    // Here, I'd use 'job', 'exp', 'stakeout'....
    class BrowserAlert {

        static activeAlerts = {};
        static defActiveAlerts = { "job": {"active": false, "ts": 0},
                                  "stakeout": {"active": false, "ts": 0},
                                  "exp": {"active": false, "ts": 0},
                                  "generic": {"active": false, "ts": 0} };

        constructor(opts = {title: 'Alert',
                            msg: 'Oops I forgot what I was going to say...',
                            type: 'generic',
                            timeout: options.alertTimeoutSecs.val,
                            interval: 60,
                            tag: '',
                            icon: '',
                            data: {},
                            clickFn: null}) {

            if (!opts.clickFn) opts.clickFn = this.handleNotifyClick;

            this.readAlerts();

            this.activeKey = opts.type + '.alertActive';
            this.tmSecs = opts.timeout;
            this.alertActive = 0;
            this.clickCb = opts.clickFn;
            this.type = opts.type;
            this.navigated = false;

            this.opts = {
                title: opts.title,
                text: opts.msg,
                tag: opts.tag,
                image: opts.icon,
                data: opts.data,
                timeout: opts.timeout * 1000,
                onclick: (context) => {
                    this.resetAlert();
                    this.handleClick(context, this.opts);
                }, ondone: () => {
                    this.resetAlert();
                    debug("[BrowserAlert] Notify done");
                }
            };

            //debug("[BrowserAlert] Created new BrowserAlert: ", this.opts);
        }

        timeTill(tm) {
            let now = new Date().getTime();
            if (now > tm) return 0;
            return secsToClock(tm - now);
        }

        validateActiveAlerts() {
            //debug("[browserAlert] validateAlerts");

            let ja = BrowserAlert.activeAlerts.job;
            let sa = BrowserAlert.activeAlerts.stakeout;
            let ea = BrowserAlert.activeAlerts.exp;

            let dirty = false;
            let tt = this.timeTill(ja.ts);
            if (!tt || +tt == 0) { ja.active = false; ja.ts = 0; dirty = true; }
            tt = this.timeTill(sa.ts);
            if (!tt || +tt == 0) { sa.active = false; sa.ts = 0; dirty = true; }
            tt = this.timeTill(ea.ts);
            if (!tt || +tt == 0) { ea.active = false; ea.ts = 0; dirty = true; }

            if (dirty == true) {
                debug("[browserAlert] validateAlerts, cleaned!");
                this.writeAlerts();
            }
        }

        logAlerts(msg='', noVal=false) {
            let ja = BrowserAlert.activeAlerts.job;
            let sa = BrowserAlert.activeAlerts.stakeout;
            let ea = BrowserAlert.activeAlerts.exp;
            let jobMsg = `job, active:  ${ja.active},  ts: ${ja.ts}, ${tinyTimeStr(ja.ts)}, until: ${this.timeTill(ja.ts)}\n`;
            let staMsg = `job, active:  ${sa.active},  ts: ${sa.ts}, ${tinyTimeStr(sa.ts)}, until: ${this.timeTill(sa.ts)}\n`;
            let expMsg = `job, active:  ${ea.active},  ts: ${ea.ts}, ${tinyTimeStr(ea.ts)}, until: ${this.timeTill(ea.ts)}\n`;
            debug("[browserAlert] ", msg, "\n", jobMsg, staMsg, expMsg);

            if (noVal == true) return;
            this.validateActiveAlerts();
        }

        writeAlerts() {
            //this.logAlerts('writeAlerts: ', true);
            GM_setValue("activeBrowserAlerts", JSON.stringify(BrowserAlert.activeAlerts));
        }

        readAlerts() {
            BrowserAlert.activeAlerts = JSON.parse(GM_getValue("activeBrowserAlerts", JSON.stringify(BrowserAlert.defActiveAlerts)));
            //this.logAlerts('readAlerts: ', true);
            this.validateActiveAlerts();
        }

        handleClick(context, opts) {
            debug("[BrowserAlert] Handle notification click ", context, opts);
            if (this.clickCb) this.clickCb(context, opts);
        }

        setOption(opt, val) {
            this.opts[opt] = val;
            debug("[BrowserAlert] type: ", this.type, " opts: ", this.opts);
        }

        isActive() {
            this.readAlerts();
            debug("[BrowserAlert][isActive, type: ", this.type);
            this.logAlerts('is active: ');
            if (BrowserAlert.activeAlerts[this.type].active == false) return false;
            let expTime = BrowserAlert.activeAlerts[this.type].ts;
            let now = new Date().getTime();
            let tt = this.timeTill(expTime);
            if (tt <= 0 || !tt || now > expTime) { // Expired, clear ... //reset but set now while we are here?
                BrowserAlert.activeAlerts[this.type].ts = 0; //(new Date().getTime() + (+this.tmSecs * 1000));
                BrowserAlert.activeAlerts[this.type].active = false;
                this.writeAlerts();
                this.logAlerts('isActive, resetting...: ');
                return false;
            }
            return true;
        }

        clearAlerts() {
            debug("[BrowserAlert] clearAlerts. ", this.type);
            GM_notification({
                tag: this.type
            });
        }

        sendAlert(params={"alertCallback": null}) {
            if (this.type == 'stakeout') {
                let now = new Date();
                let id = params.id;
                if (!id || !Object.keys(activeStakeouts).length) {
                    debug(toShortDateStr(now), " id: ", id, " stakeouts: ", activeStakeouts);
                    debugger;
                    return;
                }
                let entry = activeStakeouts[id];
                if (entry.hospitalRelease == 0) {
                    debug(toShortDateStr(now), " id: ", id, " stakeouts: ", activeStakeouts);
                    //debugger;
                    return;
                }
                this.opts.tag = id;
            } else {
                this.opts.tag = this.type;
            }

            this.logAlerts('sendAlert: ');
            if (this.isActive() == true) {
                debug("[BrowserAlert] sendAlert: ", BrowserAlert.activeAlerts);

                // debug("[BrowserAlert] Alert already active: ",
                //       (new Date().getTime() - this.alertActive),
                //       (this.tmSecs * 1000));

                debug("[BrowserAlert] msg: ", this.opts.text, "\n", params);
                return;
            }
            this.logAlerts('sendAlerts 2: ');
            this.setAlertActive();
            this.navigated = false;
            if (params && params.msg) this.opts.text = params.msg;

            GM_notification(this.opts);

            // Call the supplied callback
            if (params["callbackAfterAlert"]) {
                debug("[BrowserAlert] afterAlertCallback: ", this.opts, params, this.navigated);
                const callback = params["callbackAfterAlert"];
                if (this.navigated == true) {
                    debug("***** [BrowserAlert] afterAlertCallback: already notified!!! ****");
                    return;
                }
                this.navigated = true;
                callback(this.opts, params);
            }
            setTimeout(this.resetAlert, this.tmSecs * 1000, this);
            return true;
        }

        handleNotifyClick(context) {
            debug("[BrowserAlert] Handle notifyClick");
            this.resetAlert(this);
        }

        resetAlert(myThis) {
            debug("[BrowserAlert] myThis: ", myThis, " this: ", this);
            if (!myThis) myThis = this;
            myThis.readAlerts();
            myThis.logAlerts('resetAlert: ');
            BrowserAlert.activeAlerts[myThis.type].active = false;
            BrowserAlert.activeAlerts[myThis.type].ts = 0;
            myThis.logAlerts('resetAlert: ');
        }

        setAlertActive() {
            this.logAlerts('setAlertactive: ');
            this.readAlerts();
            if (!BrowserAlert.activeAlerts[this.type])
                BrowserAlert.activeAlerts[this.type] = { "active": true, "ts": (new Date().getTime() + (+this.tmSecs * 1000)) };
            else {
                BrowserAlert.activeAlerts[this.type].active = true;
                BrowserAlert.activeAlerts[this.type].ts = (new Date().getTime() + (+this.tmSecs * 1000));
            }
            this.writeAlerts();
            this.logAlerts('setAlertactive: ');
        }

    }

    function testAlert() {
        debug("[testAlert] testing...");
        let test = new BrowserAlert();
        test.sendAlert();
    }

    // ============================ Cash On Hand alerts =================================

    class cashOnHandWatcher {

        constructor(threshParam) {
            this.threshold = threshParam ? threshParam : options.cashOnHandAlert.val;
            this.addStyles();
            cashOnHandWatcher.checkCash(this.threshold);
        }

        doTest() { setTimeout(this.startCashAlert, 5000, true); }

        static stopCashAlert(isTest) {
            $("#nav-wrap div.progress-bar-title > span.cashDisplay").parent().removeClass('cc-alert');
            if (isTest == true) setTimeout(this.startCashAlert, 10000, true);
        }

        isActive() {
            return $("#nav-wrap div.progress-bar-title > span.cashDisplay").parent().hasClass('cc-alert');
        }

        static startCashAlert(isTest) {
            $("#nav-wrap div.progress-bar-title > span.cashDisplay").parent().addClass('cc-alert');
            if (isTest == true) setTimeout(this.stopCashAlert, 10000, true);
        }

        static checkCash(threshold) {
            const target = $("#nav-wrap div.progress-bar-title > span.cashDisplay");
            const bar = $("#nav-wrap div.progress-bar-title");
            if ($(target).length > 0) {
                let amt = parseInt($(target).text().replaceAll(',', ''));
                if (+amt > +threshold) {
                    if (!$("#nav-wrap div.progress-bar-title > span.cashDisplay").parent().hasClass('cc-alert')) {
                        cashOnHandWatcher.startCashAlert();
                        let msg = `CE Cash Alert - exceeded threshold!\n Cash on hand: ${asCurrency(amt)}`;
                        //alert(msg);
                    }
                } else {
                    cashOnHandWatcher.stopCashAlert();
                }
            } else {
                return setTimeout(cashOnHandWatcher.checkCash, 500, threshold);
            }

            setTimeout(cashOnHandWatcher.checkCash, 10 * 1000, threshold);
        }

        addStyles() {
            GM_addStyle(`
                @keyframes colorChange {
                    40% { background-color: rgba(0, 220, 0.2); }
                    50% { background-color: rgba(0, 220, 0.6); }
                    60% { background-color: rgba(0, 220, 0.2); }
                }

                .cc-alert {
                    animation: colorChange 1s infinite alternate;
                }
            `);
        }
    }

    // ====================== Bat Stat Estimates - by K9er, in AP Megascript =====================
    //
    // This i not my own, it was written by K9er for his Megascript compilation.
    // I need to ask if I re-distribute first!!!
    //
    // Modify to put in DB instead of local storage
    const observeDOM = (function() { // Used for seeing when elements update, for some reason there's no neat standard way to do that
        let MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        return function(obj, callback) {
            if(!obj || obj.nodeType !== 1)
                return;
            if(MutationObserver) {
                let mutationObserver = new MutationObserver(callback);
                mutationObserver.observe(obj, {
                    childList: true,
                    subtree: true
                });
                return mutationObserver;
            } else if(window.addEventListener) {
                obj.addEventListener("DOMNodeInserted", callback, false);
                obj.addEventListener("DOMNodeRemoved", callback, false);
            }
        }
    })();

    class StatEstimate {

            static queuedNames = [];

        constructor(darkMode) {
            this.brightness = darkMode ? 50 : 45;
            this.statEstimateLink = "/StatEstimates";
            this.statEstimateRegex = /^statestimates(\/|(\/\d+\/?)?(\?.+)?)?/;

            this.currentList = this.getList();
            if(this.currentList === null) {
                this.currentList = [];
                this.setList([]);
            }
            //GM_deleteValue("statEstimate_40");
            //this.currentList = this.currentList.filter(x=>x != 40);
            this.ownID = user_id;
            this.ownStats = this.getEst("self");

            this.constant = 8 / 3;
            this.maxFF = 3;
            this.minFF = 1;
            this.cutoff = 0.01; // Can't be certain whether it truncates or rounds, use the more conservative estimate
            this.repQuadratic = false;
            if(this.repQuadratic) {
                this.repA = 53 / 990;
                this.repC = 48 / 3;
            } else {
                this.repM = 0.049;
                this.repC = 2.7;
            }
            this.minStats = 400;
            this.multMug = 1 / 2;
            this.multHosp = 3 / 4;
            this.perPage = 50;
        }
        getEst(ID = "self") {
            const val = GM_getValue(`statEstimate_${ID}`);
            return val === undefined ? null : val;
        }
        setEst(ID, estimate) {
            GM_setValue(`statEstimate_${ID}`, estimate);
            console.log(`Set statEstimate_${ID} to "${estimate}"`);
            return estimate;
        }
        getList() {
            const list = GM_getValue("statEstimate_list");
            return list === undefined ? null : list;
        }
        setList(list) {
            GM_setValue("statEstimate_list", list);
            return list;
        }

        getName(ID) {
            // Test!!!
            if (dbReady == true) this.getName2(ID);
            //end test
            const name = GM_getValue(`name_${ID}`);
            return name === undefined ? null : name;
        }
        getName2(id, cb, params) {
            const self = this;
            debug("[statEstimate][getName2] id: ", id);
            dbGetItemFromStoreByKey(id, idToUserStoreName,
                (function(result, param) {
                    debug("[statEstimate][getName2] get: ", result, param, self);
                    if (cb) cb(result, param, self);
            }), params);
        }

        setName(ID, name) {
            GM_setValue(`name_${ID}`, name);
            console.log(`Set name_${ID} to "${name}"`);
            return name;
        }
        setName2(id, name) {
            const self = this;
            const entry = {userId: id, userName: name};
            //debug("[statEstimate] setName2, id: ", id, " name: ", name, " entry: ", entry);
            if (dbReady == false) {
                StatEstimate.queuedNames.push(entry);
                dbWaitingFns.push(addQueuedNames);
            } else {
                dbPutEntryInStore(entry, idToUserStoreName, null,
                    (function(target, params) {
                        //debug("[statEstimate][setName2] put/updated: ", target, params);
                }), entry);
            }
            function addQueuedNames() {
                //debug("[statEstimate] addQueuedNames: ", StatEstimate.queuedNames);
                StatEstimate.queuedNames.forEach(e => { self.setName2(e.userId, e.userName); });
                StatEstimate.queuedNames = [];
            }
        }

        calcFairFight(ownStats, theirStats) {
            debug("[statEstimate][calcFairFight] ", this.minFF, this.constant,
                  theirStats, ownStats, (1 + this.constant * theirStats / ownStats));
            return Math.min(this.maxFF, Math.max(this.minFF, 1 + this.constant * theirStats / ownStats));
        }
        estimateRep(level, fairFight) {
            debug("[statEstimate][estimateRep]");
            return (this.repQuadratic ? Math.pow(level + 1, 2) * this.repA + this.repC : Math.exp(level * this.repM + this.repC)) * fairFight;
        }
        estimateYouAttacked(ownStats, fairFight) {
            debug("[statEstimate][estimateYouAttacked]");
            if(fairFight === this.minFF)
                return [ '<', Math.ceil(this.cutoff / this.constant * ownStats).toLocaleString("en-US") ];
            return [ fairFight === this.maxFF ? '>' : '~', Math.floor(Math.max(this.minStats, (fairFight - 1) / this.constant * ownStats)).toLocaleString("en-US") ];
        }
        estimateAttackedYou(ownStats, fairFight) {
            debug("[statEstimate][estimateAttackedYou]");
            if(fairFight === this.minFF)
                return [ '>', Math.floor(this.constant * ownStats / this.cutoff).toLocaleString("en-US") ];
            return [ fairFight === this.maxFF ? '<' : '~', Math.ceil(Math.max(this.minStats, this.constant * ownStats / (fairFight - 1))).toLocaleString("en-US") ];
        }
        AattackedB(knownStatsText, fairFight, knownIsA) {
            const knownChar = knownStatsText[0];
            const knownStats = parseInt(knownStatsText.split(' ')[0].slice(1).replaceAll(',', ""));
            const theirStats = (knownIsA ? this.estimateYouAttacked : this.estimateAttackedYou).bind(this)(knownStats, fairFight);

            debug("[statEstimate][AattackedB] \n", knownChar, "\n", knownStats,
                  "\n", knownIsA, ": ", this.estimateYouAttacked, " or ", this.estimateAttackedYou);

            if(knownChar === '~')
                return theirStats;
            else if(knownChar === '>' && fairFight === (knownIsA ? this.minFF : this.maxFF))
                return [];
            else if(knownChar === '<' && fairFight === (knownIsA ? this.maxFF : this.minFF))
                return [];
            return [ knownChar, theirStats[1] ];
        }
        dontOverride(curStatEst, newStatEst, curChar, newChar) {
            if(curChar === '>' && newChar === '>' && curStatEst > newStatEst)
                return true;
            else if(curChar === '~' && newChar !== '~') {
                if(newChar === '>' && curStatEst > newStatEst)
                    return true;
                else if(newChar === '<' && curStatEst > newStatEst)
                    return true;
            }
            return false;
        }
        colorVal(ownStats, theirStats) {
            return ownStats ? ownStats / (ownStats + theirStats) : 0.5;
        }
        unColorVal(ownStats, theirStats) { // Unused
            return ownStats ? 67 * ownStats / (ownStats + theirStats) : 0;
        }
        scriptFunc() {
            $(() => {
                $("#userSearchName").on("input", target => {
                    $.get(`/User/SearchName?search=${target.currentTarget.value}`, result => {
                        if(result && result.status == 204) {
                            $("#userInput").attr("value", "");
                            $("#userInputActual").attr("value", "");
                            $("#userName").attr("value", "");
                        } else {
                            $("#userInput").attr("value", result.userId);
                            $("#userInputActual").attr("value", result.userId);
                            $("#userName").attr("value", result.name.toUpperCase());
                        }
                        validateSend();
                    });
                });

                $("#stats").on("input", () => validateSend());
            });
            function validateSend() {
                var allValid = true;

                if((typeof $("#userName").attr("value")) === "undefined") {
                    allValid = false;
                    $("#userInput").removeClass("is-invalid");
                } else if($("#userName").attr("value") == "") {
                    $("#userInput").addClass("is-invalid");
                    allValid = false;
                } else
                    $("#userInput").removeClass("is-invalid");

                let statsInput = document.getElementById("stats");
                if(!statsInput) {
                    allValid = false;
                    $("#stats").removeClass("is-invalid");
                } else if(statsInput.value.length === 0 || !/^\d[\d,]*$/.test(statsInput.value)) {
                    $("#stats").addClass("is-invalid");
                    allValid = false;
                } else {
                    $("#stats").removeClass("is-invalid");
                    statsInput.value = parseInt(statsInput.value.replaceAll(',', "")).toLocaleString("en-US");
                }

                if(allValid)
                    $("#addEstimate").attr("disabled", false);
                else
                    $("#addEstimate").attr("disabled", true);
            }
        }
        inStatEstimate(url) {
            debug("[statEstimate][inStatEstimate]");
            document.title = "Stat Estimates | Cartel Empire";
            const ownName = user_name;
            if(!this.ownStats) {
                let errorText = document.querySelector("div.content-container.contentColumn strong");
                errorText.innerHTML = `You haven't set your own stats yet! Visit <a class="text-white" href="/Gym">the gym</a> or <a class="text-white" href="/user">the homepage</a>`;
                return;
            }
            let container = document.querySelector("div.content-container.contentColumn");

            const urlParams = new URLSearchParams(window.location.search);
            const userID = urlParams.get("userId");
            const userName = urlParams.get("userName");
            const statEst = urlParams.get("stats");
            const deleteID = urlParams.get("delete");

            //
            // ******* use DB!!!
            //
            if(ownName !== userName && userID !== null && userName !== null && statEst !== null) {
                this.setEst(userID, `~${statEst} ${Date.now()} 0`);
                if(!this.currentList.includes(parseInt(userID))) {
                    this.currentList.push(parseInt(userID));
                    this.setList(this.currentList);
                }
                this.setName(userID, userName);
                this.setName2(userID, userName);
                container.innerHTML = `<div class="col-12 col-md-10"><div class="mb-4 card border-success"><div class="card-body text-center bg-success"><p class="card-text fw-bold text-white">Set the stat estimate for <a class="text-white" href="/User/${userID}">${userName}</a> to ${statEst}</p></div></div></div>`;
                window.history.replaceState({}, document.title, this.statEstimateLink); // remove params from URL
            } else if(deleteID !== null) {
                GM_deleteValue(`statEstimate_${deleteID}`);
                this.currentList = this.currentList.filter(estID => estID !== parseInt(deleteID));
                this.setList(this.currentList);
                const userName = this.getName(deleteID);
                container.innerHTML = `<div class="col-12 col-md-10"><div class="mb-4 card border-success"><div class="card-body text-center bg-success"><p class="card-text fw-bold text-white">Removed the stat estimate for <a class="text-white" href="/User/${deleteID}">${userName}</a></p></div></div></div>`;
                window.history.replaceState({}, document.title, this.statEstimateLink); // remove params from URL
            } else
                container.innerHTML = "";

            let extractedData = [];
            const ownData = [ ownName, "self", '~', this.ownStats, "---", 0 ];
            extractedData.push(ownData);
            for(var ID of this.currentList) {
                const estimate = this.getEst(ID);
                if(estimate === null) {
                    this.currentList = this.currentList.filter(estID => estID !== ID);
                    continue;
                }
                const textSplit = estimate.split(' ');
                extractedData.push([ this.getName(ID) || "???", ID, estimate[0], parseInt(textSplit[0].slice(1).replaceAll(',', "")), parseInt(textSplit[1]), parseInt(textSplit[2]) ]);
            }
            extractedData.sort((a, b) => {
                if(a[3] !== b[3])
                    return b[3] - a[3];
                else if(a[2] === '>' && b[2] !== '>')
                    return -1;
                else if(b[2] === '>' && a[2] !== '>')
                    return 1;
                else if(b[2] === '<' && a[2] !== '<')
                    return -1;
                else if(a[2] === '<' && b[2] !== '<')
                    return 1;
                return 0;
            });
            const ownRank = extractedData.indexOf(ownData);
            const pageNumText = url.replace('#', "").match(/\/\d+\/?$/);
            let pageNum = pageNumText === null ? Math.ceil(ownRank / this.perPage) : parseInt(pageNumText[0].replaceAll('/', ""));
            if(pageNum === 0)
                pageNum = 1;

            let navHTML = "";
            let insert = "";
            let muted = false;
            let added = false;
            for(let i = (pageNum - 1) * this.perPage; i >= 0 && i < extractedData.length && i !== pageNum * this.perPage; ++i) {
                added = true;
                const data = extractedData[i];
                if(!muted && data[3] < this.ownStats * (this.maxFF - 1) / this.constant)
                    muted = true;
                if(data[1] === "self")
                    insert += `<tr class="align-middle fw-bold"><td>${i + 1}</td><th><a class="fw-bold" href="/user">${ownName}</a></th><td><span style="color: hsl(60, 67%, ${this.brightness}%)">${this.ownStats.toLocaleString("en-US")}</span></td><td>---</td><td></td></tr>`;
                else {
                    insert += `<tr class="align-middle"><td${muted ? " class='text-muted'" : ""}>${i + 1}</td><th><a class="fw-bold" href="/User/${data[1]}">${data[0]}</a></th><td><span class="fw-bold">${data[2] === '~' ? "" : data[2].replace('>', "&gt;").replace('<', "&lt;")}</span><span style="color: hsl(${this.ownStats / (this.ownStats + data[3]) * 120}, 67%, ${this.brightness}%)">${data[3].toLocaleString("en-US")}</span></td>`;
                    const dateStr = new Date(data[4]).toLocaleDateString("en-GB", { timeZone: "Europe/London" });
                    if(data[5] === 0)
                        insert += `<td><span style="color: rgba(var(--bs-link-color-rgb), var(--bs-link-opacity, 1))">${dateStr}</span></td>`;
                    else
                        insert += `<td><a href="/Fight/${data[5]}">${dateStr}</a></td>`;
                    insert += `<td><button onclick="window.location.href += '?delete=${data[1]}'" title="Delete" aria-label="Delete stat estimate for ${data[0]}" class="btn btn-sm btn-outline-dark action-btn fw-normal p-0"><svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" height="20" width="20"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"></path></svg></button></td></tr>`;
                }
            }
            if(!added)
                insert = `<p class="card-text mt-4">You have no estimates</p>`;
            else {
                insert = `<table class="table align-items-center table-flush table-hover dark-tertiary-bg" id="statEstimateTable"><thead class="thead-light"><tr><th>Rank</th><th>Name</th><th>Estimate</th><th class="d-none d-lg-table-cell">Date of Estimate</th><th class="d-table-cell d-lg-none">Date</th><th>Delete</th></tr></thead><tbody>${insert}</tbody></table>`;
                const lastPageNum = Math.ceil(extractedData.length / this.perPage);
                navHTML = `<nav aria-label="Stat Estimates Page"><ul class="pagination justify-content-center"><li class="page-item${pageNum === 1 ? " active" : ""} pageNav"> <a class="page-link" href="${this.statEstimateLink}/1" data-page="1">1</a></li>`;
                if(pageNum >= 5)
                    navHTML += `<li class="page-item pageNav"><a class="page-link" href="${this.statEstimateLink}/${pageNum - 1}" data-page="${pageNum - 1}">&lt;- </a></li>`;
                for(let j = Math.max(2, pageNum - 2); j <= Math.min(lastPageNum - 1, pageNum + 2); ++j)
                    navHTML += `<li class="page-item${pageNum === j ? " active" : ""} pageNav"> <a class="page-link" href="${this.statEstimateLink}/${j}" data-page="${j}">${j}</a></li>`;
                if(pageNum <= lastPageNum - 4)
                    navHTML += `<li class="page-item pageNav"><a class="page-link" href="${this.statEstimateLink}/${pageNum + 1}" data-page="${pageNum + 1}">-&gt; </a></li>`;
                if(lastPageNum !== 1)
                    navHTML += `<li class="page-item${pageNum === lastPageNum ? " active" : ""} pageNav"> <a class="page-link" href="${this.statEstimateLink}/${lastPageNum}" data-page="${lastPageNum}">${lastPageNum}</a></li>`;
                navHTML += `</ul></nav>`;
            }

            let script = document.createElement("script");
            script.type = "text/javascript";
            script.innerHTML = this.scriptFunc.toString().replace(/^[^{]*{/, "").replace(/}[^}]*$/, "");
            document.head.appendChild(script);

            let fileInput = document.createElement("input");
            fileInput.id = "fileInput";
            fileInput.type = "file";
            fileInput.classList.add("d-none");
            fileInput.addEventListener("input", async e => {
                const file = e.target.files[0];
                if(file.type !== "application/json")
                    return;
                const contentText = await file.text();
                const content = JSON.parse(contentText);
                for(var entry of content) {
                    const userName = entry[0];
                    const userID = entry[1];
                    if(userID == this.ownID)
                        continue;

                    if(userName !== "???" && userName !== this.getName(userID))
                        this.setName(userID, userName);
                    this.setName2(userID, userName);

                    const curEst = this.getEst(userID);
                    if(curEst === null || entry[4] > parseInt(curEst.split(' ')[1])) {
                        this.setEst(userID, `${entry[2]}${entry[3].toLocaleString("en-US")} ${entry[4]} ${entry[5]}`);
                        if(!this.currentList.includes(userID)) {
                            this.currentList.push(userID);
                            this.setList(this.currentList);
                        }
                    }
                }
                window.location.reload();
            });

            const exportText = JSON.stringify(extractedData.filter(data => data[1] !== "self"));
            const fileBlob = new Blob([ exportText ], { type: "application/octet-binary" });
            const exportURL = window.URL.createObjectURL(fileBlob);
            const exportImport = `<div class="row align-items-center mb-4"><span class="text-center fw-bold">Export/Import Estimates</span></div><div class="row align-items-center mx-2 mb-2"><a class="btn btn-outline-dark w-100" href="${exportURL}" download="stat_estimates.json">Export</a></div><div class="row align-items-center mx-2 mb-2"><a class="btn btn-outline-dark w-100" onclick="document.getElementById('fileInput').click()">Import and Merge</a></div>`;
            const newEntryHTML = `<div class="row"><div class="col-12 col-sm-8 mb-3"><form id="addEstimateForm" class="mt-auto"><div class="row align-items-center mb-2"><div class="col-12 col-sm-3"><label class="form-label fw-bold" for="userId" id="searchLabel">Search</label></div><div class="col-12 col-sm-9"><div class="input-group"> <input class="form-control" type="text" placeholder="Diablo" autofill="false" id="userSearchName"></div></div></div><div class="row align-items-center mb-2"><div class="col-12 col-sm-3"><label class="form-label fw-bold" for="userId" id="usernameLabel">Player</label></div><div class="col-12 col-sm-9"><div class="input-group"> <input class="form-control is-invalid" name="userId" type="number" placeholder="1" min="1" disabled="" id="userInput" value=""><input class="form-control d-none" name="userId" type="number" placeholder="1" min="1" id="userInputActual" value=""><input class="form-control" name="userName" type="text" placeholder="Diablo" id="userName" value="" readonly></div></div></div><div class="row align-items-center"><div class="col-12 col-sm-3"><label class="form-label fw-bold" for="stats">Stats</label></div><div class="col-12 col-sm-9"><input class="form-control is-invalid" name="stats" type="text" placeholder="Enter player's stats" maxlength="20" required="true" autofill="false" id="stats"></div></div><input class="btn btn-outline-dark w-100 mt-4" type="submit" value="Add estimate" disabled="" id="addEstimate"></form></div><div class="col-12 col-sm-4">${exportImport}</div></div>`;
            container.innerHTML += `<div class="col-12 col-md-10"><div class="card mb-2"><div class="row mb-0"><div class="col-12"><div class="header-section"><h2>Battlestat Estimates</h2></div></div></div><div class="card-body">${newEntryHTML}<hr><div class="tab-pane fade active show" role="tabpanel"><div class="row mb-2 align-items-center">${navHTML}<div class="container">${insert}</div></div></div></div></div></div>`;
            container.appendChild(fileInput);
        }
        inSearch(url) {
            const table = document.querySelector("#userTable");

            const tableHeadTr = table.querySelector("thead tr");
            let ageCol = tableHeadTr.querySelectorAll("th")[2];
            let statEstCol = document.createElement("th");
            statEstCol.setAttribute("scope", "col");
            statEstCol.innerText = "Stat Estimate";
            tableHeadTr.insertBefore(statEstCol, ageCol);

            const entries = table.querySelectorAll("tbody tr");
            for(var entry of entries) {
                ageCol = entry.querySelectorAll("td")[1];
                statEstCol = document.createElement("td");

                const userLink = entry.querySelector("th").children[1];
                const userID = userLink.href.match(/\d+$/)[0];

                const statEst = this.getEst(userID);
                if(statEst !== null) {
                    const theirStatsText = statEst.split(' ')[0];
                    const theirStats = parseInt(theirStatsText.slice(1).replaceAll(',', ""));
                    statEstCol.innerHTML = `<a href="${this.statEstimateLink}" style="color: hsl(${this.colorVal(this.ownStats, theirStats) * 120}, 67%, ${this.brightness}%); text-decoration: none">${theirStatsText.replace('>', "&gt;").replace('<', "&lt;")}</a>`;

                    const userName = userLink.innerText; // Don't really need username of everyone

                    if(userName !== this.getName(userID))
                        this.setName(userID, userName);
                    this.setName2(userID, userName);

                } else if(userID === this.ownID && this.ownStats)
                    statEstCol.innerHTML = `<a href="${this.statEstimateLink}" style="color: hsl(60, 67%, ${this.brightness}%); text-decoration: none">${this.ownStats.toLocaleString("en-US")}</a>`;
                else {
                    statEstCol.classList.add("text-muted");
                    statEstCol.innerText = "---";
                }
                entry.insertBefore(statEstCol, ageCol);
            }
        }
        inBountyOrOtherCartel(url) {
            const table = document.querySelector("div.table-responsive table.table");
            if(table === null)
                return;

            const tableHeadTr = table.querySelector("thead tr");
            let levelCol = tableHeadTr.querySelectorAll("th")[1];
            let statEstCol = document.createElement("th");
            if(/^cartel/.test(url))
                statEstCol.setAttribute("scope", "col");
            statEstCol.innerText = "Stat Estimate";
            tableHeadTr.insertBefore(statEstCol, levelCol);

            let entries;
            let start = 0;
            let linkIdx = 1;
            if(/^cartel/.test(url)) {
                entries = table.querySelectorAll("tbody tr");
                if(/\d\/?$/.test(url))
                    linkIdx = 0;
            } else {
                entries = table.querySelectorAll("thead tr");
                start = 1;
                linkIdx = 0;
            }
            for(var i = start; i !== entries.length; ++i) {
                let entry = entries[i];
                const tds = entry.querySelectorAll("td");
                levelCol = tds[1];
                statEstCol = document.createElement("td");

                const userLink = tds[0].children[linkIdx];
                const userID = userLink.href.match(/\d+$/)[0];

                const statEst = this.getEst(userID);
                if(statEst !== null) {
                    const theirStatsText = statEst.split(' ')[0];
                    const theirStats = parseInt(theirStatsText.slice(1).replaceAll(',', ""));
                    statEstCol.innerHTML = `<a href="${this.statEstimateLink}" style="color: hsl(${this.colorVal(this.ownStats, theirStats) * 120}, 67%, ${this.brightness}%); text-decoration: none">${theirStatsText.replace('>', "&gt;").replace('<', "&lt;")}</a>`;

                    const userName = userLink.innerText; // Don't really need username of everyone

                    if(userName !== this.getName(userID))
                        this.setName(userID, userName);
                    this.setName2(userID, userName);

                } else if(userID === this.ownID && this.ownStats)
                    statEstCol.innerHTML = `<a href="${this.statEstimateLink}" style="color: hsl(60, 67%, ${this.brightness}%); text-decoration: none">${this.ownStats.toLocaleString("en-US")}</a>`;
                else {
                    statEstCol.classList.add("text-muted");
                    statEstCol.innerText = "---";
                }
                entry.insertBefore(statEstCol, levelCol);
            }
        }
        inCartelHomepage(url) {
            const table = document.querySelector("div.card-body > div.container-fluid");
            if(table === null)
                return;

            const tableHead = table.querySelector(".row-header");
            let levelCol = tableHead.querySelectorAll(".col")[1];
            let roleCol;
            let daysCol = tableHead.querySelectorAll(".col")[3];
            let statEstCol = document.createElement("div");
            statEstCol.classList.add("col", "col-xl-2");
            statEstCol.innerText = "Stat Estimate";
            tableHead.insertBefore(statEstCol, levelCol);
            levelCol.classList.remove("col-xl-2");
            levelCol.classList.add("col-xl-1");
            daysCol.classList.remove("col-xl-2");
            daysCol.classList.add("col-xl-1");

            let entries = table.querySelectorAll(".row.align-middle");
            for(var i = 0; i !== entries.length; ++i) {
                let entry = entries[i];
                const cols = entry.querySelectorAll(".col");
                const headerCols = entry.querySelectorAll(".col-3.fw-bold");
                levelCol = cols[1];
                roleCol = cols[2];
                daysCol = cols[3];
                let levelHeaderCol = headerCols[0];
                let roleHeaderCol = headerCols[1];
                let daysHeaderCol = headerCols[2];
                statEstCol = document.createElement("div");
                let statEstColHeader = document.createElement("div");
                statEstCol.classList.add("col", "col-3", "col-xl-2");
                statEstColHeader.classList.add("col-3", "d-xl-none", "fw-bold");
                levelCol.classList.remove("col-xl-2", "col-3");
                levelCol.classList.add("col-xl-1", "col-2");
                daysCol.classList.remove("col-xl-2", "col-3");
                daysCol.classList.add("col-xl-1", "col-2");
                roleCol.classList.remove("col-3");
                roleCol.classList.add("col-2");
                levelHeaderCol.classList.remove("col-3");
                levelHeaderCol.classList.add("col-2");
                roleHeaderCol.classList.remove("col-3");
                roleHeaderCol.classList.add("col-2");
                daysHeaderCol.classList.remove("col-3");
                daysHeaderCol.classList.add("col-2");
                statEstColHeader.innerText = "Stat Estimate";

                const userLink = cols[0].children[1];
                const userID = userLink.href.match(/\d+$/)[0];

                const statEst = this.getEst(userID);
                if(statEst !== null) {
                    const theirStatsText = statEst.split(' ')[0];
                    const theirStats = parseInt(theirStatsText.slice(1).replaceAll(',', ""));
                    statEstCol.innerHTML = `<a href="${this.statEstimateLink}" style="color: hsl(${this.colorVal(this.ownStats, theirStats) * 120}, 67%, ${this.brightness}%); text-decoration: none">${theirStatsText.replace('>', "&gt;").replace('<', "&lt;")}</a>`;

                    const userName = userLink.innerText; // Don't really need username of everyone
                    if(userName !== this.getName(userID))
                        this.setName(userID, userName);
                    this.setName2(userID, userName);

                } else if(userID === this.ownID && this.ownStats)
                    statEstCol.innerHTML = `<a href="${this.statEstimateLink}" style="color: hsl(60, 67%, ${this.brightness}%); text-decoration: none">${this.ownStats.toLocaleString("en-US")}</a>`;
                else {
                    statEstCol.classList.add("text-muted");
                    statEstCol.innerText = "---";
                }
                entry.insertBefore(statEstCol, levelCol);
                entry.insertBefore(statEstColHeader, levelHeaderCol);
            }
        }
        inCartelWar(url) {
            const war = document.querySelector("div#warReportModule");
            let cols = war.querySelectorAll("div.col-12.col-lg-6");
            cols[0].classList.remove("col-lg-6");
            cols[0].classList.add("col-lg-7");
            cols[1].classList.remove("col-lg-6");
            cols[1].classList.add("col-lg-5");

            const theirTable = cols[0].querySelector("table.table");
            const tableHeadTr = theirTable.querySelector("thead tr");
            let levelCol = tableHeadTr.querySelectorAll("th")[1];
            let statEstCol = document.createElement("th");
            statEstCol.setAttribute("scope", "col");
            statEstCol.innerText = "Stat Estimate";
            tableHeadTr.insertBefore(statEstCol, levelCol);
            const tableBody = theirTable.querySelector("tbody");

            observeDOM(theirTable, e => {
                if(e[0].target !== tableBody)
                    return;
                let trs = tableBody.querySelectorAll("tr");
                for(var tr of trs) {
                    const tds = tr.querySelectorAll("td");
                    levelCol = tds[1];
                    statEstCol = document.createElement("td");

                    let statusCol = tds[2];
                    if(statusCol.innerText === "Active") // Highlight actives in war
                        statusCol.classList.add("fw-bold");
                    else
                        statusCol.classList.add("text-muted");

                    const userLink = tds[0].children[0];
                    const userID = userLink.href.match(/\d+$/)[0];

                    const statEst = this.getEst(userID);
                    if(statEst !== null) {
                        const theirStatsText = statEst.split(' ')[0];
                        const theirStats = parseInt(theirStatsText.slice(1).replaceAll(',', ""));
                        statEstCol.innerHTML = `<a href="${this.statEstimateLink}" style="text-decoration: none">${theirStatsText.replace('>', "&gt;").replace('<', "&lt;")}</a>`;

                        const userName = userLink.innerText;
                        if(userName !== this.getName(userID))
                            this.setName(userID, userName);
                        this.setName2(userID, userName);

                    } else {
                        statEstCol.classList.add("text-muted");
                        statEstCol.innerText = "---";
                    }
                    tr.insertBefore(statEstCol, levelCol);
                }
            });
        }
        inHomepage(url) {
            try {
                // Grab the stats container and rows
                const stats = document.querySelectorAll("div.mb-4.card.flex-fill")[1];
                const statRows = stats?.querySelectorAll(".row.align-items-center.gy-2.mb-2");

                // Ensure stats and rows are found
                if (stats && statRows?.length > 0) {
                    const fifthSpan = statRows[0].querySelector("div:last-of-type > p");  // Get last p in the first row
                    const statText = (fifthSpan.lastChild ?? fifthSpan)?.textContent.replace(/\D/g, "");
                    const statValue = statText ? parseInt(statText, 10) : 0;

                    // If value has changed, update
                    if (this.ownStats !== statValue && statValue !== 0) {
                        console.log("Updating ownStats");
                        this.setEst("self", statValue);
                    }
                } else {
                    console.error("Stats or stat rows not found");
                }
            } catch (error) {
                console.error("Error in inHomepage:", error);
            }
        }

        inGym(url) {
            const totalStats = document.querySelector("p.card-text.fw-bold.text-muted"); // Total is the first one
            if(totalStats === null)
                return;
            const totalStatsVal = parseInt(totalStats.innerText.split(' ')[0].slice(1).replaceAll(',', ""));

            if(this.ownStats !== totalStatsVal)
                this.setEst("self", totalStatsVal);
        }
        inFight(url) {
            const showEsts = (nameA, nameB, A_ID, B_ID, Anew = false, Bnew = false) => {
                let container = document.querySelector("div.contentColumn");
                const fightReport = container.querySelector("div.col-12.col-md-10");
                let ests = document.createElement("div");
                ests.classList.add("col-12", "col-md-10");
                const estA = A_ID === "self" ? (this.ownStats ? this.ownStats.toLocaleString("en-US") : "???") : (this.getEst(A_ID) || "???");
                const estB = this.getEst(B_ID) || "???";
                let inner = `<div class="row"><div class="col-md-6 col-12"><div class="mb-4 card"><div class="row mb-0"><div class="col-12"><div class="header-section text-center"><h2>`;
                inner += nameA === "You" ? "You" : `<a class="text-white" href="/${A_ID === "self" ? "user" : ("User/" + A_ID)}">${nameA}</a>`;
                inner += `</h2></div></div></div><div class="card-body"><p class="card-text text-center">Stat estimate: `;
                if(estA === "???")
                    inner += `<span class="text-muted">???</span>`;
                else {
                    const Astats = parseInt(estA.split(' ')[0].replace(/[,<>~]/g, ""));
                    inner += `<span class="fw-bold" style="color: hsl(${this.colorVal(this.ownStats, Astats) * 120}, 67%, ${this.brightness}%)">${estA.split(' ')[0].replace('>', "&gt;").replace('<', "&lt;")}</span>${Anew ? " (new)" : ""}`;
                }
                inner += `</p></div></div></div><div class="col-md-6 col-12"><div class="mb-4 card"><div class="row mb-0"><div class="col-12"><div class="header-section text-center"><h2><a class="text-white" href="/${"User/" + B_ID}">${nameB}</a></h2></div></div></div><div class="card-body"><p class="card-text text-center">Stat estimate: `;
                if(estB === "???")
                    inner += `<span class="text-muted">???</span>`;
                else {
                    const Bstats = parseInt(estB.split(' ')[0].replace(/[,<>~]/g, ""));
                    inner += `<span id="them-bstat" class="fw-bold" style="color: hsl(${this.colorVal(this.ownStats, Bstats) * 120}, 67%, ${this.brightness}%)">${estB.split(' ')[0].replace('>', "&gt;").replace('<', "&lt;")}</span>${Bnew ? " (new)" : ""}`;
                }
                inner += `</p></div></div></div></div>`;
                ests.innerHTML = inner;
                container.insertBefore(ests, fightReport);
            }

            const firstRow = document.querySelector("div.fightTable tbody tr td");
            const youAttacked = firstRow.innerText.startsWith("You ");
            const attackedYou = firstRow.innerText.endsWith(" you");
            const estimate = youAttacked ? this.estimateYouAttacked.bind(this) : attackedYou ? this.estimateAttackedYou.bind(this) : this.AattackedB.bind(this);

            const headers = document.querySelectorAll("div.card-body p.card-text.fw-bold");
            if(!this.ownStats || headers.length < 3 || (headers[0].innerText.split(' ')[2] === "Loss" && !attackedYou)) {
                if(firstRow.children.length === 1) {
                    const other = firstRow.children[0];
                    showEsts("You", other.innerText, "self", other.href.match(/\d+$/)[0]);
                } else {
                    const userA = firstRow.children[0];
                    const userB = firstRow.children[1];
                    showEsts(userA.innerText, userB.innerText, userA.href.match(/\d+$/)[0], userB.href.match(/\d+$/)[0]);
                }
                return;
            }
            const fairFightText = headers[1];
            const fairFight = parseFloat(fairFightText.children[0].innerText.slice(1));
            const dateText = headers[headers.length - 1].innerText.slice(7).split(/[ :\/]/g);
            const fightDate = Date.UTC(dateText[5], parseInt(dateText[4]) - 1, dateText[3], dateText[0], dateText[1], dateText[2]);

            let fightID = url.replace('#', "").match(/\d+\/?$/)[0];
            if(fightID.endsWith('/'))
                fightID = fightID.slice(0, -1);

            // Method: replace old log with new log, but only if it's more extreme OR specific
            if(youAttacked || attackedYou) {
                const userLink = firstRow.children[0];
                const againstID = userLink.href.match(/\d+$/)[0];
                const currentEstimate = this.getEst(againstID);

                const userName = userLink.innerText;
                if(userName !== this.getName(againstID))
                    this.setName(againstID, userName);
                this.setName2(againstID, userName);

                if(currentEstimate === null || fightDate > parseInt(currentEstimate.split(' ')[1])) {
                    const est = estimate(this.ownStats, fairFight);
                    const newStatEst = parseInt(est[1].replace(',', ""));
                    if(currentEstimate !== null) {
                        const curStatEst = parseInt(currentEstimate.split(' ')[0].slice(1).replace(',', ""));
                        if(this.dontOverride(curStatEst, newStatEst, currentEstimate[0], est[0])) {
                            showEsts("You", userName, "self", againstID);
                            return;
                        }
                    }

                    this.setEst(againstID, `${est[0]}${est[1]} ${fightDate} ${fightID}`);
                    if(!this.currentList.includes(parseInt(againstID))) {
                        this.currentList.push(parseInt(againstID));
                        this.setList(this.currentList);
                    }
                }
                showEsts("You", userName, "self", againstID, false, true);
            } else {
                // Indirect attack logs
                const userA = firstRow.children[0];
                const userB = firstRow.children[1];
                const A_ID = userA.href.match(/\d+$/)[0];
                const B_ID = userB.href.match(/\d+$/)[0];
                const Astats = this.getEst(A_ID);
                const Bstats = this.getEst(B_ID);
                if(Astats !== null && Bstats !== null) {
                    const Adate = parseInt(Astats.split(' ')[1]);
                    const Bdate = parseInt(Bstats.split(' ')[1]);
                    if(Adate === Bdate || fightDate <= Adate || fightDate <= Bdate) {
                        showEsts(userA.innerText, userB.innerText, A_ID, B_ID);
                        return;
                    }

                    const newerStats = Adate > Bdate ? Astats : Bstats;
                    const otherEst = estimate(newerStats, fairFight, Adate > Bdate);
                    if(otherEst.length === 0) {
                        showEsts(userA.innerText, userB.innerText, A_ID, B_ID);
                        return;
                    }
                    const oldEst = Adate > Bdate ? Bstats : Astats;
                    console.log(parseInt(oldEst.split(' ')[0].slice(1).replaceAll(',', "")), parseInt(otherEst[1].replaceAll(',', "")), oldEst[0], otherEst[0]);
                    if(this.dontOverride(parseInt(oldEst.split(' ')[0].slice(1).replaceAll(',', "")), parseInt(otherEst[1].replaceAll(',', "")), oldEst[0], otherEst[0])) {
                        showEsts(userA.innerText, userB.innerText, A_ID, B_ID);
                        return;
                    }
                    console.log("hi");
                    const otherID = Adate > Bdate ? B_ID : A_ID;
                    this.setEst(otherID, `${otherEst[0]}${otherEst[1]} ${newerStats.split(' ')[1]} ${fightID}`);
                    if(!this.currentList.includes(parseInt(otherID))) {
                        this.currentList.push(parseInt(otherID));
                        this.setList(this.currentList);
                    }
                    showEsts(userA.innerText, userB.innerText, A_ID, B_ID, Adate <= Bdate, Adate > Bdate);
                } else if((Astats !== null && Bstats === null) || (Astats === null && Bstats !== null)) {
                    const knownStats = Astats !== null ? Astats : Bstats;
                    const knownDate = parseInt(knownStats.split(' ')[1]);
                    if(fightDate <= knownDate) {
                        showEsts(userA.innerText, userB.innerText, A_ID, B_ID);
                        return;
                    }

                    const otherEst = estimate(knownStats, fairFight, Astats !== null);
                    if(otherEst.length === 0) {
                        showEsts(userA.innerText, userB.innerText, A_ID, B_ID);
                        return;
                    }
                    const otherID = Astats !== null ? B_ID : A_ID;
                    this.setEst(otherID, `${otherEst[0]}${otherEst[1]} ${knownDate} ${fightID}`);
                    if(!this.currentList.includes(parseInt(otherID))) {
                        this.currentList.push(parseInt(otherID));
                        this.setList(this.currentList);
                    }
                    showEsts(userA.innerText, userB.innerText, A_ID, B_ID, Astats === null, Astats !== null);
                    const otherUser = Astats !== null ? userB : userA;
                    const userName = otherUser.innerText;

                    // Set id==>name if not saved or diff from saved one
                    if (userName !== this.getName(otherID))
                        this.setName(otherID, userName);
                    this.setName2(otherID, userName);

                } else {
                    showEsts(userA.innerText, userB.innerText, A_ID, B_ID);
                }
            }
        }
        inUserProfile(url) {
            debug("[statEstimate][inUserProfile]");
            let userID = url.replace('#', "").match(/\d+\/?$/)[0];
            if(userID.endsWith('/'))
                userID = userID.slice(0, -1);
            if(userID === this.ownID)
                return;

            let statsTable = document.querySelector("div.card-body tbody");
            const estimate = this.getEst(userID);

            const attackText = document.querySelector("div#attackConfirmModal p.card-text");
            const level = parseInt(statsTable.children[4].children[1].innerText);
            const repMultipliers = {
                Attack: 1,
                Mug: this.multMug,
                Hospitalise: this.multHosp
            };
            let prefix = "";
            let append = "";
            let expectedRep = 0;

            if(estimate !== null) {
                const textSplit = estimate.split(' ');
                const statEstimate = textSplit[0];
                const date = new Date(parseInt(textSplit[1])).toLocaleDateString("en-GB", { timeZone: "Europe/London" });

                const theirStats = parseInt(statEstimate.slice(1).replaceAll(',', ""));
                statsTable.innerHTML += `<tr><th>Stat Estimate:</th><td><a href="${this.statEstimateLink}" class="fw-bold" style="color: hsl(${this.colorVal(this.ownStats, theirStats) * 120}, 67%, ${this.brightness}%)">${statEstimate.replace('>', "&gt;").replace('<', "&lt;")}</a> (${date})</td></tr>`;

                expectedRep = this.ownStats ? this.estimateRep(level, this.calcFairFight(this.ownStats, theirStats)) : "???";
                prefix = statEstimate[0].replace('~', "");
            } else {
                statsTable.innerHTML += `<tr><th>Stat Estimate:</th><td><a href="${this.statEstimateLink}" class="text-muted">No attacks recorded</a></td></tr>`;
                expectedRep = this.estimateRep(level, this.maxFF);
                append = " with 3x fair fight modifier";
            }
            observeDOM(attackText, e => {
                const textSplit = e[0].target.innerText.split(' ');
                let attackType = textSplit[textSplit.length - 2];
                attackType = attackType.charAt(0).toUpperCase() + attackType.slice(1);
                if(![ "Attack", "Mug", "Hospitalise" ].includes(attackType))
                    return;
                e[0].target.innerHTML += `<br>Expected rep gain: <span class="fw-bold">${prefix.replace('>', "&gt;").replace('<', "&lt;")}${expectedRep === "???" ? "???" : Math.round(expectedRep * repMultipliers[attackType])}</span>${append}`;
            });

            const userName = document.querySelector("div.header-section > .profileNameTitle").innerText;
            if(userName !== this.getName(userID))
                this.setName(userID, userName);
            this.setName2(userID, userName);
        }
        inEvents(url) {
            const urlParams = new URLSearchParams(window.location.search);
            const category = urlParams.get("filter");
            if(category !== "Attack")
                return;

            const eventList = document.querySelector("div.container.eventWrapper").children;
            for(var i = 1; i !== eventList.length; ++i) {
                const ev = eventList[i];
                ev.children[0].classList.value = "col-2 col-lg-2 col-md-2 col-sm-2"; //"col-2 col-lg-2 col-md-2 col-sm-2";
                ev.children[1].classList.value = "col-5 col-lg-6 col-md-7 col-sm-7"; //"col-5 col-lg-6 col-md-5 col-sm-6";
                ev.children[2].classList.value = "col-3 col-lg-2 d-none d-lg-inline"; //"col-3 col-lg-2 col-md-3 col-sm-2";
                let estCol = document.createElement("div");
                let mergedCol = document.createElement("div");
                estCol.classList.value = "col-2 col-lg-2 d-none d-lg-inline"; //"col-2 col-lg-2 col-md-2 col-sm-2";
                mergedCol.classList.value = "col-3 col-md-3 col-sm-3 d-lg-none"; // new

                if(i === 1) {
                    estCol.innerText = "Stat Estimate";
                    mergedCol.innerText = "Date/Est";
                    ev.insertBefore(estCol, ev.children[2]);
                    ev.appendChild(mergedCol);
                    continue;
                }
                const userID = parseInt(ev.children[1].querySelector("a").href.match(/\d+$/)[0]);
                const theirStats = this.getEst(userID);
                if(theirStats !== null) {
                    estCol.style.color = `hsl(${this.colorVal(this.ownStats, parseInt(theirStats.split(' ')[0].slice(1).replaceAll(',', ""))) * 120}, 67%, ${this.brightness}%)`;
                    estCol.innerText = theirStats.split(' ')[0];
                    mergedCol.innerHTML = `${ev.children[2].innerText}<br><span style="color: ${estCol.style.color}">${estCol.innerText}</span>`;
                } else {
                    estCol.classList.add("text-muted");
                    estCol.innerText = "???";
                    mergedCol.innerHTML = `${ev.children[2].innerText}<br><span class="text-muted">${estCol.innerText}</span>`;
                }
                ev.insertBefore(estCol, ev.children[2]);
                ev.appendChild(mergedCol);
            }
        }
    }

    // ========================= Create alert objects as needed ===================================

    var expAlerter;
    var jobAlerter;
    var stakeoutAlerter;
    const ceIcon = 'https://imgur.com/Vhmd1Qn.png';
    if (options.displayJobStatus.on == true)
        jobAlerter = new BrowserAlert({title: "Job Alert", msg: "Job Complete!", type: "job", timeout: 60,
                                       icon: ceIcon, clickFn: (options.onJobClickGotoPage.on == true ? jobClickHandler : null)});
    if (options.displayExpStatus.on == true)
        expAlerter = new BrowserAlert({title: "Expedition Alert", msg: "Expedition Complete!", type: "exp", timeout: 60, icon: ceIcon});
    if (options.enableStakeouts.on == true || options.enemyHospTime.on == true)
        stakeoutAlerter = new BrowserAlert({title: "Stakeout", type: "stakeout", timeout: 30, icon: ceIcon, clickFn: stakeoutClickHandler});

    // =================================== The Gym Lock class ===================================

    class ceGymLock {

        static defOptions = {
            "defaultLock": true,
            "refreshLock": false,
            "initialLock": false,
            "initialNum": 25
        };

        static options = JSON.parse(GM_getValue("ceGymLockOptions", JSON.stringify(ceGymLock.defOptions)));

        static savedInputs = JSON.parse(GM_getValue('savedInputs', JSON.stringify([0, 0, 0, 0])));
        currentInputs = [];

        lockOnRefreshHlp = `If enabled, when the page refreshes<br>after a train, the values entered in
                              the energy to spend input fields will<br>remain where they are set, unless they
                              go to 0, in which case they will display<br>the max e available to spend.`;
        lockOnStartHlp = `If enabled, when opening the gym the energy<br>to spend will be pre-filled with the value
                            you specify here, instead of the maximum amount.<br>This makes it easier to evenly split your training
                            accross each stat evenly.`;
        defaultLockHlp = `If enabled, when opening the gym no<br>changes are made, defaults are used,<br>which is use all energy in a stat.`;

        currE = parseInt($("#currentEnergy").text());

        constructor() {
            if (document.readyState == 'loading') {
                document.addEventListener('DOMContentLoaded', this.onPageLoad);
            } else {
                this.onPageLoad();
            }
        }

        static dbgOutOps() {
            debug("[ceGymLock][ceGymLock.options] Options:\n", JSON.stringify(ceGymLock.options, null, 4),
                  "\ninitialLock.prop(checked): ", $("#initialLock").prop('checked'),
                  "\nrefreshLock.prop(checked): ", $("#refreshLock").prop('checked'),
                  "\nsavedInputs: ", ceGymLock.savedInputs, JSON.parse(GM_getValue('savedInputs', JSON.stringify([]))));
        }

        static dbgOutRadios() {
            debug("[ceGymLock][handleLockInputChange]: ",
                  "\nRefresh: ", $("#refreshLock").prop('checked'), ceGymLock.options["refreshLock"], GM_getValue("refreshLock", '?'),
                  "\nInitial: ", $("#initialLock").prop('checked'), ceGymLock.options["initialLock"], GM_getValue("initialLock", '?'));
        }

        onPageLoad() {
            debug("[ceGymLock][onPageLoad]");
            if (!isGymPage()) return log("[onPageLoad] not at the gym");
            this.addStyles();
            this.handlePageLoad();
        }

        static writeAllOpts() {
            GM_setValue('savedInputs', JSON.stringify(ceGymLock.savedInputs));
            GM_setValue("ceGymLockOptions", JSON.stringify(ceGymLock.options));
        }

        static commitSavedInputs() {
            debug("[ceGymLock][commit] savedInputs: ", ceGymLock.savedInputs);
            GM_setValue('savedInputs', JSON.stringify(ceGymLock.savedInputs));
        }

        static updateInputs(energy) {
            let en = parseInt($("#currentEnergy").text());
            let list = $('input[name="energyToUse"]');
            if (!energy) {
                if ($("#defaultLock").prop('checked') == true) {
                    //energy = parseInt($("#currentEnergy").text());
                    return; // ????
                } else if ($("#initialLock").prop('checked') == true) {
                    energy = $("#init-num").val();
                    if (energy > en) energy = en;
                } else if ($("#refreshLock").prop('checked') == true) {
                    $(list).each(function(idx, el) {
                        energy = parseInt(ceGymLock.savedInputs[idx]);
                        if (energy > en)energy = en;
                        $(el).val(en);
                    });
                    return;
                }
            }

            $(list).each(function(idx, el) {
                $(el).val(energy);
            });
        }

        static idxFromNode = (node) => { return $(node).closest('.col').index(); }

        handleInputChange(e) {
            ceGymLock.dbgOutOps();
            //debug("[ceGymLock][handleInputChange] e: ", e);
            let valNow = $(this).val();
            let idx = ceGymLock.idxFromNode(this);
            //debug("[ceGymLock][handleInputChange] now: ", valNow, " saved: ", ceGymLock.savedInputs[idx]);
            ceGymLock.savedInputs[idx] = valNow;
            ceGymLock.commitSavedInputs();
            ceGymLock.dbgOutOps();
        }

        handleInitialNumChange(e) {
            ceGymLock.dbgOutOps();
            let newVal = $("#init-num").val();
            ceGymLock.options["initialNum"] = newVal;
            ceGymLock.writeAllOpts();

            ceGymLock.updateInputs();
            ceGymLock.commitSavedInputs();
            ceGymLock.dbgOutOps();
        }

        handleTrainClick(e) {
            let idx = ceGymLock.idxFromNode(this);
            ceGymLock.savedInputs[idx] = 0;
            ceGymLock.commitSavedInputs();
        }

        handleLockInputChange(e) {
            ceGymLock.dbgOutOps();
            ceGymLock.dbgOutRadios();

            let currEnergy = parseInt($("#currentEnergy").text());

            ceGymLock.options["refreshLock"] = $("#refreshLock").prop('checked');
            ceGymLock.options["initialLock"] = $("#initialLock").prop('checked');
            ceGymLock.options["defaultLock"] = $("#defaultLock").prop('checked');

            ceGymLock.updateInputs();
            ceGymLock.writeAllOpts();
            ceGymLock.dbgOutOps();
        }

        installUI(retries=0) {
            let target = $(".card .header-section")[0];
            if (!$(target).length) {
                if (retries++ < 25) return setTimout(this.installUI, 100, retries);
                return log("[installUI] timed out.");
            }

            GM_addStyle('@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css");');
            const caretBtn = `<span class="col-caret"><i class="fa fa-caret-right"></i></span>`;
            const ceSubBtn = `<div class="input-group-append"> <input class="btn btn-success gym-btn" type="submit" value="Apply"></div>`;
            let newNode = `
                <div id='lock' class="row mb-0" style="display: none;">
                    <div class="inner-lock">
                        <span id='default-lock' style="margin-left: 20px;">
                           <label><span><input id='defaultLock' type='radio' name="gymOpt"></span>Default</label>
                       </span>
                       <span id='refresh-lock' style="margin-left: 20px;">
                           <label><span><input id='refreshLock' type='radio' name="gymOpt"></span>Lock on Refesh</label>
                       </span>
                       <span id='initial-lock'>
                           <label><input id='initialLock' type='radio' name="gymOpt">Lock initial values at
                                  <input id='init-num' name='initialNum' type='number' value='50'>
                           </label>
                           <div class="input-group-append">
                               <input id="gym-apply" class="btn btn-success gym-btn" type="submit" value="Apply">
                           </div>
                       </span>
                   </div>
               </div>`;

            $(target).css("display", "flex");
            $(target).append(newNode);
            $(target).append(caretBtn);

            $(".fa").on('click', handleCaret);
            $("#gym-apply").on('click', handleApply);

            $(`#initialLock`).prop('checked', ceGymLock.options["initialLock"]);
            $(`#refreshLock`).prop('checked', ceGymLock.options["refreshLock"]);
            $(`#defaultLock`).prop('checked', ceGymLock.options["defaultLock"]);
            $(`#initial-lock input[name="initialNum"]`).val(ceGymLock.options.initialNum);

            $(`#lock input[type='radio']`).on('change', this.handleLockInputChange);

            ceGymLock.dbgOutOps();

            $(`#init-num`).on('change', this.handleInitialNumChange);

            displayHtmlToolTip($("#refresh-lock"), this.lockOnRefreshHlp);
            displayHtmlToolTip($("#initial-lock"), this.lockOnStartHlp);
            displayHtmlToolTip($("#default-lock"), this.defaultLockHlp);

            ceGymLock.dbgOutOps();

            function handleCaret(e) {
                let target = $(this).next()
                //debug("[ceGymLock][handleCaret] ", $(this), $(this).next());
                $('#lock').slideToggle("slow");
                $(this).toggleClass('fa-caret-down fa-caret-right');
            }

            function handleApply(e) {
                debug("[ceGymLock][handleApply]");
                let value = $(`#initial-lock input[name="initialNum"]`).val();
                let list = $('input[name="energyToUse"]');
                for (let idx=0; idx<$(list).length; idx++) {
                    let el = $(list)[idx];
                    $(el).val(value);
                    ceGymLock.savedInputs[idx] = value;
                }
            }
        }

        handlePageLoad(retries=0) {
            debug("[ceGymLock][handlePageLoad]");
            let list = $('input[name="energyToUse"]');
            if ($(list).length < 4) {
                if (retries++ < 25) return setTimeout(this.handlePageLoad, 100, retries);
                return log("[ceGymLock][handlePageLoad] timed out");
            }

            this.installUI();
            let savedSum = ceGymLock.savedInputs[0] + ceGymLock.savedInputs[1] + ceGymLock.savedInputs[2] + ceGymLock.savedInputs[3];
            for (let idx=0; idx<$(list).length; idx++) {
                let el = $(list)[idx];
                let root = $(el).closest('.col');
                let savedVal = ceGymLock.savedInputs[idx];
                let currVal = $(el).val();
                this.currE = parseInt($("#currentEnergy").text());
                this.currentInputs[idx] = currVal;

                debug("[ceGymLock][handlePageLoad] refreshLock: ",
                      ceGymLock.options.refreshLock, " initialLock: ", ceGymLock.options.initialLock,
                      " defaultLock: ", ceGymLock.options.defaultLock,
                     " saved: ", savedVal, " init num: ", ceGymLock.options.initialNum);

                ceGymLock.updateInputs();
                $(el).on('change', this.handleInputChange);
            }

            $(".btn.btn-success[value='Train']").on('click', this.handleTrainClick);
        }

        addStyles() {
            addToolTipStyle();

            // Gym page lock options
            GM_addStyle(`
                .separator-shadow {
                    height: 2px;
                    background-color: #222;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3); /* Offset-y, blur, spread, color */
                    width: 100%;
                }
                #initial-lock {
                    /* width: 50%; */
                    margin-left: 50px;
                }
                #initial-lock, #initial-lock > label {
                    display: flex;
                }
                #initial-lock > label {
                    align-items: center;
                }
                .inner-lock {
                    display: flex;
                    /* justify-content: space-around; */
                }
                .inner-lock span {
                    /* width: 25%; */
                }
                #lock {
                    /* padding-bottom: 5px;
                    float: right;
                    justify-content: flex-end; */
                    margin-right: 50px;
                    right: 0;
                    display: flex;
                    position: absolute;
                }
                #lock input {
                    height: 16px;
                    margin: 0px 10px 5px 10px;
                }
                #lock input[type='checkbox'] {
                    /* margin-left: 10px; */
                }
                #lock input[type='number'] {
                    width: 60px;
                    padding-left: 5px;
                }
                .col-caret {
                    top: 6px;
                }
                .gym-btn {
                    height: 24px;
                    margin: 0px 10px 10px 10px;
                    align-content: center;
                    display: flex;
                    flex-flow: row wrap;
                    height: 24px !important;
                    align-content: center;
                    display: flex;
                    flex-flow: row wrap;
                    text-align: center;
                    line-height: 24px !important;
                    padding: 0px 10px 0px 10px;
                }
            `);
        }
    }

    // ======================== On the Town page, add links on the pictures ===========================

    function addTownLinks() {
        return new Promise((resolve, reject) => {
            if (options.linksOnTownImages.on != true) { return resolve("[addTownLinks] not enabled"); }
            $("#v-content-shops .equipmentModule > div").each(function(idx, el) {
                let img = $(el).find("img").first();
                let link = $(el).find("a.btn").first();
                let href = $(link).attr('href');
                if (href) {
                    $(img).on('click', function() { location.href = href; });
                    $(img).css("cursor", "pointer");
                }
            });
            return resolve("[addTownLinks] success.");
        });
    }

    // ================ quicklinks ===
    // $("#userDropdownDesktop > div:nth-child(2) > div:nth-child(2) > li:nth-child(6)")
    // $("#userDropdownDesktop > div:nth-child(2) > div:nth-child(2) > li")
    // check li > a href, for example /...enemies

    // ================= experimental sidebar

    //$("#mainBackground > div").prepend(`<div style="width:50px; height:100%;position:sticky;"`)

    // =========================== Create an expedition team overview table =============================

    const defMemberStats = {"assigned": false, "memNum": 0, "name": "", "id": 0, "morale": 0, "combat": 0, "caution": 0, "speed": 0, "lvl": 0, "rank": 0};
    const defTeamStats =
          [{"assigned": false, "memNum": 0, "name": "", "id": 0, "morale": 0, "combat": 0, "caution": 0, "speed": 0, "lvl": 0, "rank": 0, "lastUpd": '', "sum": 0 },
           {"assigned": false, "memNum": 0, "name": "", "id": 0, "morale": 0, "combat": 0, "caution": 0, "speed": 0, "lvl": 0, "rank": 0, "lastUpd": '', "sum": 0 },
           {"assigned": false, "memNum": 0, "name": "", "id": 0, "morale": 0, "combat": 0, "caution": 0, "speed": 0, "lvl": 0, "rank": 0, "lastUpd": '', "sum": 0 },
           {"assigned": false, "memNum": 0, "name": "", "id": 0, "morale": 0, "combat": 0, "caution": 0, "speed": 0, "lvl": 0, "rank": 0, "lastUpd": '', "sum": 0 },
           {"assigned": false, "memNum": 0, "name": "", "id": 0, "morale": 0, "combat": 0, "caution": 0, "speed": 0, "lvl": 0, "rank": 0, "lastUpd": '', "sum": 0 }
          ];

    const expOverviewDef = {
        "team1": deepCopy(defTeamStats),
        "team2": deepCopy(defTeamStats),
        "team3": deepCopy(defTeamStats),
        "team4": deepCopy(defTeamStats),
        "team5": deepCopy(defTeamStats)
       };
    var expOverview = {};
    var tableLoaded = false;
    var tableCreated = false;

    function fixupSavedOverview() {
        fixTeam('team1');
        fixTeam('team2');
        fixTeam('team3');
        fixTeam('team4');
        fixTeam('team5');

        function fixTeam(team) {
            let entry = expOverview[team];
            for (let idx=0; idx<5; idx++) {
                if (!entry[idx]["lastUpd"]) entry[idx]["lastUpd"] = "";
                if (!entry[idx]["sum"]) entry[idx]["sum"] = 0;
            }
        }
    }

    function saveExpOverview() {
        debug("[expOverview][saveExpOverview]");
        GM_setValue("expOverview", JSON.stringify(expOverview));
    }

    function loadExpOverview() {
        expOverview = JSON.parse(GM_getValue("expOverview", JSON.stringify(expOverviewDef)));
        //fixupSavedOverview();        // If I change the saved data format, fix up what's already saved
        saveExpOverview();
        tableLoaded = true;

    }

    function parseStat(stat) {
        let res = 0;
        if (parseInt(stat) == 0) return 0;
        if (typeof stat == 'number') return stat;
        if (!stat || typeof stat != 'string') {
            debug("[overview] invalid stat: ", stat, typeof stat, $(stat).length);
            return stat;
        }
        stat.replace(/[()+]/g, ' ').split(' ').forEach((n, idx) => { res += (n && !isNaN(n)) ? parseInt(n) : 0; });
        return res;
    }

    function statTotals(memberEntry) {
        let total = parseStat(memberEntry.morale) + parseStat(memberEntry.combat) +
            parseStat(memberEntry.caution) + parseStat(memberEntry.speed);

        return total;
    }

    function populateMemberRow(team, memberNum, memberEntry) {
        $(`#tr-${team}-${memberNum}`).removeClass("flagged");
        $(`#tr-${team}-${memberNum}`).removeClass("maxStat");
        $(`#tr-${team}-${memberNum}`).removeClass("minStat");
        let lastUpd = '---';
        if (memberEntry.lastUpd && memberEntry.lastUpd != '' && memberEntry.lastUpd != 0) {
            let d = new Date(memberEntry.lastUpd);
            lastUpd = toShortDateStr(d);
        }

        $(`#tr-${team}-${memberNum} > td.tdname`).text(memberEntry.name);
        $(`#tr-${team}-${memberNum} > td.tdlvl`).text(memberEntry.lvl);
        $(`#tr-${team}-${memberNum} > td.tdrnk`).text(memberEntry.rank);
        //$(`#tr-${team}-${memberNum} > td.tdrnk`).addClass(`rank${memberEntry.rank}`);

        if (parseInt(memberEntry.lvl) == 0 && parseInt(memberEntry.rank) == 0) {
            $(`#tr-${team}-${memberNum} > td.tdname`).text('');
        }

        let rLow = 1;
        if (memberEntry.rank >= rLow) {
            let R = memberEntry.rank, L = memberEntry.lvl;
            let C = 100 / (10 - rLow);
            let max = ((R - rLow) * C) + C;
            let style = `filter: brightness(1.7); ` +
                        `background: linear-gradient( to right,
                             rgba(255, 0, 0, 1) 0%, rgba(${R * 10}, 0, 0, 1) ${max}%, rgba(255, 0, 0, 0) 100%);`
            $(`#tr-${team}-${memberNum} > td.tdrnk`).attr("style", style);
        }
        $(`#tr-${team}-${memberNum} > td.tdttl`).text(statTotals(memberEntry));
        $(`#tr-${team}-${memberNum} > td.tdmor`).text(memberEntry.morale);
        $(`#tr-${team}-${memberNum} > td.tdcom`).text(memberEntry.combat);
        $(`#tr-${team}-${memberNum} > td.tdcau`).text(memberEntry.caution);
        $(`#tr-${team}-${memberNum} > td.tdspd`).text(memberEntry.speed);
        $(`#tr-${team}-${memberNum} > td.tdlu`).text(lastUpd);

        let memTotal = 0;
        let m = parseStat(memberEntry.morale); memTotal += (isNaN(m) ? 0 : m);
        m = parseStat(memberEntry.combat); memTotal += (isNaN(m) ? 0 : m);
        m = parseStat(memberEntry.caution); memTotal += (isNaN(m) ? 0 : m);
        m = parseStat(memberEntry.speed); memTotal += (isNaN(m) ? 0 : m);

        memberEntry.sum = memTotal;

        if (memberEntry["flagged"] == true) $(`#tr-${team}-${memberNum}`).addClass("flagged");
    }

    function populateTableRows() {
        debug("[overview][*** populateTableRows] start");

        for (let team = 1; team < 6; team++) {
            let teamEntry = expOverview[`team${team}`];
            let sumMorale = 0, sumCaution = 0, sumCombat = 0, sumSpeed = 0;
            let maxStats = { m: -1, s: 0 }, minStats = { m: -1, s: 0 };

            for (let memberNum=1; memberNum<6; memberNum++) {

                // Find correct member entry in our table
                let memberEntry = teamEntry[memberNum - 1];
                if (!memberEntry || memberEntry.assigned == false) continue;

                //debug(`[overview] filling row tr-${team}-${memberNum} from: `, memberEntry);
                populateMemberRow(team, memberNum, memberEntry);

                let m = parseStat(memberEntry.morale); sumMorale += m;
                m = parseStat(memberEntry.combat); sumCombat += m;
                m = parseStat(memberEntry.caution); sumCaution += m;
                m = parseStat(memberEntry.speed); sumSpeed += m;

                if (memberEntry.sum > maxStats.s) {
                    maxStats.s = memberEntry.sum; //memTotal;
                    maxStats.m = memberEntry.memNum;
                }
                if (memberEntry.sum < minStats.s || minStats.s == 0) {
                    minStats.s = memberEntry.sum; //memTotal;
                    minStats.m = memberEntry.memNum;
                }
            }

            if (maxStats.m > -1)
                $(`#tr-${team}-${maxStats.m}`).addClass('maxStat');
            if (minStats.m > -1)
                $(`#tr-${team}-${minStats.m}`).addClass('minStat');

            $(`#tr-tot-${team} td.totmor`).text(sumMorale);
            $(`#tr-tot-${team} td.totcom`).text(sumCombat);
            $(`#tr-tot-${team} td.totcau`).text(sumCaution);
            $(`#tr-tot-${team} td.totspd`).text(sumSpeed);

            let teamTotal = sumMorale + sumCombat + sumCaution + sumSpeed;
            $(`#tr-tot-${team} td.sum-total`).text(teamTotal);
        }
    }

    function buildOverviewTable(retries=0) {
        let tabWrap = $("#expeditionsNav > .nav-tabs");
        let tabBtns = $("#expeditionsNav > .nav-tabs > button");
        let content = $("#expeditionsNav > .tab-content");
        let currentTab = $("#expeditionsNav > .nav-tabs > button.active");
        if (!$(tabBtns).length) {
            if (retries++ < 25) return setTimeout(buildOverviewTable, 100, retries);
            return log("[buildOverviewTable] timed out!");
        }

        loadExpOverview();

        $(tabBtns).on('click', handleTabClick);
        $(tabBtns).addClass('xtc');

        $(tabWrap).append(getTabBtn());
        $(content).append(getTablePg());

        for (let idx=1; idx<6; idx++) {
            let newTbl = $(getTeamTable(idx));
            let rows = `
                <tr id="tr-${idx}-1">
                    <th rowspan="5" class="td-lh">${idx}</th>
                    <td class="tdname"></td><td class="tdlvl"></td><td class="tdmor"></td><td class="tdcom"></td><td class="tdcau"></td><td class="tdspd"></td><td class="tdrnk"></td><td class="tdttl"></td><td class="tdlu"></td>
                </tr>
                <tr id="tr-${idx}-2"><td class="tdname"></td><td class="tdlvl"></td><td class="tdmor"></td><td class="tdcom"></td><td class="tdcau"></td><td class="tdspd"></td><td class="tdrnk"></td><td class="tdttl"></td><td class="tdlu"></td></tr>
                <tr id="tr-${idx}-3"><td class="tdname"></td><td class="tdlvl"></td><td class="tdmor"></td><td class="tdcom"></td><td class="tdcau"></td><td class="tdspd"></td><td class="tdrnk"></td><td class="tdttl"></td><td class="tdlu"></td></tr>
                <tr id="tr-${idx}-4"><td class="tdname"></td><td class="tdlvl"></td><td class="tdmor"></td><td class="tdcom"></td><td class="tdcau"></td><td class="tdspd"></td><td class="tdrnk"></td><td class="tdttl"></td><td class="tdlu"></td></tr>
                <tr id="tr-${idx}-5"><td class="tdname"></td><td class="tdlvl"></td><td class="tdmor"></td><td class="tdcom"></td><td class="tdcau"></td><td class="tdspd"></td><td class="tdrnk"></td><td class="tdttl"></td><td class="tdlu"></td></tr>
                <tr id="tr-tot-${idx}">
                    <th class="td-lh">Totals:</th>
                    <td></td><td></td><td class="totmor"></td><td class="totcom"></td><td class="totcau"></td><td class="totspd"></td><td class="sum-total" colspan="3"></td>
                </tr>`;

            $(newTbl).find(`.teamOverviewTableBody`).append(rows);
            $("#tbl-cont").append(newTbl);

            tableCreated = true;
        }
    }

    var inStatHandler = false;

    function delayedMemberClick(e, node, retries=0) {
        let root = $(node).closest("[id^='v-content-team']");
        if (!$(root).length) {
            if (retries++ < 25) return setTimeout(delayedMemberClick, 100, e, node, retries);
            return log("[overview][delayedMemberClick] timed out");
        }

        let tabTeamNum = $(root).attr("id") ? parseInt($(root).attr("id").replace('v-content-team', '')) : 0;
        if (tabTeamNum) {
            debug("[expOverview][delayedMemberClick] tabTeamNum: ", tabTeamNum);
            updateMemberStats(tabTeamNum);
        } else {
            debugger;
        }
    }

    function updateMemberStats(teamNum, retries=0, retries2=0) {
        let panes = $(".tab-pane.active");
        let plen = $(panes).length;
        let thisPaneId = $($(".tab-pane.active")[plen - 1]).attr("id");
        let thisTeamNum = thisPaneId ? parseInt(thisPaneId.replace('v-content-team', '')) : -1;
        debug("[expOverview][updateMemberStats] teamNum: ", teamNum, " thisTeamNum: ", thisTeamNum);
        if (thisTeamNum != -1) teamNum = thisTeamNum;


        if ($(`#v-content-team${teamNum} .sicarioMorale`).text() == "75") {
            if (retries++ < 25) return setTimeout(updateMemberStats, 100, teamNum, retries);
            return log("[overview][updateMemberStats] timed out waiting for valid stats");
        }

        // Set/reset click handlers
        $(`#v-content-team${teamNum} .teamManagementSicarioSelectBtn.assigned`).off('click.xedx');
        $(`#v-content-team${teamNum} .teamManagementSicarioSelectBtn.assigned`).on('click.xedx', function(e) {
                delayedMemberClick(e, this);
        });

        // Grab name/member num from button
        let memberBtn = $(`#v-content-team${teamNum} .teamManagementSicarioSelectBtn.active`);
        let memberNum = $(memberBtn).index() + 1;
        let memberName = $(memberBtn).text();
        let teamEntry = expOverview[`team${teamNum}`];
        let memberEntry = teamEntry[$(memberBtn).index()];

        let paneName = $(`#v-content-team${teamNum} .sicarioName`).text();
        if (paneName) paneName = paneName.replace(" - On Expedition", "");
        if (paneName != memberName) {
            if (retries2++ < 25) return setTimeout(updateMemberStats, 100, teamNum, 0, retries2);
            return log("[overview][updateMemberStats] timed out waiting for valid stats");
        }

        memberEntry["assigned"] = true;
        memberEntry["morale"] = $(`#v-content-team${teamNum} .sicarioMorale`).text();
        memberEntry["caution"] = $(`#v-content-team${teamNum} .sicarioCaution`).text();
        memberEntry["combat"] = $(`#v-content-team${teamNum} .sicarioCombat`).text();
        memberEntry["speed"] = $(`#v-content-team${teamNum} .sicarioSpeed`).text();
        memberEntry["lvl"] = $(`#v-content-team${teamNum} .sicarioLevel`).text();
        memberEntry["rank"] = $(`#v-content-team${teamNum} .sicarioMaxRank`).text();
        memberEntry["id"] = $(memberBtn).attr("sicarioid");
        memberEntry["name"] = $(memberBtn).text();
        memberEntry["memNum"] = memberNum;
        memberEntry["lastUpd"] = (new Date().getTime());

        debug("[expOverview][*** updateMemberStats] teamNum: ", teamNum, " memberNum: ", memberNum, "\nEntry: ", memberEntry);

        if (memberEntry["morale"] == "75" && memberEntry["combat"] == "75" && memberEntry["caution"] == "75" && memberEntry["speed"] == "75") {
            memberEntry["morale"] = memberEntry["combat"] = memberEntry["caution"] =
                memberEntry["speed"] = memberEntry["lvl"] = memberEntry["rank"] = '';
        } else {
            $(memberBtn).addClass('b-border');
        }

        expOverview[`team${teamNum}`][memberNum - 1] = JSON.parse(JSON.stringify(memberEntry));
        saveExpOverview();

        populateMemberRow(teamNum, memberNum, memberEntry);
        //populateTableRows();

        inStatHandler = false;
    }

    // Member names
    var prevTeamNum = -1;
    function updateTeamMembers(retries=0) {
        $("#v-content-team .nav-tabs:first-child button").off('click.xedx');
        $("#v-content-team .nav-tabs:first-child button").on('click.xedx', updateTeamMembers);

        // Mark ones we already know about
        let currTeamSel = $("#v-content-team .nav-tabs:first-child button.active").attr('data-bs-target');
        if (!$(currTeamSel).length) {
            if (retries++ < 25) return setTimeout(updateTeamMembers, 100, retries);
            return log("[expOverview][updateTeamMembers] timed out");
        }
        let thisTeamNum = currTeamSel.split('team')[1];
        if (prevTeamNum > -1 && (prevTeamNum == thisTeamNum)) {
            if (retries++ < 25) return setTimeout(updateTeamMembers, 100, retries);
            log("[expOverview][updateTeamMembers] timed out, team num didn't change.");
        }
        let btns = $(`${currTeamSel} .teamManagementSicarioSelectBtn.assigned`);
        for (let idx=0; idx<$(btns).length; idx++) {
            let btnName = $($(btns)[idx]).text();
            let entry = expOverview[`team${thisTeamNum}`][idx];
            if (entry && entry.name && entry.name == btnName && entry.rank > 0)
                $($(btns)[idx]).addClass('b-border');
            else
                $($(btns)[idx]).removeClass('b-border');
        }

        let allMembers = $(".teamManagementSicarioSelectBtn.assigned");
        let allUnassigned = $(".teamManagementSicarioSelectBtn.notAssigned");
        debug("[expOverview][*** updateTeamMembers] \nAssigned: ", $(allMembers), "\nUnassigned: ", $(allUnassigned));

        for (let idx=0; idx<$(allMembers).length; idx++) {
            let teamNum = parseInt(idx / 5) + 1;
            let memberIdx = idx % 5;
            let memberNum = memberIdx + 1;
            let btn = $(allMembers)[idx];
            if ($(btn).hasClass('notAssigned')) {
                 expOverview[`team${teamNum}`][memberIdx] = JSON.parse(JSON.stringify(defMemberStats));
                 continue;
            }
            let memberName = $($(allMembers)[idx]).text();
            let teamEntry = expOverview[`team${teamNum}`];
            let memberEntry = teamEntry[memberIdx];

            // temp - debugging
            memberEntry["flagged"] = false;

            // Used to be a diff secario at this slot...clear stats
            let erasedEntry = false;
//            if (memberEntry && memberEntry.name && memberEntry.name != memberName && memberEntry.assigned == true) {
//                 debug("[expOverview][updateTeamMembers] WOULD BE removing: ", memberEntry);
//                 memberEntry = JSON.parse(JSON.stringify(defMemberStats));
//                 memberEntry.name = "";
//                 erasedEntry = true;
//                 debug("[expOverview][updateTeamMembers] new: ", memberEntry);
//            }
            if (!memberEntry) memberEntry = JSON.parse(JSON.stringify(defMemberStats));

            if (erasedEntry == false) {
                memberEntry.name = memberName;
                memberEntry.assigned = true;
            }

            teamEntry[memberIdx] = JSON.parse(JSON.stringify(memberEntry));
        }

        for (let idx=0; idx<$(allUnassigned).length; idx++) {
            let btn = $(allUnassigned)[idx];
            let memberIdx = $(btn).index();
            let memberNum = memberIdx + 1;

            let pane = $(btn).closest(".tab-pane.fade");
            let paneId = $(pane).attr("id");
            const teamNum = Number(paneId.replace(/\D/g, ''));

            // debug("**** [expOverview][updateTeamMembers] REMOVING team ", teamNum,
            //       " member ", memberIdx, "\nbtn: ", $(btn), "\npane: ", $(pane), "\npane ID: ", paneId,
            //       "\nentry: ", expOverview[`team${teamNum}`][memberIdx]);

            expOverview[`team${teamNum}`][memberIdx] = JSON.parse(JSON.stringify(defMemberStats));

            let teamEntry = expOverview[`team${teamNum}`];
            let memberEntry = teamEntry[memberIdx];
            //debug("[expOverview][updateTeamMembers] team: ", teamEntry, " member: ", memberEntry);
        }

        debug("[expOverview][updateTeamMembers] expOverview: ", expOverview);
        saveExpOverview();

        $(`.teamManagementSicarioSelectBtn.assigned`).on('click', function(e) {
            updateMemberStats($(this).index());
        });
    }

    function handleTeamsTab() {
        updateTeamMembers();
        $("#v-content-team .nav-tabs > button").on('click', updateMemberStats);
    }

    function handleTabClick(e) {
        let id = $(this).attr("id");
        switch (id) {
            case "v-tab-expeditions":
            case "v-tab-sicarios": {

                break;
            }
            case "v-tab-team": {
                debug("********** [overview][v-tab-team] **********");
                handleTeamsTab();
                break;
            }
            case "v-tab-overview": {
                debug("********** [overview][handleTabClick][v-tab-overview] **********");
                //populateTableRows();
                break;
            }
        }
    }

    function handleTabOverview(e) {
        debug("********** [overview][handleTabOverview][v-tab-overview] **********");
        populateTableRows();

    }

    function startExpeditionOverview() {
        GM_addStyle(`
            .maxStat > td, span.maxStat {
                /*background-color: rgba( 10, 220, 10, 0.6);*/
                color: limegreen !important;
            }
            .minStat > td, span.minStat {
                /*background-color: rgba( 10, 220, 10, 0.6);*/
                color: #c8c820 !important;
            }
            .flagged {
                filter: brightness(.4);
            }
        `);

        if (tableCreated == true) {
            //debugger;
        } else {
            buildOverviewTable();
        }

        $("#v-tab-overview").on('click', handleTabOverview);
        updateTeamMembers();
        populateTableRows();
        saveExpOverview();
    }

    //
    // ==================== Add context (right click) menu to town icon ===========================
    //
    //var validMktPages = ["Weapon"];
    function addTownContextMenu(retries=0) {
        // #desktopMenu > li:nth-child(2) > a > svg
        GM_addStyle(`
            #desktopMenu a.nav-link[href*='Town'] > svg:hover { fill: #fdc128; }
            #desktopMenu a.nav-link[href*='Town']:hover > svg { fill: #fdc128; }
            #desktopMenu a.nav-link[href*='Town'] > span:hover { color: #fdc128; }
            #desktopMenu a.nav-link[href*='Town']:hover > span { color: #fdc128; }
            `);
        let selector = "#desktopMenu a.nav-link[href*='Town']";
        let target = $(selector);

        if (!$(target).length) {
            if (retries++ < 50) return setTimeout(addTownContextMenu, 100, retries);
            return log("[addTownContextMenu] timed out");
        }

        const urlParams = new URLSearchParams(window.location.search);
		let selected = urlParams.get("p");
        if (!selected || selected == "undefined") selected = null;

        let lastMarketPage = GM_getValue("lastMarketPage", selected);
        if (!lastMarketPage || lastMarketPage == "undefined") {
            GM_deleteValue("lastMarketPage");
            lastMarketPage = null;
        }
        let desiredMarketPage = GM_getValue("marketPage", null);

        let searchStr = "?p=";
        let refreshPage = '';
        if (desiredMarketPage && desiredMarketPage != "undefined") {
            let refreshPage = searchStr + desiredMarketPage;
        }

        if (options.marketKeepTabOnReload.on == true) {
            if (desiredMarketPage == 'Same Page') {
                refreshPage = searchStr + selected;
            } else if (desiredMarketPage == 'default') {
                refreshPage = '';
            }
        }

        let menuSelector = "#town-ctx";
        const cmHtml = `<div id="town-ctx" class="context-menu ctxhide">
                        <ul class="" style="max-height: 50vh; overflow-y: auto;">
                            <li><a href="/Town/ArmedSurplus">Armed Surplus</a></li>
                            <li><a href="/Town/Pharmacy">Alberto's Pharmacy</a></li>
                            <li><a href="/Market${refreshPage}">La Paz Market</a></li>
                            <li><a href="/Town/Mateos">Mateo's Antiques</a></li>
                            <li><a href="/Casino">Casino</a></li>
                            <li><a href="/PetShop">Victor's Pet Shop</a></li>
                            <li><a href="/Town/EstateAgent">Estate Agent</a></li>
                            <li><a href="/Hospital">Hospital</a></li>
                            <li><a href="/Jail">San Pedro Prison</a></li>
                            <li><a href="/Bank">Bank</a></li>
                            <li><a href="/Town/Diablos">Underground Weapons</a></li>
                            <li><a href="/Town/DrugDen">Drug Den</a></li>
                            <li><a href="/Bounty">Winston's Bounties</a></li>
                            <li><a href="/Town/Club">Julio's Club</a></li>
                            <li><a href="/Town/Dealership">Car Dealership</a></li>
                            <li><a href="/Town/Construction">Carlo's Construction</a></li>
                            <li><a href="/Town/PoliceAuction">Police Auction</a></li>
                        </ul>
                    </div`;

        $(target).after(cmHtml);
        displayHtmlToolTip($(target), "Right-click for quick links");

        let params = {cmSel: menuSelector, targetSel: selector};
        $(selector).on('contextmenu', params, handleRightClick);
        $(menuSelector).on('contextmenu', params, handleRightClick);
        cmHandleOutsideClicks('town-ctx');

        function handleRightClick(event) {
            event.preventDefault();
            let menuSel = event.data.cmSel;
            let targetSel = event.data.targetSel;
            log("Click on context: ", $(menuSel).attr('href'), $(menuSel));

            $("#desktopMenu a.nav-link[href*='Town']").tooltip('close');

            let mouseX = event.pageX;
            let mouseY = event.pageY;
            //let mouseX = $(event.currentTarget).position().left;

            $(menuSel).offset({
                left: mouseX,
                top: mouseY
            });

            $(menuSel).toggleClass("ctxshow ctxhide");
        }

        function cmHandleOutsideClicks(cmId) {
            $("html").click(function (e) {
                let menu = document.getElementById(cmId)
                if (e.target != menu) {
                    if ($(menu).hasClass("ctxshow"))
                        $(menu).removeClass("ctxshow").addClass("ctxhide");
                    if (!$(menu).hasClass("ctxhide"))
                        $(menu).addClass("ctxhide");
                }
            });
        }
    }

    // =========================== Track market prices, historically ==============================

    var itemsArray;
    var myChart;
    var activeParams;
    var useSmoothed = false;
    var hiddenItems = {};
    class cMarketTabLock {
        constructor(noisy=false) {
            this.locked = false;
            this.noisy = noisy;
        }

        lock() {
            if (this.noisy == true) debug('[marketTabLock] lock');
            this.locked = true;
        }
        unlock() {
            if (this.noisy == true) debug('[marketTabLock] unlock');
            this.locked = false;
        }
        isLocked() { return this.locked; }
    }

    const marketTabsLock = new cMarketTabLock(true);

    // TBD: Save unique/smoothed entries only! Much faster graph building.
    // Have a store for each cat, use it! Maybe remove index?
    function collectMarketPrices(retries=0) {
        debug("[collectMarketPrices]: ", thisURL);

        if (!isMarketPage()) return;
        if (dbReady == false) {
            dbWaitingFns.push(collectMarketPrices);
            return;
        }

        $("#itemMarketNav button.itemMarketNav").off('click.prices');
        $("#itemMarketNav button.itemMarketNav").on('click.prices', function(e) {
            marketTabsLock.lock();
            collectMarketPrices();
        });

        let activeTab = $("#itemMarketNav button.itemMarketNav.active");
        let target = $(activeTab).attr("data-bs-target");
        if (!$(target).length) {
            if (retries++ < 20) return setTimeout(collectMarketPrices, 200, retries);
            marketTabsLock.unlock();
            return log("[collectMarketPrices] timed out.");
        }

        marketTabsLock.unlock();
        let title = target.replace('#', '');

        hiddenItems = {};
        if (myChart != undefined) { // Assuming 'myChart' is the variable holding your chart instance
            myChart.destroy();
            myChart = undefined;
        }

        let sel = `${target} > div.offerListWrapper div.card > div.card-body`;
        let cardTarget = `${target} > div.offerListWrapper div.card > div.card-body`;
        let cards = $(cardTarget);
        if (!$(cards).length) {
            if (retries++ < 60) return setTimeout(collectMarketPrices, 100, retries);
            return log("[collectMarketPrices] timed out after ", retries);
        }

        let dbEntries = [];
        for (let idx=0; idx<$(cards).length; idx++) {
            let card = $($(cards)[idx]);
            let name = $(card).find('h5.card-title').text();
            let price = $(card).find('p:nth-child(3)').text();
            let itemId = $(card).find('button.viewOffersButton').attr('data-itemid');

            title = filterNameForDb(title); // title.replaceAll(' ', '_');
            name = name.replaceAll(' ', '_');
            let entry = {"category": title, "name": name, "id": itemId, "price": price, "dateTime": (new Date().getTime()) };

            let root = $($(cards)[idx]).closest(".card"); //.tab-pane");
            //debug("[collectMarketPrices] card body: ", $(card), " root: ", $(root));

            //debug("*****[collectMarketPrices]: entry: ", entry);
            dbEntries.push(entry);
        }

        //debug("*****[collectMarketPrices][databse] Adding entries to ", marketPricesStoreName, "\nentries: ", dbEntries);

        // TBD: Add as unique and/or smoothed, into new DBs!!
        dbAddEntriesToStore(dbEntries, marketPricesStoreName);

        //debug("*****[collectMarketPrices][databse] Adding entries done");

        // Add button to show price history
        addHistoryBtns();
        addUiToPage();

        function addHistoryBtns(retries=0) {
            let btns = $(".tab-pane.active .viewOffersButton");
            let itemCat = $(btns).length ? $($(btns)[0]).attr('data-category').split(' ')[0].toLowerCase() : "";
            for (let idx=0; idx<$(btns).length; idx++) {
                let offerBtn = $(btns)[idx];
                let name = $(offerBtn).parent().find('h5').text();
                debug("[collectMarketPrices] btn: ", $(offerBtn), " name: ", name);
                let itemId = $(offerBtn).attr('data-itemid');
                itemCat = $(offerBtn).attr('data-category').split(' ')[0].toLowerCase();
                debug("[collectMarketPrices] id: ", itemId, " cat: ", itemCat);
                let histBtn =
                    `<button class="btn btn-success w-100 priceHistoryBtn" data-name="${name}" data-itemid="${itemId}" data-category="${itemCat}">History</button>`;
                if (!$(offerBtn).find(".priceHistoryBtn").length)
                    $(offerBtn).after(histBtn);
                $(offerBtn).on('click.xedx', handleViewOffers);
            }

            let newBtns = $(".tab-pane.active .priceHistoryBtn");
            if ($(btns).length == 0 || ($(newBtns).length == 0 && $(btns).length > 0)) {
                if (retries++ < 20) return setTimeout(addHistoryBtns, 100, retries);
                return debug("[collectMarketPrices][addHistoryBtns] timed out");
            }
            $(newBtns).on('click', toggleGraph);

            function handleViewOffers(e, retries=0) {
                let btn = $(".backToCategoryBtn");
                if (!$(btn).length) {
                    if (retries++ < 50) setTimeout(handleViewOffers, 100, e, retries);
                } else {
                    $(btn).on('click.xedx', function (e) { setTimeout(addHistoryBtns, 100); });
                }
            }
        }

        function toggleGraph(e) {
            let name = filterNameForDb($(this).attr('data-name'));
            let id = $(this).attr('data-itemid'), cat = $(this).attr('data-category');

            if ($("#hist-prices").css('display') == 'none')
                $("#hist-prices").slideToggle();

            displaySpinner($(this), "marketGraph");

            // If opening, get saved data points
            if ($("#hist-prices").css('display') != 'none') {
                dbGetRecordsForIndex(marketPricesStoreName, byNameIdx.name, name, getPricesCb);
            }

            // Now we have (or have created) the status entry, can populate the graph.
            function getItemStatusCb(res, params) {
                debug("[collectMarketPrices][createMarketGraph][getItemStatusCb] ", res, params);

                if (!res) {
                    let now = new Date().getTime();
                    let entry = params.resArray[0];
                    res = {"name": entry.name, "id": entry.id,
                           "minT": 999999999, "maxT": 0, "minP": 9999999999, "maxP": 0,
                           "lastEntryKey": null, "oldestDate": now, "newestDate": now, "lastUpdate": 0, "range": 0, "window": 0};
                }
                if (params) params["statusEntry"] = res;
                createMarketGraph(params);
            }

            // Have array of prices, now get the status of the data records
            function getPricesCb(resArray) {
                debug("[collectMarketPrices][createMarketGraph][getPricesCb] res: ", $(resArray));
                let name = filterNameForDb(resArray[0].name);
                let params = {resArray: resArray, name: name, statusEntry: {}};

                dbGetItemFromStoreByKey(name, pricesByCatWithStatusStoreName, getItemStatusCb, params);
            }
        }

        function addUiToPage(retries=0) {
            if ($("#hist-prices").length > 0) return debug("[collectMarketPrices][addUiToPage] already exists");
            let activeTab = $("#itemMarketNav button.itemMarketNav.active");
            let target = $(activeTab).attr("data-bs-target");
            let catCard = $(target).closest('.card');

            let resetBtn =
                    `<button class="btn btn-success graphBtn" id="resetGraphBtn">Reset Zoom</button>`;
            let smoothBtn =
                    `<button class="btn btn-success graphBtn" id="smoothGraphBtn">Smooth</button>`;
            let closeBtn =
                     `<button class="btn btn-success graphBtn" id="closeGraphBtn">Close</button>`;

            let hdrRow = `<div class="row mb-0"><div class="col-12"><div class="header-section" style="position: relative;">
                              <h2>Historical Prices</h2>
                              <span class="closeBtnWrap">${resetBtn}${smoothBtn}${closeBtn}</span>
                              <span class="col-caret" data-root="card" data-area="market" data-idx="1"><i class="fa fa-caret-down"></i></span>
                          </div></div></div>`;

            let cardBody = `<div class="card-body"><nav id="sellNav">
                                <div class="tab-content">
                                    <div style="width: 1100px; height: 300px;">
                                        <canvas id="myChart">
                                        </canvas>
                                    </div>
                                </div>
                            </div></div>`;

            let newCard = `<div id="hist-prices" class="card mb-4" style="display: none;">` + hdrRow + cardBody + `</div?`;

            $(catCard).after(newCard);

            $("#resetGraphBtn").on('click', function() { myChart.resetZoom(); });

            $("#closeGraphBtn").on('click', function () {
                if ($("#hist-prices").css('display') != 'none')
                    $("#hist-prices").slideToggle();
            });

            $("#smoothGraphBtn").on('click', function () {
                useSmoothed = !useSmoothed;
                $("#smoothGraphBtn").text(useSmoothed ? "Unique" : "Smooth");
                createMarketGraph();
            });
        }
    }

    function calculateMovingAverage(data, windowSize) {
        const smoothedData = [];
        for (let i = 0; i < data.length; i++) {
            let sum = 0;
            let count = 0;
            for (let j = Math.max(0, i - Math.floor(windowSize / 2)); j <= Math.min(data.length - 1, i + Math.floor(windowSize / 2)); j++) {
                sum += data[j].y;
                count++;
            }
            smoothedData.push({ x: data[i].x, y: sum / count });
        }
        return smoothedData;
    }

    function addOrUpdateItemPriceStatus(status) {
        status.lastUpdate = new Date().getTime();
        dbPutEntryInStore(status, pricesByCatWithStatusStoreName, null, updateCompleteCb, status);

        function updateCompleteCb(res, params) {
            debug("[createMarketGraph] [updateCompleteCb] res: ", res, " params: ", params);
        }
    }

    function getRandomColor() {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        return `rgb(${r}, ${g}, ${b})`;
    }

    function createMarketGraph(params) {
        debug("[createMarketGraph] params: ", params);
        params ? (activeParams = params) : (params = activeParams);
        if (!params) debugger;

        let smoothedData = [];
        const dataVals = [];
        let resArray = params.resArray;
        let status = params.statusEntry;
        if (!status) debugger;

        debug("[createMarketGraph] array len: ", resArray.length);

        // NOTE: can go to/from set and array to get unique arrays!
        //
        // For now, convert from resArray to new sorted/unique/smoothed entries.
        // Going forward, just use new tables, so we don't need to spend all the
        // time converting everything... in that case, can ignore the old resArray,
        // just load new table data.
        if (!resArray || !resArray[0]) debugger;

        let name = dbNameToRealName(resArray[0].name);
        let chartTimeOffset = 1762000000000;

        // See if this data already exists, if so, toggle visibility.
        if (myChart != undefined) {
            let found = false;
            myChart.data.datasets.forEach((dataset, idx) => {
                if (dataset.label == name) {
                    found = true;
                    const currVis = myChart.isDatasetVisible(idx);
                    hiddenItems[name] = currVis ? "hidden" : "visible";
                    myChart.setDatasetVisibility(idx, !currVis);
                }
            });
            if (found == true) {
                myChart.update();
                removeSpinner("marketGraph");
                return;
            }
        }

        // Parse DB entry into an X,Y pair. Could map this, esp if data is already filtered/sorted
        resArray.forEach((entry, idx) => {
            let p = filterPriceForDb(entry.price);
            let t = parseInt((entry.dateTime - chartTimeOffset) / 1000);
            //let t = parseInt(entry.dateTime / 1000);

            // this clippeddata!!!!
            //if (status.minT != t && status.minP != p && status.maxT != t && status.maxP != p) {
                let dbEntry = {"name": entry.name, "dateTime": entry.dateTime, "timeX": t, "priceY": p, "smooth": false};
                dataVals.push(dbEntry);
                if (t < status.minT) status.minT = t;
                if (t > status.maxT) status.maxT = t;
                if (p < status.minP) status.minP = p;
                if (p > status.maxP) status.maxP = p;
            //}
        });

        // ============================ exp remove high spike, keep lows
        // Try 'reduce' to get max/min
        const max = dataVals.reduce(function(prev, current) {
          return (prev && prev.priceY > current.priceY) ? prev : current
        });
        const min = dataVals.reduce(function(prev, current) {
          return (prev && prev.priceY < current.priceY) ? prev : current
        });
        debug("[createMarketGraph][graph_array] dataVals min/max: ", min, max);

        // remove max?
        dataVals.splice(dataVals.findIndex(a => a.dateTime === max.dateTime) , 1);
        debug("[createMarketGraph][graph_array] reoved max: ", dataVals);
        // ==================================

        // Sort and guarantee unique. Can do this when adding to the DB to begin with...

        debug("[createMarketGraph][graph_array] dataVals: ", dataVals);
        dataVals.sort((a, b) => a.timeX - b.timeX);
        debug("[createMarketGraph][graph_array] dataVals, sorted: ", dataVals);
        const uniqueIds = new Set();
        const uniqueSortedData = dataVals.filter(item => {
            if (uniqueIds.has(item.timeX)) {
                return false;
            } else {
                uniqueIds.add(item.timeX);
                return true;
            }
        });

        // TEMP...
        debug("[createMarketGraph][graph_array] uniqueSortedData: ", uniqueSortedData);

        //if (uniqueSortedData.length < 2)
        if (!uniqueSortedData.length)
        {
            removeSpinner("marketGraph");
            alert("Not enough unique data to display any trends yet!");
            return;
        }

        //let smoothedData = calculateMovingAverage(uniqueSortedData, 3);

        // When we allow ranges, this won't be true - min and max will be local graph range limits
        if (status.oldestdate > status.minT) status.oldestdate = status.minT;
        if (status.newestdate > status.maxT) status.newestdate = status.maxT;
        status.range = status.maxT - status.minT;
        status.window = .01 * status.range;

        addOrUpdateItemPriceStatus(status);

        if (uniqueSortedData.length < 5) {
            uniqueSortedData.forEach(item => { smoothedData.push(item); });
        } else {
            let prevT = uniqueSortedData[0].timeX;
            smoothedData.push(uniqueSortedData[0]);
            for (let idx=1; idx<uniqueSortedData.length - 1; idx++) {
                if (uniqueSortedData[idx].timeX - status.window > prevT) {
                    uniqueSortedData[idx]["smooth"] = true;
                    smoothedData.push(uniqueSortedData[idx]);
                    prevT = uniqueSortedData[idx].timeX;
                }
                smoothedData.push(uniqueSortedData[uniqueSortedData.length - 1]);
            }
        }
        // TBD: Put all unique data into DB!!!!

        debug("[collectMarketPrices] result smoothedData: ", smoothedData);
        debug("[collectMarketPrices] result lengths\nresArray: ", resArray.length,
              " dataVals: ", dataVals.length, " unique:", uniqueSortedData.length, " smoothedData: ", smoothedData.length);
        debug("[collectMarketPrices] result smoothed: ", smoothedData);
        debug("[collectMarketPrices] result unique: ", uniqueSortedData);

        let useData = uniqueSortedData;
        if (useSmoothed == true && smoothedData && smoothedData.length > 0) {
            debug("[collectMarketPrices] Using smoothed data");
            useData = smoothedData;
        }
        // if (useData.length < 2)
        if (!useData.length)
            if (useSmoothed == true) useData = uniqueSortedData;

        // if (useData.length < 2)
        if (!useData.length)
        {
            removeSpinner("marketGraph");
            alert("Not enough data to display any trends yet!");
            return;
        }
        //debug("[collectMarketPrices] useData: ", useData);

        // Get chart data from our DB entries - map to an x, y array
        const chartData = useData.map(item => ({
            x: item.timeX,
            y: item.priceY
        }));
        debug("[collectMarketPrices] chartData: ", chartData);

        debug("[graph_array] chartData: ", chartData);

        let labels = [];
        hiddenItems[name] = "visible";

        // Add a new dataset if we've clicked on another item in the same category
        if (myChart != undefined) {
            myChart.data.datasets.push({
                label: name,
                data: chartData,
                borderColor: getRandomColor(),
                fill: false,
                showLine: true,
                hidden: false,
                tension: .4
            });
            myChart.update();
            removeSpinner("marketGraph");
            return;
        }

        const data = {
            datasets: [{
                label: name,
                data: chartData,
                fill: false,
                showLine: true,
                hidden: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: .4
            }]
        };
        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        labels: labels,
                        min: chartData[0].x,
                        max: chartData[chartData.length - 1].x,
                        type: 'linear',
                        position: 'bottom',
                        ticks: {
                            callback: function (value, index, ticks) {
                                //debug("[collectMarketPrices][tick cb] ", value, index, ticks.length);
                                //return tinyDateStr(new Date(value * 1000), true);
                                return tinyDateStr(new Date((value * 1000) + chartTimeOffset), true);
                            },
                            minRotation: 45,
                            maxRotation: 45,
                            maxTicksLimit: 5,
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Price'
                        },
                    }
                },
                plugins: { // For Chart.js v3 and later
                    legend: {
                        onClick: (event, legendItem, legend) => {
                            let name = filterNameForDb (legendItem.text);
                            if (myChart != undefined) {
                                let found = false;
                                myChart.data.datasets.forEach((dataset, idx) => {
                                    if (filterNameForDb(dataset.label) == name) {
                                        found = true;
                                        const currVis = myChart.isDatasetVisible(idx);
                                        hiddenItems[name] = currVis ? "hidden" : "visible";
                                        myChart.setDatasetVisibility(idx, !currVis);
                                    }
                                });
                                if (found == true) {
                                    myChart.update();
                                    removeSpinner("marketGraph");
                                }
                            }
                        },
                        labels: {
                            filter: function(legendItem, chartData) {
                                if (hiddenItems[`${legendItem.text}`] == 'hidden') {
                                    return false; // Hide this legend item
                                }
                                return true; // Show all other legend items
                            }
                        }
                    },
                    zoom: {
                        pan: {
                            enabled: true, // Enable panning
                            mode: 'xy',    // Allow panning in both X and Y directions
                        },
                        zoom: {
                            enabled: true, // Enable zooming
                            mode: 'xy',    // Allow zooming in both X and Y directions
                            wheel: {
                                enabled: true, // Zoom using mouse wheel
                            },
                            drag: {
                                enabled: true // Enable drag-to-zoom (drawing a box)
                            }
                        },
                    }
                },
            },
        };

        removeSpinner("marketGraph");

        // ...instantiate the chart
        const ctx = $('#myChart')[0].getContext('2d');
        myChart = new Chart(ctx, config);
    }

    function getHistoryCard() {
        let hdr =
            `<div class="row mb-0"><div class="col-12">
                <div class="header-section" style="position: relative;"><h2>Price History</h2></div>
            </div></div>`;
        let body =
            `<div class="card-body">
                <nav id="sellNav">
                    <div class="nav nav-tabs mb-4" role="tablist">
                        <button class="nav-link active" id="v-tab-items" data-bs-toggle="tab" data-bs-target="#v-content-items" type="button" role="tab" aria-controls="v-content-items" aria-selected="true">Items</button>
                        <button class="nav-link" id="v-tab-points" data-bs-toggle="tab" data-bs-target="#v-content-points" type="button" role="tab" aria-controls="content-points" aria-selected="false" tabindex="-1">Points</button>
                    </div>
                    <div class="tab-content">
                        <div class="tab-pane fade" id="v-content-points" role="tabpanel" aria-labelledby="v-tab-points">
                        </div>
                    </div>
                </nav>
            </div>`;
        return `<div class="card mb-4">` + hdr + body + `</div>`;
    }

    // ============================= Item Market tab opts =========================================

    const marketPageTabs = ['Default', 'Same Page', 'Weapon', 'Thrown', 'Armour', 'Special', 'Alcohol', 'Medical', 'Drug', 'Production',
                          'Construction', 'Food', 'Collectible', 'Luxury', 'Car', 'Enhancement', 'Points'];
    const marketPriceDiv = `<span class='csave'><label>Price history:<input type="checkbox" name="price-history"></label></span>`;
    const marketPgSelect =  // ((options.saveMarketPrices.on == true) ? marketPriceDiv : ``) +
          `<label>Start page:<select id="market-page-select" style="margin: 0px 10px 0px 10px;"></select></label>`;
    const saveCaretPosOpt = `
        <span class="csave">
            <label>Restore position on reload<input type="checkbox" name="caret-save"></label>
        </span>`;
    const marketSaveOpt = `
        <span class="csave">
            ${marketPgSelect}
            <label>Restore position on reload<input type="checkbox" name="caret-save"></label>
        </span>`;

    function setLastMarketPage(val) {
        if (!val || val == "undefined") return debug("[addMarketTabOpts] NOT setting lastMarketPage to ", val);
        debug("[addMarketTabOpts] setting lastMarketPage to ", val);
        GM_setValue("lastMarketPage", val);
    }

    function addMarketTabOpts(retries=0) {
        if (!isMarketPage()) return;

        // Trap tab clicks to save page we are going to, as 'last page'
        $("#itemMarketNav button.itemMarketNav").off('click.tabs');
        $("#itemMarketNav button.itemMarketNav").on('click.tabs', function(e) {
            marketTabsLock.lock();
            let area = $(this).attr("data-url");
            const urlParams = new URLSearchParams(window.location.search);
		    const selected = urlParams.get("p");

            setLastMarketPage(area);
        });

        let area;
        let path = location.pathname;
        if (path == '/') {
            area = 'home';
        } else {
            if (path) area = path.split("/")[1];
            log("path: ", path, " parts: ", (path ? path.split("/") : ''), " area: ", area);
        }
        if (!area) return;
        area = area.toLowerCase().trim();

        const urlParams = new URLSearchParams(window.location.search);
		let selected = urlParams.get("p");

        let lastMarketPage = GM_getValue("lastMarketPage", selected);
        let desiredMarketPage = GM_getValue("marketPage", 'Weapon');

        if (lastMarketPage == "undefined") {
            GM_deleteValue("lastMarketPage");
            lastMarketPage = null;
        }
        if (selected == "undefined") selected = null;
        if (area == 'market') {
            marketPageTabs.forEach(area => {
                $("#market-page-select").append(`<option value="${area}">${area}</option>`);
            });
            let currPage = GM_getValue("marketPage", 'Weapons');
            $("#market-page-select").val(currPage);
            $("#market-page-select").change(function() {
                let val = $(this).val();
                GM_setValue("marketPage", val);
            });
        }
        if (area == 'market' && desiredMarketPage != 'weapon' && desiredMarketPage != 'Default' &&
            desiredMarketPage != 'Same Page' && selected != desiredMarketPage && marketTabsLock.isLocked() == false) {
            if (desiredMarketPage && desiredMarketPage != "undefined")
            location.href = `/Market?p=${desiredMarketPage}`;
            return;
        }
        if (area == 'market' && desiredMarketPage == 'Same Page' &&
            selected != lastMarketPage && marketTabsLock.isLocked() == false) {
            if (lastMarketPage && lastMarketPage != "undefined") {
                debug("[addMarketTabOpts] setting path to ", lastMarketPage);
                location.href = `/Market?p=${lastMarketPage}`;
                return;
            }
        }
        setLastMarketPage(selected);
    }

    // ===================================== Help for items in market ====================================

    const vTypes = ['weapon', 'armour', 'special', 'thrown'];
    const oTypes = ["luxury", "car", "thrown", "alcohol", "medical", "drug", "construction"];
    const hasRank = ['weapon', 'armour', 'luxury', 'car'];
    function addItemMarketHelp(retries=0) {
        if (dbReady == false) {
            dbWaitingFns.push(addItemMarketHelp);
            return;
        }
        const urlParams = new URLSearchParams(window.location.search);
		let selected = urlParams.get("p");
        debug("[database][addItemMarketHelp] selected: ", selected);
        if (!selected) {
            if (retries++ < 25) return setTimeout(addItemMarketHelp, 250, retries);
            return log("[addItemMarketHelp] timed out");
        } else {
            selected = selected.toLowerCase().trim();
        }

        $("#itemMarketTabs > button").off('click.xedx');
        $("#itemMarketTabs > button").on('click.xedx', addItemMarketHelp);

        if (vTypes.includes(selected)) {
            buildHelpForItemList(`#v-content-${selected} > div.offerListWrapper > div.row > div`);
        } else if (oTypes.includes(selected)) {
            buildHelpForItemList(`#content-${selected} > div.offerListWrapper > div.row > div`);
        }

        function buildHelpForItemList(selector, retries=0) {
            let list = $(selector);
            if (!$(list).length) {
                if (retries++ < 25) return setTimeout(buildHelpForItemList, 250, selector, retries);
                return log("[addItemMarketHelp][buildHelpForItemList] timed out");
            }
            for (let idx=0; idx<$(list).length; idx++) {
                let iRoot = $(list)[idx];
                let itemId = $(iRoot).find("button.viewOffersButton").attr('data-itemid');
                let name = $(iRoot).find("h5.card-title").text();
                let target = $(iRoot).find("img");
                $(target).attr("data-hlp-id", itemId);

                if (!itemId || isNaN(itemId))
                    debug("[addItemMarketHelp][buildHelpForItemList] itemId: ", itemId, $(iRoot));
                dbGetItemFromStoreByKey(parseInt(itemId), allItemsStoreName, getItemCallback);
            }
        }
    }

    function getItemCallback(result) {
        debug("[database][addItemMarketHelp][getItemCallback] result: ", result);
        if (result) {
            let itemId = result.id;
            let type = result.type.toLowerCase();
            let prefix = '';
            if (vTypes.includes(type)) prefix = 'v-';
            let target = $(`#${prefix}content-${type} > div.offerListWrapper`).find(`img[data-hlp-id="${itemId}"]`);
            let hlpText = hasRank.includes(type) ?
                `${result.name}\nRank: ${result.rank}\nValue: ${asCurrency(result.itemValue)}\n${result.effect}` :
                `${result.name}\nValue: ${asCurrency(result.itemValue)}\n${result.effect}`;

            displayHtmlToolTip($(target), hlpText, "tooltip4 itemHlp");
        }
    }

    function addEntriesCallback(param) {
        debug("[database][addItemMarketHelp][addEntriesCallback] params: ", param);
        GM_setValue("itemsDbInitialized", JSON.stringify( { init: true, when: (new Date().getTime()) }));
    }

    function itemsApiCallback(response, status, xhr) {
        let data = JSON.parse(response);
        if (!data) return log("Error: no data in response");

        let dbEntries = data.items;
        dbAddEntriesToStore(dbEntries, allItemsStoreName, true, addEntriesCallback);
    }

    function getAllAvailableItems() {
        if (dbReady == false) {
            dbWaitingFns.push(getAllAvailableItems);
            return;
        }

        ce_getItemsList('advanced', itemsApiCallback);
        logApiCount("ce_getItemsList");
    }

    //
    // ========================= Add collapsible carets to various pages =================================
    //
    // Maybe change this, or add to it, with a 'caret class', to add carets independently/easier
    // Or add additional paths to saved selects? Not saved now...
    function addCollapseCarets() {
        debug("[addCollapseCarets]");

        const caretSelects = {
            "market": {area: "market", sel: ".card .header-section", root: "card"},
            "jobs": {area: "jobs", sel: ".jobContainer .header-section", root: "row"},
            "inventory": {area: "inventory", sel: ".card .header-section", root: "row"},
            //"university": {sel: ".card .header-section", root: "card"},
            "cartel": {area: "cartel", sel: ".card .header-section", root: "card"},
            "home": {area: "/", sel: ".card .header-section", root: "card"},
            "armedsurplus": {area: "town/armedsurplus", sel: ".card .header-section", root: "card"},
            "slots": {area: "casino/slots", sel: ".card .header-section", root: "card"},
            "blackjack": {area: "casino/blackjack", sel: ".card .header-section", root: "card"},
            "lottery": {area: "casino/lottery", sel: ".card .header-section", root: "card"},
            "pot-o-plata": {area: "casino/pot-o-plata", sel: ".card .header-section", root: "card"},
        }

        var cStates = JSON.parse(GM_getValue('cStates', JSON.stringify({})));
        const savecStates = () => { debug("[savecStates]: ", cStates); GM_setValue('cStates', JSON.stringify(cStates)); };
        if (Object.keys(cStates).length == 0) {
            let keys = Object.keys(caretSelects);
            for (let idx=0; idx<keys.length; idx++) {
                cStates[keys[idx]] = { "enabled": false };
            }
            savecStates();
        }

        const urlParams = new URLSearchParams(window.location.search);
		let selected = urlParams.get("p");
        if (!selected || selected == "undefined") selected = '';

        let area;
        let fullArea;
        let path = location.pathname;
        let obj = getObjForPath(path);

        if (!obj)
            return debug('[addCollapseCarets]Not adding carets for ', path, ', not known.');

        var updcStates = false;
        addCaretForObject(obj);

        if (obj["area"] == 'market') addMarketTabOpts();
        $(".fa").on('click', handleCaret);
        if (updcStates == true) savecStates();

        function handleCbSaveOpt(e) {
            let area = $(this).attr("data-area");
            let checked = $(this).prop('checked');
            cStates[area].enabled = checked;
            savecStates();
        }

        function handleCaret(e, node) {
            let target;
            let card;
            if (!$(node).length) node = this;
            let sel = $(node).parent().attr('data-root');
            let area = $(node).parent().attr('data-area');
            let idx = $(node).parent().attr('data-idx');
            if (!area && !idx) return;
            if (sel == 'card') {
                card = $(node).closest('.card');
                if ($(card).length) target = $(card).find('.card-body');
                if (!$(target).length) target = $(card).find('div:nth-child(2)');
            } else if (sel == 'row') {
                target = $(node).closest('.row').next();
            }
            $(target).slideToggle("slow");
            $(node).toggleClass('fa-caret-down fa-caret-right');
            debug("[handleCaret] cStates: ", idx, area, " before: ", cStates[area]);
            let state = $(node).hasClass('fa-caret-down') ? 'fa-caret-down' : 'fa-caret-right';
            cStates[area][idx] = state;
            savecStates();
            debug("[handleCaret] cStates: ", idx,  area, " after: ", cStates[area]);
            debug("[handleCaret] cStates: ", cStates);
        }

        function addCaretForObject(obj) {
            let selector = obj.sel;
            let rootSel = obj.root;
            const hdrs = $(selector);
            if ($(hdrs).length) {
                $(hdrs).each(function(idx, node) {
                    let el = $(caretBtn);
                    $(el).attr('data-root', `${rootSel}`);
                    $(el).attr('data-area', `${area}`);
                    $(el).attr('data-idx', `${idx}`);
                    $(node).css("position", "relative");
                    $(node).append(el);
                    let key = idx.toString();
                    let state = cStates[area] ? cStates[area][key] : null;
                    debug("addCaret cState: ", state, idx, area, key);
                    if (!state) {
                        debug("default cState, not saved: ", area, key, idx, cStates[area]);
                        state = "fa-caret-down";
                        if (!cStates[area]) cStates[area] = {};
                        cStates[area][key] = state;
                        cStates[area]["enabled"] = true;
                        updcStates = true
                    } else if (cStates[area].enabled == true && state) { // && state == 'fa-caret-right') {
                        debug("cState, saved: ", area, state, key, idx, cStates[area]);
                        if (state == 'fa-caret-right') {
                            debug("changing cState");
                            handleCaret(null, $(node).find('i'));
                            debug("cState, after: ", cStates);
                        }
                    }

                    // First header has an option to save caret position, and in the market,
                    // option to save tab on refresh
                    if (idx == 0) {  // id='mkt-caret
                        $(node).css({"display": "flex", "justify-content": "space-between"});
                        let newNode = (area == 'market') ? $(marketSaveOpt) : $(saveCaretPosOpt);
                        let saveCb = $(newNode);
                        $(node).find(".col-caret").before(newNode);
                        let checked = cStates[area].enabled;
                        debug("Saved cState, checked ", checked, area, cStates[area], cStates);
                        debug("[cState] idx: ", idx, " node:", $(node));
                        $(node).find('input').prop('checked', checked);;
                        $(node).find('input').attr('data-area', area);
                        $(node).find('input').on('change', handleCbSaveOpt);
                    }
                });
            }
        }

        function getObjForPath(path) {
            if (path == '/') {
                area = 'home';
            } else {
                let parts = path ? path.split('/') : [];
                //debug("[addCollapseCarets] path: ", path, " parts: ", parts);
                if (parts && parts.length > 0) {
                    area = parts[parts.length - 1];
                    fullArea = parts[1];
                    if (parts.length > 2 && parts[2]) fullArea = fullArea + '/' + parts[2];
                }
                //debug("[addCollapseCarets] path: ", path, " parts: ", (path ? path.split("/") : ''),
                //      " area: ", area, " fullArea: ", fullArea);
            }
            return area ? caretSelects[area.toLowerCase().trim()] : null;
        }

    }

    // ================================== Production page ========================================

    function doProdPageMods() {
        let tables = $(".production-table");  // Owned, ownable, etc,
        for (let idx=1; idx<$(tables).length; idx++) {
            let req = $($(".production-table")[idx]).next().next().next();
            let own = $($(".production-table")[idx]).next().next().next().next();
            let reqTxt = $(req).text();
            let item = reqTxt.slice(reqTxt.indexOf(' ') + 1);
            let ownTxt = $(own).text();
            let reqNum = reqTxt ? reqTxt.replace(/\D/g, '') : 0;
            let ownNum = ownTxt ? ownTxt.replace(/\D/g, '') : 0;
            //$(req).css("color", "green");
            if (+reqNum > +ownNum) $(own).css("color", "red");
            else if (+ownNum >= +reqNum && +ownNum <= 2 * +reqNum) $(own).css("color", "yellow");
            else if (+ownNum >= +reqNum * 2 && +ownNum <= 3 * +reqNum) $(own).css("color", "green");
            else if (+ownNum > 3 * +reqNum) $(own).css("color", "limegreen");
            //debug("[doProdPageMods] required: ", reqTxt, " owned: ", ownTxt);
            debug("[doProdPageMods] ",  item, " required: ", reqNum, " owned: ", ownNum);
        }
    }

    //
    // ================== Job timer - display time left in the status bar =========================
    //
    // If on the Jobs page, either find the active job and save it's completion time, or
    // hook the Start buttons to save when one is started. If not on the Jobs page, use
    // that info to display current job status. If running, start the countdown timer.
    // Turns out, no need to hook the Start event, as the page reloads....
    const jobTimer = `<p class="card-text fw-bold text-success" id="myProgMessage" data-bs-finishtime="1758592461"></p>`;

    function jobClickHandler(context, opts) {
        jobAlerter.clearAlerts();
        openUniqueTab("/Jobs");
    }

    function addJobHelp(node) {
        let innerMsg = isJobsPage() ? 'refresh page' : 'go to Jobs';
        let title = $($("#cancelButton").closest(".equipmentModule")).find('h5').text();
        let txt = (title && title.length) ? `${title}<br>Click to ${innerMsg}` : `Click to ${innerMsg}`;
        displayHtmlToolTip(node, txt);
    }

    function handleJobClick(e){        // Handle clicks on the timer itself
        debug("[handleJobClick] clear browserAlert");
        jobAlerter.clearAlerts();
        isJobsPage() ? location.reload(): window.location.href = '../jobs';
    }

    var jobAlerted = false;

    function alertJobComplete() {
        if (!$("#myProgMessage").hasClass('blink182')) {
            $("#myProgMessage").addClass('blink182');
            //jobAlertInt = 0;
        }
        if (options.notifyJobComplete.on == true && jobAlerted == false) {
            if (jobAlerter.sendAlert() == true)
                jobAlerted = true;
        }
    }

    function stopJobAlert() {
        jobAlerter.clearAlerts();
        $("#myProgMessage").addClass('blink182');
    }

    function getJobStartedTime() {
        let epochEnd = GM_getValue("activeJobEnd", 0);
        let now = new Date().getTime() / 1000;
        let diff = (epochEnd > now) ? (epochEnd - now) : 0;
        let node = `<p class="card-text fw-bold text-success" id="myProgMessage" data-bs-finishtime="${epochEnd}"></p>`;
        addJobLink($("#topNavBtnWrap .col-cd-caret"), $(node));

        updateJobTime(epochEnd);
        //addJobHelp(node);
        if (now < epochEnd) {
            setInterval(updateJobTime, 1000, epochEnd);
        }

        function updateJobTime(epochEnd) {
            let disp = 'Job Complete';
            let now = new Date().getTime() / 1000;
            let secsLeft = (epochEnd > now) ? (epochEnd - now) : 0;
            if (secsLeft > 0) {
                disp = "Job: " + secsToClock(secsLeft);
                $("#myProgMessage").removeClass('blink182');
            } else {
                alertJobComplete();
                //$("#myProgMessage").addClass('blink182');
            }
            $("#myProgMessage").text(disp);
        }
    }

    function installJobObserver(target) {
        const jobObserver = new MutationObserver(function(mutationsList, observer) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes[0]) {
                    let disp = (mutation.addedNodes[0].nodeValue.indexOf('Job') < 0) ?
                        ("Job: " + mutation.addedNodes[0].nodeValue) :
                        mutation.addedNodes[0].nodeValue;
                    $("#myProgMessage").text(disp);
                    if (disp.indexOf('omplete') > -1) {
                        alertJobComplete();
                    }
                }
            }
        });
        const config = { childList: true, subtree: true };
        jobObserver.observe($(target)[0], config);
    }

    var activeCtxMenuSel;
    function filterContextClick(event) {
        debug("[addJoblink] click filter, e: ", event);
        debug("[addJoblink] data: ", event.data);
        if (event.data) {
            activeCtxMenuSel = event.data.cmSel;
        }
    }

    function addJobLink(target, node, retries=0) {
        $(target).after(node);
        debug("[addJoblink] target: ", $(target));

        $("#myProgMessage").off('click');
        $("#myProgMessage").on('click', handleJobClick);
        addJobHelp($(node));

        GM_addStyle(`
            .jobCtxItem {
                background-color: var(--bs-body-bg);
            }
            .jobCtxItem:first-child {
                border-radius: 6px 6px 0px 0px;
            }
            .jobCtxItem:last-child {
                border-radius: 0px 0px 6px 6px;
            }
            #job-ctx {
                border-radius: 6px;
            }
        `);

        let liArr = [
            `<li class="jobCtxItem" id="job-time">Time Left</li>`,
            `<li class="jobCtxItem" id="job-time">Percent Left</li>`,
            `<li class="jobCtxItem" id="job-time">Progress Bar</li>`
        ];
        let opts = {filter: filterContextClick, itemList: liArr};
        installContextMenu($("#myProgMessage"), "job-ctx", opts);
    }

    function hookJobStart(retries=0) {
        let node = $(`<p class="card-text fw-bold text-success" id="myProgMessage" data-bs-finishtime="0"></p>`);
        //let ul = $("ul.playerstatusIcons");

        let prog = $("#progressMessage");
        $("#progressMessage").off('click');
        $("#progressMessage").on('click', handleJobClick);
        if ($("#cancelButton").length && $(prog).length && !$("#myProgMessage").length) {
            let endTime = $(prog).attr('data-bs-finishtime');
            $(node).attr("data-bs-finishtime", endTime);
            $(node).text($(prog).text());
            GM_setValue("activeJobEnd", endTime);

            $(node).on('click', handleJobClick);
            //$(prog).on('click', handleJobClick);
            $(prog).css("cursor", "pointer");
            installJobObserver(prog);
            //addJobHelp($(node));
            if ($(node).text().indexOf('omplete') > -1) {
                alertJobComplete();
            }
            addJobLink($("#topNavBtnWrap .col-cd-caret"), $(node));
            return;
        }

        $(node).addClass('blink182');
        $(node).text("Job complete");
        addJobLink($("#topNavBtnWrap .col-cd-caret"), $(node));
    }

    //
    // ======================== Same for expeditions ========================
    //
    function hookExpeditionStart() {
        debug("[hookExpeditionStart]");
        // Look for existing timers
        findTimers();
        hookExpBtns();

        $(".expeditionTeamSelector").on('change', function() {
            setTimeout(hookExpBtns, 100);
        });

        function hookExpBtns() {
            //let buttons = $("input.btn[type='submit'][value='Start']:not('.disabled')");
            let buttons = $("input.btn[type='submit'][value='Start']");
            debug("hookExpBtns: ", $(buttons));
            for (let idx=0; idx<$(buttons).length; idx++) {
                let btn = $(buttons)[idx];
                if ($(btn).hasClass('hooked')) continue;
                $(btn).addClass('hooked')
                $(btn).on('click', handleExpBtnClick);
            }
        }

        function findTimers() {
            let timers = $(".remainingTime").filter(function() {return !$(this).closest('div').hasClass('d-none');});
            debug("[findTimers] timers: ", $(timers));
            if ($(timers).length) {
                for (let idx=0; idx<$(timers).length; idx++) {
                    let timer = $(timers)[idx];
                    if ($(timer).hasClass('hooked')) continue;
                    let time = $(timer).text();
                    debug("Remains: ", time, " completion: ", $(timer).attr('completion'), " timer: ", $(timer));
                    addExpTimer(timer); //$(timer).attr('completion'));
                }
            }
        }

        function handleExpBtnClick(e, data={retries: 0}) {
            debug("Exp btn clicked! data: ", data, " this: ", $(this), " exp: ", $(this).closest(".expeditionButton"));
            //setTimeout(findTimers, 100);
            let root;
            if (!data.node) {
                let exp = $(this).closest(".expeditionButton");
                root = $(exp).find(".remainingTime");
            } else {
                root = $(data.node);
            }
            if (!$(root).length) {
                if (data.retries++ < 50) return setTimeout(handleExpBtnClick, 100, e, {retries: data.retries});
                return log("[handleExpBtnClick] timed out");
            }

            let time = $(root).attr('completion');
            let fin = $(root).attr('data-bs-finishtime')
            debug("Completion: ", time, " fin: ", fin, " root: ", $(root));
            if (time)
                addExpTimer(root);
            else {
                if (data.retries++ < 50) return setTimeout(handleExpBtnClick, 100, e, {retries: data.retries, node: $(root)});
                return log("[handleExpBtnClick] timed out");
            }
        }
    }

    function alertExpComplete(node) {
        debug("[alertExpComplete]: ", options.notifyExpComplete.on, $(node));
        //if (!$(node).hasClass('blink182'))
        $(node).addClass('blink182 expired');
        //$(node).addClass('expired');
        if (options.notifyExpComplete.on == true) {
            expAlerter.sendAlert()
            //browserAlert("Expedition complete!");
        }
    }

    function updateExpTimers(epochEnd) {
        let active = $("p[id^='myExpProgMessage']");
        let minTimer;
        let p;
        for (let idx=0; idx<$(active).length; idx++) {
            p = $(active)[idx];
            $(p).removeClass('active');
            let epochEnd = $(p).attr('data-bs-finishtime');
            if (parseInt(epochEnd) == 0) continue;
            let now = new Date().getTime() / 1000;
            let secsLeft = (epochEnd > now) ? (epochEnd - now) : 0;
            if ($(p).hasClass('expired')) {
                if (secsLeft > 0) $(p).removeClass('expired');
                else continue;
            }
            if (secsLeft <= 0 && secsLeft > -15) {
                debug("Exp complete for ", $(p));
                debug("now: ", now, " epoch: ", epochEnd, " dif: ", secsLeft);
                $(p).text("Exp. Complete");
                let id = $(p).attr("id");
                $(p).addClass('expired');
                //$(p).css("color", "red !important");
                //$(p).addClass('blink182');
                if (alertExpComplete(p) == true)
                    $(p).attr('data-bs-finishtime', 0);

                return; // setTimeout(delExp, 10000, id);
            }
            $(p).removeClass('blink182');
            if (!minTimer || secsLeft < minTimer)
                minTimer = secsLeft;
        }

        if (minTimer && p) {
            let disp = "Exp: " + secsToClock(minTimer);
            $(p).text(disp);
            $(p).addClass('active').removeClass('xhide');
            $("p[id^='myExpProgMessage']").removeClass('blink182');
        }
        $("p[id^='myExpProgMessage']:not('.active')").addClass('xhide');
        addExpHelp($(p));

        function delExp(id) {
            debug("Remove node with id: ", id);
            $(`#${id}`).remove();
        }
    }

    function handleExpClick(e) {
        debug("[handleExpClick]");
        if (isExpeditionsPage())
            location.reload();
        else
            window.location.href = 'https://cartelempire.online/Expedition';
    }

    var expInt;

    function addExpHelp(node) {
        let txt = isExpeditionsPage() ? 'Click to refresh page' : 'Click to go to Expeditions';
        displayHtmlToolTip(node, txt);
        debug("[expeditions] added help to ", $(node));
    }

    // Save completion in array, for slots 1 to 3.
    // On update, get min of the 3, if expired, null out.
    log("expTimers: ", expTimers);
    function addExpTimer(timer) {
        let time = $(timer).attr('completion');
        let fin = $(timer).attr('data-bs-finishtime')
        let root = $(timer).closest(".card.equipmentModule").parent();
        let index = $(root).index();

        let d = secsToClock(time);
        let h = d ? d.split(':')[0] : 0;
        if (h && +h > 24) {
            d = secsToClock(time / 1000);
        }
        if ($("#myExpProgMessage").filter(function(){return $(this).attr("data-bs-finishtime") == time;}).length > 0) {
            $(`#myExpProgMessage[data-bs-finishtime="${time}"]`).text(("Exp: " + secsToClock(time)));
            return log("Timer for ", time, " already added: ", $(`#myExpProgMessage[data-bs-finishtime="${time}"]`));
        }
        let nodeId = `myExpProgMessage-${time}`;
        let node = `<p class="card-text fw-bold text-success xhide" id="${nodeId}" data-bs-finishtime="${time}">Exp: ${secsToClock(time)}</p>`;
        $("#topNavBtnWrap").append(node);
        addExpHelp(node);

        $(`#${nodeId}`).on('click', handleExpClick);
        expTimers[parseInt(index)] = nodeId;
        GM_setValue('expTimers', JSON.stringify(expTimers));
        if (!expInt) expInt = setInterval(updateExpTimers, 1000);
    }

    // Just used saved end date!
    function addExpeditionTimers() {
        debug("[addExpeditionTimers] ", expTimers);
        expTimers.forEach((id, index) => {
            if (id) {
                let time = id.split('-')[1], now = new Date().getTime() / 1000;
                let msg = `Exp: ${secsToClock(time)}`, complete = false;
                if (time - now <= 0) {
                    complete = true;
                    msg = "Exp. Complete";
                }

                let secsDiff = (+time - now), d = secsToClock(time);
                let nodeId = `myExpProgMessage-${time}`;
                if (complete == true) time = 0;
                let node = `<p class="card-text fw-bold text-success xhide" id="${nodeId}" data-bs-finishtime="${time}">${msg}</p>`;
                $("#topNavBtnWrap").append(node);
                addExpHelp(node)

                expTimers[parseInt(index)] = nodeId;
                GM_setValue('expTimers', JSON.stringify(expTimers));

                $(`#${nodeId}`).on('click', handleExpClick);
                if (!expInt) expInt = setInterval(updateExpTimers, 1000);
            }
        });
    }

    // =================================== Expedition Success Chances ====================================
    function trackExpeditionSuccessRates() {
        // Alternatively, add another class to all .px-2 nodes...
        //$(".px-2").addClass('hidden-exp');

        // When the expedition tab is clicked, call again - in case teams have been changed
        $("#v-tab-expeditions").off("click.xedx");
        $("#v-tab-expeditions").on("click.xedx", trackExpeditionSuccessRates);

        let teamStats = [ [], [], [], [], [] ];
		for(let team_i = 1; team_i <= 5; ++team_i) {
			const stats = document.querySelectorAll(`#v-content-team${team_i} > .justify-content-center span:not(.fw-bold)`);
			if(stats.length !== 4) return;
			for(let statText of stats) {
				teamStats[team_i - 1].push(parseInt(statText.innerText.replaceAll(',', "")));
			}
		}

        const expeds = $(".expeditionButton");
		for(let exped of expeds) {
			if (exped.children.length < 5) continue;
			let chances = [ 1, 1, 1, 1, 1 ];
			for(let i = 1; i < 4; ++i) {
				const stat = parseInt(exped.children[i].children[1].innerText.replaceAll(',', ""));
				for(let team_i = 0; team_i < 5; ++team_i) {
					chances[team_i] = Math.min(chances[team_i], teamStats[team_i][i - 1] / stat);
				}
			}
			let options = exped.querySelectorAll("select.expeditionTeamSelector option");
			for(let opt of options) {
				const team_i = parseInt(opt.value);
				if(team_i === 0) continue;
				opt.innerText = `Team ${team_i} - ${Math.floor(chances[team_i - 1] * 100)}%`;
			}
		}
    }

    //
    // ====================== Start a clock, stolen from chat.js... ======================
    //
    class CEClock {
        // Hid time zone 11/6 when forum link added to nav panel
        static myClock =
        `<div id='myClock' class="text-center text-white"><span class="currentTime" epoch=""></span>` +
        `<span style="display: none;"> LPT</span></div>`;

        constructor(options) {
            this.addStyles();
            this.startClock();
        }

        startClock(retries=0) {
            if (!$(`#desktopMenu`).length) {
                if (retries++ < 50) return setTimeout(this.startClock, 100, retries);
                return log("[startClock] timed out.");
            }
            if (!$("#myClock").length) {
                $(`#desktopMenu`).parent().css('position', 'relative');
                $(`#desktopMenu`).before(CEClock.myClock);
            }

            let now = new Date().getTime();
            let clock = $('.currentTime');
            clock.attr('epoch', now);
            clock.text(new Date(now).toLocaleTimeString('en-GB', {timeZone: 'UTC'}));
        }

        remove() { $("#myClock").remove(); }

        addStyles() {
            GM_addStyle(`
                #myClock {
                    position: absolute;
                    left: 0;
                    display: flex;
                    top: 30%;
                    margin-left: 20px;
                }
                #myClock > .currentTime {
                    margin-right: 10px;
                }
            `);
        }
    }

    // ========================= Lock the nav bar and status bar ===========================
    //
    // Move the status bar to after the nav bar, so neither scrolls with the page content.
    //
    class StatusBarLock {
        constructor() {
            this.lockState = GM_getValue("navBarLockState", "locked");
            this.installStatusBarLock();
        }

        addLockUnlockBtn() {
            this.addLockStyles();
            const topNavBtnWrap = `<div id="topNavBtnWrap"></div>`;
            const lockedSvg = `
                <svg id='xlocked' id2="Layer_1" data-state="locked" class="x-lock-svg" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 93.63 122.88">
                    <defs><style>.cls-4{fill:#fbd734;}.cls-4,.cls-5{fill-rule:evenodd;}.cls-5{fill:#36464e;}</style></defs>
                    <!-- title>padlock</title -->
                    <path class="cls-4" d="M6,47.51H87.64a6,6,0,0,1,6,6v63.38a6,6,0,0,1-6,6H6a6,6,0,0,1-6-6V53.5a6,6,0,0,1,6-6Z"/>
                    <path class="cls-5" d="M41.89,89.26l-6.47,16.95H58.21L52.21,89a11.79,11.79,0,1,0-10.32.24Z"/>
                    <path class="cls-5" d="M83.57,47.51H72.22V38.09a27.32,27.32,0,0,0-7.54-19,24.4,24.4,0,0,0-35.73,0,27.32,27.32,0,0,0-7.54,19v9.42H10.06V38.09A38.73,38.73,0,0,1,20.78,11.28a35.69,35.69,0,0,1,52.07,0A38.67,38.67,0,0,1,83.57,38.09v9.42Z"/>
                </svg>`;
            const unlockedSvg = `
                <svg id='xunlocked' id2="Layer_1" data-state="unlocked" class="x-lock-svg" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 86.5 122.88">
                    <defs><style>.cls-1{fill:#ffff66;}.cls-1,.cls-2{fill-rule:evenodd;}.cls-2{fill:#36464e;}</style></defs>
                    <!-- title>unlocked</title -->
                    <path class="cls-1" d="M5.54,53.25H81a5.57,5.57,0,0,1,5.54,5.54v58.55A5.56,5.56,0,0,1,81,122.88H5.54A5.55,5.55,0,0,1,0,117.34V58.79a5.56,5.56,0,0,1,5.54-5.54Z"/>
                    <path class="cls-2" d="M38.7,91.82l-6,15.66H53.77L48.23,91.6a10.9,10.9,0,1,0-9.53.22Z"/>
                    <path class="cls-2" d="M66.69,34.16a25.17,25.17,0,0,0-6.94-16.49,22.56,22.56,0,0,0-33,0,25.22,25.22,0,0,0-7,17.52V53.25H9.29V35.19A35.76,35.76,0,0,1,19.2,10.42a33,33,0,0,1,48.09,0,35.69,35.69,0,0,1,9.9,23.74Z"/>
                </svg>`;

            let useSvg = (this.lockState == 'unlocked') ? unlockedSvg : lockedSvg;
            let lockedWrap = `<div id='topNav-lock' class="xlock-wrapper">${useSvg}</div>`;

            let ul = $("ul.playerstatusIcons");
            $(ul).before(topNavBtnWrap);
            $("#topNavBtnWrap").append(lockedWrap);
            $(ul).css("position", "absolute");

            if (this.lockState == 'unlocked') {
                $("body > div.topNav").toggleClass("sticky-top");
            }

            $("#topNav-lock").on("click", function(e) {
                $("body > div.topNav").toggleClass("sticky-top");
                if ($("#xlocked").length > 0) {
                    $("#xlocked").replaceWith(unlockedSvg);
                    GM_setValue("navBarLockState", "unlocked");
                } else if ($("#xunlocked").length > 0) {
                    $("#xunlocked").replaceWith(lockedSvg);
                    GM_setValue("navBarLockState", "locked");
                }
            });
        }

        installStatusBarLock(retries=0) {
            this.navBar = $("body > div.topNav.sticky-top > .navbar");
            if (!$(this.navBar).length) {
                if (retries++ < 50) return setTimeout(this.installStatusBarLock, 100, retries);
                return log("[installStatusBarLock] timed out.");
            }
            this.moveCol12(this.navBar);
            this.addLockUnlockBtn();
        }

        moveCol12(navBar, retries=0) {
            let statusBar = $("#contentContainer > div > div.col-12")[0];
            if (!$(statusBar).length) {
                if (retries++ < 50) return setTimeout(moveCol12, 100, navBar, retries);
                return log("[moveCol12] timed out.");
            }

            $(navBar).wrap(`<div id='nav-wrap'></div>`);
            $(statusBar).addClass('fixed-status');
            $(navBar).after($(statusBar));
        }

        addLockStyles() {
            GM_addStyle(`
                #topNavBtnWrap {
                    display: flex;
                    position: relative;
                    z-index: 9;
                }
                .xlock-wrapper {
                    align-items: center;
                    border-left: 1px solid #fff;
                    border-left: 1px solid var(--item-row-color-border-light);
                    border-right: 1px solid #ccc;
                    border-right: 1px solid var(--item-row-color-border-dark);
                    box-sizing: border-box;
                    display: flex;
                    justify-content: center;
                    position: relative;
                    width: 14px;
                    margin-bottom: 16px;
                    cursor: pointer;
                    margin-left: 5px;
                }
                .x-lock-svg {
                    width: 20px;
                }
            `);
        }

    }

    // ======================== On the Bounties page, add hosp time left ===========================
    function processBountiesPage() {
        GM_addStyle(`.bstatus {padding-left: 10px;}`);
        debug("[processBountiesPage]");

        var bountyTargets = {};
        var bountryEntries = [];
        //let namesArr = [];
        let targets = $("table tr td:first-child > a");
        for (let idx=0; idx<$(targets).length; idx++) {
            let target = $(targets)[idx];
            let name = $(target).text();
            if (name) name = name.replaceAll('.', '');
            let href = $(target).attr("href");
            let id = idFromHref(href);

            if (options.bountyPageNoAttackMug.on == true) {
                href = href + "?referrer=bounties";
                $(target).attr("href", href);
            }

            if (options.bountyPageHospStatus.on == false) continue;

            // When we get status later, we can color the name, so add
            // an ID to find it easier...
            let nodeId = `${name}-${idx}`;
            $(target).attr("id", nodeId);

            if (!bountyTargets[name]) {
                bountyTargets[name] = {"id": id, "status": ''};
                let el = $(caretBtn);
                $(el).addClass('bcaret');
                $(el).attr('data-name', name);
                $(el).find('i').toggleClass('fa-caret-down fa-caret-right');
                let node = $(target).closest('tr');
                $(node).css("position", "relative");
                $(node).append(el);
                $(node).find(".fa").on('click', handleCaret);
                let newRow = `<tr id="bty-${name}" class='bounty-row' style="display: none;">
                                  <td><span class='bstatus'></span></td>
                                  <td><span class='buserType'></span></td>
                                  <td><span class='baction'></span></td>
                                  <td><span class='bage'></span></td>
                                  <td colspan="5"><span class='blife'></span></td>
                              </tr>`;
                $(node).after(newRow);
            }
        }

        if (options.bountyPageHospStatus.on == false) return;

        debug("[processBountiesPage] bounty targets: ", bountyTargets);

        let keys = Object.keys(bountyTargets);
        for (let idx=0; idx<keys.length; idx++) {
            let name = keys[idx];
            let id = bountyTargets[name].id;
            debug("[processBountiesPage] find status for: ", name, id);
            if (id) ce_getUserStats(id, 'advanced', processBountyEnemyResult);
        }

        setInterval(function() {
            bountryEntries.forEach( entry => { updateBountyEntry(entry); });
        }, 2000);

        // ---------------------------------------------------------------
        function handleCaret(e, node) {
            let name = $(this).parent().attr('data-name');
            debug("[processBountiesPage][handleCaret] ", $(node), $(this), name);
            //if (!$(node).length) node = this;
            let entry = bountyTargets[name];
            debug("[processBountiesPage][handleCaret] bountyTargets: ", bountyTargets);
            debug("[processBountiesPage][handleCaret] entry: ", entry, " new row: ", $(`#bty-${name}`));

            // let target = $(node).closest('.row').next();
            $(`#bty-${name}`).slideToggle("slow");
            $(this).toggleClass('fa-caret-down fa-caret-right');
            let state = $(this).hasClass('fa-caret-down') ? 'fa-caret-down' : 'fa-caret-right';

        }

        function updateBountyEntry(entry) {
            debug("[processBountiesPage] updateBountiesEntry: ", entry);
            let row = $(`#bty-${entry.name}`);
            let cell = $(`#bty-${entry.name} > td`);

            let now = new Date().getTime() / 1000;
            let secsAgo = now - entry.lastAction;
            let hospSecsToGo = (entry.inHosp == true) ? (entry.hospitalRelease - now) : 0;
            let hospToGo = secsToClock(hospSecsToGo);
            let hospTxt = (entry.inHosp == true) ? (` | ${hospToGo} left`) : '';

            if (entry.inHosp == true)
                $(`a[id^='${entry.name}-']`).css("color", "red");
            else
                $(`a[id^='${entry.name}-']`).css("color", "var(--bs-card-color)");

            $(`#bty-${entry.name} > td span.bstatus`).text(`Status: ${entry.status}${hospTxt}`);
            $(`#bty-${entry.name} > td span.buserType`).text(`User Type: ${entry.userType}`);
            $(`#bty-${entry.name} > td span.bage`).text(`Age: ${entry.age}`);
            $(`#bty-${entry.name} > td span.baction`).text(`Last Action: ${secsToClock(secsAgo)} ago.`);
            $(`#bty-${entry.name} > td span.blife`).text(`${entry.currentLife} / ${entry.maxLife} life`);

            if (hospSecsToGo <= 2) {
                entry.inHosp = false;
                entry.hospitalRelease = 0;
            }
        }

        function processBountyEnemyResult(response, status, xhr, id) {
            let data = JSON.parse(response);
            if (!data) return log("Error: no data in response");

            let bountyEntry = {};
            debug("[processBountiesPage] API res: ", data);
            let name = data.name;
            if (name) name = name.replaceAll('.', '');
            bountyEntry["name"] = name;
            let lastAction = data.lastActive;
            bountyEntry["lastAction"] = data.lastActive;

            let inHosp = data.status.indexOf('ospital') > -1;
            bountyEntry["inHosp"] = inHosp
            bountyEntry["hospitalRelease"] = inHosp ? data.hospitalRelease : 0;
            bountyEntry["status"] = data.status;
            bountyEntry["currentLife"] = data.currentLife;
            bountyEntry["maxLife"] = data.maxLife;
            bountyEntry["userType"] = data.userType;
            bountyEntry["age"] = data.age;

            bountryEntries.push(bountyEntry);
            updateBountyEntry(bountyEntry);
        }
    }

    // Make this a style!! Add BEFORE page loaded...
    //
    // On a profile page, if directed here from the bounties page, hide the attack and mug burrons
    function handleBountiesHospOnly() {
        let btns = $(".attackBtn");
        $($(btns)[0]).addClass("disabled");
        $($(btns)[1]).addClass("disabled");
        debug("[bountyPageNoAttackMug][handleBountiesHospOnly] btns: ", $(btns));
    }

    // ====================== Add sorting to Cartel page, Users table (TBD)  =======================

    function processCartelPage() {

        if (options.sortableCartelPage.on == true) {

        }
    }

    // ===================================== Favorites menu =========================================

    var faveDefs = {};
    function installFavoritesMenu() {
        const savedFavesKey = "savedFavorites";
        adddropdownStyles();
        let progBarWidth = $("#nav-wrap > div > div.row > div:nth-child(5) > a > div > div.col > div").width();
        const addRemoveLis = `<li id="addpage">Add page</li><li id="rempage">Remove page</li>`;
        let favesMenu = `
            <div id="favesMenu" class="custom-dropdown" style="width: ${progBarWidth}px;">
                <div id="fave-hdr" class="dropdown-header bg-white progress-bar-title">Favorites
                    <span class="fav-caret"><i class="fa fa-caret-down"></i></span>
                </div>
                <ul class="dropdown-options">
                    <div id="inner-list" style="display: flex; flex-direction: column;">

                    </div>
                    <li id="addpage" class="favFooter">Add This Page</li>
                    <li id="rempage" class="favFooter">Remove This Page</li>
                    <li id="favedit" class="favFooter">Edit List</li>
                </ul>
            </div>`;
        ;

        $("ul.playerstatusIcons").after(favesMenu);
        loadFavorites();

        const paramsString = window.location.search;
        const searchParams = paramsString ? new URLSearchParams(paramsString) : null;
        if (searchParams) {
            let refId = searchParams.get('ref');
            let entry = faveDefs[refId];
            let desc = entry ? entry.desc : null;
            if (desc) $("#fave-hdr").text(desc);
        }

        // Add event handlers
        $('#addpage').on('click', handleAddPage);
        $('#rempage').on('click', handleRemovePage);
        $('#favedit').on('click', handleEditFaves);

        $('.dropdown-header').on('click', function() {
            $(this).next('.dropdown-options').slideToggle();
        });
        $('.dropdown-options li.faveLink').on('click', handleFavoriteClick);

        // Close dropdown if clicked outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.custom-dropdown').length) {
                $('.dropdown-options').slideUp();
            }
        });

        // ================= Local functions =================

        function doToggle() {
            $("#favesMenu ul.dropdown-options").slideToggle();
        }

        function liStartFromEntry(entry) {
            return `<li id="${entry.id}" class="faveLink" data-idx=${entry.idx} draggable="true" contenteditable="true" data-title="${entry.title}" ` +
                `data-value="${entry.url}">`;
        }

        function favesEntryToHtml(entry) {
            let html = liStartFromEntry(entry) + `${entry.desc}</li>`;
            return html;
        }

        function logLiIdx(lis) {
            let idxArray = $(lis).map(function() {
                return $(this).attr('data-idx');
            }).get();
            let nameArray = $(lis).map(function() {
                return $(this).attr('data-title');
            }).get();
            debug("[faves][logfave] li indexes: ", idxArray, "\nnames: ", nameArray);
        }

        function logEntryIdx(list) {
            let idxArray = [];
            let nameArray = [];
            $.each(list, function(key, value) {
                idxArray.push(value.idx);
                nameArray.push(value.title);
            });
            debug("[faves][logfave] entry indexes: ", idxArray, "\nnames: ", nameArray);
        }

        function saveFavorites() {
            debug("[faveSelect][saveFavorites] faveDefs: ", faveDefs);
            logEntryIdx($(faveDefs)[0]);
            GM_setValue(savedFavesKey, JSON.stringify(faveDefs));
        }

        function loadFavorites() {
            faveDefs = JSON.parse(GM_getValue(savedFavesKey, JSON.stringify({})));
            $("#favesMenu ul.dropdown-options #inner-list").empty();
            $(".dropdown-options li.faveLink").remove();
            let keys = Object.keys(faveDefs);

            let tmpArr = [];
            for (let idx=0; idx<keys.length; idx++) {
                let id = keys[idx];
                let entry = faveDefs[id];
                entry.order = 0; //entry.idx;
                faveDefs[id] = entry;
                tmpArr.push({ "id": entry.id, "idx": entry.idx });
            }

            tmpArr.sort((a, b) => a.idx - b.idx);
            tmpArr.forEach(item => {
                let nodeHtml = favesEntryToHtml(faveDefs[item.id]);
                $("#favesMenu ul.dropdown-options #inner-list").append(nodeHtml);
            });

            debug("[faveSelect][loadFavorites] list: ", $("#favesMenu ul.dropdown-options #inner-list li"));
            $("#favesMenu ul.dropdown-options #inner-list li").on('click', handleFavoriteClick);
        }

        function getPageTitleSmall() {
            let pgTitle = $($("title")[0]).text();
            if (pgTitle)
                pgTitle = pgTitle.replace("| Cartel Empire", '').trim();

            const urlParams = new URLSearchParams(window.location.search);
            let selected = urlParams ? urlParams.get("p") : null;
            if (!selected) selected = urlParams ? urlParams.get("t") : null;
            if (selected) pgTitle = pgTitle + ' - ' + selected;
            return pgTitle;
        }

        function getHeaderText(li) {
            let txt = "Favorites";
            if ($(li).attr('id') == "rempage") return txt;
            if ($(li).attr('id') == "addpage") return getPageTitleSmall();
            let nodeTxt = $(li).attr('data-title');
            if (nodeTxt) return nodeTxt;
        }

        function getRelURL() {
            return (window.location.pathname +
                    window.location.search +
                    window.location.hash);
        }

        function addReferrerToPath(path, entry) {
            debug("[faveSelect][]addReferrerToPath] path: ", path);
            if (!path) {
                console.error("Bad Path! entry: ", entry);
                return;
            }
            let fullPath = window.location.origin + path;
            const currentUrl = new URL(fullPath);
            const params = currentUrl.searchParams;
            if (params) params.append('ref', entry.id);

            const newPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
            debug("[faveSelect][]addReferrerToPath] fullPath: ", fullPath, "\nnewPath: ", newPath);

            return newPath;
        }

        function handleFavoriteClick(e) {
            e.stopPropagation();
            //e.preventDefault();
            let selectedValue = $(this).attr('data-value');
            let id = $(this).attr("id");
            let entry = faveDefs[id];
            let url = entry.url;
            if (!url) url = $(this).attr("data-value");
            let selectedText = getHeaderText($(this));
            $('.dropdown-header').text(entry.desc);
            $('.dropdown-options').slideUp(); // Hide options

            let newPath = addReferrerToPath(url, entry)
            window.location.href = newPath;
        }

        function handleAddPage() {
            let smTitle = getPageTitleSmall();
            //let tmp = $(`.faveLink[data-title="${smTitle}"]`);
            let url = getRelURL();

            debug("[faveSelect][handleAddPage] getting hash for ", url);
            hashUrlToId(url).then(hashedId => {
                debug("[faveSelect][handleAddPage]: got hash: ", hashedId, smTitle);
                let test = faveDefs[hashedId];
                if (test) {
                    debug("[faveSelect][handleAddPage] hash collision, already exists? \n", faveDefs, "\hhashed: ", hashedId);
                    return doToggle();
                }
                //if ($(tmp).length > 0) return doToggle();

                let entry = {"desc": smTitle, "title": smTitle, "url": getRelURL(), "id": hashedId, "order": 0, "idx": faveDefs.length};
                let newOptHtml = favesEntryToHtml(entry);
                faveDefs[hashedId] = entry;

                $("#inner-list").append(newOptHtml);
                let newOpt = $("#inner-list > li:last-child");
                $('.dropdown-header').text(getPageTitleSmall());
                $(newOpt).on('click', handleFavoriteClick);
                entry.idx = $(newOpt).index();
                debug("[faveSelect][handleAddPage] added page: ", $(newOpt), "\nPath: ", getRelURL());
                doToggle();
                saveFavorites();
                loadFavorites();
            });

        }

        function handleRemovePage() {
            debug("[faveSelect][handleRemovePage]");
            let relUrl = getRelURL();
            let opt = $('#favesMenu ul').find(`li[data-value='${relUrl}']`);
            if (!$(opt).length)
                opt = $('#favesMenu ul').find(`li[data-value*='${window.location.pathname}']`);
            let id = $(opt).attr("id");
            let entry = faveDefs[id];
            delete faveDefs[id];
            $(opt).remove();
            debug("[faveSelect] removed page: ", id, entry);

            saveFavorites();
        }

        function handleEditRemoveEntry(e) {
            e.stopPropagation();
            let li = $(this).closest("li");
            let id = $(li).attr("id");
            let url = $(li).attr("data-value");
            let opt = $('#favesMenu ul').find(`li[data-value='${url}']`);

            let entry = faveDefs[id];

            debug("[handleEditRemoveEntry] li: ", $(li), " id: ", id, " url: ", url, " opt: ", opt, " entry: ", entry);

            delete faveDefs[id];
            $(opt).remove();
            $(li).remove();
            saveFavorites();
        }

        function makeEditLiFromEntry(entry) {
            let li = //`<li style="order: ${entry.order};">` +
                 liStartFromEntry(entry) +
                     `<span class="fav-edit-span" data-id="${entry.id}" contenteditable="true">${entry.desc}</span>` +
                     `<span style="width:10px;"></span><span class="fes2">X</span>` +
                 `</li>`;
            return li;
        }

        function saveFavesHelp() {
            let helpDiv = `
                <div id="FavesHelp" class="xopts-ctr-screen xopts-def-size xopts-bg xopt-border-ml6">
                    <div class='inner'>
                        <p>
                            To remove an entry, click the 'X' to the right of the entry<br><br>
                            To edit the text, simply click on it and start typing<br><br>
                            You can drag the entries to re-order them<br><br>
                            When finished, select 'Close' and your changes will be saved
                        </p>
                    </div>
                    <div class="footer">
                        <button id="help-fav-close" class="btn btn-success btn-dark">Close</button>
                    </div>
                </div>
            `;

            $("#FavesEdit").replaceWith(helpDiv);

            $("#help-fav-close").on("click", function(e) {
                $("#FavesHelp").remove();
                $("#FavesEdit").remove();
                debug("[favesHelp][help-fav-close]  \nhelp: ", $("#FavesHelp"), "\nedit: ", $("#FavesEdit"));
                handleEditFaves();
            });
        }

        function saveFavesEdits() {
            debug("[saveFavesEdits] faves: ", faveDefs);
            let nodes = $("#FavesEdit > div.inner > ul > li > span");
            for (let idx=0; idx< $(nodes).length; idx++) {
                let node = $(nodes)[idx];
                let desc = $(node).text();
                let id = $(node).attr("data-id");
                let entry = faveDefs[id];
                entry.desc = desc;
                faveDefs[id] = entry;
                debug("[saveFavesEdits] new entry: ", entry);
            }
            saveFavorites();
            loadFavorites();
            debug("[saveFavesEdits] done: ", faveDefs);
        }

        function handleEditFaves(e) {
            debug("[handleEditFaves]");
            let editDiv = `
                <div id="FavesEdit" class="xopts-ctr-screen xopts-def-size xopts-bg xopt-border-ml6">
                    <div class='inner'>
                        <ul>

                        </ul>
                    </div>
                    <div class="footer">
                        <button id="edit-fav-save" class="btn btn-success btn-dark" type="button">Save</button>
                        <button id="edit-fav-help" class="btn-fav-help btn btn-success btn-dark" type="button">?</button>
                        <button id="edit-fav-close" class="btn btn-success btn-dark">Close</button>
                    </div>
                </div>
            `;

            $('body').append(editDiv);

            let ul = $("#FavesEdit > div.inner > ul");
            let keys = Object.keys(faveDefs);
            let tmpArr = [];
            for (let idx=0; idx<keys.length; idx++) {
                let id = keys[idx];
                let entry = faveDefs[id];
                tmpArr.push({ "id": id, "idx": entry.idx });
            }

            tmpArr.sort((a, b) => a.idx - b.idx);
            tmpArr.forEach(item => {
                let li = makeEditLiFromEntry(faveDefs[item.id]);
                $(ul).append(li);
            });

            $("#edit-fav-close").on('click', function() {$("#FavesEdit").remove();});
            $("#edit-fav-save").on('click', saveFavesEdits);
            $("#edit-fav-help").on('click', saveFavesHelp);

            $(".fes2").on("click", handleEditRemoveEntry);

            // ===== Drag support =====
            let draggedItem = null;
            let draggableList = $("#FavesEdit ul")[0];
            $("#FavesEdit ul").on('dragstart', (e) => {
                if (e.target.tagName === 'LI') {
                    e.target.contentEditable = 'false';
                    draggedItem = e.target;
                    e.originalEvent.dataTransfer.setData('text/plain', e.target.id);
                    debug("[faves-drag] dragstart, id: ", e.target.id, " idx: ", $(e.target).index());
                } else {
                    e.preventDefault();
                }
            });

            $("#FavesEdit ul").on('dragover', (e) => {
                e.preventDefault();
                const target = e.target.closest('li');
                if (target && target !== draggedItem) {
                    const boundingBox = target.getBoundingClientRect();
                    const offset = e.clientY - boundingBox.top;
                    if (offset > boundingBox.height / 2) {
                        draggableList.insertBefore(draggedItem, target.nextSibling);
                    } else {
                        draggableList.insertBefore(draggedItem, target);
                    }
                }
            });

            $("#FavesEdit ul").on('drop', (e) => {
                e.preventDefault();
                const data = e.originalEvent.dataTransfer.getData('text/plain');
                const element = document.getElementById(data);

                let targetElement = e.target;
                while (targetElement && targetElement.tagName !== 'LI') {
                    targetElement = targetElement.parentElement;
                }

                if (targetElement && element) {
                    if (targetElement.id !== element.id) {
                        debug("[faves-drag] drop: ", $(targetElement), $(element));
                        e.target.appendChild(element);
                    } else {
                        element.contentEditable = 'true';
                    }
                }

                debug("[faves-drag] drop, id: ", element.id, " idx: ", $(element).index());

                document.querySelectorAll('li[contenteditable="true"]').forEach(item => {
                    if (item !== element) { // Skip the item we just moved, if it is being re-enabled
                        item.contentEditable = 'true';
                    }
                });
                draggedItem = null; // Clear the dragged item variable
            });

            $("#FavesEdit ul").on('dragend', (e) => {
                // Make all list items editable again after drag ends
                const id = e.target.id;
                debug("[faves-drag] dragend, id: ", id, $(`#${id}`));
                let lis = $("#FavesEdit ul li");

                let editedEntries = {};
                for (let idx=0; idx < $(lis).length; idx++) {
                    let item = $(lis)[idx];
                    let entry = faveDefs[item.id];
                    debug("[faves-drag] change idx from: ", entry.idx, " to: ", idx, " index: ", $(item).index(), entry.title);
                    entry.idx = idx;
                    item.contentEditable = 'true';
                    faveDefs[item.id] = JSON.parse(JSON.stringify(entry));
                    editedEntries[idx] = entry;
                }

                $(".dropdown-options li.faveLink").remove();
                let keys = Object.keys(editedEntries);
                for (let idx=0; idx<keys.length; idx++) {
                    let itemIdx = keys[idx];
                    let entry = editedEntries[itemIdx];
                    let nodeHtml = favesEntryToHtml(entry);
                    $("#favesMenu ul.dropdown-options #inner-list").append(nodeHtml);
                }

                //logEntryIdx($(faveDefs)[0]);
                saveFavorites();
                loadFavorites();
                //logEntryIdx($(faveDefs)[0]);

            });

        }
    }

    // ========================= Stakeouts and hosp time, enemies page ==============================
    //
    // stakeout entry: id: { name: <>, release: <> }
    var activeStakeouts = {};

    // Helper to count down time left in hosp
    function secsTillRelease(release) {
        //let release = $(`#user-${id}`).attr('data-hosp-rel');
        if (release == 0) return 0;
        let now = (new Date().getTime()) / 1000;
        let diff = (release - now);
        return (diff > 0) ? diff : 0;
    }

    function getRepCallback(fightEntry, params) {
        debug("[database][lastRespectOnEnemiesPage] entry: ", fightEntry, params);
        let allEnemyNotes = $("#enemiesTabContent > div.row:not(.row-header) > div:nth-child(4)");
        if (fightEntry && fightEntry.length) {
            let rep = fightEntry[(fightEntry.length - 1)].rep;
            let ff = fightEntry[(fightEntry.length - 1)].ff;
            if (!rep) {
                for (let idx=(fightEntry.length - 1); idx>=0; idx--) {
                    rep = fightEntry[idx].rep;
                    ff = fightEntry[idx].ff;
                    if (rep > 0) break;
                }
            }

            let repFld = $($(allEnemyNotes)[params.idx]).find(".rep-ff");
            $(repFld).text(`${rep},  ${ff}`);
        }
    }

    function addRepOnEnemiesPage() {

        debug("[database][addRepOnEnemiesPage]");
        if (dbReady == false) {
            dbWaitingFns.push(addRepOnEnemiesPage);
            return;
        }

        let allEnemyNames = $("#enemiesTabContent > div.row:not(.row-header) > div:nth-child(1)");
        let allEnemyNotes = $("#enemiesTabContent > div.row:not(.row-header) > div:nth-child(4)");
        let notesHdr = $("#enemiesTabContent > div.row-header > div:last-child");
        $(notesHdr).replaceWith(repHdr);

        let notes = $("form.input-group");
        for (let idx=1; idx<$(notes).length; idx++) {
            let note = $(notes)[idx];
            $(note).css("width", "95%");
            $(note).parent().css("display", "flex");
            $(note).before(repDivSm);
        }

        for (let idx=0; idx<$(allEnemyNames).length; idx++) {
            let href = $($(allEnemyNames)[idx]).find('a').attr('href');
            let key = `fightData.${idFromHref(href)}`;

            // ********
            let params = {idx: idx};
            dbGetItemFromStoreByKey(key, fightResultStoreName, getRepCallback, params);
            //let fightEntry = JSON.parse(GM_getValue(key, JSON.stringify([])));

            /*
            debug("[lastRespectOnEnemiesPage] entry: ", fightEntry);
            if (fightEntry && fightEntry.length) {
                let rep = fightEntry[(fightEntry.length - 1)].rep;
                let ff = fightEntry[(fightEntry.length - 1)].ff;
                if (!rep) {
                    for (let idx=(fightEntry.length - 1); idx>=0; idx--) {
                        rep = fightEntry[idx].rep;
                        ff = fightEntry[idx].ff;
                        if (rep > 0) break;
                    }
                }

                let repFld = $($(allEnemyNotes)[idx]).find(".rep-ff");
                $(repFld).text(`${rep},  ${ff}`);
            }
            */
        }
    }

    function loadStakeouts() {
        activeStakeouts = JSON.parse(GM_getValue("activeStakeouts", JSON.stringify({})));
        debug("[stakeout][loadStakeouts]: ", activeStakeouts);
    }

    function saveStakeouts() {
        GM_setValue("activeStakeouts", JSON.stringify(activeStakeouts));
        debug("[stakeout][saveStakeouts]: ", activeStakeouts);
    }

    function fixupStakeouts() {
        debug("[fixupStakeouts]");
        if (GM_getValue("stakeoutsNeedUpdate", true) == false) return;
        loadStakeouts();
        let keys = Object.keys(activeStakeouts);
        let dirty = false;
        for (let idx=0; idx<keys.length; idx++) {
            let entry = activeStakeouts[keys[idx]];
            debug("[fixupStakeouts] entry: ", entry);
            if (!entry["jailRelease"]) {
                entry["jailRelease"] = 0;
                dirty = true;
            }
            if (entry["release"]) {
                delete entry["release"];
                dirty = true;
            }
        }
        if (dirty == true) {
            debug("[fixupStakeouts] saved stakeouts");
            saveStakeouts();
            GM_setValue("stakeoutsNeedUpdate", false);
        }
    }

    function clearStakeout(id) {
        debug("[clearStakeout] Clearing stakeout: ", id, " *******");
        if (!id) return;
        let timer = $(`#user-${id}`).attr('data-timer');
        if (timer) clearTimeout(timer);
        $(`#user-${id}`).attr('data-timer', 0);
        activeStakeouts[id].hospitalRelease = 0;
        activeStakeouts[id].jailRelease = 0;
        saveStakeouts();
    }

    // Handle having multiple tabs opening due to multiple instances running
    const openedUrls = new Set();
    function removeOpenedUrl(url) {
        debug("[stakeouts] deletinng URL: ", url);
        openedUrls.delete(url);
    }

    var stakeoutChannel;
    function openBroadcastChannel() {
        stakeoutChannel = new BroadcastChannel('unique-tab-opener-channel');
        debug("[stakeout][broadcast] opened channel!");
        stakeoutChannel.onmessage = (event) => {
            debug("[stakeout][broadcast] event: ", event);
            if (event.data.type === 'url_opened') {
                debug("[stakeout][broadcast] Got opened event: ", event.data.type, event.data.url);
                openedUrls.add(event.data.url);
                debug("[stakeout][broadcast] added URL to lst: ", openedUrls);
                // Need to remove from the set eventually if this tab never closes/refreshes
                setTimeout(removeOpenedUrl, 30000, event.data.url);
            }
            if (event.data.type === 'test_event') {
                debug("[stakeout][broadcast] Got test event: ", event);
            }
        };
    }

    function openUniqueTab(url) {
        debug("[stakeout][broadcast][openUniqueTab] url: ", url);
        debug("[stakeout][broadcast][openUniqueTab] openedUrls: ", openedUrls);
        if (!openedUrls.has(url)) {
            openedUrls.add(url);
            let event = { type: 'url_opened', url: url, "path": location.pathname,  "ts": (new Date().getTime())};
            debug("[stakeout][broadcast][openUniqueTab] opening URL and posting: ", event);
            stakeoutChannel.postMessage(event);

            openInNewTab(url);

            let msg = "tab " + location.pathname + " opening new tab for " + url;
            //alert(msg);
            const opts = { mainMsg: msg, timeoutSecs: 30,
                          optBg: "xalertBg"
                         };
            alertWithTimeout(opts);

            // Need to remove from the set eventually if this tab never closes/refreshes
            setTimeout(removeOpenedUrl, 30000, url);
        } else {
            debug("[stakeout][broadcast] URL already opened in another tab: ", url);
        }
    }

    var inStakeoutClick = false;
    function stakeoutClickHandler(context, opts) {
        debug("[stakeout][stakeoutClickHandler] inClick? ", inStakeoutClick,
              " context: ", context, " opts: ", opts, this);
        if (inStakeoutClick == true) return false;
        inStakeoutClick = true;
        setTimeout(function() {inStakeoutClick = false;}, 1000);
        let id = context.tag;
        let entry = activeStakeouts[id]; //opts.data;
        debug("[stakeout][stakeoutClickHandler] id: ", id, " entry: ", entry);
        if (!entry) return debug("[stakeout][stakeoutClickHandler] no entry!");

        // let key = "att-tab-" + entry.id;
        // let opened = GM_getValue(key, false);
        // debug("[stakeoutClickHandler] opened: ", opened, " key: ", key, " entry: ", entry);
        // if (opened == true) return;
        // GM_setValue(key, true);
        // setTimeout(function () {
        //     debug("[stakeoutClickHandler] clearing key: ", key);
        //     GM_setValue(key, false);
        // }, 5000);

        let delay = getRandomIntEx(1, 10) * 100;
        let url = `/user/${entry.id}`;
        let event = { type: 'url_opened', url: url, "path": location.pathname,  "ts": (new Date().getTime())};
        debug("[stakeout][broadcast] posting: ", event);
        stakeoutChannel.postMessage(event);
        debug("[stakeout][broadcast][stakeoutClickHandler] delay: ", delay, " url: ", url);
        setTimeout(openUniqueTab, delay, url);
        //openInNewTab(`/user/${entry.id}`);
    }

    // Send a browser alert once released
    function handleHospRelease(id) {
        let entry = activeStakeouts[id];
        debug("[stakeout][handleHospRelease]: ", id, entry);
        if (!id || !entry || (entry.hospitalRelease == 0 && entry.jailRelease == 0) ||
            (entry.enabled == false)) return debug("[stakeout][handleHospRelease] invalid entry, or already alerted");
        //let id = entry.id;
        let name = entry.name;
        let reason = entry["reason"];
        if (!reason) reason = 'hosp';
        let msg = `${name} [${id}] is out of ${reason}!`;
        // if (!id) debugger;
        // if (entry.enabled == false) return;
        // if (entry.hospitalRelease == 0 && entry.jailRelease == 0) return;
        activeStakeouts[id].hospitalRelease = 0;
        activeStakeouts[id].jailRelease = 0;
        saveStakeouts();
        $(`#user-${id}`).text('Active');
        $(`#user-${id}`).removeClass('hosp-red');
        debug("[stakeout] sending alert: ", msg, id);
        stakeoutAlerter.setOption("data", entry);
        stakeoutAlerter.sendAlert({msg: msg, id: id});

        clearStakeout(id);
    }

    // Noo longer 10 secs, variable
    const tenSecWarningSecs = 30;
    function handleTenSecTimer(entry) {
        debug("[stakeout][handleTenSecTimer]: ", entry, pageIsVisible);
        if (entry.enabled == false) return;
        if (entry.hospitalRelease == 0 && entry.jailRelease == 0) return;

        // Double check time
        ce_getUserStats(entry.id, 'advanced', processEnemyResult);
        logApiCount(("handleTenSecTimer ce_getUserStats " + entry.id));

        if (pageIsVisible == true) {
            let to = 30;
            const reason = entry["reason"] ? entry["reason"] : "hosp";
            let msg = `${entry.name} [${entry.id}] is out of ${reason} in under ${tenSecWarningSecs} seconds!`;
            const opts = { mainMsg: msg,
                          timeoutSecs: to,
                          btnMsg: 'OK',
                          optId: `alert-${entry.id}`,
                          optBg: "xalertBg"
                         };
            alertWithTimeout(opts);
            $(`#alert-${entry.id} .p1`).after($(`<p class="p2">This alert will go away in ${to} seconds.</p>`));
            setTimeout(updateAlert, 1000, entry.id, --to);
            debug(`[stakeout][handleTenSecTimer]: alert node: `, $(`#alert-${entry.id}`), " opts: ", opts);

            function updateAlert(id, timeout) {
                if (timeout <= 0 || !$(`#alert-${id}`).length) return;
                $(`#alert-${id} .p2`).text(`This alert will go away in ${timeout} seconds.`);
                setTimeout(updateAlert, 1000, id, --timeout);
            }
        }
        //debug(`[stakeout][handleTenSecTimer]: alert node:`, $(`#alert-${entry.id}`), " opts: ", opts, " visible:", pageIsVisible);
    }

    function updateStakeoutArrayEntry(entry, id) {
        activeStakeouts[id] = JSON.parse(JSON.stringify(entry));
        saveStakeouts();
    }

    // *****
    function updateStakeoutEntry(entry) {
        debug("[updateStakeoutEntry] entry: ", entry, "\nsecs: ", secsTillRelease(entry.hospitalRelease), secsTillRelease(entry.jailRelease));
        // *****
        updateStatsIfNeeded(entry.id, 'advanced', processEnemyResult, true);

        if (secsTillRelease(entry.hospitalRelease) > 30) {setTimeout(updateStakeoutEntry, 30000, entry);}
        else if (secsTillRelease(entry.jailRelease) > 30) {setTimeout(updateStakeoutEntry, 30000, entry);}
    }

    function updateStatsIfNeeded(id, type, cb, immed, forceSecs) {
        let entry = activeStakeouts[id];
        let now = new Date().getTime() / 1000;
        if (!entry) return debug("[stakeouts][updateStatsIfNeeded] ERROR no entry for id: ", id);

        if (entry.fromCache == true)
            $(`#user-${id}`).addClass('so_cached');

        let diff = Number(now) - Number(entry.lastUpdate);
        debug("[stakeouts][updateStatsIfNeeded] now: ", now, " diff: ", diff, " entry: ", entry,
             (diff < 2 ? " will use cached version" : " needs update"));

        if (diff < 2) {
            if (cb) cb(JSON.stringify(entry), entry.ststus, null, id);
            return debug("[updateStatsIfNeeded] too soon to update: ", diff);
        }

        entry.lastUpdate = now;
        entry.delayed = true;
        updateStakeoutArrayEntry(entry, id);

        if (!$(`#user-${id}`).hasClass('so_cached'))
            $(`#user-${id}`).addClass('so_delayed');

        if (immed) {
            ce_getUserStats(id, type, cb);
        } else if (forceSecs > 0) {
            setTimeout(ce_getUserStats, (forceSecs * 1000), id, type, cb);
        } else {
            let delay = getRandomIntEx(1, 20) * 100;    // 1/10th to 2 secs
            setTimeout(ce_getUserStats, delay, id, type, cb);
        }

        logApiCount(("updateStatsIfNeeded ce_getUserStats " + entry.id));
    }

    var pauseApiCalls = false;
    function startStakeoutsCb(response, status, xhr, id) {
        debug("[startStakeoutsCb] id: ", id, "\nresponse: ",  response);
        if (response.error) {
            const code = response.req ? response.req.status: 'unknown';
            debug("[startStakeoutsCb] ERROR status code: ",
                  code, response.error);
            pauseApiCalls = true;
            debugger;
            return;
        }
        let entry = activeStakeouts[id];
        if (!entry) return debug("[startStakeoutsCb] Error: no entry for id ", id);

        if (entry["fromCache"] == true) {
            debug("[startStakeoutsCb] Cached entry used for ", id, " selector: ", `#user-${id}`, " node: ", $(`#user-${id}`));
            $(`#user-${id}`).addClass('so_cached');
        }

        let data = JSON.parse(response);
        if (!data) return log("Error: no data in response");
        let release = Number(data.hospitalRelease);
        let jailRelease = Number(data.jailRelease);
        let dirty = false;
        if (entry.status != data.status) {
            dirty = true;
            entry["status"] = data.status;
        }
        if (release > 0) {
            $(`#user-${id}`).attr('data-hosp-rel', release);
            entry.hospitalRelease = release;
            dirty = true;
        }
        if (jailRelease > 0) {
            $(`#user-${id}`).attr('data-jail-rel', jailRelease);
            entry["jailRelease"] = jailRelease;
            dirty = true;
        }
        let secsToGo = (release > 0) ? secsTillRelease(release) : 0;
        let jailSecsToGo = (jailRelease > 0) ? secsTillRelease(jailRelease) : 0;

        if (secsToGo || jailSecsToGo) {
            debug("[startStakeoutsCb] STARTING TIMER for id: ", id, " entry: ", entry);
            let useSecs = secsToGo ? secsToGo : jailSecsToGo;

            if (entry.relTimer) clearTimeout(entry.relTimer);
            entry.relTimer = setTimeout(handleHospRelease, useSecs * 1000, id);    // This timer pops when time left gets to 0

            let tenSecs = (useSecs * 1000 - (+tenSecWarningSecs * 1000));     // This is 'n' secs before hitting 0
            if (tenSecs > (+tenSecWarningSecs * 1000)) {
                if (entry.tenSecTimer) clearTimeout(entry.tenSecTimer);
                entry.tenSecTimer = setTimeout(handleTenSecTimer, tenSecs, entry);
            }

            if (useSecs > 30) {    // This timer updates every 30 secs plus or minus
                let rn = getRandomIntEx(-10, +10);
                // *******
                setTimeout(updateStakeoutEntry, (30 + rn) * 1000, entry);
                debug("[startStakeoutsCb][updateStakeoutEntry] Set update timer: ", rn, (30 + rn) * 1000);
            }
            dirty = true;
        }

        if (entry && ((release > 0 && !entry.hospitalRelease) || (jailRelease > 0 && !entry.jailRelease))) {
            entry.hospitalRelease = release;
            entry["jailRelease"] = jailRelease;
            dirty = true;
        }

        if (dirty == true) {
            debug("[startStakeoutsCb] update entry 2, id: ", id, entry, activeStakeouts[id]);
            updateStakeoutArrayEntry(entry, id);
        }

        debug("[stakeout] startStakeoutsCb, exit id: ", id, " release: ", release, " secs: ", secsToGo, " entry: ", entry);
    }

    function startStakeoutsRunning(startIdx=0) {
        const maxAtOnce = 40; const delaySecs = 10;
        loadStakeouts();
        let keys = Object.keys(activeStakeouts);
        let len = $(keys).length;
        let count = 0;
        let idx = startIdx;
        let dirty = false;

        let apiCount = logApiCount("startStakeoutsRunning");
        if (apiCount > 80) {
            debug("[startStakeoutsRunning] delaying: apiCount is ", apiCount);
            return setTimeout(startStakeoutsRunning, delaySecs * 1000, idx);
        }

        for (; idx<len && count < maxAtOnce; idx++, count++) {
            if (pauseApiCalls == true) {
                pauseApiCalls = false;
                debug("[startStakeoutsRunning] delaying (paused in cb), apiCount is ", apiCount);
                return setTimeout(startStakeoutsRunning, delaySecs * 1000, idx);
            }
            let id = keys[idx];
            let entry = activeStakeouts[id];
            if (!entry) {
                debug("[startStakeoutsRunning] ERROR: no entry for id ", id, "\in list: ", activeStakeouts);
                continue;
            }

            entry["fromCache"] = false;
            entry["delayed"] = false;
            debug("[startStakeoutsRunning] id: ", id, " entry: ", entry);
            let needCall = true;

            if (entry.release && !entry.hospitalRelease)
                entry["hospitalRelease"] = entry.release;
            let now = parseInt(new Date().getTime() / 1000);
            debug("[startStakeoutsRunning] now: ", now, " hosp: ", parseInt(entry.hospitalRelease),
                  " jail: ", parseInt(entry.jailRelease),
                  (now < parseInt(entry.hospitalRelease)), (now < parseInt(entry.jailRelease)));

//             if (now > 0 && (now < parseInt(entry.hospitalRelease) || now < parseInt(entry.jailRelease))) {
//                 debug("[startStakeoutsRunning] send entry direct, no API call: ", entry);
//                 entry.fromCache = true;
//                 saveStakeouts();
//                 $(`#user-${id}`).addClass('so_cached');
//                 startStakeoutsCb(JSON.stringify(entry), 'success', null, id);


//                 needCall = false;
//             }

            updateStatsIfNeeded(id, 'advanced', startStakeoutsCb);

            // 'Stagger' the calls...
            // if (needCall == true) {
            //     let delay = getRandomIntEx(1, 20) * 100;
            //     entry.delayed = true;
            //     setTimeout(delayedGetStats, delay, { id: id, type: 'advanced', cb: startStakeoutsCb} );
            // }
        }

        // if (startIdx + count < len - 1)
        //     setTimeout(startStakeoutsRunning, delaySecs * 1000, idx);

        //saveStakeouts();

        // function delayedGetStats(params) {
        //     logApiCount();
        //     ce_getUserStats(params.id, params.type, params.cb);
        // }
    }

    // ======================== On the Enemies page, add hosp time left ===========================
    // This can also add a 'stakeout' feature, a checkbox you can check so that you get an alert when
    // your targets hosp time is about over.
    //

    // Save hosp release time, if any
    function processEnemyResult(response, status, xhr, id) {
        let entry = activeStakeouts[id];
        debug("[stakeout] processEnemyResult: ", response);
        let data = JSON.parse(response);
        if (!data) return log("Error: no data in response");

        entry["fromCache"] = false;
        entry["delayed"] = false;
        $(`#user-${id}`).removeClass('so_delayed');
        $(`#user-${id}`).removeClass('so_cached');

        let dirty = false;
        let release = Number(data.hospitalRelease);
        let inHosp = (release > 0);
        $(`#user-${id}`).attr('data-hosp-rel', release);
        let secsLeft = (release > 0) ? secsTillRelease(release) : 0;
        if (release > 0 && (!entry.hospitalRelease || release > parseInt(entry.hospitalRelease))) {
            entry.hospitalRelease = release;
            entry["reason"] = 'hosp';
            dirty = true;
        }

        if (entry.status != data.status) {
            dirty = true;
            entry["status"] = data.status;
        }

        let lcStatus = data.status.toLowerCase();
        let inJail = lcStatus.indexOf('jail') > -1;
        let jailSecsToGo = inJail ? secsTillRelease(data.jailRelease) : 0;
        $(`#user-${id}`).attr('data-jail-rel', jailSecsToGo);
        let jailToGo = secsToClock(jailSecsToGo);
        let jailTxt = inJail ? (` | ${jailToGo} left`) : '';
        if (data.jailRelease > 0 && data.jailRelease > parseInt(entry.jailRelease)) {
            entry["jailRelease"] = data.jailRelease;
            entry["reason"] = 'jail';
            dirty = true;
            //updateStakeoutArrayEntry(entry, id);
        }

        if (dirty == true)
            updateStakeoutArrayEntry(entry, id);

        debug("[stakeout] processEnemyResult: ", id, release, secsLeft, $(`#user-${id}`), $(`#user-${id}`).attr('data-hosp-rel'));
        debug("[stakeout] processEnemyResult, jail: ", id, data.jailRelease, jailSecsToGo, $(`#user-${id}`),
              $(`#user-${id}`).attr('data-hosp-rel'));
        debug("[stakeout] entry: ", entry);

        updateHospTime(id, secsLeft);
    }

    // Update hosp time left countdown
    function updateHospTime(id, diff) {
        let entry = activeStakeouts[id];
        if (!diff) diff = secsTillRelease(entry.hospitalRelease);
        let disp = secsToClock(diff);
        if (diff > 0) {
            $(`#user-${id}`).text(`In Hospital: ${disp}`);
            $(`#user-${id}`).addClass('hosp-red');
        } else if (entry.jailRelease > 0) {
            diff = secsTillRelease(entry.jailRelease);
            if (diff > 0) {
                disp = secsToClock(diff);
                $(`#user-${id}`).text(`In Jail: ${disp}`);
                $(`#user-${id}`).addClass('hosp-red');
            }
        } else {
            //let entry = activeStakeouts[id];
            handleHospRelease(id);
            $(`#user-${id}`).text(`Active`);
            $(`#user-${id}`).removeClass('hosp-red');
        }
        if (diff > 0) setTimeout(updateHospTime, 1000, id);
    }

    function processEnemiesPage() {
        let isFriends = $("#friends-tab").hasClass('active');
        let isEnemies = $("#enemies-tab").hasClass('active');

        fixupStakeouts();

        // Handle switching between friends/enemies
        $("#enemies-tab").on('click', function() { setTimeout(processEnemiesPage, 250); });

        // Handle the enemies half
        var enemyNames = [];
        var enemyIds = [];
        if (isEnemies == true) {
            if (options.enableStakeouts.on == true && Object.keys(activeStakeouts).length == 0) {
                loadStakeouts();
            }
            let allEnemyNames = $("#enemiesTabContent > div.row:not(.row-header) > div:nth-child(1)");
            let allEnemyNotes = $("#enemiesTabContent > div.row:not(.row-header) > div:nth-child(4)");
            let allEnemyStatus = $("#enemiesTabContent > div.row:not(.row-header) > div:nth-child(2)");

            if (Object.keys(activeStakeouts).length > 0) {
                let dirty = false;
                $(allEnemyNames).each(function(idx, item) {
                    let name = item.innerText;
                    let id = idFromHref($($(item).find('a')[0]).attr("href"));
                    debug("[stakeouts][enemies] b: ", name, id);
                    enemyIds.push(id);
                    enemyNames.push(name);
                });
                debug("[stakeouts][enemies] ids: ", enemyIds, " names: ", enemyNames);
                let asKeys = Object.keys(activeStakeouts);
                asKeys.forEach(key => {
                    debug("[stakeouts][enemies] check key ", key);
                    if (!enemyIds.includes(key)) {
                        dirty = true;
                        debug("[stakeouts][enemies] deleting ID ", key, " from ", activeStakeouts);
                        delete activeStakeouts[key];
                    }
                });
                if (dirty == true) saveStakeouts();
            }

            // Add last known reputation
            if (options.recordFightHistory.on == true && options.lastRespectOnEnemiesPage.on == true) {
                addRepOnEnemiesPage();
            }

            let enemiesInHospRows = $("#enemiesTabContent > div.row:not(.row-header) > div:nth-child(2)").filter(function(idx) {
                return $(this).text().indexOf('ospital') > -1;
            }).closest(".row");
            let enemiesInHospStatus = $("#enemiesTabContent > div.row:not(.row-header) > div:nth-child(2)").filter(function(idx) {
                return $(this).text().indexOf('ospital') > -1;
            });

            let enemiesNotInHospRows = $("#enemiesTabContent > div.row:not(.row-header) > div:nth-child(2)").filter(function(idx) {
                return $(this).text().indexOf('ospital') == -1;
            }).closest(".row");
            let enemiesNotInHospStatus = $("#enemiesTabContent > div.row:not(.row-header) > div:nth-child(2)").filter(function(idx) {
                return $(this).text().indexOf('ospital') == -1;
            });

            $(allEnemyStatus).each((idx, el) => {
                let href = $(el).closest(".row").find('div > a').attr('href');
                let name = $(el).closest(".row").find('div > a').text();
                let id, entry;

                // Tag all status fields with ID, to locate later
                if (href) id = idFromHref(href);
                if (id) $(el).attr("id", `user-${id}`);

                // Add stakeout entry and checkbox if enabled
                if (options.enableStakeouts.on == true) {
                    if (id) entry = activeStakeouts[id];
                    if (entry && entry["fromCache"] == true) {
                        $(`#user-${id}`).addClass("so_cached");
                        $(`#user-${id}`).addClass('so_cached');
                        let delay = (2 + idx/10) * 1000;
                        debug("[processEnemiesPage][startStakeouts] Cached entry used for ", id,
                              " selector: ", `#user-${id}`, " node: ", $(`#user-${id}`),
                             "\nChecking again in ", (delay/1000), " secs");
                        updateStatsIfNeeded(id, 'advanced', processEnemyResult, null, delay);
                    }

                    if (!entry && id)
                        entry = { "id": id, "name": name, "release": 0, "jailRelease": 0, "fromCache": false, "delayed": false,
                                 "relTimer": null, "tenSecTimer": null, "enabled": false, "onList": true, "timer": 0 };
                    if (id) activeStakeouts[id] = JSON.parse(JSON.stringify(entry));

                    // Add stakeout checkbox
                    addStakeoutOpt(el, {id: id, name: name});
                }

                // Add tooltip with batstats? If enabled?
                if (options.statEstimates.on == true) {
                    debug("enemies page, finding stats for ", entry.name);
                    let target = $(el).prev();
                    let key = `statEstimate_${entry.id}`;
                    let stats = GM_getValue(key, null);
                    if (stats) {
                        let parts = stats.split(' ');
                        debug("enemies page, stats: ", stats, " parts: ", parts);
                        stats = parts[0];

//                         let ttText = `Estimated bat stats<br>for user ${entry.name} [${entry.id}]<br>${stats}`;
//                         debug("enemies page, ttText: ", ttText, "\nentry: ", entry);
//                         displayHtmlToolTip($(target), ttText);

                        addLongPressHandler(target, showEnemyBatStatEstimate, {"stats": stats, "name": name, "id": id});
                    } else {
                        debug("enemies page, didn't find stats for ", entry.name);
                    }
//                     let ttText = `Estimated bat stats:<br>${stats}`;
//                     debug("enemies page, ttText: ", ttText, "\nentry: ", entry);
//                     displayHtmlToolTip($(target), ttText);
                }
            });

            if (options.enableStakeouts.on == true) {
                saveStakeouts();
            }

            // Add the hosp time countdown
            $(enemiesInHospRows).each(function(idx, el) {
                let href = $(el).find('div > a').attr('href');
                let name = $(el).find('div > a').text();
                let id = idFromHref(href);
                let entry = activeStakeouts[id];

                updateStatsIfNeeded(id, 'advanced', processEnemyResult);
            });

            $(enemiesNotInHospRows).each(function(idx, el) {
                let href = $(el).find('div > a').attr('href');
                let name = $(el).find('div > a').text();
                let id = idFromHref(href);
                updateStatsIfNeeded(id, 'advanced', processEnemyResult);
            });

        // Revisit this - do sep, for all pages...
        } else {
            if (options.enableStakeouts.on == true) {
                loadStakeouts();

                let now = new Date().getTime() / 1000;
                let keys = Object.keys(activeStakeouts);
                for (let idx=0; idx<keys.length; idx++) {
                    let entry = activeStakeouts[keys[idx]];
                    if (entry.enabled != true) continue;

                    if (entry.release && !entry.hospitalRelease)
                        entry["hospitalRelease"] = entry.release;

                    let release = parseInt(entry.hospitalRelease);
                    if (release && release > now) {
                        let secsToGo = release - now;
                        if (entry.relTimer) clearTimeout(entry.relTimer);
                        entry.relTimer = setTimeout(handleHospRelease, secsToGo * 1000, id);
                        debug("[stakeout]Stakeouts: adding timeout for ", entry.name);
                        let tenSecs = (secsToGo * 1000 - 30000);
                        if (tenSecs > 30000) {
                            if (entry.tenSecTimer) clearTimeout(entry.tenSecTimer);
                            entry.tenSecTimer = setTimeout(handleTenSecTimer, (secsToGo * 1000 - 30000), entry);
                        }
                    }
                }
            }
        }

        // Not debugged yet!
        var handlingClick = false;
        function handleAddStakeout(e) {
            if (handlingClick == true) return;
            handlingClick = true;
            e.stopPropagation();
            e.preventDefault();
            let checked = $(this).prop('checked');
            debug("[stakeout][handleAddStakeout] checked: ", checked, $(this));

            let idstr = $(this).parent().attr('data-id');
            let id = idstr.split('-')[1];
            let name = $(this).parent().attr('data-name');
            let release = parseInt($(`#user-${id}`).attr('data-hosp-rel'));
            let jailRelease = parseInt($(`#user-${id}`).attr('data-jail-rel'));
            let secsToGo = parseInt(secsTillRelease(release));

            let entry = id ? activeStakeouts[id.toString()] : null;
            if (!entry)
                entry = { "id": id, "name": name, "release": release, "jailRelease": jailRelease,
                         "fromCache": false, "delayed": false, "relTimer": null, "tenSecTimer": null,
                         "enabled": (checked == true), "onList": true };
            else {
                entry.enabled = checked;
                if (release > 0 && release > parseInt(entry.hospitalRelease)) {
                    entry.hospitalRelease = release;
                    updateStakeoutArrayEntry(entry, id);
                }
            }

            if (id) {
                activeStakeouts[id] = entry;
                saveStakeouts();
            }
            debug("[stakeout][handleAddStakeout] id: ", id, " entry: ", entry);

            // TBD: add entry to storage
            debug("[stakeout][handleAddStakeout]  for: ", name, ' [', id, "], ", secsToGo, " secs fromm now");
            debug("[stakeout]activeStakeouts: ", activeStakeouts);

            if (checked == true && secsToGo * 1000 > 0) {
                debug("[stakeout]Adding stakeout: ", secsToGo * 1000);
                if (entry.relTimer) clearTimeout(entry.relTimer);
                entry.relTimer = setTimeout(handleHospRelease, secsToGo * 1000, id);
                debug("[stakeout]Stakeouts: adding timeout for ", entry.name);
                let tenSecs = (secsToGo * 1000 - 30000);
                if (tenSecs > 30000) {
                    if (entry.tenSecTimer) clearTimeout(entry.tenSecTimer);
                    entry.tenSecTimer = setTimeout(handleTenSecTimer, (secsToGo * 1000 - 30000), entry);
                }
            } else {
                debug("[stakeout]Removing stakeout");
                //clearStakeout(id);

//                 let timer = $(`#user-${id}`).attr('data-timer');
//                 if (timer) clearTimeout(timer);
//                 $(`#user-${id}`).attr('data-timer', 0);
//                 activeStakeouts[id].release = 0;
//                 saveStakeouts();
            }
            setTimeout(function() {handlingClick = false; }, 500);
        }

        // Adds the checkbox
        function addStakeoutOpt(el, user) {
            //debug("[stakeout] addStakeoutOpt: ", user, $(el));
            let id = user.id;
            let name = user.name;
            $($(el).closest('.row').find('div')[0]).css("position", "relative");
            $($(el).closest('.row').find('div')[0]).append(`
                <span data-id='user-${id}' data-name='${name}' class="warn-on-rel">
                    <input type='checkbox' name='warn'>
                </span>`);
            let entry = activeStakeouts[id];
            if (entry) entry.name = name;
            let active = entry ? (entry.enabled == true) : false;
            $(`.warn-on-rel[data-id="user-${id}"] > input`).prop('checked', active);
            $(`.warn-on-rel[data-id="user-${id}"] > input`).on('change', handleAddStakeout);
            displayHtmlToolTip($(`.warn-on-rel[data-id="user-${id}"] > input`), "Stakeout this user");
        }


    }

    // ===================== Display fight results in reverse order =====================
    // ============================== Collect fight results =============================

    function getPastResultsCb(result, params) {
        debug("[collectFightResults][getPastResultsCB][rebuildAttHist] res: ", result, params);
        //if (!result) return log("[getPastResultsCb] No fights saved yet for ", params.name, params.id);
        let dataObj = params;
        let entry = result ? result : [];
        entry.push(dataObj);

        if (entry.length > options.maxFightHist.val) { // options.ma...
          entry.shift(); // Remove the first element if the size is exceeded
        }

        let key = `fightData.${dataObj["id"]}`;
        dbPutEntryInStore(entry, fightResultStoreName, key);
        debug("[collectFightResults][rebuildAttHist] data: ", JSON.stringify(dataObj, null, 4));
    }

    function processfightResultsPage() {
        var orderApplied = false;

        const getDefender = () => {
            let a = $($(".fightTable > table > tbody > tr:last-child a")[0]).text();
            if (!a) a = $($(".fightTable > table > tbody > tr:first-child a")[0]).text();
            return a ? a.trim() : '';
        }
        const getHref = () => {
            let a = $($(".fightTable > table > tbody > tr:last-child a")[0]).attr("href");
            if (!a) a = $($(".fightTable > table > tbody > tr:first-child a")[0]).attr("href");
            return a ? a.trim() : '';
        }

        function collectFightResults() {
            debug("[database][collectFightResults]");
            if (dbReady == false) {
                dbWaitingFns.push(collectFightResults);
                return;
            }

            let outcome = $(".fightTable").prev().find('div:first-child span').text();

            let defender = getDefender(); //$($(".fightTable > table > tbody > tr:last-child a")[0]).text().trim();
            let href = getHref(); //$(".fightTable > table > tbody > tr:last-child a").attr("href");
            let id = href && href.length ? idFromHref(href) : 0;

            // Full result text
            // ex: "You beat SPIDER
            // unconscious and left them on the street as a warning to others <-- leave
            // near death, they'll be spending some time in Hospital  <-- Hosp, e.g. bounty
            // and stole some of their cash (53 Reputation gained) (£914 stolen) <-- mug
            // loss test: https://cartelempire.online/Fight/1942251
            // draw: https://cartelempire.online/Fight/1946387
            let fullRes = $(".fightTable > table > tbody > tr:last-child").text();
            let ffMod = (outcome == 'Win') ? $(".fightTable").prev().find('div:nth-child(2) span').text() : "0";
            let datePos = (outcome == 'Win') ? 3 : 2;
            let txt = $(".fightTable").prev().find(`div:nth-child(${datePos}) p`).text();
            if (txt && txt.indexOf('Date') < 0) {
                datePos = (datePos == 2) ? 3 : 2;
                txt = $(".fightTable").prev().find(`div:nth-child(${datePos}) p`).text();
                if (txt && txt.indexOf('Date') < 0) {
                    datePos = 4;
                    txt = $(".fightTable").prev().find(`div:nth-child(${datePos}) p`).text();
                }
            }
            let date = txt ? txt.split('-')[1].trim() : '';
            let stats = $('#them-bstat').text();
            debug("[collectFightResults], stats: ", stats);

            let attType = '';
            if (fullRes && fullRes.indexOf('unconscious') > -1) attType = 'Leave';
            else if (fullRes && fullRes.indexOf('near death') > -1) attType = 'Hospitalize';
            else if (fullRes && fullRes.indexOf('stole some') > -1) attType = 'Mug';

            debug("[collectFightResults]: \n", fullRes, "\nType: ", attType);
            debug("[collectFightResults]: fullRes.indexOf('unconcious'): ", fullRes.indexOf('unconcious'));
            debug("[collectFightResults]: fullRes.indexOf('near death'): ", fullRes.indexOf('near death'));
            debug("[collectFightResults]: fullRes.indexOf('stole some'): ", fullRes.indexOf('stole some'));


            let rep = 0;
            let mug = ''
            if (outcome == 'Win') {
                debug("[collectFightResults type: ", attType, (attType == 'Mug'), " res: ", fullRes);
                if (attType == 'Mug') {
                    // You beat ZADDY and stole some of their cash (53 Reputation gained) (£914 stolen)
                    let tmp = fullRes.replace('Reputation', '('); // .split('(');
                    let parts = tmp.split('(');
                    rep = parts[1]; // .trim();
                    mug = parts[3].replace(' stolen', '');
                    debug("[collectFightResults tmp:\n ", tmp, "\nParts:: ", parts, "\nrep: ",  rep, "\nmug: ", mug);
                } else {
                    rep = fullRes.split("(").pop().split(' ')[0];
                }
            } else {
                // get from last row of fight details
                let td = $(".fightTable > table > tbody > tr:last-child > td");
                let txt = $(td).text();
                debug("[collectFightResults] last row, td: ", txt, $(td));
                //if (attType == 'Mug') {
                    // You beat ZADDY and stole some of their cash (53 Reputation gained) (£914 stolen)
                // leave: NEEYO beat you unconscious and left you on the street as a warning to others (144 Reputation gained)
                    let tmp = txt.replace('Reputation', '('); // .split('(');
                    let parts = tmp.split('(');
                    rep = parts[1]; // .trim();
                    if (attType == 'Mug') mug = parts[3].replace(' stolen', '');
                    debug("[collectFightResults tmp:\n ", tmp, "\nParts:: ", parts, "\nrep: ",  rep, "\nmug: ", mug);
                //}
            }

            // Log ID
            const lastSlashIndex = location.pathname.lastIndexOf('/');
            const logNum = lastSlashIndex ? location.pathname.substring(lastSlashIndex + 1) : '';

            debug("[collectFightResults] defender: ", defender, " id: ", id, " outcome: ",
                  outcome, " ff mod: ", ffMod, " rep: ", rep,  " date: ", date, " logNum: ",
                  logNum, " type: ", attType, "mug: ", mug, " stats: ", stats);
            const sep = '|';
            // Don't need name, id here...?
            // Maybe save max last 10 results?
            // {"id":1984390,"initiatorId":55266,"initiatorCartelId":84,"targetId":14380,"targetCartelId":null,
            //"repGained":126.34,"cashMugged":0,"fairFightMultiplier":2.79,
            //"attackType":"attack","outcome":"Win","created":"1762278097","defenderRepGain":0,"isWar":false,"warId":null,"itemAwarded":null},
            let dataObj = {"defender": defender, "id": id, "outcome": outcome,
                           "ff": ffMod, "rep": rep, "date": date, "log": logNum, "type": attType, "mug": mug, "stats": stats };

            let key = `fightData.${id}`;
            //let entry = JSON.parse(GM_getValue(key, JSON.stringify([])));

            dbGetItemFromStoreByKey(key, fightResultStoreName, getPastResultsCb, dataObj);

        }

        function invertFightResults(retries = 0) {
            if (isFightResults() == false) return;
            installFightResUI();

            let rows = $(".fightTable > table > tbody > tr");
            let row0 = $($(".fightTable > table > tbody > tr")[0]);
            let border1, border0 = $(row0).css('border-bottom');
            if (border0) border1 = border0.replace('0px', '1px');
            GM_addStyle(`.borderFirst {border-bottom: ${border1}; border-top: ${border0}; }
                         .borderLast {border-bottom: 0px solid transparent !important;}`);
            if ($(rows).length < 2) {
                if (retries++ < 25) return setTimeout(invertFightResults, 100, retries);
                log("[invertFightResults] timed out");
            }
            $(".fightTable > table > tbody").css({"display": "flex", "flex-direction": "column"});
            $(".fightTable > table > tbody").find('td').css('width', ($(row0).width() + 'px'));

            if (options.showResultsInverted.on == true) {
                $($(rows)[$(rows).length-1]).addClass('borderLast');
                $($(rows)[0]).addClass('borderFirst');
                doFightRowInvert(rows);
            } else {
                $($(rows)[$(rows).length-1]).addClass('borderFirst');
                $($(rows)[0]).addClass('borderLast');
            }
        }

        function doFightRowInvert(e) {
            let rows = $(".fightTable > table > tbody > tr");
            let numRows = $(rows).length;
            if (orderApplied == false) {
                for (let idx=numRows - 1; idx >= 0; idx--) {
                    $($(rows)[idx]).css('order', (numRows - idx));
                }
            } else {
                for (let idx=numRows - 1; idx >= 0; idx--) {
                    let currOrder = $($(rows)[idx]).css('order');
                    let newOrder = 1 + (numRows - currOrder);
                    $($(rows)[idx]).css('order', newOrder);
                }
            }
            $($(rows)[0]).toggleClass('borderLast borderFirst');
            $($(rows)[numRows - 1]).toggleClass('borderLast borderFirst');
            orderApplied = true;
        }

        function installFightResUI(retries=0) {
            let target = $(".card .header-section")[0];
            if (!$(target).length) {
                if (retries++ < 25) return setTimout(installFightResUI, 100, retries);
                return log("[installFightResUI] timed out.");
            }
            // Font Awesome support
//             if (fasLoaded == false) {
//                 GM_addStyle('@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css");');
//                 fasLoaded = true;
//             }
            const caretBtn = `<span class="col-caret" style="top: 6px;"><i class="fa fa-caret-right"></i></span>`;
            let newNode = `
                <div id='invert' class="row mb-0" style="display: none;">
                    <div class="inner-invert">
                       <span id='invert-help' style="margin-left: 20px;">
                           <label><span><input name='showResultsInverted' type='checkbox'></span>Show results last to first order</label>
                       </span>
                   </div>
               </div>`;

            $(target).append(caretBtn);
            $(target).closest(".row").after(newNode);
            $(".fa").on('click', handleCaret);

            displayHtmlToolTip($("#invert-help"), `Show results in revers order,<br>final outcome at the top.`);
            $(`#invert input[name="showResultsInverted"]`).prop('checked', options.showResultsInverted.on);
            $(`#invert input`).on('change', handleCbChange);
            $(`#invert input`).on('change', doFightRowInvert);

            function handleCaret(e) {
                let target = $(this).next()
                debug("[handleCaret] ", $(this), $(this).next());
                $('#invert').slideToggle("slow");
                $(this).toggleClass('fa-caret-down fa-caret-right');
            }
        }

        if (options.invertFightResults.on == true) {
            addInvFightResStyles();
            invertFightResults();
        }

        if (options.recordFightHistory.on == true) {
            collectFightResults();
        }
    }

    // Be easier to just grab using the API...
    // https://cartelempire.online/api/user?type=attacks&key=CEB79213-5742-42F7-9C4
    function rebuildAttHist(res, status, xhr, id, param) {
        debug("[rebuildAttHist] res: ", res);

        if (res && res.error) {
            debug("[rebuildAttHist] ERROR: ", res.error, res, id, param);
            console.error("[rebuildAttHist] ERROR: ", res.error, res, id, param);
            return;
        }

        // {"id":1984390,"initiatorId":55266,"initiatorCartelId":84,"targetId":14380,"targetCartelId":null,
        //"repGained":126.34,"cashMugged":0,"fairFightMultiplier":2.79,
        //"attackType":"attack","outcome":"Win","created":"1762278097","defenderRepGain":0,"isWar":false,"warId":null,"itemAwarded":null},
        let results;
        try {
            let obj = JSON.parse(res);
            results = obj["attacks"];
        } catch (ex) {
            console.error("[rebuildAttHist] exception parsing: ", ex);
            results = res["attacks"];
        }
        debug("[rebuildAttHist] results: ", results);


        results.forEach( (result, idx) => {
            debug("[rebuildAttHist] result: ", result);

            let opponentId = (user_id == result.initiatorId) ?  result.targetId : result.initiatorId;
            let entry = {"defender": result.targetId, "attacker": result.initiatorId, "id": opponentId, "outcome": result.outcome,
                           "ff": result.fairFightMultiplier, "rep": result.repGained, "date": result.created,
                         "log": result.id, "type": result.attackType, "mug": result.cashMugged, "stats": '???' };

            let key = `fightData.${opponentId}`;

            debug("[rebuildAttHist] key: ", key, entry);

            dbGetItemFromStoreByKey(key, fightResultStoreName, getPastResultsCb, entry);
        });
    }

    function migrateFightResults() {
        debug("[database][migrateFightResults]");

        if (dbReady == false) {
            dbWaitingFns.push(migrateFightResults);
            return;
        }

        const keys = GM_listValues();
        for (const key of keys) {
            if (key.indexOf('fightData.') > -1) {
                const entry = JSON.parse(GM_getValue(key));
                debug("[database][migrateFightResults] writing entry for ", key, " to ", fightResultStoreName);
                let newKey = key.replace('_', '');
                dbPutEntryInStore(entry, fightResultStoreName, newKey);
                //debug(`Key: ${key}, Value: ${value}`);
            }
        }
        GM_setValue("migrateFightResults", false);
    }

    // ======================== Show fight history with user ===========================

    function addFightHistoryToUser() {
        debug("[database][addFightHistoryToUser]");
        if (dbReady == false) {
            dbWaitingFns.push(addFightHistoryToUser);
            return;
        }

        let id = location.href.substring(location.href.lastIndexOf('/') + 1).trim();
        let key = `fightData.${id}`;
        debug("[addFightHistoryToUser] id: ", id, " key: ", key);

        dbGetItemFromStoreByKey(key, fightResultStoreName, addHistoryCallback, {id: id, key: key});
    }

    function addHistoryCallback(fights, params) {
        // ********
        //let fights = JSON.parse(GM_getValue(key, JSON.stringify([])));
        debug("[addFightHistoryToUser] entry: ", fights);

        let node = $("#mainBackground > div.container > div.row > div > div.card.d-flex.flex-fill");

        if (fights && !fights.length) {
            $(node).after(`<div class="mt-3 card"><div class="row mb-0">
                              <div class="col-12"><div class="header-section"><h2>No Previous Attack Data</h2></div></div>
                          </div></div>`);
            return;
        }

        let fight = fights ? fights[0] : undefined;
        let id = fight ? fight["id"] : params ? params.id : 0;
        let key = id ? `fightData.${id}` : params ? params.key : undefined;

        // TBD: Add caret to collapse!
        let table =
        `<div class="mt-3 card">
            <div class="row mb-0">
                <div class="col-12"><div class="header-section"><h2>Previous Attacks</h2></div></div>
            </div>
            <div class="row gx-0 dark-tertiary-bg">
                <div class="container pt-2 signatureWrapper">
                    <table class="table align-items-center table-flush" id="attackhistory">
                         <thead class="thead-light">
                            <tr>
                                <th scope="col">Date</th>
                                <th scope="col">Time</th>
                                <th scope="col">Outcome</th>
                                <th scope="col">Type</th>
                                <th scope="col">FF Mod</th>
                                <th scope="col">Reputation</th>
                                <th scope="col">Fight Log</th>
                            </tr>
                        </thead>
                        <tbody class="attackhistoryTableBody">

                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;

        $(node).after(table);

        let dirty = false;
        if (fights) {
            fights.forEach( (el, idx) => {
                debug("[addFightHistoryToUser] entry #", idx, ": ", el);
                let parts = el.date.split(' ');
                let d = parts[1];
                let t = parts[0];
                let logNum = el.log ? el.log : null;
                if (!el.type) {
                    el["type"] = '';
                    fights[idx] = JSON.parse(JSON.stringify(el));
                    dirty = true;
                }

                let dispType = el.type;
                if (el.type == 'Mug' && el.mug) dispType = dispType + ` (${el.mug})`;
                let row = `<tr><td>${d}</td><td>${t}</td><td>${el.outcome}</td>` +
                    `<td>${dispType}</td><td>${el.ff}</td><td>${el.rep}</td><td>` +
                    (logNum ? `<a href="/Fight/${logNum}">View</a>` : ``) +
                    `</td></tr>`;
                $("#attackhistory > tbody").prepend(row);
            });
        }

        // ********
        if (dirty == true) {
            dbPutEntryInStore(fights, fightResultStoreName, key);
            //GM_setValue(key, JSON.stringify(fights))
        }

    }

    // ====================== Add quick links to some prog bars =========================
    function addProgBarLinks(retries=0) {
        if (!$("#energyProgressBar").length) {
            if (retries++ < 25) return setTimeout(addProgBarLinks, 100, retries);
            return log("[addProgBarLinks] timed out");
        }

        $("#energyProgressBar").on('click', function(e) {
            debug("Going to the gym...");
            location.href = '../Gym';
        });

        $("div > a[data-bs-original-title='Cash']").on('click', function(e) {
            debug("Going to the vault...");
            //location.href = '../Bank';
            location.href = '../Property';
        });

        $("#lifeProgressBar").on('click', function(e) {
            debug("Going to the hosp...");
            location.href = '../Hospital';
        });
    }

    // ============================ Faster Store Sales ==================================

    function handleFasterStoreSales(store) {
        debug("[fastStoreSales] store: ", store);
        switch (store) {
            case 'ArmedSurplus': {
                let inputList = $("div.sellItemsContainer input.form-control.itemQuantityInput");
                for (let idx=0; idx<$(inputList).length; idx++) {
                    let node = $(inputList)[idx];
                    let max = $(node).attr("max");
                    let itemname = $(node).attr("itemname");
                    let name = $(node).attr("name");
                    $(node).val(max);
                    let val = $(node).val();
                    $(node).attr("autofill", "true");

                    $(node).css("border", "1px solid blue");
                    let btn = $(node).next();
                    if ($(btn).hasClass('btn')) {
                        $(btn).css("border", "1px solid red");
                        $(btn).prop('disabled', false);
                    }

                    debug("[fastStoreSales] node: ", $(node), " itemname: ", itemname, " id: ", name, " max: ", max, " val: ", val);
                }
                break;
            }
            default: {
                debug("[fastStoreSales] ", store, " not handled yet!");
                return;
            }
        }
    }

    // ======================== Track dog training stats ================================

    function safeFloat(val) {
        let num = parseFloat(val ? val.toString().replace(/\D/g, "") : 0);
        return isNaN(num) ? 0 : num;
    }

    function addDogEntryCb(target, entry) {
        let primaryKey = target.result;
        if (!entry["key"]) entry["key"] = primaryKey;

        // Note fact that we just fed/trained, to get stats on refresh
        if (entry.valid == false) {
            GM_setValue("dogTrainedOrFed", JSON.stringify({"id": entry.id, "key": primaryKey, "valid": entry.valid}));
        }
        debug("[handleDogBtnClick][addDogEntryCb] new key: ", primaryKey, target, entry);
    }

    function putDogEntryCb(target, entry) {
        let primaryKey = target.result;
        entry["key"] = primaryKey;
        debug("[handleDogBtnClick][putDogEntryCb] new key: ", primaryKey, target, entry);
    }

    function handleDogBtnClick(e) {
        let inp = $("input[name='dataDogId']");
        let id = $(inp).val();
        let name = $(inp).next().val();
        let trained = $(this).hasClass("trainDog");
        debug("[handleDogBtnClick] ", $(inp), id, name);
        let entry = {"dateTime": (new Date().getTime()), "id": id, "name": name, "desc": null, "action": (trained ? "train" : "fed"),
                     "att": 0, "attBonus": 0, "acc": 0, "accBonus": 0, "loy": 0, "exp": 0, "key": null, "valid": false};

        dbAddEntryToStore(entry, dogStatsStoreName, null, addDogEntryCb, entry);
    }

    function getDogEntryCb(result, entry) {
        debug("[collectDogStats] [getDogEntryCb]", result, entry, entry["id"]);
        if (!result) {
            debugger;
            return;
        }

        let stats = $(`#dogContainer${entry["id"]}  div.container p.card-text`);
        debug("[collectDogStats] [getDogEntryCb]", stats);
        result["att"] = $($(stats)[0]).text();
        result["acc"] = $($(stats)[1]).text();
        result["loy"] = $($(stats)[2]).text();
        result["exp"] = $($(stats)[3]).text();

        result["attBonus"] = $($("#dogContainer21831  div.container p.card-text")[0]).children('span').text();
        result["accBonus"] = $($("#dogContainer21831  div.container p.card-text")[1]).children('span').text();

        result["key"] = entry.key;

        debug("[collectDogStats] [getDogEntryCb] new entry: ", result);

        tryGetResult(result);
    }

    function collectDogStats(entry) {
        debug("[collectDogStats] ", entry);
        let id = entry.id;
        let key = entry.key;

        if (entry["valid"] == true) {
            debug("[collectDogStats] entry ", entry, " already valid!");
            return;
        }
        // Get existing entry from DB
        dbGetItemFromStoreByKey(key, dogStatsStoreName, getDogEntryCb, entry);
    }

    function doDogTest() {
        let id = "dogContainer21831";
        let trained = true;
        let entry = {"dateTime": (new Date().getTime()), "id": id, "action": (trained ? "Trained" : "Fed"),
                     "att": 0, "attBonus": 0, "acc": 0, "accBonus": 0, "loy": 0, "exp": 0};

        debug("[startDogTracking][doDogTest] entry: ", entry);

        dbPutEntryInStore(entry, dogStatsStoreName, null, putDogEntryCb, entry);
    }

    function tryGetResult(entry, retries=0) {
        let alertBox = $(".statusAlertBox");
        let msg = $(".statusAlertBox > div > p").text();

        if (msg && (msg.indexOf('Fed') > -1 || msg.indexOf('Trained') > -1)) {
            entry["desc"] = msg;
            debug("[tryGetResult] desc: ", msg);
        }

        //let msg = $(".card.border-success.statusAlertBox > div > p");
        //let txt = $(msg).text();
        //if (!$(msg).length || !txt || txt.indexOf(entry["name"]) < 0) {
        //    if (retries++ < 50) return setTimeout(tryGetResult, 100, entry, retries);
        //    //return;
        //}

        //entry["desc"] = (txt && txt.length) ? txt : 'not found' ;
        entry["valid"] = true;

         // don't need the CB, just logging for now...
        if (!entry.key) debugger;
        dbPutEntryInStore(entry, dogStatsStoreName, entry.key, putDogEntryCb, entry);

        GM_setValue("dogTrainedOrFed", JSON.stringify({}));
//         dbAddEntryToStore(entry, dogStatsStoreName, null, addDogEntryCb, entry);
//         getDogEntryCb(entry, entry)
    }

    var attDataPts = [];
    var accDataPts = [];
    var expDataPts = [];
    var loyDataPts = [];
    function rowFromEntry(entry) {
        debug("[dogStatsCb] entry: ", entry);
        let keys = Object.keys(entry);
        if (!keys || keys.length < 10) {
            debug("[dogStatsCb] invalid entry, should delete!");
            return;
        }
        for (let idx=0; idx<keys.length; idx++) {
            if (!entry[keys[idx]]) {
                debug("[dogStatsCb] no value for ", keys[idx]);
                return;
            }
        }
        let when = toShortDateStr(new Date(entry.dateTime));
        let wp = when.split(',');
        let dt = wp[0].trim();
        let tm = wp[1].trim();
        let att = safeFloat(entry.att.split('+')[0]);
        debug("[dogStats-parseStats] entry.att: ", entry.att, " att: ", att, " bonus: ", entry.attBonus, " parts: ", entry.att.split('+'));
        let acc = safeFloat(entry.acc.split('+')[0]);
        let attB = parseFloat(entry.attBonus.trim().replace('+', ''));
        let accB = parseFloat(entry.accBonus.trim().replace('+', ''));
        let loy = safeFloat(entry.loy);
        let exp = safeFloat(entry.exp);
        let action = (entry.action == 'train') ? 'Trained' : (entry.action == 'fed') ? 'Fed' : entry.action;
        let row = `<tr class="dtr" data-dt="${dt}"><td>${when}</td><td>${action}</td><td>${att}</td><td>${entry.attBonus}</td>` +
                      `<td>${acc}</td><td>${entry.accBonus}</td><td>${entry.loy}</td><td>${entry.exp}</td></tr>`;

        let xVal = parseInt(entry.dateTime) / 1000;
        attDataPts.push({ x: xVal, y: (parseFloat(att) + parseFloat(attB)) });
        debug("[dogStats-parseStats] (parseFloat(att) + parseFloat(attB)): ", (parseFloat(att) + parseFloat(attB)));
        accDataPts.push({ x: xVal, y: (parseFloat(acc) + parseFloat(accB)) });
        debug("[dogStats-parseStats] : (parseFloat(acc) + parseFloat(accB))", (parseFloat(acc) + parseFloat(accB)));
        expDataPts.push({ x: xVal, y: exp });
        loyDataPts.push({ x: xVal, y: loy });
        return row;
    }

    var dogStatColors = JSON.parse(GM_getValue("dogStatColors",
                        JSON.stringify(['rgb(43, 160, 50)', 'rgb(20, 115, 215)'])));
    GM_setValue("dogStatColors", JSON.stringify(dogStatColors));

    function dogStatsCb(result, params) {
        debug("[dogStatsCb] res: ", result, " params: ", params);

        if (result && result.length) {
            result.forEach( entry => {
                if (entry.dateTime) {
                    let row = rowFromEntry(entry);
                    if (row) $("#stats-tbl tbody").prepend(row);
                }
            });

            let hdr = `<tr><th>Date</th><th>Action</th><th colspan="2">Attack</th>` +
                      `<th colspan="2">Accuracy</th><th>Loyalty</th><th>Experience</th></tr>`;
            $("#stats-tbl tbody").prepend(hdr);

            let rows = $(".dtr");
            let colorIdx = 0;
            let len = $(rows).length;
            let maxIdx = len - 1;
            for (let idx=0; idx<$(rows).length; idx += 2) {
                let row0 = $(rows)[idx];
                let dt0 = $(row0).attr("data-dt");
                if (idx == 0)
                    $(row0).css("color", dogStatColors[colorIdx]);
                else {                                           // Rows 2, 4, 6...
                    let chk = $(rows)[idx - 1];
                    let dtChk = $(chk).attr("data-dt");
                    if (dtChk == dt0)                            // Same date as prev, use that
                        $(row0).css("color", $(chk).css("color"));
                    else {
                        colorIdx = (colorIdx == 0) ? 1 : 0;
                        $(row0).css("color", dogStatColors[colorIdx]);
                    }
                }

                if (idx < maxIdx) {                              // If not true, will break out of loop
                    let row1 = $(rows)[idx + 1];
                    let dt1 = $(row1).attr("data-dt");
                    if (dt0 == dt1) {                            // Use same color idx, grab and match color via css
                        $(row1).css("color", $(row0).css("color"));  // Color idx does not change
                    } else {                                     // otherwise, need other color - so other idx, can change
                        colorIdx = (colorIdx == 0) ? 1 : 0;
                        $(row1).css("color", dogStatColors[colorIdx]);
                    }
                }
            }
        }
    }

    function installDogStatsUI() {

        addStatStyles();
        let statsTbl = `
            <div class="mt-3 text-center" id="statsContainer" style="display: none;">
                <div class="separator-shadow"></div>
                <div id='stat-wrap-inner' class="row row-cols-3 row-header align-items-center">
                    <div id='dog-stats'>
                        <table id='stats-tbl'><tbody>
                        </tbody></table>
                    </div>
                </div>
                <div class="separator-shadow"></div>
            </div>`;

        let target = $("[id^='dogContainer']")[0];
        debug("[dogTracking][installDogStatsUI] target: ", $(target));
        if (!$(target).length) return debug("[dogTracking][installDogStatsUI] target not found.");

        let targetId = $(target).attr('id');
        if (targetId) GM_setValue("primaryDogId", targetId);
        let el = $(target).parent().parent(); //.prev();
        let hc = $(el).css("display");
        let ishid = (hc == 'none');
//         let ca = $(el).prev().find(".fa");
//         let cl = [];
//         if ($(ca).length) {cl = getClassList($(ca));}

        let openBtn = `<div class="stat-btn-wrap"><button class="btn btn-success dog-btn" id="showStats">History</button></div>`;
        let graphBtn = `<div class="stat-graph-wrap"><button class="btn btn-success dog-btn" id="showGraph">Graph</button></div>`;

        let hfull = 0;
        if (ishid == true) {
            $(el).attr("style", "opacity: 0; display: flex");
            hfull = $(target).height() - 34; // header height, get dynamically !!!
            $(el).attr("style", "display: none;");
            let h2 = $("#dogContainer21831 > div.row.g-0.align-items-center.border > div.container-fluid").height();
        }
        $(target).append(openBtn);
        let wrap = $("#showStats").parent();
        let pt = $(wrap).position().top - 4 + hfull;
        $(wrap).css("top", (pt + 'px'));
        $(wrap).css({"margin-left": "10px", "height": "26px"});
        $(target).append(statsTbl);
        $("#showStats").on('click', handleShowStats);

        $("#showStats").after(graphBtn);
        $("#showGraph").on("click", handleGraphBtn);

        dbGetAllItemsInStore(dogStatsStoreName, dogStatsCb, { "targetId": targetId });

        function handleShowStats(e) {
            debug("[dogTracking][handleShowStats]");
            $("#statsContainer").slideToggle("slow", function() {
                if ($("#dogStatsContainer").css('display') == 'none')
                    $("#showStats").text("History");
                else
                    $("#showStats").text("Close");
            });
        }
    }

    function handleGraphBtn(e) {

        if ($("#dog-graph").length) {
            $("#dog-graph").slideToggle();
            //myChart.destroy();
            //$("#dog-graph").remove();
        } else {
            installDogStatGraph();
            $("#dog-graph").slideToggle();
        }
    }

    function installDogStatGraph() {
        let closeBtn =
                     `<button class="btn btn-success graphBtn" id="closeGraphBtn">Close</button>`;
        let hdrRow = `<div class="row mb-0"><div class="col-12"><div class="header-section" style="position: relative;">
                          <h2>Historical</h2>
                          <!-- span class="closeBtnWrap">${closeBtn}</span -->
                          <span class="col-caret" data-root="card" data-area="market" data-idx="1"><i class="fa fa-caret-down"></i></span>
                      </div></div></div>`;

        let cardBody = `<div class="card-body"><nav id="sellNav">
                            <div class="tab-content">
                                <div style="width: 1100px; height: 200px;">
                                    <canvas id="myChart">
                                    </canvas>
                                </div>
                                <div style="width: 1100px; height: 200px;">
                                    <canvas id="myChart2">
                                    </canvas>
                                </div>
                            </div>
                        </div></div>`;

        let newCard = `<div id="dog-graph" class="card mb-4" style="display: none;">` + hdrRow + cardBody + `</div?`;

        let targetId = GM_getValue("primaryDogId", null);
        debug("[installDogStatGraph] targetId: ", targetId);
        let t;
        if (!targetId) {
            t = $("[id^='dogContainer']")[0];
            targetId = $(t).attr('id');
            debug("[installDogStatGraph] targetId: ", targetId);
            if (targetId)
                GM_setValue("primaryDogId", targetId);
            else
                return log("[installDogStatGraph] no target found!");
        }

        let target = $(`#${targetId}`);
        $(`#${targetId}`).after(newCard);

        debug("[installDogStatGraph] target: ", $(target), " chart: ", $('#dog-graph'));

        $('#dog-graph').parent().css({"display": "flex", "flex-direction": "column"});

        $("#closeGraphBtn").on('click', handleGraphBtn);

        // ========================== Build data ===========================


        // ====================== Instantiate graph ========================

        // hmmm, data is scaled all wrong (y val)
        const c1 = 'rgb(75, 192, 192)';
        const c2 = 'rgb(192, 192, 75)';
        let labels = [];
        const data1 = {
            datasets: [{
                label: "Attack",
                data: attDataPts,
                fill: false,
                showLine: true,
                hidden: false,
                borderColor: c1,
                tension: .3
            },
            {
                label: "Accuracy",
                data: accDataPts,
                fill: false,
                showLine: true,
                hidden: false,
                borderColor: c2,
                tension: .3
            }]
        };
        const config1 = {
            type: 'line',
            data: data1,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        labels: labels,
                        min: accDataPts[0].x,
                        max: accDataPts[accDataPts.length - 1].x,
                        type: 'linear',
                        position: 'bottom',
                        ticks: {
                            callback: function (value, index, ticks) {
                                //debug("[installDogStatGraph][tick cb] ", value, index, ticks.length);
                                //return tinyDateStr(new Date(value * 1000), true);
                                return tinyDateStr(new Date((value * 1000)), true);
                            },
                            minRotation: 45,
                            maxRotation: 45,
                            maxTicksLimit: 5,
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Attack/Accuracy'
                        },
                    }
                },
                plugins: { // For Chart.js v3 and later
                    legend: {
                        // onClick: (event, legendItem, legend) => {
                        //     let name = filterNameForDb (legendItem.text);
                        //     if (myChart != undefined) {
                        //         let found = false;
                        //         myChart.data.datasets.forEach((dataset, idx) => {
                        //             if (filterNameForDb(dataset.label) == name) {
                        //                 found = true;
                        //                 const currVis = myChart.isDatasetVisible(idx);
                        //                 hiddenItems[name] = currVis ? "hidden" : "visible";
                        //                 myChart.setDatasetVisibility(idx, !currVis);
                        //             }
                        //         });
                        //         if (found == true) {
                        //             myChart.update();
                        //             removeSpinner("marketGraph");
                        //         }
                        //     }
                        // },
                        // labels: {
                        //     filter: function(legendItem, chartData) {
                        //         if (hiddenItems[`${legendItem.text}`] == 'hidden') {
                        //             return false; // Hide this legend item
                        //         }
                        //         return true; // Show all other legend items
                        //     }
                        // }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                let label = context[0].label || '';
                                let time = parseFloat(label.replaceAll(',', '')) * 1000;
                                return tinyDateStr(new Date(time));
                            },
                        },
                    },
                }
            },
        };

        const data2 = {
            datasets: [
            {
                label: "Loyalty",
                data: loyDataPts,
                fill: false,
                showLine: true,
                hidden: false,
                borderColor: c1,
                tension: .3
            },
            {
                label: "Experience",
                data: expDataPts,
                fill: false,
                showLine: true,
                hidden: false,
                borderColor: c2,
                tension: .3
            }]
        };
        const config2 = {
            type: 'line',
            data: data2,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        labels: labels,
                        min: loyDataPts[0].x,
                        max: loyDataPts[loyDataPts.length - 1].x,
                        type: 'linear',
                        position: 'bottom',
                        ticks: {
                            callback: function (value, index, ticks) {
                                //debug("[installDogStatGraph][tick cb] ", value, index, ticks.length);
                                //return tinyDateStr(new Date(value * 1000), true);
                                return tinyDateStr(new Date((value * 1000)), true);
                            },
                            minRotation: 45,
                            maxRotation: 45,
                            maxTicksLimit: 5,
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Loyalty/Experience'
                        },
                    }
                },
                plugins: { // For Chart.js v3 and later
                    legend: {
                        // onClick: (event, legendItem, legend) => {
                        //     let name = filterNameForDb (legendItem.text);
                        //     if (myChart != undefined) {
                        //         let found = false;
                        //         myChart.data.datasets.forEach((dataset, idx) => {
                        //             if (filterNameForDb(dataset.label) == name) {
                        //                 found = true;
                        //                 const currVis = myChart.isDatasetVisible(idx);
                        //                 hiddenItems[name] = currVis ? "hidden" : "visible";
                        //                 myChart.setDatasetVisibility(idx, !currVis);
                        //             }
                        //         });
                        //         if (found == true) {
                        //             myChart.update();
                        //             removeSpinner("marketGraph");
                        //         }
                        //     }
                        // },
                        // labels: {
                        //     filter: function(legendItem, chartData) {
                        //         if (hiddenItems[`${legendItem.text}`] == 'hidden') {
                        //             return false; // Hide this legend item
                        //         }
                        //         return true; // Show all other legend items
                        //     }
                        // }
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                let label = context[0].label || '';
                                let time = parseFloat(label.replaceAll(',', '')) * 1000;
                                return tinyDateStr(new Date(time));
                            },
                        },
                    },
                },
            },
        };


        // ...instantiate the chart
        debug("[installDogStatGraph] chart: ", $('#myChart'));
        const ctx = $('#myChart')[0].getContext('2d');
        myChart = new Chart(ctx, config1);

        debug("[installDogStatGraph] chart: ", $('#myChart2'));
        const ctx2 = $('#myChart2')[0].getContext('2d');
        myChart = new Chart(ctx2, config2);
    }

    function startDogTracking() {
        if (dbReady == false) {
            dbWaitingFns.push(startDogTracking);
            return;
        }

        let doTest = GM_getValue("doDogTest", false);
        GM_setValue("doDogTest", false);
        debug("[startDogTracking] doTest: ", doTest);

        if (doTest == true) {
            doDogTest();
            //location.reload();
        }

        // Collect stats if needed
        let entry = doTest ? {} : JSON.parse(GM_getValue("dogTrainedOrFed", JSON.stringify({})));
        debug("[startDogTracking] entry: ", entry);
        if (entry["id"]) {
            collectDogStats(entry);
        }

        // Trap btn clicks
        let feedBtns = $("button.feedDog:not('.disabled')");
        let trainBtns = $("button.trainDog:not('.disabled')");

        //debug("[startDogTracking] btns: ", $(feedBtns), $("button.feedDog"), $(trainBtns), $("button.trainDog"));

        $(feedBtns).on('click', handleDogBtnClick);
        $(trainBtns).on('click', handleDogBtnClick);

        installDogStatsUI();
    }

    // ========================= Experimental: event logging ===========================

    var alertCheckTimer;
    function startEventLogging() {
        if (dbReady == false) {
            dbWaitingFns.push(startEventLogging);
            return;
        }
        debug("[startEventLogging] starting.");

        checkForAlertBox();
        let alertBox = $(".statusAlertBox");
        if ($(alertBox).length)
            createDataChangeObserver();
        else {
            alertCheckTimer = setInterval(checkForAlertBox, 2000);
            debug("[startEventLogging] interval timer started");
        }

        // Add observer to see if alert changes or pops up!!!

        // NEED BETTER TARGET, TOO BROAD!!! ???
        let target = $("#mainBackground > div > div > div.col-12");
        var alertObserver = new MutationObserver(function(mutationsList, observer) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes[0]) {
                    if ($(mutation.addedNodes[0]).hasClass("statusAlertBox")) {
                        debug("[startEventLogging]New node: ", $(mutation.addedNodes[0]));
                        debug("[startEventLogging]Val: ", mutation.addedNodes[0].nodeValue);
                    }
                    // getStatsForUser(node);
                    if ($(".statusAlertBox").length) {
                        alertObserver.disconnect();
                        debug("[startEventLogging] alertObserver stopped");
                        entryFromCurrentAlert();
                        createDataChangeObserver();
                    }
                }
            }
        });
        const config = { childList: true, subtree: true };
        alertObserver.observe($(target)[0], config);
        debug("[startEventLogging] alertObserver started");

        var stopChecking = false;
        var prevAlert;
        function checkForAlertBox() {
            if (stopChecking == true) return;
            let alertBox = $(".statusAlertBox");
            let msg = $(".statusAlertBox > div > p").text();
            if (msg && prevAlert && msg === prevAlert) {
                debug("[startEventLogging][checkForAlertBox] duplicate msg: ", msg, "\n", prevAlert);
                return;
            }

            let entry;
            if (msg && msg.length)
                entry = entryFromCurrentAlert();

            prevAlert = msg; // set AFTER entryFromCurrentAlert!!!

            if (entry) {
                dbAddEntryToStore(entry, privateEventsStoreName, null, addEventEntryCb, entry);
                stopChecking = true;
                if (alertCheckTimer) {
                    clearInterval(alertCheckTimer);
                    alertCheckTimer = null;
                    debug("[startEventLogging] interval timer cleared");
                }
            }
        }

        function createDataChangeObserver() {
            // characterData
            let target = $(".statusAlertBox");
            const dataChangeObserver = new MutationObserver(function(mutationsList, observer) {
                for (const mutation of mutationsList) {
                    if (mutation.type === ' characterData') {
                        debug("[startEventLogging] characterData mutation: ", mutation);
                    }
                }
            });
            const config = { childList: true, subtree: true, characterData: true };
            dataChangeObserver.observe($(target)[0], config);
            debug("[startEventLogging] dataChangeObserver started");
        }

        function entryFromCurrentAlert() {
            let alertBox = $(".statusAlertBox");
            let msg = $(".statusAlertBox > div > p").text();
             if (msg && prevAlert && msg === prevAlert) {
                 debug("[startEventLogging] [entryFromCurrentAlert] duplicate msg: ", msg);
                 return;
             }
             prevAlert = msg;

            let entry;
            if (msg && msg.length) {
                let now = new Date().getTime();
                entry = { dateTime: now, date: toShortDateStr(new Date()), msg: msg, path: location.pathname };
                debug("[startEventLogging][entryFromCurrentAlert] new entry: ", entry);
            }

            return entry;
        }

        function addEventEntryCb(result, param) {
            debug("[startEventLogging][addEventEntryCb] res: ", result, " param: ", param);
        }
    }

    // ============================== Merket Price Helper ===============================

    function startMarketPriceHelper(retries=0) {
        let inp = $("#itemSelector");
        debug("[startMarketPriceHelper] select: ", $(inp));

        if (!$(inp).length) {
            if (retries++ < 50) return setTimeout(startMarketPriceHelper, 100, retries);
            return debug("[startMarketPriceHelper] timed out");
        }

        $("#sellNav > .nav-tabs").append(getPriceDiv(1));

        $('#itemSelector').on('change', function() {
            let val = $(this).val(); // Get the new selected value
            let txt = $(this).find('option:selected').text();
            let name = txt.split('-')[0].trim();
            debug("[startMarketPriceHelper] val: ", val, " txt:", txt, " name: ", name);
            let val2 = $("#totalInput").val();
            let txt2 = $("#totalInput").text();
            debug("[startMarketPriceHelper] val2: ", val2, " txt2:", txt2);
        });


        function setPrice(value) {
            $("#priceper").val(value.toString());
        }

        function getPriceDiv(num) {
            GM_addStyle(`
                .tmp-class {
                    display: flex;
                    flex-flow: row wrap;
                    position: absolute;
                    right: 0;
                    margin-right: 10px;
                }
                .mkt-lbls {
                    align-content: center;
                    display: flex;
                    flex-flow: row wrap;
                    margin-right: 10px;
                }
                .tmp-input {
                    display: block;
                    padding: 0.375rem 0.75rem;
                    font-size: 1rem;
                    font-weight: 400;
                    line-height: 1.5;
                    color: var(--bs-body-color);
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    background-color: var(--bs-body-bg);
                    background-clip: padding-box;
                    border: var(--bs-border-width) solid var(--bs-border-color);
                    border-radius: var(--bs-border-radius);
                    transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
                }
                `);
            let node = `
                <div class="mb-3 tmp-class">
                    <label class="form-label mkt-lbls" for="priceper${num}" id="pricePer${num}Label">Suggested</label>
                    <input class="tmp-input allowAbbreviation" id="priceper${num}" name="priceper${num}" type="text" ` +
                    `placeholder="0" aria-described-by="pricePerLabel">
                </div>`;

            return $(node);
        }
    }

    // ======================= Buttons on refills page =================================

    // Arggg! Lose the button on refresh of page, need to save the fact wejust reloaded/refilled...
    function addQuickRefillBtns() {
        let tabs = $("#supporterNav > div > button");
        let activeTab = $("#supporterNav > div > button.active");
        let name = $(activeTab).attr("tab");
        debug("[addQuickRefillBtns] name: ", name, $(activeTab), $(tabs));

        $(tabs).off('click.xedx');
        $(tabs).on('click.xedx', doTabClick);

        if (name == 'refills') {
            handleRefillsPage();
        }

        function handleRefillClick(e) {
            event.stopPropagation();
            let url = $(this).attr('data-link');
            $(this).animate({"opacity": 0}, 250, function() {
                $(this).removeClass('show').addClass('hide');

                // *** Do same tab...
                //openInNewTab(url);
                window.location.href = url;
            });
        }

        /*
        Should wait (if not there but hidden) for #useRefillConfirm
        Way beneath that (deep child) is
        <button class="btn btn-danger w-100" type="button" data-bs-dismiss="modal">Cancel</button>
        and
        <button class="btn btn-success w-100" id="actionBtn" type="submit">Refill</button>
        (under div.container > div.row > div.col6, but one immediate under and one in a form)
        */
        function enableRefillLink(optBtn) {
            let btn = optBtn ? $(optBtn) : $(this).find('.refill-btn-wrap');
            let url = $(btn).attr('data-link');
            $(btn).animate({"opacity": 1}, 250);
            $(btn).removeClass('hide').addClass('show');
            $(btn).on('click.xedx', handleRefillClick);
        }

        function addRefillLinkBtn(node, title, type, url) {
            let btnId = `refill-${type}`;
            let btn = `<div id="${btnId}" class="refill-btn-wrap hide" data-link="${url}">` +
                `<button class="btn btn-success refill-btn">${title}</button></div>`;
            $(node).append(btn);

            debug("[handleRefillsPage] adding btn to ", type, " node: ", $(node), " btn: ", $(btn));

            $(node).on('click.xedx', function() {
                GM_setValue("refillState", JSON.stringify({ reloading: true, type: type, id: btnId }));
                //enableRefillLink($(`#${btnId}`));
            }); //enableRefillLink);

            let parentPos = $(`#${btnId}`).parent().position();
            let newTop = parentPos.top + 20 + 'px';
            let newLeft = parentPos.left + 15 + 'px';
            $(`#${btnId}`).css("top", newTop);
            $(`#${btnId}`).css("left", newLeft);
        }

        function handleRefillsPage() {
            let refillState = JSON.parse(GM_getValue("refillState", JSON.stringify({ reloading: false, type: '', id: '' })));
            let doShow = (refillState.reloading == true);
            debug("[handleRefillsPage] state: ", refillState, doShow);
            let refillBtns = $("#v-content-refills .card-body .row div");
            for (let idx=0; idx<$(refillBtns).length; idx++) {
                let btn = $(refillBtns)[idx];
                let type = $(btn).find("a").attr("data-bs-type");
                if (type == 'life') {
                    //continue;
                    // TESTING!!!
                    addRefillLinkBtn($(btn), "Test", type, "/User/15746");
                }
                if (type == 'energy') {
                    addRefillLinkBtn($(btn), "Gym", type, "/Gym");
                } else if (type == 'petshop') {
                    addRefillLinkBtn($(btn), "Pet Shop", type, "/PetShop");
                } else if (type == 'casino') {
                    addRefillLinkBtn($(btn), "Casino", type, "Casino");
                } else if (type == 'clubSlots') {
                    addRefillLinkBtn($(btn), "Julio's", type, "/Town/Club");
                } else if (type == 'achievement') {
                    addRefillLinkBtn($(btn), "Rewards", type, "/Achievements");
                }
            }
            if (doShow == true) {
                debug("[handleRefillsPage] doShow, node: ", refillState.id, $(`#${refillState.id}`));
                enableRefillLink($(`#${refillState.id}`));
                GM_setValue("refillState", JSON.stringify({ reloading: false, type: '', id: '' }));
            }
        }

        function doTabClick(e) {
            debug("[addQuickRefillBtns] doTabClick: ", e.currentTarget);
            setTimeout(addQuickRefillBtns, 100);
        }
    }

    // ================ Add materials owned stats to the Build page =====================

    function addEstateStats(response, status, xhr, id, param) {
        debug("[addEstateStats] result: ", response);
        // $("#classCollapse6 h3")[0]

        let jsonObj = JSON.parse(response);
        let data = jsonObj.inventory;

        debug("[addEstateStats] data: ", data);
        let btnHdrs = $("[id^='buildPropertyHeading']");
        debug("[addEstateStats] hdrs: ", $(btnHdrs));

        let qn = 0, qb = 0, qc = 0, qs = 0;
        let nails = data.find(item => item.itemId == 2000);
        if (nails) qn = nails["quantity"];
        let bricks = data.find(item => item.itemId == 2001);
        if (bricks) qb = bricks["quantity"];
        let conc = data.find(item => item.itemId == 2002);
        if (conc) qc = conc["quantity"];
        let steel = data.find(item => item.itemId == 2003);
        if (steel) qs = steel["quantity"];

        debug("[addEstateStats]\n", qn, nails, '\n', qc,  conc, '\n', qb, bricks, '\n', qs, steel);

        let currHtml = $($("#classCollapse6 h3")[0]).next().html();
        if (!currHtml) return debug("[addEstateStats] didn't find materials list");

        // 'x2000 Nails<br>x1200 Bricks <br>x750 Concrete Bags <br>x300 Steel'
        debug("[addEstateStats] ", currHtml);
        let tmp = currHtml.replaceAll(' ', 'x');

        let tmpParts = tmp.split('x');
        debug("[addEstateStats]  tmpParts: ", tmpParts);
        let rn = parseInt(tmpParts[1]);
        let rb = parseInt(tmpParts[3]);
        let rc = parseInt(tmpParts[6]);
        let rs = parseInt(tmpParts[10]);
        let parts = currHtml.split("<br>");

        //let nStr = `${parts[0]} (${qn}, ${rn - qn} to go)<br>${parts[1]} (${qb}, ${rb - qb} to go)<br>` +
        //    `${parts[2]} (own: ${qc}, req: ${rc - qc})<br>${parts[3]} (${qs}, ${rs - qs} to go)`;
        let nStr = `${parts[0]} (need ${rn - qn})<br>${parts[1]} (need ${rb - qb})<br>` +
            `${parts[2]} (need ${rc - qc})<br>${parts[3]} (need ${rs - qs})`;
        debug("[addEstateStats] new html: ", nStr);
        $($("#classCollapse6 h3")[0]).next().html(nStr);
    }

    // ======================== Process API cooldowns results ===========================

    const formatSecondsToTime = (totalSeconds) => {
        let time = new Date(totalSeconds * 1000).toISOString().slice(11, 19);
        debug("[cooldownsCallback] totalSeconds: ", totalSeconds, time);
        return time;
    };


    const minPerHr = 60;
    const maxMedCd = minPerHr * 12;
    const maxDrugCd = minPerHr * 24;
    const maxBoosterCd = minPerHr * 24;

    function installCooldownBars() {
        debug("[installCooldownBars]");
        GM_addStyle(`.nvis { visibility: hidden; }`);
        const minPerHr = 60;

        // <a id="lifeProgressBar" tabindex="0" role="button" data-bs-toggle="popover" data-bs-html="true" data-bs-trigger="hover focus"
        // data-bs-placement="bottom" data-bs-sanitize="false" data-bs-content="You'll gain 34 Life in 1m 41s<br>Full Life at 02:58 LPT"
        // data-bs-original-title="Life">

        const medCdNode =
            `<div id="medCdWrap"><div class="progress progressBarStat">
                <div class="progress-bar bg-info progress-bar-striped" id="medCdProgress" role="progressbar" style="Width: ${medCdPct}%"
                    aria-valuenow="${medCdNow}" aria-valuemin="0" aria-valuemax="${maxMedCd}" aria-label="Current Med CD"></div>
                <div class="progress-bar-title">
                    <span id="currentMedCd">0</span><span id="maxMedCd">${maxMedCd}</span>
                </div>
            </div></div>`;
        const drugCdNode =
            `
            <div id="drugCdWrap"><div class="progress progressBarStat">
                <div class="progress-bar bg-info progress-bar-striped" id="drugCdProgress" role="progressbar" style="Width: ${drugCdPct}%"
                    aria-valuenow="${drugCdNow}" aria-valuemin="0" aria-valuemax="${maxDrugCd}" aria-label="Current Drug CD"></div>
                <div class="progress-bar-title">
                    <span id="currentDrugCd">0</span><span id="maxDrugCd">${maxDrugCd}</span>
                </div>
            </div></div>`;
        const boosterCdNode =
            `<div id="boosterCdWrap"><div class="progress progressBarStat">
                <div class="progress-bar bg-info progress-bar-striped" id="boosterCdProgress" role="progressbar" style="Width: ${boosterCdPct}%"
                    aria-valuenow="${boosterCdNow}" aria-valuemin="0" aria-valuemax="${maxBoosterCd}" aria-label="Current Booster CD"></div>
                <div class="progress-bar-title">
                    <span id="currentBoosterCd">0</span><span id="maxBoosterCd">${maxBoosterCd}</span>
                </div>
            </div></div>`;

        let cdBar =
            `<ul id="player-cds" class="w-100 nav nav-pills mb-2 justify-content-center" style="display: none;">
                ${drugCdNode}
                ${medCdNode}
                ${boosterCdNode}
             </ul>`;

        let drugIcon = $("li.drugIcon").clone();
        let boosterIcon = $("li.boosterIcon").clone();
        let medIcon = $("li.medicalIcon").clone();

        $(drugIcon).removeClass("d-none").addClass("mtUp4");
        $(drugIcon).attr("id", "drugIcon2");
        $(boosterIcon).removeClass("d-none").addClass("mtUp4");
        $(boosterIcon).removeClass("boosterIcon");
        $(boosterIcon).attr("id", "boosterIcon2");
        $(medIcon).removeClass("d-none").addClass("mtUp4");
        $(medIcon).attr("id", "medicalIcon2");

        $("ul.playerstatusIcons").parent().after(cdBar);
        $("#player-cds").parent().css("position", "relative");
        $("#drugCdWrap").before(drugIcon);
        $("#medCdWrap").before(medIcon);
        $("#boosterCdWrap").before(boosterIcon);

        doStats();
        setInterval(doStats, 5000);
        addCdCaret();

        let cdBarState = GM_getValue('cdBarState', 'closed');
        GM_setValue('cdBarState', cdBarState);
        if (cdBarState == 'open') $("#cdCaret > i").click();

        // ==========

        function addCdCaret() {
            const cdCaretBtn = `<span id="cdCaret" class="col-cd-caret"><i class="fa fa-caret-right"></i></span>`;
            $("#topNavBtnWrap").append(cdCaretBtn);
            displayHtmlToolTip($(".col-cd-caret"), "Display cooldown bars");

            let tnh = $(".topNav").height();
            tnh = Number(tnh) + 24;
            GM_addStyle(`.add20 { height: ${tnh}px; max-height: ${tnh}px; }`);

            let inClick = false;
            $("#cdCaret > i").on('click', function(e) {
                if (inClick == true) return;
                inClick = true;
                $("#player-cds").slideToggle("slow", function () {
                    debug("[player-cds] click: ", $(this).is(':visible'));

                    if ($(this).is(':visible')) {
                        $(this).css('display', 'flex');
                        GM_setValue('cdBarState', 'open');
                        // $("#drugCdWrap").toggleClass("nvis");
                        // $("#medCdWrap").toggleClass("nvis");
                        // $("#boosterCdWrap").toggleClass("nvis");
                    } else {
                        GM_setValue('cdBarState', 'closed');
                    }
                    inClick = false;
                });
                $(this).toggleClass("fa-caret-right fa-caret-down");
                $(".topNav").toggleClass("add20");
                return false;
            });

        }

        // TEMP - already have a 'get stat' fn...
        function doStats() {
            ce_getUserStats(user_id, 'cooldowns', cooldownsCallback);
            logApiCount("cooldownsOnStatBar ce_getUserStats cooldowns");
        }

        var detachedLife, detachedMedCd;
        var savedLife;
        var medCdNow = 0, drugCdNow = 0, boosterCdNow = 0;
        var medCdPct = 0, drugCdPct = 0, boosterCdPct = 0;
        var medCdSecs = 0, boosterCdSecs = 0, drugCdSecs = 0;

        var progBarTimer;
        var progBarType = GM_getValue('progBarType', 'mins');    // 'pct', 'clock'
        GM_setValue('progBarType', progBarType);

        function updateProgBar(which) {
            switch (which) {
                case "med": {
                    medCdPct = parseInt((medCdNow / +maxMedCd) * 100);
                    if (progBarType == 'mins') {
                        $("#currentMedCd").text(medCdNow + ' / ');
                        $("#maxMedCd").text(maxMedCd);
                    } else if (progBarType == 'pct') {
                        $("#currentMedCd").text(medCdPct + "%");
                        $("#maxMedCd").text('');
                    } else { //if (progBarType == 'clock') {
                        $("#currentMedCd").text(secsToClock(+medCdSecs) + ' / ');
                        $("#maxMedCd").text(secsToClock(+maxMedCd * 60));
                    }

                    $("#medCdProgress").attr("style", `Width: ${medCdPct}%`);
                    break;
                }
                case "booster": {
                    boosterCdPct = parseInt((boosterCdNow / +maxBoosterCd) * 100);
                    if (progBarType == 'minss') {
                        $("#currentBoosterCd").text(boosterCdNow + ' / ');
                        $("#maxBoosterCd").text(maxBoosterCd);
                    } else if (progBarType == 'pct') {
                        $("#currentBoosterCd").text(boosterCdPct + "%");
                        $("#maxBoosterCd").text('');
                    } else { //if (progBarType == 'clock') {
                        $("#currentBoosterCd").text(secsToClock(+boosterCdSecs) + ' / ');
                        $("#maxBoosterCd").text(secsToClock(+maxBoosterCd * 60));
                    }

                    $("#boosterCdProgress").attr("style", `Width: ${boosterCdPct}%`);
                    break;
                }
                case "drug": {
                    drugCdPct = parseInt((drugCdNow / +maxDrugCd) * 100);
                    if (progBarType == 'mins') {
                        $("#currentDrugCd").text(drugCdNow + " / ");
                        $("#maxDrugCd").text(maxDrugCd);
                    } else if (progBarType == 'pct') {
                        $("#currentDrugCd").text(drugCdPct + "%");
                        $("#maxDrugCd").text('');
                    } else { //if (progBarType == 'clock') {
                        $("#currentDrugCd").text(secsToClock(+drugCdSecs) + ' / ');
                        $("#maxDrugCd").text(secsToClock(+maxDrugCd * 60));
                    }

                    $("#drugCdProgress").attr("style", `Width: ${drugCdPct}%`);
                    break;
                }
            }

            if (progBarType == 'clock' && !progBarTimer) {
                progBarTimer = setInterval(updateProgBarClocks, 1000);
            }

            function updateProgBarClocks() {
                if (drugCdSecs > 0) {
                    drugCdSecs = +drugCdSecs - 1;
                    $("#currentDrugCd").text(secsToClock(+drugCdSecs) + ' / ');
                }
                if (medCdSecs > 0) {
                    medCdSecs = +medCdSecs - 1;
                    $("#currentMedCd").text(secsToClock(+medCdSecs) + ' / ');
                }
                if (boosterCdSecs > 0) {
                    boosterCdSecs = +boosterCdSecs - 1;
                    $("#currentBoosterCd").text(secsToClock(+boosterCdSecs) + ' / ');
                }
            }
        }

        function cooldownsCallback(response, status, xhr, id) {
            const secsPerDay = 60 * 60 * 24;
            const cdDiffSecs = (d) => { return (d.getTime() - new Date().getTime()) / 1000; }
            const cdValid = (d) => { return (cdDiffSecs(d) > 0 && cdDiffSecs(d) < secsPerDay); }

            let data = JSON.parse(response);
            debug("[cooldownsCallback] data: ", data);

            let d = new Date(parseInt(data["drugCooldown"]) * 1000);
            let m = new Date(parseInt(data["medicalCooldown"]));
            let b = new Date(parseInt(data["boosterCooldown"] ));

            let timeNow = new Date().getTime();
            debug("[cooldownsCallback]\nDrug: ", d, cdValid(d), "\nMed: ", m, cdValid(m), "\nBooster: ", b, cdValid(b));

            drugCdSecs = cdDiffSecs(d);
            medCdSecs = cdDiffSecs(m);
            boosterCdSecs = cdDiffSecs(b);
            debug("[cooldownsCallback] As seconds...\nDrug: ",
                  drugCdSecs, secsToClock(drugCdSecs),
                  "\nMed: ", medCdSecs, secsToClock(medCdSecs),
                  "\nBooster: ", boosterCdSecs, secsToClock(boosterCdSecs));

            medCdNow = parseInt(medCdSecs / 60);
            if (medCdNow < 0) medCdNow = 0;
            updateProgBar("med");

            drugCdNow = parseInt(drugCdSecs / 60);
            if (drugCdNow < 0) drugCdNow = 0;
            updateProgBar("drug");

            boosterCdNow = parseInt(boosterCdSecs / 60);
            if (boosterCdNow < 0) boosterCdNow = 0;
            updateProgBar("booster");
            }
    }

    // ========================== code to vault cash balance ==========================
    /*
    const cash = parseInt(document.querySelector('.cashDisplay')?.textContent.replace(/,/g, '') || '0');
    if (cash === 0) return;

    const response = await fetch('/Property/Deposit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams({
            Cash: cash,
            propertyId: propertyId
        })
    });

    const text = await response.text();
    */

    // ============================= Add our own settings ===============================

    function handleSettingsBtn(e) {
        let fn = $(this).attr("data-fn");
        debug("[handleSettingsBtn] rebuildAttHist? ", $(this), fn);
        switch (fn) {
            case "rebuildAttHist": {
                // // https://cartelempire.online/api/user?type=attacks&key=CEB79213-5742-42F7-9C4
                // let opts = {"from": xxx, "to": xxx};
                let opts = null;
                debug("[rebuildAttHist] making API call");
                ce_executeApiCall('user', '', 'attacks', rebuildAttHist, opts);
                logApiCount("handleSettingsBtn ce_executeApiCall user");
                break;
            }
            case "exportDb": {
                debug("[database] exportDb clicked!");
                dbExportWholeDB();
                break;
            }
            case "importDb": {
                debug("[database] importDb clicked!");
                dbImportFromFile();
                break;
            }
            case "viewDb": {
                debug("[database] viewDb clicked!");
                break;
            }
            case "clearDb": {
                debug("[database] clearDb clicked!");
                break;
            }
            case "testAlerts": {
                testAlert();
                break;
            }
            default: {
                debug("[handleSettingsBtn] no handler defined for: ", fn);
                break;
            }

        }
    }

    function installSettings(retries=0) {
        let root = $("#settingsNav");
        let navTab = $("#settingsNav > div.nav.nav-tabs > button.active");

        if (!$(root).length || !$(navTab).length) {
            if (retries++ < 25) return setTimeout(installSettings, 100, retries);
            return log("[installSettings] timed out");
        }

        let tabId = $(navTab).attr("id");
        const selected = (tabId == "v-content-customize");
        debug("[settings] selected: ", selected, " id: ", tabId, " nav tab: ", $(navTab));

        let tabs = $("#settingsNav > div.nav-tabs");
        let content = $("#settingsNav .tab-content");

        debug("[installSettings]", $(tabs), $(content));

        const newTab = `
            <button class="nav-link settings-nav-link" id="v-tab-customize" data-bs-toggle="tab"
            data-bs-target="#v-content-customize" type="button" role="tab" aria-controls="v-content-customize"
            aria-selected="${selected.toString()}" tab="customize" tabindex="-1">Customize</button>`;
        $(tabs).append(newTab);

        $("#v-tab-customize").on('click', function(e) {
            let url = new URL(window.location.href);
            let searchParams = url.searchParams;
            searchParams.set('t', 'customize');
            url.search = searchParams.toString();
            history.replaceState(null, '', url.toString());
            });

        if (selected == false)
			$("#v-tab-customize").attr("tabindex", "-1");

        debug("[installSettings] new tab: ", $("#v-tab-customize"));

        appendSettingsHtml(content);
        //$(content).append(newContent);
        debug("[installSettings] appended content: ", $("#v-content-customize"));

        if (selected == true) {
            debug("[installSettings] adding active class");
			$("#v-content-customize").addClass("active show");
        }

        let optNames = Object.keys(options);
        debug("[installSettings] opt names: ", optNames);

        for (let idx=0; idx<optNames.length; idx++) {
            let name = optNames[idx];
            let entry = options[name];
            if (entry.visible == false) continue;
            let inputIdSelect = "#" + name;
            let on = entry.on;

            // Fixup changed group IDs
            if (defOptions[name] && defOptions[name].grp && defOptions[name].grp != entry.grp) {
                entry.grp = defOptions[name].grp;
                GM_setValue(name, JSON.stringify(entry));
            }

            debug("[settings] \nentry: ", entry, "\ndefOptions[name]: ", defOptions[name]);
            let grpEntry = groupIds[entry.grp];

            debug("[settings] entry.grp: ", entry.grp);
            if (!grpEntry) {
                console.error("No group entry for ", name, " entry: ", entry);
                continue;
            }
            let tblId = groupIdToId(grpEntry.id);
            debug("[installSettings] ", name, inputIdSelect, on);

            let row = getSettingsRow(name);
            debug("[installSettings] row before: ", row);
            $(`#${tblId}`).append($(row));
            debug("[installSettings] appended row: ", $(`#${tblId}`), $(inputIdSelect));

            $(inputIdSelect).prop('checked', on);
            $(inputIdSelect).on('change', handleSettingsChange);
        }

        $(".form-btn").on('click', handleSettingsBtn);
        $(".settings-input").on('change blur', handleSettingsValChange);

        function getSettingsRow(key) {
            let name = key;
            let entry = options[name];
            let enabled = entry.on;
            let isBtn = entry.btn && entry.btn == true;
            let input = `<span class="settingsVal">
                             <input class="settings-input text-center text-xl-start" name="${key}" type="number" value="${entry.val}">
                         </span>`;

            let addlClass = ``;
            if (entry.val) addlClass = "flex-r";

            let rowInput;
            if (!isBtn) {
                rowInput =
                    `<div class="form-check form-switch">
                        <input class="form-check-input" name="${key}" type="checkbox" id="${key}">
                    </div>`;
            } else {
                rowInput =
                    `<div class="form-btn-wrap">
                        <input class="btn btn-success form-btn" type="submit" data-fn="${entry["fn"]}" value="${entry["btnTxt"]}" id="${key}Btn">
                    </div>`;

                debug("xxxx[installSettings] Button: ", entry["fn"], entry);
            }

            let newRow =
                  `<tr class="align-middle settings-row" style="border-bottom-width: 1px;">
                      <td class="${addlClass}"><span>${entry.desc}</span>` + (entry.val ? `${input}` : ``) + `</td>
                      <td>${rowInput}</td>
                  </tr>`;

            return newRow;
        }

        function handleSettingsChange(e) {
            let name = $(this).attr("name");
            let entry = options[name];
            entry.on = $(this).prop('checked');
            GM_setValue(name, JSON.stringify(entry));

            // Some options may be able to be turned on/off dynamically without
            // refreshing. Is it worth doing that?
            doDynamicSettingsUpdate(name);
        }

        function handleSettingsValChange(e) {
            debug("[handleSettingsValChange]");
            let name = $(this).attr("name");
            let entry = options[name];
            let newVal = $(this).val();
            entry.val = newVal;
            GM_setValue(name, JSON.stringify(entry));
            //doDynamicSettingsUpdate(name);

            debug("[handleSettingsValChange] ", name, newVal, entry);
        }

        function doDynamicSettingsUpdate(key) {
            let entry = options[key];
            if (!entry) return;
            let enable = entry.on;

            switch (key) {
                case 'customClock': {
                    if (theClock && enable == false) {
                        theClock.remove();
                        theClock = null;
                    }
                    if (!theClock && enable == true) {
                        theClock = new CEClock();
                    }
                    break;
                }

                default: break;
            }
        }


        // =============================== Settings HTML ==================================

        function getTblBody(hdrText, bodyId) {
            debug("[settings][getTblBody] ", hdrText, bodyId);
            let tblEntry = `
                <div class="table-responsive">
                    <table class="table align-items-center table-flush table-hover dark-tertiary-bg">
                            <thead class="thead-light">
                                <tr><th>${hdrText}</th><th>Enabled</th></tr>
                            </thead>
                            <tbody id="${bodyId}">

                            </tbody>
                    </table>
                 </div>`;
            return tblEntry;
        }

        function appendSettingsHtml(content) {
            debug("[settings][appendSettingsHtml]");
            const subBtn = `<input class="btn btn-success mt-2" type="submit" value="Update Custom Pages" id="submitCustomPagesBtn">`;
            let settingsHtml = `
                <div class="tab-pane fade" id="v-content-customize" role="tabpanel" aria-labelledby="v-tab-customize">
                    <div class="card">
                        <div id="cust-opts" class="card-body">

                        </div>
                    </div>
                </div>`;

            $(content).append(settingsHtml);

            let ids = Object.keys(groupIds);
            for (let idx=0; idx<ids.length; idx++) {
                let groupId = ids[idx];
                let entry = groupIds[groupId];
                let tblId = groupIdToId(entry.id);
                let newTbl = getTblBody(entry.title, tblId);

                $("#cust-opts").append(newTbl);
            }
            $("#cust-opts").append(subBtn);

            debug("[settings][appendSettingsHtml] ", $("#v-content-customize"));

            //return $(settingsHtml);
        }
    }

    // ============================ Bat Stat estimates =======================================

    /*
    calcFairFight(ownStats, theirStats) {
		return Math.min(this.maxFF, Math.max(this.minFF, 1 + this.constant * theirStats / ownStats));
	}
	estimateRep(level, fairFight) {
		return (this.repQuadratic ? Math.pow(level + 1, 2) * this.repA + this.repC : Math.exp(level * this.repM + this.repC)) * fairFight;
	}
	estimateYouAttacked(ownStats, fairFight) {
		if(fairFight === this.minFF)
			return [ '<', Math.ceil(this.cutoff / this.constant * ownStats).toLocaleString("en-US") ];
		return [ fairFight === this.maxFF ? '>' : '~', Math.floor(Math.max(this.minStats, (fairFight - 1) / this.constant * ownStats)).toLocaleString("en-US") ];
	}
	estimateAttackedYou(ownStats, fairFight) {
		if(fairFight === this.minFF)
			return [ '>', Math.floor(this.constant * ownStats / this.cutoff).toLocaleString("en-US") ];
		return [ fairFight === this.maxFF ? '<' : '~', Math.ceil(Math.max(this.minStats, this.constant * ownStats / (fairFight - 1))).toLocaleString("en-US") ];
	}
    */

    var statEstimate;
    function startStatsEst() {
        if (!statEstimate) return debug("[startStatsEst] not enabled.");

        if (isFightResults() == true)
            statEstimate.inFight(thisURL);
        else if (hasPath('cartel'))
            statEstimate.inBountyOrOtherCartel(thisURL);
        else if (hasPath('events'))
		    statEstimate.inEvents(thisURL);
        else if (hasPath('home'))
		    statEstimate.inHomepage(thisURL);
        else if (hasPath('user') && !hasPath('search'))
		    statEstimate.inUserProfile(thisURL);
        else if(hasPath('statestimate') || statEstimate?.statEstimateRegex.test(thisURL))
		    statEstimate.inStatEstimate(URL);
        else if (hasPath('search'))
            statEstimate.inSearch(URL);
        else if (hasPath('bounty'))
            statEstimate.inBountyOrOtherCartel(thisURL);
        else if (hasPath('gym'))
            statEstimate.inGym(thisURL);
        else {
            return debug("[startStatsEst] did not match page: ", thisURL);
        }

        debug("[startStatsEst] estimator started for path: ", thisURL);
    }

    // ============================ Personal Stats Graphs =================================

    function startStatsGraphs() {
        debug("[startStatsGraphs]");
        return new Promise((resolve, reject) => {
            let now = new Date().getTime();
            let lastStatUpdate = parseInt(GM_getValue("lastStatUpdate", 0));
            let diffSecs = parseInt(now/1000 - lastStatUpdate/1000);
            if (diffSecs < secsInDay) {
                //return Promise.resolve("[startStatsGraphs] Stats are up to date");
                resolve("[startStatsGraphs] Stats are up to date");
                return;
            }

            if (updateStats()) resolve("[startStatsGraphs]: update started OK");

            reject("[startStatsGraphs]: updateStats failed!");
        });

        function updateStats() {
            debug("[startStatsGraphs][updateStats]");
            return true;
        }
    }

    // ====================== Called when DOM has been loaded ===================
     // Shorthand for the result of a promise, here, they are just logged
    // promise.then(a => _a(a), b => _b(b));
    // instead of
    // promise.then(result => {<do something with success result>}, error => {<do something with error result>});
    function _a(result) {log('[SUCCESS] ', result);
                         //log("REMINDER: Finish addressing this!");
                         //if (result == undefined) debugger;
                        }
    function _b(error) {
        //let wrongPage = error.toString().indexOf('wrong page') > -1 || // Suppress 'wrong page' errors for now. Change to resolve's?
        //    error.toString().indexOf('not at home') > -1
        //if (!wrongPage) {
            log('[ERROR] ', error);
        //    if (enableDebugger == true) debugger;
        //}
    }

    //
    // TBD: convert all (or most) of these to promises!!!
    //
    //
    function handlePageLoad(retries=0) {
        debug("[handlePageLoad]: ", location.href);

        const urlParams = new URLSearchParams(window.location.search);

        if (GM_getValue("migrateFightResults", false) == true)
            migrateFightResults();
        GM_setValue("migrateFightResults", false);

        // TEST TEST experimental
        startEventLogging();

        // Test: fake init a new DB object store
        if (GM_getValue("doEventLogTest", false) == true) {
            function testCb(res) {
                debug("[database][testCb] res: ", res);
                GM_setValue("doEventLogTest", false)
            }

            function doEventLogTest() {
                debug("[database][testCb][doEventLogTest]");
                ce_getEventsLogCat("Jobs", testCb);
                logApiCount("doEventLogTest ce_getEventsLogCat");
            }

            if (dbReady == false) {
                debug("[database][testCb] db not ready for test");
                dbWaitingFns.push(doEventLogTest);
            } else {
                debug("[database][testCb] call test");
                doEventLogTest();
            }
        }
        GM_setValue("doEventLogTest", false)

        // TESTING: long press
        if (options.miniProfiles.on == true) { addChatLpHandlers(); }
        function addChatLpHandlers(retries=0) {
            let chatHrefs = $(".lastActiveContainer").next();
            debug("[longpress] chatHrefs: ", $(chatHrefs));
            if (!$(chatHrefs).length) {
                if (retries++ < 25) return setTimeout(addChatLpHandlers, 200, retries);
                return log("[longpress] addChatLpHandlers timed out.");
            }
            for (let idx=0; idx< $(chatHrefs).length; idx++) {
                let tag = $($(chatHrefs)[idx]).get(0).tagName;
                if (tag) tag = tag.toLowerCase();
                let href;
                let name = $($(chatHrefs)[idx]).text();
                if (tag == 'a')
                    href = $($(chatHrefs)[idx]).attr('href');
                if (tag == 'span')
                    href = $($(chatHrefs)[idx]).closest("label.chat-btn").next().find("div.lastActiveContainer").next().attr('href');
                let id = idFromHref(href);

                debug("[longpress] adding handler to ", tag, href, $($(chatHrefs)[idx]));

                addLongPressHandler($(chatHrefs)[idx], longPressOnChat, {"href": href, "name": name, "id": id});
            }
        }

        if (isProductionPage() == true) {
            if (options.fixupProductionPage.on == true)
                doProdPageMods();
        }

        if (options.statEstimates.on == true) {
            statEstimate = new StatEstimate(darkMode);
            startStatsEst();
        }

        if (options.displayJobStatus.on == true) {
            if (isJobsPage()) {
                hookJobStart();
            } else {
                getJobStartedTime();
            }
        }

        if (options.showExpOverview.on == true && isExpeditionsPage()) {
            startExpeditionOverview();
        }

        if (isExpeditionsPage()) {
            if (options.showExpOverview.on == true) startExpeditionOverview();
            if (options.showExpSuccessRates.on == true) trackExpeditionSuccessRates();

        }

        if (options.displayExpStatus.on == true) {
            var expAlerter = new BrowserAlert({title: "Expedition Alert", msg: "Expedition Complete!", type: "exp", timeout: 60});
            if (isExpeditionsPage()) {
                debug("isExpeditionsPage, hookExpeditionStart");
                hookExpeditionStart();
            } else {
                debug("!isExpeditionsPage, addExpeditionTimers");
                addExpeditionTimers();
            }
        }

        // Move stakeouts - load on any page and update hosp time!!!!
        if (isFriendsEnemiesPage()) {
            let isFriends = $("#friends-tab").hasClass('active');
            let isEnemies = $("#enemies-tab").hasClass('active');

            if (options.enemyHospTime.on == true) processEnemiesPage();
            else if (options.enableStakeouts.on == true) processEnemiesPage();
            else if (options.recordFightHistory.on == true) processEnemiesPage();
        }

        if (isFightResults() == true) {
            if (options.recordFightHistory.on == true || options.invertFightResults.on == true) {
                processfightResultsPage();
            }
        }

        if (isUserPage() == true) {
            if (options.recordFightHistory.on == true) {
                addFightHistoryToUser();
            }

            if (options.bountyPageNoAttackMug.on == true) {
                debug("[bountyPageNoAttackMug] href: ", location.href, "\nrefferer: ", urlParams.get("referrer"));
                if (urlParams.get("referrer") == "bounties") {
                    handleBountiesHospOnly();
                }
            }
        }

        if (options.collapsibleHdrs.on == true) {
            addCollapseCarets();
        }

        if (isTownPage()) {
            if (options.linksOnTownImages.on == true)
                addTownLinks().then(a => _a(a), b => _b(b));
            if (options.fasterStoreSales.on == true) {
                let parts = location.pathname.split("/Town/");
                if (parts && parts.length > 1) {
                    handleFasterStoreSales(parts[1]);
                }
            }
        }

        if (isBountyPage()) {
            if (options.bountyPageHospStatus.on == true || options.bountyPageNoAttackMug.on == true) {
                processBountiesPage();
            }
        }

        if (options.sortableCartelPage.on == true && isCartelPage()) {
            processCartelPage();
        }

        if (isMarketPage()) {
            if (options.saveMarketPrices.on == true) {
                collectMarketPrices();
            }

            if (options.itemHelpInMarket.on == true) {
                addItemMarketHelp();
            }

            if (options.marketPriceHelper.on == true) {
                // $("#priceper").val("40000")
                startMarketPriceHelper();
            }
        }

        if (isInventoryPage()) {
            if (options.trackDogTraining.on == true) startDogTracking();
        }

        if (isEstateAgent()) {
            debug("On estate page...");
            //if (urlParams.get('t') == 'build') {
                debug("[ce_executeApiCall] inventory");
                ce_executeApiCall('inventory', null, 'advanced', addEstateStats);
                logApiCount("ce_executeApiCall 'inventory'");
            //}
        }

        if (options.personalStatsGraphs.on == true) {
            startStatsGraphs().then(a => _a(a), b => _b(b));
        }


    // ================= experimental sidebar

        /*
        $("#mainBackground > div").css({"display": "flex", "margin-left": "40px"});
        $("#mainBackground > div").prepend(
            `<div id='sidebar-test' style="width:50px; height:100%;position:sticky;border: 1px solid green;"></div>`);
        $("#sidebar-test").append($("#userDropdownDesktop > div:nth-child(2) > div:nth-child(2) > li:nth-child(6)").clone(true));
        $("#sidebar-test").next().css("width", "1090px");
        */

//         if (isMarketPage() && options.marketKeepTabOnUnload.on == true) {
//             preserveMarketTabs();
//         }
    }

    //
    // ========================= Called at script start =========================
    //
    function handleLoadStarting(retries=0) {
        if (options.cashOnHandAlert.on == true) {
            cashWatcher = new cashOnHandWatcher();
        }
        if (options.customClock.on == true) {
            theClock = new CEClock();
        }
        if (options.lockStatusBar.on == true) {
            var lock = new StatusBarLock();
        }
        if (options.townContextMenu.on == true) {
            addContextMenuStyles();
            addTownContextMenu();
        }
        if (options.progBarClickToGym.on == true) {
            addProgBarLinks();
        }
        if (isSettingsPage() == true) {
            installSettings();
        }
        if (options.cooldownsOnStatBar.on == true) {
            debug("Calling installCooldownBars");
            installCooldownBars();
        }
        if (options.gymLock.on == true) theGymLock = new ceGymLock();
        if (options.enableStakeouts.on == true) {
            openBroadcastChannel();
            startStakeoutsRunning();
        }
        if (options.installFavoritesMenu.on == true) {
            installFavoritesMenu();
        }
        if (isMarketPage() && options.itemHelpInMarket.on == true) {
            let now = new Date().getTime();
            let entry = JSON.parse(GM_getValue("itemsDbInitialized",
                                               JSON.stringify({ init: false, when: 0 }) ));
            if (entry == null || typeof entry != 'object')
                entry = { init: false, when: 0 };

            let dbNeedsInit = (!entry || !entry.init || ((now - entry.when) / 1000 / 60 / 60) > 12);

            debug("[database] itemsDbInitialized entry: ", entry, dbNeedsInit, (((now - entry.when) / 1000 / 60 / 60) > 12));

            //let dbInitialized = GM_getValue("itemsDbInitialized", false);
            if (dbNeedsInit == true) {
                GM_setValue("itemsDbInitialized", JSON.stringify( { init: false, when: 0 } ));
                getAllAvailableItems();
                //ce_getItemsList('advanced', itemsApiCallback);
            }
        }
        if (isExpeditionsPage() && options.showExpSmallFormat.on == true) {
            GM_addStyle(`
                .px-2 { /*display: none !important;*/ }
                .col-xxl-4 {
                    flex: 0 0 auto;
                    width: 33.33%;
                }
                #v-content-expeditions div.col-xxl-4:nth-child(3) {
                    margin-bottom: 1rem !important;
                }
            `);
        }
        if (isSupporterPage()) {
            if (options.refillQuickLinks.on == true) {
                addRefillStyles();
                addQuickRefillBtns();
            }
        }
    }

    // ========================= Called when unloading ==========================

    function handlePageUnload() {
        debug("[handlePageUnload]");
        let entry = { "href": location.href, "time": (new Date().getTime()) };
        GM_setValue("prevPage", JSON.stringify(entry));

//         const urlParams = new URLSearchParams(window.location.search);
//         if (options.marketKeepTabOnUnload.on == true && isMarketTab()) {
// 		    const selected = urlParams.get("p");
//             GM_setValue("lastMktTab", selected);
//         }
        //debugger;
    }

    // ======================== Called on hash change ===========================
    function hashChangeHandler() {
        debug("[hashChangeHandler]: ", location.href);
        debugger;
        //callOnContentLoaded(handlePageLoad);
    }

    //////////////////////////////////////////////////////////////////////
    // Main, set up everything to run
    //////////////////////////////////////////////////////////////////////

    logScriptStart();
    debug("Start Time: ", timeStamp());
    debug("[CE_Custom startup] Debug logging is enabled");
    addStyles();
    validateApiKey();

    callOnVisibilityChange(onVisChange);

    debug("[database] Opening DB: ", timeStamp());

    // let dbOpenResult = dbOpenDatabaseSync(false);
    // debug(timeStamp(), " [database] openDatabase2 result: ", dbOpenResult);

    dbOpenDatabase(false).then(result => {
        log(timeStamp(), " [database] openDatabase result: ", result);
    }).catch(error => {
        debug(timeStamp(), " [database] caught error: ", error);
    });

    debug("[CE_Custom startup] user_id: ", user_id);
    debug("[CE_Custom startup] thisURL: ", thisURL, " path: ", location.pathname);

    window.onunload = function() { handlePageUnload(); };

    callOnHashChange(hashChangeHandler);

    handleLoadStarting();

    callOnContentLoaded(handlePageLoad);

    // ===============================================================================

    function addStyles() {

        // Testing/dev
        GM_addStyle(`
            .so_delayed { color: #f0f00ca8 !important; }
            .so_cached {
                color: green !important;
                filter: brightness(1.4);
            }
        `);

        // tool-tips
        addToolTipStyle();
        GM_addStyle(`.tooltip4.itemHlp { max-width: 300px; }`);

        // Alert boxes
        GM_addStyle(`
            .xalertBg {
                background: linear-gradient(180deg, #333333 6%, #000 50%, #333333 95%);
            }
            .p2 {
                justify-content: center;
                display: flex;
            }
        `);

        // Font Awesome support
        GM_addStyle('@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css");');

        // graphs/charts, price history
        GM_addStyle(`
            .priceHistoryBtn {
                width: 80px !important;
                font-size: 12px;
                height: 20px;
                margin-top: 4px;
                padding: 0px 10px 2px 10px;
            }
            .graphBtn {
                height: 18px;
                display: flex;
                cursor: pointer;
                flex-flow: row wrap;
                align-content: center;
                padding-bottom: 7px;
                margin-left: 10px;
            }
            .closeBtnWrap {
                position: absolute;
                top: 6px;
                right: 44px;
                display: flex;
                flex-flow: row wrap;
            }
        `);

        // Bounties page
        GM_addStyle(`
            .bstatus {
                padding-left: 10px;
            }
        `);

        GM_addStyle(`
            .blink182 { animation: blinker 1.8s linear infinite; }
            @keyframes blinker {
                0%, 100% {opacity: 1;}
                50%, 70% {opacity: .3;}
            }

            .xhide { display: none; }
            .tooltipMisc { position: relative; }
        `);

        // Spinner used when loading historical prices
        // Styles for a 'spinner' when doing something that may take a bit.
        //function addSpinLoaderStyles() {
            GM_addStyle(`
                .spinLoader {
                  border: 16px solid #f3f3f3; /* Light grey */
                  border-top: 16px solid #3498db; /* Blue */
                  border-radius: 50%;
                  width: 120px;
                  height: 120px;
                  animation: spin 2s linear infinite;
                  z-index: 9999999;
                  position: fixed !important;
                  top: 50%  !important;
                  left: 50% !important;

                }

                @keyframes spin {
                  0% { transform:  translate(-50%,-50%) rotate(0deg); }
                  100% { transform:  translate(-50%,-50%) rotate(360deg); }
                }
            `);
        //}

        // Edit favorites dialog
        GM_addStyle(`
            #favesMenu ul {
                top: 16px;
                overflow-y: scroll;
            }
            .fes2 {
                cursor: pointer;
                border: 1px solid #ccc;
                width: 18px;
                height: 18px;
                border-radius: 18px;
                align-content: center;
                display: flex;
                flex-flow: row wrap;
                justify-content: center;
                margin-top: 4px;
            }
            .fes2:hover {
                background: #fff;
                filter: brightness(1.2);
                color: black;
                transform: scale(1.2);
            }
            #FavesEdit {
                /* margin-top: 6%; */
            }
            #FavesEdit .inner,
            #FavesHelp .inner {
                margin: 20px;
                background-color: black;
                border-radius: 15px;
                border: 2px solid white;
                height: 75%;
                max-height: 75%;
                overflow-y: scroll;
            }
            #FavesEdit li {
                width: 90%;
                margin-right: 22px;
                margin-top: 4px;
            }
            #FavesEdit ul, #FavesHelp p {
                margin-top: 10px;
                max-height: 320px;
                overflow-y: scroll;
                display: flex;
                flex-direction: column;
            }
            #FavesHelp p {
                font-size: 16px;
                padding: 10px;
            }
            #FavesEdit .footer,
            #FavesHelp .footer {
                position: fixed;
                left: 0;
                bottom: 0;
                width: 100%;
                display: flex;
                flex-flow: row wrap;
                justify-content: space-evenly;
                align-content: center;
                padding-bottom: 10px;
            }
            #FavesEdit .footer button,
            #FavesHelp .footer button {
                width: 64px;
            }
            .btn-fav-help {
                width: 18px !important;
                height: 18px !important;
                border-radius: 18px !important;
                align-content: center;
                display: flex;
                flex-flow: row wrap;
                justify-content: center;
                margin-top: 7px;
                cursor: pointer;
            }
            .faveLink {
                display: flex;
            }
            .fav-edit-span {
                background-color: #eeeeee;
                border: 1px solid white;
                border-radius: 6px;
                display: flex;
                padding: 1px 10px 1px 10px;
                color: black;
                text-align: center;
                justify-content: center;
                width: 100%;
            }
            .fes2 {
                /* position: absolute;
                right: 39px; */
                position: static;
                margin-right: -39px;
            }
            .xopts-ctr-screen {
                position: fixed !important;
                top: 50%  !important;
                left: 50% !important;
                -ms-transform: translateX(-50%) translateY(-50%)  !important;
                -webkit-transform: translate(-50%,-50%) !important;
                transform: translate(-50%,-50%) !important;
            }
            .xopts-bg {
                background: #212529;
                width: 360px !important;
                height: 380px !important;
            }
            .xopts-def-size {
                width: 360px !important;
                height: 380px !important;
            }
            .xopt-border-ml6 {
                border-radius: 15px;
                box-shadow: 0 29px 52px rgba(0,0,0,0.40), 0 25px 16px rgba(0,0,0,0.20);
            }
            .xopt-border-ml7 {
                border-radius: 15px;
                box-shadow: 0 45px 65px rgba(0,0,0,0.50), 0 35px 22px rgba(0,0,0,0.16);
            }
            .xopt-border-ml8 {
                border-radius: 15px;
                box-shadow: 0 60px 80px rgba(0,0,0,0.60), 0 45px 26px rgba(0,0,0,0.14);
            }
            .xopts-border-10 {
                border-radius: 15px;
                box-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px;
            }
            .xopts-border-27 {
                border-radius: 15px;
                box-shadow: rgba(50, 50, 93, 0.25) 0px 30px 60px -12px inset, rgba(0, 0, 0, 0.3) 0px 18px 36px -18px inset;
            }
        `);

        // Enemies page
        GM_addStyle(`
            .warn-on-rel { position: absolute; right: 0; padding-right: 20px; }
            .hosp-red { color: #c54141; }
            .hosp-green { color: green; }
        `);

        // Bounties page
        GM_addStyle(`
            td[id^='bty-'],
            .bcaret, .bcaret > i {
                border-bottom: 0px solid;
                border-bottom-color: inherit;
            }
            .bcaret {
                height: 32px;
            }
        `);

        // Settings page
        GM_addStyle(`
            #cust-opts tbody tr:first-child {
                /* border-top-width: 1px; */
            }
            #cust-opts tr td:first-child {
                padding-left: 20px;
                width: 84%;
            }
            #cust-opts tr td:last-child {
                width: 16%;
                padding-left: 20px;
            }

            #cust-opts thead tr:first-child {
                margin-top: 10px;
            }
            #cust-opts tr th:first-child {
                width: 84%;
                font-size: 16px;
            }
            #cust-opts tr th:last-child {
                width: 16%;
            }
            .flex-r {
                display: flex;
            }
            .settingsVal {
                position: absolute;
                right: 0;
                margin-right: 200px;
            }
            .settings-input {
                display: block;
                width: 120px;
                /* margin-top: -2px; */
                padding: 0px 0px 2px 10px;
                font-size: 1rem;
                font-weight: 400;
                line-height: 1.5;
                color: var(--bs-body-color);
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance: none;
                background-color: var(--bs-body-bg);
                background-clip: padding-box;
                border: var(--bs-border-width) solid var(--bs-border-color);
                border-radius: var(--bs-border-radius);
                transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
            }
            .settings-row {
                border-bottom-width: 1px;
            }
            .settings-row td {
                border-bottom-width: 0px;
            }
            .form-btn  {
                height: 20px;
                width: 64px;
                display: flex;
                cursor: pointer;
                flex-flow: row wrap;
                align-content: center;
                padding-top: 4px;
                line-height: 0.8;
            }
            .form-btn-wrap {
                /* position: absolute;
                top: 6px;
                right: 44px; */
                display: flex;
                flex-flow: row wrap;
            }
        `);

        // Expedition overview table styles
        if (options.showExpOverview.on == true) {
            GM_addStyle(`
                #tbl-cont table {
                    margin-bottom: 10px;
                    min-width: 100%;
                    border: 1px solid blue;
                }
                #tbl-cont table tr {
                    width: 100%;
                    height: 22px;
                }
                #tbl-cont table tr td {
                    border: 1px solid green;
                    align-items: center;
                    padding: 0px;
                }
                #tbl-cont table tr:not(.minstat):not(.maxstat) td {
                    color: #dddddd;
                }
                #tbl-cont table tr td:first-child {
                    border-left: 1px solid blue;
                }
                #tbl-cont table tr td:last-child {
                    border-right: 1px solid blue;
                }
                #tbl-cont table tr:last-child,
                #tbl-cont table tr:last-child td {
                    border-bottom: 1px solid blue;
                    vertical-align: middle;
                }

                #tbl-cont table tr.minstat th.td-lh {
                    font-weight: bold;
                    color: #dddddd;
                }

                .b-border { border: 1px solid blue !important; }
                .maxStat > td, span.maxStat { color: limegreen !important; }
                .minStat > td, span.minStat { color: #c8c820 !important; }

                .rank5 {
                     /* background-color: rgba(255, 20, 0, 0.2) !important; */
                     filter: brightness(1.7);
                     background: linear-gradient(
                        to right,
                        rgba(255, 0, 0, 1) 0%, /* Fully transparent red at the start */
                        rgba(255, 0, 0, 1) 20%, /* Fully opaque red at 50% mark */
                        rgba(255, 0, 0, 0) 100% /* Remains fully opaque red to the end */
                      );
                }
                .rank6 {
                     filter: brightness(1.7);
                     background: linear-gradient(
                        to right,
                        rgba(255, 0, 0, 1) 0%, /* Fully transparent red at the start */
                        rgba(255, 0, 0, 1) 40%, /* Fully opaque red at 50% mark */
                        rgba(255, 0, 0, 0) 100% /* Remains fully opaque red to the end */
                      );
                }
                .rank7 {
                     filter: brightness(1.7);
                     background: linear-gradient(
                        to right,
                        rgba(255, 0, 0, 1) 0%,
                        rgba(255, 0, 0, 1) 60%,
                        rgba(255, 0, 0, 0) 100%
                      );
                }
                .rank8 {
                     filter: brightness(1.7);
                     background: linear-gradient(
                        to right,
                        rgba(255, 0, 0, 1) 0%,
                        rgba(255, 0, 0, 1) 80%,
                        rgba(255, 0, 0, 0) 100%
                      );
                }
                .rank9 {
                     filter: brightness(1.7);
                     background: linear-gradient(
                        to right,
                        rgba(255, 0, 0, 1) 0%, /* Fully transparent red at the start */
                        rgba(255, 0, 0, 1) 100%, /* Fully opaque red at 50% mark */
                        rgba(255, 0, 0, 1) 100% /* Remains fully opaque red to the end */
                      );
                }
            `);
        }

        // Cooldown bars
        GM_addStyle(`
            #player-cds {
                /*border: 1px solid blue;*/
                margin-top: -4px;
                display: flex;
                position: absolute;
                top: 32px;
                background-color: rgb(33, 37, 41);
            }
            .mtUp4 {
                margin-top: -4px;
            }
            #medCdWrap, #boosterCdWrap, #drugCdWrap {
                width: 200px;
                height: 18px;
                margin: 0px 5px 4px 5px;
            }
            /* .add20 {
                height: 136px; /* calc(100% + 20px);*/
            } */
        `);

        // Carets (little arrows) for collapsible headers/bodies
        GM_addStyle(`
            .col-caret {
                position: absolute;
                cursor: pointer;
                transition: all .2s ease-in-out;
                top: 4px;
                right: 12px;
                font-size: 16px;
            }
            .col-cd-caret {
                position: relative;
                cursor: pointer;
                transition: all .2s ease-in-out;
                font-size: 16px;
                margin-left: 10px;
            }
            .col-caret:hover {
                transform: scale(1.6);
                filter: brightness(1.2);
                color: #fdc128;
            }
            .col-cd-caret:hover {
                transform: scale(1.2);
                filter: brightness(1.1);
                color: #fdc128;
            }
            .pr {
                position: relative;
            }
            .col-caret > .fa-caret-right {
                color: #fdc128;
            }
            .csave {
                opacity: 0;
                transition: opacity .5s ease-out;
                -moz-transition: opacity .5s ease-out;
                -webkit-transition: opacity .5s ease-out;
                -o-transition: opacity .5s ease-out;
            }
            .csave input {
                margin: 0px 20px 0px 10px;
            }
            .csave:hover {
                opacity:1;
            }
        `);

        GM_addStyle(`
            .topNav {
                width: 100%;
            }
            #nav-wrap {
                display: flex;
                flex-direction: column;
            }
            .fixed-status {
                height: 58px;
                padding-top: 6px;
            }
        `);

        if (options.displayJobStatus.on == true || options.displayExpStatus.on == true) {
            GM_addStyle(`
                #myProgMessage {
                    font-size: 16px !important;
                    cursor: pointer;
                    margin: 0px 10px 0px 10px;
                }
                #myProgMessage:hover, [id^='myExpProgMessage']:hover {
                    transform: scale(1.1);
                    filter: brightness(1.2);
                }
                [id^='myExpProgMessage'] {
                    font-size: 16px !important;
                    cursor: pointer;
                    margin: 0px 10px 0px 10px;
                }
                /* [id^='myExpProgMessage']:hover {
                    transform: translateX(10px);
                } */
            `);
        }
    }

    function addRefillStyles() {
        GM_addStyle(`
            .refill-btn-wrap {
                position: absolute;
                opacity: .2;
                width: 100px;
            }
            .refill-btn-wrap.hide {
                pointer-events: none;
            }
            .refill-btn-wrap.show {
                pointer-events: auto;
                cursor: pointer;
            }
            .refill-btn {
                width: 100px;
            }
        `);
    }

    function addStatStyles() {
        GM_addStyle(`
            .ss-hide { display: none !important; }
            #stat-wrap-inner {
                justify-content: center;
                margin: 10px 0px;
            }
            #statsContainer {
                display: flex;
                flex-direction: column;
                justify-content: center;
                margin-bottom: 10px;
            }
            #dog-stats {
                width: 90%;
                max-height: 300px;
                overflow-y: scroll;
            }
            .dog-btn-wrap {
                align-content: center;
                display: flex;
                flex-flow: row wrap;
                justify-content: center;
            }
            .dog-btn {
                height: 26px;
                display: flex;
                flex-flow: row wrap;
                justify-content: center;
                align-content: center;
            }
            #stats-tbl {
                width: 100%;
                table-layout: auto;
            }
            #stats-tbl tbody {
                /* overflow-y: scroll; */
            }
            #stats-tbl, #stats-tbl th, #stats-tbl td {
                border: 1px solid #eeeeee;
                border-collapse: collapse;
            }
            #stats-tbl th {
                text-align: center;
            }
            #stats-tbl tr:first-child th:first-child,
            #stats-tbl tr:first-child th:nth-child(4) {
                width: 100px;
            }
            #stats-tbl th, #stats-tbl td {
                white-space: nowrap;
                padding: 6px;
            }
            .w100 { width: 100px; }
            .stat-btn-wrap {
                position: absolute;
                top: 88%;
                display: flex;
                justify-content: flex-end;
            }
            .stat-graph-wrap {
                border: 1px solid blue;
                align-content: center;
                display: flex;
                flex-flow: row wrap;
                justify-content: center;
            }

            .ss-hide { display: none !important; }
            #showStats {
                margin-right: 20px;
                width: 89px;
            }
        `);
    }

    function adddropdownStyles() {
        GM_addStyle(`
            #favesMenu {
                position: absolute;
                right: 0;
                height: 18px;
                margin-right: 10px;
            }
            #inner-list {
                /* max-height: 50vh; */
                max-height: 210px;
                overflow-y: scroll;
                overflow-x: hidden;
            }
            .mkt-opt {
                display: flex;
                justify-content: space-between;
            }
            #favesMenu > select > option:first-child {
                pointer-events: none;
            }
            .fav-caret {
                position: absolute;
                cursor: pointer;
                transition: all .2s ease-in-out;
                right: 12px;
            }
            .custom-dropdown {
                position: relative;
                border: 1px solid #ccc;
                border-radius: var(--bs-border-radius);
                cursor: pointer;
                /* --bs-progress-border-radius: var(--bs-border-radius); */
            }
            #addpage {
                border-top: 1px solid #ccc;
                padding-top: 4px;
            }
            .dropdown-header {
                padding: 0px 4px 2px 0px;
                display: flex;
                justify-content: center;
                /* background-color: var(--bs-body-bg);
                background-color: var(--bs-tertiary-bg); */
                border-radius: inherit;
                height: 16px;
            }
            .dropdown-options {
                list-style: none;
                padding: 0;
                margin: 0;
                position: absolute;
                width: 100%;
                background-color: var(--bs-body-bg);
                border: 1px solid #ccc;
                border-radius: 0 0 8px 8px;
                display: none; /* Hidden by default */
                z-index: 1;
            }
            .dropdown-options li {
                padding: 0px 10px;
                white-space: nowrap;
                color: #ccc;
            }
            .favFooter {
                display: flex;
                justify-content: center;
                background-color: var(--bs-tertiary-bg)
            }
            .dropdown-options li:last-child {
                border-radius: 0 0 10px 10px;
            }
            .dropdown-options li:hover {
                background-color: #454545;
                color: #ffc107;
            }
        `);
    }

    function addInvFightResStyles() {
        GM_addStyle(`
            #invert {
                padding-bottom: 5px;
            }
            #invert input {
                height: 16px;
                margin: 0px 10px 5px 20px;
            }
        `);
    }

    function addContextMenuStyles() {
        GM_addStyle(`
            ::-webkit-scrollbar {
                width: 4px;
            }
            #town-ctx {
                position: absolute;
                text-align: center;
                margin: 2px;
                z-index: 999999;
                transform: none;
                background: none;
            }
            #town-ctx > ul {
                max-height: 50vh;
                overflow-y: auto;
                overflow-x: hidden;
                border-radius: 10px;
                border: 1px solid rgb(255, 255, 255, 0.4);
                background-color: rgb(33, 37, 41);

                padding: 0px;
                margin: 0px;
                min-width: 160px;
                list-style: none;
            }
            #town-ctx > ul > li {
                color: #fff;
                border-color: #fff;
                border-top: 1px solid rgb(255, 255, 255, 0.75);
                padding: 2px 6px 2px 6px;
            }
            #town-ctx > ul > li > a {
                color: rgb(255, 255, 255, 0.75);
                font-family: LATO;
                font-weight: 450;
                letter-spacing: 0.03em;
                text-decoration: none;
                display: block;
            }
            #town-ctx > ul > li:first-child {
                border-radius: 6px 6px 0px 0px;
            }
            #town-ctx > ul > li:last-child {
                border-radius: 0px 0px 6px 6px;
            }
            #town-ctx > ul > li > a:hover {
                color: rgb(255, 255, 255, 1.0);
                filter: brightness(1.2);
                transform: scale(1.1);
            }

            .ctxhide {display: none;}
            .ctxshow {display: block}
        `);
    }

    // ================== Expedition Team Overview UI elements =======================

    function getTabBtn() {
        const tabBtn = `<button class="nav-link" id="v-tab-overview" data-bs-toggle="tab" ` +
                           `data-bs-target="#v-content-overview" type="button" role="tab" aria-controls="v-content-overview" ` +
                       `aria-selected="false" tabindex="-1">Team Overview</button>`;

        return tabBtn;
    }

    function getTablePg() {
        const tablePg = `
        <div class="tab-pane fade show" id="v-content-overview" role="tabpanel" aria-labelledby="v-tab-overview">
                <div class="container-fluid text-center mt-2">
                    <div class="row">
                        <h3 class="h3 mt-2">Team Overview</h3>
                        <h5 class="h5 mt-2" style="display: flex; flex-flow: row wrap; justify-content: space-around;">
                            <span><span class="minStat">Yellow:</span><span> Sicario with weakest stats on the team.</span></span>
                            <span><span class="maxStat">Green:</span><span> Sicario with best stats on the team.</span></span>
                        </h5>
                    <div id="tbl-cont" class="table-responsive">
                    </div>
                </div>
            </div>
        </div>`;

        return tablePg;
    }

    function getTeamTable(teamNum) {
        let teamTable = `<table class="table align-items-center table-flush" id="teamOverviewTable-${teamNum}">
            <thead class="thead-light">
                <tr>
                    <th scope="col" width="1">Team</th>
                    <th scope="col">Name</th>
                    <th scope="col">Level</th>
                    <th scope="col">Morale</th>
                    <th scope="col">Combat</th><th scope="col">Caution</th>
                    <th scope="col">Speed</th>
                    <th scope="col">Max Rank</th>
                    <th scope="col">Total</th>
                    <th scope="col">Last Update</th>
                </tr>
            </thead>
            <tbody class="teamOverviewTableBody">

            </tbody>
        </table>`;

        return teamTable;
    }

    // =============================== Settings HTML ==================================

    function getTblBody(hdrText, bodyId) {
        debug("[settings][getTblBody] ", hdrText, bodyId);
        let tblEntry = `
            <div class="table-responsive">
                <table class="table align-items-center table-flush table-hover dark-tertiary-bg">
                        <thead class="thead-light">
                            <tr><th>${hdrText}</th><th>Enabled</th></tr>
                        </thead>
                        <tbody id="${bodyId}">

                        </tbody>
                </table>
             </div>`;
        return tblEntry;
    }

    function appendSettingsHtml(content) {
        debug("[settings][appendSettingsHtml]");
        const subBtn = `<input class="btn btn-success mt-2" type="submit" value="Update Custom Pages" id="submitCustomPagesBtn">`;
        let settingsHtml = `
            <div class="tab-pane fade" id="v-content-customize" role="tabpanel" aria-labelledby="v-tab-customize">
                <div class="card">
                    <div id="cust-opts" class="card-body">

                    </div>
                </div>
            </div>`;

        $(content).append(settingsHtml);

        let ids = Object.keys(groupIds);
        for (let idx=0; idx<ids.length; idx++) {
            let groupId = ids[idx];
            let entry = groupIds[groupId];
            let tblId = groupIdToId(entry.id);
            let newTbl = getTblBody(entry.title, tblId);

            $("#cust-opts").append(newTbl);
        }
        $("#cust-opts").append(subBtn);

        debug("[settings][appendSettingsHtml] ", $("#v-content-customize"));

        //return $(settingsHtml);
    }

    // ============================= API support testing =========================

    // ====== Not finished yet!!!

    // Test api call, move to lib. Get all event entries for a category
    // To check for getting all new DB: use local storage, 'events<cat>Oldest' (last date seen,
    // when initializing is the next calls 'to' date). Once all available data is received, set
    // initialized flag: 'events<cat>Init = true'. On first call, also set 'events<cat>Newest',
    // store updates use this as the 'from' date. If that returns only one event - with same date
    // as the 'created' field - no more data.
    //
    // This will initialize if not already done, or if the 'forceInit' param is true.
    // Otherwise, it updates. The callback gets an object containg the date range
    // retrieved, and number of records.
    // Callback sig: callback(result), where
    // result = {success: <true/false>, error: <null/error>, category: <cat>, records: <num>, from: <date>, to: <date>}
    function ce_getEventsLogCat(cat, callback, forceInit=false) {

        // Check storage for to and from, and init flag.
        let catState = JSON.parse(GM_getValue(`events${cat}State`,
                                              JSON.stringify({oldest: null, newest: null, records: 0, initialized: false})));
        debug("[database][doApiCall] cat state: ", catState);

        let params = { from: null, to: null, cb: callback, cat: cat, initializing: false,
                       result: { success: false, error: null, cat: cat, records: 0, from: null, to: null}
                     };

        if (catState.initialized == true && forceInit == false) {  // Updating
            params.from = catState.newest;
            params.result.from = catState.newest;  // Save params.from, orig will be in result
        } else {                                                   // Otherwise is an init, so leave to and from alone...
            params.initializing = true;
        }

        debug("[database][doApiCall] params (1): ", params);

        let result = doApiCall(params);

        debug("[database][doApiCall] res: ", result);

        // =============== Local fns. =================

        function doApiCall(params) {
            let from = (params.from ? `&from=${params.from}` : ``);
            let to = (params.to ? `&to=${params.to}` : ``);
            let url = `https://cartelempire.online/api/user?type=events&category=${cat}${from}${to}&key=${api_key}`;

            debug("[database][doApiCall] params (2): ", params, url);

            $.ajax({
                url: url,
                type: 'GET',
                success: function (response, status, xhr) {
                    if (response.error) {
                        error("ajax error: ", status, response);
                        return params.cb({success: false, error: status });
                    }
                    let data = JSON.parse(response);
                    processEventsResp(params, data);
                    //callback(response, status, xhr, id);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    error("Error in ajax lookup: ", textStatus,
                         "\nError jqXHR: ", jqXHR,
                         "\nError thrown: ", errorThrown);
                }
            });
        }

        function filterEvents(events, cat) {
            debug("[database][filterEvents] cat: ", cat);

            switch (cat) {
                case 'Jobs':
                    break;
                case 'Attack':
                    break;
                default:
                    return;
            }
        }

        // Sample data:
        // {"events":[{"id":"8D8E4EDD-6E0B-49EF-A3B8-A0A5C8A8866D",
        //             "viewed":false,"category":"Jobs",
        //             "description":"You failed the Agave Storehouse Robbery job!","created":1761607426}]}
        //
        function processEventsResp(params, data) {
            debug("[database][processEventsResp] \nParams: ", params, "\nData: ", data);

            let events = data.events;
            let eLen = events.length;
            let firstEvent = events[0];
            let lastEvent = events[eLen - 1];
            debug("[database][processEventsResp] eLen: ", eLen);
            debug("***** [database][processEventsResp]\nFirst: ",
                  toShortDateStr(new Date(firstEvent.created * 1000)),
                  "\nLast: ", toShortDateStr(new Date(lastEvent.created * 1000)));

            // Can simplify all this, both are basically the same...

            // Check for updating done. length will be 1, should be last event written.
            if (params.initializing == false) {
                if (events.length == 1) {
                    params.result.success = true;
                    let res = JSON.parse(JSON.stringify(params.result));

                    debug("xxxx[database][processEventsResp] update done?, \nevents", events, "\nparams: ", params);

                    let catState = JSON.parse(GM_getValue(`events${cat}State`,
                                              JSON.stringify({oldest: null, newest: null, records: 0, initialized: false})));
                    catState.initialized = true;
                    catState.newest = events[0].created;
                    catState.records = catState.records ? catState.records + params.result.records : params.result.records;

                    GM_setValue(`events${params.cat}State`, JSON.stringify(catState));

                    params.cb(res);
                    return;
                } else if (events.length > 1) { // If updating and not done, call again. Set the new 'from' date
                    params.from = events[0].created;
                    params.result.records += events.length;

                    // Write each event to the DB, maybe filter to just save pertinent info?
                    let filteredEvents = filterEvents(events, cat);
                    let storeName = `events${cat}Store`;
                    dbAddEntriesToStore(filteredEvents ? filteredEvents : events, storeName, true,
                                        eventLogWriteComplete, {success: true, category: cat, records: params.result.records});

                    doApiCall(params);
                    return;
                }
            } else if (params.initializing == true) {  //Do same if initializing
                debug("[database][processEventsResp] initializing, enter");
                if (events.length == 1) {
                    params.result.success = true;
                    let res = JSON.parse(JSON.stringify(params.result));
                    let catState = JSON.parse(GM_getValue(`events${cat}State`,
                          JSON.stringify({oldest: null, newest: null, records: 0, initialized: false})));
                    catState.initialized = true;
                    catState.oldest = events[0].created;
                    catState.records = params.result.records;
                    GM_setValue(`events${params.cat}State`, JSON.stringify(catState));
                    params.cb(res);
                    return;
                }  else if (events.length > 1) {
                    params.to = events[0].created; //events[events.length - 1].created;
                    params.result.records += events.length;
                    if (params.result.records > 30000) {
                        debugger;
                        params.cb({success: false, error: "debug safety net"});
                        return;
                    }

                    // Write each event to the DB, maybe filter to just save pertinent info?
                    let filteredEvents = filterEvents(events, cat);
                    let storeName = `events${cat}Store`;
                    dbAddEntriesToStore(filteredEvents ? filteredEvents : events, storeName, true,
                                        eventLogWriteComplete, {success: true, category: cat, records: params.result.records});

                    debug("xxxx[database][processEventsResp] new call, exit: ", (new Date(params.to * 1000)), "\n", params);
                    doApiCall(params);
                    return;
                }
            }
        }


    }

    function eventLogWriteComplete(params) {
        debug("[database][eventLogWriteComplete] params: ", params);
    }

    //
    // ======================================== DB Support =========================================

    // ============= onUpgradeNeeded handlers: called when version changes =========================
    function dbRenameStore(event, entry) {
        const db = event.target.result;
        const transaction = event.target.transaction;
        const oldName = entry.oldName;
        const newName = entry.name;

        let storeKey = entry.keypath;
        if (storeKey && storeKey.indexOf('auto') > -1) {
            storeKey = { "autoIncrement": (storeKey.indexOf('true') > -1) };
        } else {
            storeKey = { "keyPath": entry.keypath };
        }

        // Read out all data from the old object store (if you need to preserve it)
        const oldObjectStore = transaction.objectStore(oldName);
        const allData = [];
        oldObjectStore.openCursor().onsuccess = (cursorEvent) => {
            const cursor = cursorEvent.target.result;
            let count = 0;
            if (cursor) {
                count++;
                allData.push(cursor.value);
                cursor.continue();
            } else {
                db.deleteObjectStore(oldName);
                debug("[database][rename] deleted ", oldName, " saved ", count, " records");

                const objStore = db.createObjectStore(newName, storeKey); // Adjust keyPath as needed
                debug("[database][rename] created ", newName, " keypath: ", storeKey);

                if (entry.indexes && entry.indexes.length > 0) {
                    entry.indexes.forEach(idxEntry => {
                        objStore.createIndex(idxEntry.name, idxEntry.key, { unique: idxEntry.unique });
                        debug('[database][rename] Index "', idxEntry.name, '", key: ',  idxEntry.key,
                              ', unique: ', idxEntry.unique, '" created.');
                    });
                }

                count = 0;
                allData.forEach((item) => {
                    count++;
                    objStore.add(item);
                });
                debug("[database][rename] added ", count, " records to new store ", newName);
            }
        };
    };

    function dbDeleteIndexFromStore(event, storeName, idxName) {
        const db = event.target.result;
        const transaction = event.target.transaction;

        // Check if the object store exists before attempting to access it
        if (db.objectStoreNames.contains(storeName)) {
            const objectStore = transaction.objectStore(storeName);

            // Check if the index exists before attempting to delete it
            if (objectStore.indexNames.contains(idxName)) {
                objectStore.deleteIndex(idxName);
                debug("[database][upgrade] Index ", idxName, " deleted successfully.");
            } else {
                debug("[database][upgrade]Index ", idxName, " does not exist.");
            }
        } else {
            debug("[database][upgrade] store ", storeName, " does not exist.");
        }
    }

    function dbUpgradeSchema(event) {
        const db = event.target.result;
        const transaction = event.target.transaction;

        debug("[database][upgrade] Upgrading to version ", currDbVersion);
        let keys = Object.keys(dbStores);
        debug("[database][upgrade] keys (store names): ", keys);

        // Fix the market price store
        dbDeleteIndexFromStore(event, marketPricesStoreName, byTypeIdx.name);

        // Add (or rename!) any additional object stores or indexes
        for (let idx=0; idx<keys.length; idx++) {
            let entryKey = keys[idx];
            let entry = dbStores[entryKey];
            let exists = cartelDB.objectStoreNames.contains(entry.name);
            debug("[database][upgrade] name: ", entry.name, " exists: ", exists, " active: ", entry.active);
            if (entry.active == false) continue;

            let storeKey = entry.keypath;
            if (storeKey && storeKey.indexOf('auto') > -1) {
                storeKey = { "autoIncrement": (storeKey.indexOf('true') > -1 ? true : false) };
            } else {
                storeKey = { "keyPath": entry.keypath };
            }

            let objStore;
            debug("[database][upgrade] old entry name: ", entry.oldName, " exists: ",
                  cartelDB.objectStoreNames.contains(entry.oldName));

            if (entry.oldName && cartelDB.objectStoreNames.contains(entry.oldName)) {
                debug("[database][upgrade] renaming old store: ", entry);
                dbRenameStore(event, entry);
            } else if (exists != true) {
                debug("[database][upgrade] adding new store: ", entry);

                objStore = cartelDB.createObjectStore(entry.name, storeKey);
                debug('[database][upgrade] Object store "', entry.name, '" created, key: ', storeKey);
            }

            if (entry.indexes && entry.indexes.length > 0) {
                entry.indexes.forEach(idxEntry => {
                    const objStore = transaction.objectStore(entry.name);
                    if (!objStore.indexNames.contains(idxEntry.name)) {
                        objStore.createIndex(idxEntry.name, idxEntry.key, { unique: idxEntry.unique });
                        debug('[database][upgrade] Index "', idxEntry.name, '", key: ',  idxEntry.key,
                              ', unique: ', idxEntry.unique, '" created.');
                    } else {
                        debug('[database][upgrade] Index "', idxEntry.name, '", key: ',  idxEntry.key,
                              ', unique: ', idxEntry.unique, '" already exists!.');
                    }
                });
            }
        }

        // Delete stores not used anymore
        if (cartelDB.objectStoreNames.contains("undefined")) {
            cartelDB.deleteObjectStore("undefined");
            console.log("Object store 'undefined' deleted during upgrade.");
        }
    }

    // ========================== Standard DB operations =======================

    function dbOpenDatabase(getKeys=false) {
        debug("[database][openDatabase] enter, name: ", databaseName);
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(databaseName, currDbVersion);  // new version to force upgrade...
            request.onversionchange = function(event) {
                debug("[database] onversionchange: ", JSON.stringify(event, null, 4));
                reject({success: false, error: event});
            }
            request.onblocked = function(event) {
                debug("[database] onblocked: ", JSON.stringify(event, null, 4));
                let msg = "Unable to upgrade the DB, it seems to\n" +
                          "be blocked by another tab(s). Please\n" +
                          "close other tabs and refresh to retry.";
                alert(msg);
                reject({success: false, error: event});
            }

            request.onupgradeneeded = function(event) {
                cartelDB = event.target.result;
                debug("[database] onupgradeneeded ver ", cartelDB.version, " to ", currDbVersion);

                dbUpgradeSchema(event);
            };

            request.onsuccess = function(event) {
                cartelDB = event.target.result;
                debug(`[database] Database " ${databaseName} version ${cartelDB.version} opened successfully!`);

                cartelDB.onerror = (event) => {
                  debug(`Database error: ${event.target.error?.message}`, "\nevent.target: ", event.target);
                };

                cartelDB.onversionchange = (event) => {
                    cartelDB.close();
                    alert("A new version of this page is ready. Please reload this page!");
                  };

                dbReady = true;
                dbWaitingFns.forEach(function(fn, idx) { let rc = fn(); });
                resolve({success: true});
            };
            request.onerror = function(event) {
                log('[database] ERROR opening database:', event);
                reject({success: false, error: event});
            };

        });
    }

    async function dbOpenDatabaseSync(getKeys=false) {
        debug("[database][openDatabaseSync] enter, name: ", databaseName);
        try {
            const result = await dbOpenDatabase(getKeys); // Await the promise
            debug("[database][openDatabaseSync] result: ", result);
            return result;
        } catch (error) {
            debug("[database][openDatabaseSync] ERROR: ", error);
            return error;
        }
        debug("[database][openDatabaseSync] open finished, should not get here!");
    }

    // If key is provided, it will be used as an out-of-line key.
    async function dbPutEntryInStore(entry, storeName, key, optCallback, optParams) {
        debug("[database][dbPutEntryInStore], entry: ", entry, "\nstor: ", storeName, " key: ", key);
        const objectStore = cartelDB
          .transaction([storeName], "readwrite")
          .objectStore(storeName);

        const requestUpdate = (!key || key == null) ? objectStore.put(entry) : objectStore.put(entry, key);
        requestUpdate.onerror = (event) => {
            debug("[database][dbPutEntryInStore] Error: ", key,  (event.target ? event.target.error : event));
            if (optCallback) optCallback(event.target, optParams);
        };
        requestUpdate.onsuccess = (event) => {
            debug("[database][dbPutEntryInStore] Success: ", key, event.target, " key: ", event.target.result);
            if (optCallback) optCallback(event.target, optParams);
        };
        requestUpdate.oncomplete = (event) => {
            debug("[database][dbPutEntryInStore] oncomplete: ", key, event.target, " key: ", event.target.result);
            if (optCallback) optCallback(event.target, optParams);
        };
        requestUpdate.onabort = (event) => {
            debug("[database][dbPutEntryInStore] onabort: ", key, event.target);
            if (optCallback) optCallback(event.target, optParams);
        };
    }

    async function dbAddEntryToStore(entry, storeName, key, optCallback, optParams) {
        debug("[database][dbAddEntryToStore], entry: ", entry, "\nstor: ", storeName, " key: ", key);
        const objectStore = cartelDB
          .transaction([storeName], "readwrite")
          .objectStore(storeName);

        const requestUpdate = (!key || key == null) ? objectStore.add(entry) : objectStore.add(entry, key);
        requestUpdate.onerror = (event) => {
            console.error("[database][dbAddEntryToStore] Error: ", key,  event.target.error);
            if (optCallback) optCallback(event.target, optParams);
        };
        requestUpdate.onsuccess = (event) => {
            debug("[database][dbAddEntryToStore] Success: ", key, event.target, " key: ", event.target.result);
            if (optCallback) optCallback(event.target, optParams);
        };
        requestUpdate.oncomplete = (event) => {
            debug("[database][dbAddEntryToStore] oncomplete: ", key, event.target, " key: ", event.target.result);
            if (optCallback) optCallback(event.target, optParams);
        };
        requestUpdate.onabort = (event) => {
            debug("[database][dbPutEntryInStore] onabort: ", key, event.target);
            if (optCallback) optCallback(event.target, optParams);
        };
    }

    async function dbAddEntriesToStore(entryArray, storeName, canUpdate=false, optCallback=null, optParams=null) {
        debug("[database][addEntriesToStore] ", storeName, canUpdate, entryArray, cartelDB);

        const transaction = cartelDB.transaction([storeName], "readwrite");
        transaction.oncomplete = (event) => {
            debug("[database][addEntryToStore] complete");
            if (optCallback) {
                optCallback(event.target.result, optParams);
            }
        };

        transaction.onerror = (event) => {
            debug("[database][addEntryToStore] error: ", event);
            if (optCallback) {
                optCallback(event.target, optParams);
            }
        };

        const objectStore = transaction.objectStore(storeName);
        let key = (storeName == allItemsStoreName) ? "id" : "dateTime";

        entryArray.forEach((entry) => {
            const request = (canUpdate == true) ? objectStore.put(entry) : objectStore.add(entry);
            request.onsuccess = (event) => {
                let newKey = event.target.result
                debug("[database][addEntryToStore] added item with key ", newKey);
                if (optCallback) optCallback(event.target.result, optParams);
            };
        });
    }

    async function dbDeleteEntryFromStore(key, store, callback, params) {
        debug("[database][dbDeleteEntryFromStore], store: ", store, " key: ", key);
        const request = cartelDB
          .transaction([store], "readwrite")
          .objectStore(store)
          .delete(key);

        request.onsuccess = (event) => {
            debug("[database][dbDeleteEntryFromStore] Success: ", key, event.target);
            if (callback) callback(event.target, params);
        };
        request.onerror = (event) => {
            console.error("[database][dbDeleteEntryFromStore] Error: ", key,  event.target.error);
            if (optCallback) optCallback(event.target, optParams);
        };
    }

    async function dbGetItemFromStoreByKey(key, store, callback, params) {
        debug("[database][dbGetItemFromStoreByKey] ", key, store);

        if (!key) {
            return console.error("ERROR invalid key! \nStore: ",
                store, " key: ", key, "\ncb: ", callback, "\nparams: ", params);
        }

        const transaction = cartelDB.transaction([store]);
        const objectStore = transaction.objectStore(store);
        const request = objectStore.get(key);

        request.onsuccess = (event) => {
            debug("[database][dbGetItemFromStoreByKey] ",
                key, store, event.target.result, request.result);
            if (callback)
                callback(event.target.result, params);
            else
                return event.target.result;
        };
        request.onerror = (event) => {
            console.error("[database][dbGetItemFromStoreByKey] ERROR: ", event.target);
            if (callback) callback(event.target, params);
        };
    }

    async function dbGetAllItemsInStore(store, callback, params) {
        debug("[database][dbGetAllItemsInStore] ", store);
        const transaction = cartelDB.transaction([store]);
        const objectStore = transaction.objectStore(store);
        const request = objectStore.getAll();
        request.onsuccess = (event) => {
            debug("[database][dbGetAllItemsInStore] ",
                store, event.target.result, request.result);
            if (callback) callback(event.target.result, params);
        };
        request.onerror = (event) => {
            console.error("[database][dbGetAllItemsInStore] ERROR: ", event.target);
            if (callback) callback(event.target, params);
        };
    }

    async function dbGetAllKeysInStore(store, callback, params) {
        debug("[database][dbGetAllKeysInStore] ", store);
        const transaction = cartelDB.transaction([store]);
        const objectStore = transaction.objectStore(store);
        const request = objectStore.getAllKeys();
        request.onsuccess = (event) => {
            debug("[database][dbGetAllKeysInStore] ",
                store, event.target.result, request.result);
            if (callback) callback(event.target.result, params);
        };
        request.onerror = (event) => {
            console.error("[database][dbGetAllKeysInStore] ERROR: ", event.target);
            if (callback) callback(event.target, params);
        };
    }

    async function dbGetRecordsForIndex(storeName, indexName, key, callback, params) {
        debug("[database][dbGetRecordsForIndex] ", storeName, indexName, key, params);
        const transaction = cartelDB.transaction([storeName], "readwrite");
        const objectStore = transaction.objectStore(storeName);
        const index = objectStore.index(indexName);

        const getAllRequest = index.getAll((key && key.length) ? key : undefined);
        getAllRequest.onsuccess = () => {
            const items = getAllRequest.result;
            debug("[database][dbGetRecordsForIndex] result: ", getAllRequest.result);
            if (callback) callback(items, params);
        };
        getAllRequest.onerror = (event) => {
            console.error(`Database error: ${event.target.error?.message}`, "\nevent.target: ", event.target);
            if (callback) callback(event.target, params);
        };
    }

    // =============================== DB import/export ===============================

    function dbGetAllFromStore(db, storeName) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    function dbClearAndBulkPut(db, storeName, items) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const clearReq = store.clear();
            clearReq.onerror = () => reject(clearReq.error);

            // We need our DB entry to see what kind of key we have
            // But the dbStores object is not keyed by name....
            const entry = getDbStoreEntryByName(storeName);
            debug("[database][dbClearAndBulkPut] entry from store name: ", storeName, " entry: ", entry);
            clearReq.onsuccess = () => {
                for (const item of items) {
                    try {
                        // let key = `fightData.${dataObj["id"]}`;
                        // dbPutEntryInStore(entry, fightResultStoreName, key);
                        //store.put(item);

                        // temp test
                        if (storeName == fightResultStoreName) item["oolKey"] = "id";
                        dbPutEntryInStore(item, storeName, item.oolKey);
                    } catch(ex) {
                        debug("[database][dbClearAndBulkPut] ERROR: ", ex);
                        debugger;
                    }
                }
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    // ============================ Download / file helpers ============================

    function dbDownloadJSON(obj, filename) {
        const blob = new Blob([JSON.stringify(obj, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function pickFile(accept = '.json') {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.style.display = 'none';
            document.body.appendChild(input);

            input.addEventListener('change', () => {
                if (!input.files || !input.files[0]) {
                    reject(new Error('No file selected'));
                    input.remove();
                    return;
                }
                const file = input.files[0];
                const reader = new FileReader();
                reader.onload = () => {
                    input.remove();
                    resolve(reader.result);
                };
                reader.onerror = () => {
                    input.remove();
                    reject(reader.error);
                };
                reader.readAsText(file);
            });

            input.click();
        });
    }

    // ================================= Export logic ==================================

    async function dbExportWholeDB() {
        try {
            const db = cartelDB; //await openDb(DB_NAME);
            const exportObj = {
                dbName: db.name,
                version: db.version,
                // storeName -> array of records
                stores: {}
            };

            const storeNames = Array.from(db.objectStoreNames);

            for (const storeName of storeNames) {
                const records = await dbGetAllFromStore(db, storeName);
                exportObj.stores[storeName] = records;
            }

            const filename = `idb-backup-${db.name}-${Date.now()}.json`;
            dbDownloadJSON(exportObj, filename);
            alert(`IndexedDB "${db.name}" exported with ${storeNames.length} stores.`);
            //db.close();
        } catch (err) {
            debug('[database] Export failed:', err);
            alert('Export failed: ' + err);
        }
    }

    // Make a dialog with a list here...
    async function dbExportOneStorePrompt() {
        const storeName = prompt('Enter object store name to export:');
        if (!storeName) return;

        try {
            const db = cartelDB; //await openDb(DB_NAME);
            if (!db.objectStoreNames.contains(storeName)) {
                alert(`Store "${storeName}" does not exist in DB "${db.name}".`);
                //db.close();
                return;
            }

            const records = await dbGetAllFromStore(db, storeName);
            const exportObj = {
                dbName: db.name,
                version: db.version,
                store: storeName,
                data: records
            };
            const filename = `idb-backup-${db.name}-${storeName}-${Date.now()}.json`;
            dbDownloadJSON(exportObj, filename);
            alert(`Exported store "${storeName}" with ${records.length} records.`);
            //db.close();
        } catch (err) {
            debug('[database] Store export failed:', err);
            alert('Store export failed: ' + err);
        }
    }

    // ================================== Import logic ==================================

    async function dbImportFromFile() {
        debug("[database] dbImportFromFile");
        try {
            const text = await pickFile('.json');
            const backup = JSON.parse(text);

            const db = cartelDB; //await openDb(DB_NAME);

            // Simple safety checks
            if (backup.dbName && backup.dbName !== db.name) {
                const ok = confirm(
                    `Backup is for DB "${backup.dbName}", but current DB is "${db.name}". Continue anyway?`
                );
                if (!ok) {
                    //db.close();
                    return;
                }
            }

            if (backup.stores) {
                // Whole DB backup (data for multiple stores)
                const storeNames = Object.keys(backup.stores);

                // Ensure the stores exist; if your schema changed, you might need to
                // update your userscript's onupgradeneeded and reload once before import.
                for (const storeName of storeNames) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        alert(`Store "${storeName}" from backup does not exist in current DB. Skipping it.`);
                    }
                }

                for (const storeName of storeNames) {
                    if (!db.objectStoreNames.contains(storeName)) continue;
                    const records = backup.stores[storeName];
                    await dbClearAndBulkPut(db, storeName, records);
                }

                alert('Import completed (whole DB data). Reload page if needed.');
            } else if (backup.store && backup.data) {
                // Single store backup
                const storeName = backup.store;
                if (!db.objectStoreNames.contains(storeName)) {
                    alert(`Store "${storeName}" from backup does not exist in current DB.`);
                    //db.close();
                    return;
                }
                await dbClearAndBulkPut(db, storeName, backup.data);
                alert(`Import completed for store "${storeName}".`);
            } else {
                debug('[database] Backup format not recognized.');
            }

            //db.close();
        } catch (err) {
            debug('[database] Import failed:', err);
            alert(`Import failed: ${err}`);
        }
    }



    // ===================================================================================
})();





