// ==UserScript==
// @name         CE Advanced Search Assist
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  This script adds additional stats to the search results page
// @author       xedx [2100735]
// @match        https://cartelempire.online/*
// @require      https://raw.githubusercontent.com/edlau2/CartelEmpire/master/Helpers/ce_js_utils.js
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      http://code.jquery.com/ui/1.12.1/jquery-ui.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// ==/UserScript==

/*eslint no-unused-vars: 0*/
/*eslint no-undef: 0*/
/*eslint curly: 0*/
/*eslint no-multi-spaces: 0*/

// This adds reputation and last action columns to the filtered advanced search results.
// It can also save your last search criteria, to search the same again.

(function() {
    'use strict';

    debugLoggingEnabled =
        GM_getValue("debugLoggingEnabled", -1);    // Extra debug logging
    if (debugLoggingEnabled == -1)
        GM_setValue("debugLoggingEnabled", false);

    const secsInMin = 60;
    const minInHr = 60;
    const secsInHr = minInHr * secsInMin;
    const secsInDay = 24 * secsInHr;

    const hh = (x) => { return (x && x.length == 1) ? ('0' + x) : x; }



    // =========== IndexedDb support for preivous fight results ==========

    const DB_NAME = "CartelEmpire2";
    const fightResultStoreName = "AttackResults";
    let db;

    // Call this once at the start of your script
    const initDB = () => new Promise(res => {
        debug("[initDB]");
        const req = indexedDB.open(DB_NAME);
        req.onsuccess = () => {
            debug("[initDB] result: ", req.result);
            res(db = req.result);
        }
    });

    async function getDB() {
        if (db) return db;
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME);

            log("Opening DB: ", DB_NAME);

            // Handle error (e.g., DB doesn't exist or permission denied)
            req.onerror = () => {
                debug(`Failed to open DB: ${req.error.message}`);
                reject(`Failed to open DB: ${req.error.message}`);
            }

            // Block script if the DB doesn't exist (prevents creating an empty one)
            req.onupgradeneeded = (e) => {
                e.target.transaction.abort();
                debug("Database does not exist.");
                reject("Database does not exist.");
            };

            req.onsuccess = () => {
                const instance = req.result;
                debug("[getDB] Success! ", req.result);

                // Handle version changes from the site's original scripts
                instance.onversionchange = () => {
                    instance.close();
                    db = null; // Reset so the next read re-opens the DB
                };

                db = instance;

                debug("Database opened: ", db);
                resolve(db);
            };
        });
    }

    /**
     * Concise read function
     * @param {string} store - Object store name
     * @param {any} key - The key to look up
     * @param {function} cb - Success callback
     */
    async function getDbValue(store, key, cb) {
        debug("[getDbValue] ", store, key, db);

        try {
            const database = await getDB();
            const request = database.transaction(store).objectStore(store).get(key);
            request.onsuccess = () => { debug("[getDbValue] success: ", request.result); cb(request.result, key); }
            request.onerror = (e) => { debug("[getDbValue] ERROR Read failed", e.target.error); }
        } catch (err) {
            console.error(err);
        }
    }


    // ================= Save and restore search params =================
    //
    function handleSearchBtn(e) {

        let form = $("#advancedSearchDropdown > form");
        let inputs = $("#advancedSearchDropdown > form input");
        let selects = $("#advancedSearchDropdown > form select");

        debug("[handleSearchBtn] form: ", $(form));
        debug("[handleSearchBtn] inputs: ", $(inputs));
        debug("[handleSearchBtn] selects: ", $(selects));

        for (let idx=0; idx<$(inputs).length; idx++) {
            let inp = $(inputs)[idx];
            let id = $(inp).attr("id");

            let savedKey = 'input-' + id;
            let savedVal = GM_getValue(savedKey, -1);
            debug(`Input id:  ${id} saved val: ${savedVal}`);

            if (savedVal != -1) {
                $(inp).val(savedVal);
            }

            $(inp).on('change', function() {
                let id = $(this).attr('id');
                let val = $(this).val();
                debug(`input: #${id} = ${val}`);

                let key = 'input-' + id;
                GM_setValue(key, val);
            });
        }
        for (let idx=0; idx<$(selects).length; idx++) {
            let sel = $(selects)[idx];
            let id = $(sel).attr("id");

            let savedKey = 'select-' + id;
            let savedVal = GM_getValue(savedKey, -1);
            debug(`Select id:  ${id} saved val: ${savedVal}`);

            if (savedVal && savedVal != -1) {
                $(sel).val(savedVal);
            }

            $(sel).change(function() {
                let id = $(this).attr('id');
                let val = $(this).val();
                debug(`select: #${id} = ${val}`);

                let key = 'select-' + id;
                GM_setValue(key, val);
            });
        }
    }

    function filterAdvSearchBtn(retries=0) {
        let btn = $("#searchBtn");
        if (!(btn).length) {
            if (retries++ < 20) return setTimeout(filterAdvSearchBtn, 250, retries);
            return log("[filterAdvSearchBtn] timed out.");
        }

        // This opens the search form
        $(btn).on('click', handleSearchBtn);
    }


    // ================= Get stats for the resultant users  =================
    //
    function getUserStats(userId, row) {
        const url = `https://cartelempire.online/api/user?type=advanced&id=${userId}&key=${api_key}&desc=AdvSearchAssist`;
        $.get(url, function(data, result) {
            let jsonObj = JSON.parse(data);
            //debug("[getUserStats] result: ", result, " data: ", data, " json: ", jsonObj);

            if (result == 'success') {
                let name = jsonObj.name;
                let id = jsonObj.userId;
                let longName = `${name} [${id}]`;
                let now = new Date().getTime() / 1000;
                let la = jsonObj.lastActive;
                let diff = now - +la;
                let days = parseInt(+diff / secsInDay);

                let node = $(row).find("td.last-act");
                $(node).text((days + " days"));

                let rep = jsonObj.reputation;
                node = $(row).find("td.rep");
                $(node).text(rep);

                debug("[getUserStats] result for ", longName, `${days} old, ${rep} reputation`);

            } else {
                debug("[getUserStats] ERROR result: ", result, " data: ", data, " json: ", jsonObj);
            }
        });
    }

    function getFightDataCb(data, key) {
        let id, entry, nameNode;
        if (key) {
            id = key.split(".")[1];
            entry = userList[id];
            //debug("[getFightDataCb] entry: ", entry);
        }
        if (id) nameNode = $(`#XID-${id}`);

        if (!data)
            debug("[getFightDataCb] No data for user: ", entry.longName);
        else {
            let dataLen = data.length;
            let newest = data[dataLen - 1];
            debug("[getFightDataCb] newest: ", newest);
            if ($(nameNode).length) {
                if (newest.outcome == 'Win') $(nameNode).css("color", "limegreen");
                if (newest.outcome == 'Loss') $(nameNode).css("color", "red");
                let hlp = "Last attack: " + newest.date + "<br>Rep Gain: " + (newest.rep ? newest.rep : "N/A");
                displayHtmlToolTip($(nameNode), hlp);

                if (newest.rep && newest.rep != undefined) {
                    let attNode = $(nameNode).closest('tr').find('td > a')[0];
                    let msg = $(attNode).text();
                    debug("***** att node: ", $(attNode), " name node: ", $(nameNode), " text: ", msg, " parts: ", (msg ? msg.split('/') : "NA"));
                    if (msg) {
                        let parts = msg.split('/');
                        if (parts && parts.length > 1) msg = parts[0];
                        msg = msg + ' / ' + newest.rep;
                        $(attNode).text(msg);
                    }
                }
            }
        }
    }

    const userList = {};
    function handlePageLoad(retries=0) {

        // table body
        let tblBody = $("#userTable > tbody ");
        if (!$(tblBody).length) {
             if (retries++ < 25) return setTimeout(handlePageLoad, 250, retries);
             return log("[handlePageLoad] timed out.");
        }

        // New Last Action header
        let hdr = $("#userTable > thead > tr > th:nth-child(3)"); // Stat Estimate?
        $(hdr).text("Stat Est");
        $(hdr).after(`<th scope="col">Last Act</th>`);
        $(hdr).after(`<th scope="col">Rep</th>`);

        // And cells
        let statCells = $("#userTable > tbody > tr > td:nth-child(3)");
        for (let idx=0; idx<$(statCells).length; idx++) {
            let cell = $(statCells)[idx];
            $(cell).after(`<td class="text-muted last-act">Unknown</td>`);
            $(cell).after(`<td class="text-muted rep">Unknown</td>`);
        }

        // a href's
        let names = $("#userTable > tbody > tr > th > a");
        debug("[handlePageLoad] db: ", db);
        for (let idx=0; idx<$(names).length; idx++) {
            let node = $(names)[idx];
            let userName = $(node).text();
            let userId = $(node).attr('href').replace('/user/', '');
            $(node).attr('id', `XID-${userId}`);
            let longName = userName + "[" + userId + "]";

            let entry = { id: userId, name: userName, longName: longName };
            userList[userId] = entry;

            //log("[handlePageLoad] Check for fight data? ", db);
            if (db) {
                let key = "fightData." + userId;
                debug("Query DB for user '", longName, "', key: ", key, " entry: ", entry);
                getDbValue(fightResultStoreName, key, getFightDataCb);
            }

            setTimeout(getUserStats, (250 * (idx + 1)), userId, $(node).closest('tr'));
        }

        // Add filter for advanced search
        filterAdvSearchBtn();
    }

    //////////////////////////////////////////////////////////////////////
    // Main.
    //////////////////////////////////////////////////////////////////////

    logScriptStart();
    validateApiKey();

    // If not on results page, just restore saved searches
    if (location.href.indexOf("AdvancedSearch") < 0) {
        debug("Filter search button only, not on results page:\n", location.href);
        callOnContentLoaded(filterAdvSearchBtn);
        return;
    }

    addStyles();

    (async () => {
        log("Initializing DB");
        await initDB();

        callOnContentLoaded(handlePageLoad);
    })();

    // Add any styles here
    function addStyles() {
        addToolTipStyle();
    }

})();