// ==UserScript==
// @name         Ce Fight Simulator
// @namespace    http://tampermonkey.net/
// @version      1.06
// @description  Adds an animated interpretation of an attack
// @author       xedx [55266]
// @match        https://cartelempire.online/Fight/*
// @match        https://cartelempire.online/user/*
// @match        https://cartelempire.online/settings*
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      http://code.jquery.com/ui/1.14.2/jquery-ui.js
// @require      https://raw.githubusercontent.com/edlau2/CartelEmpire/master/Helpers/ce_js_utils.js
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// ==/UserScript==

/*eslint no-unused-vars: 0*/
/*eslint no-undef: 0*/
/*eslint curly: 0*/
/*eslint no-multi-spaces: 0*/

(function() {
    'use strict';

    const TARGET_SELECTOR = '#mainBackground > div.container > div > div.col-12 > div.mb-4.card';
    const hideCSS = `${TARGET_SELECTOR} { /* display: none !important;*/ visibility: hidden !important; }`;

    const styleNode = document.createElement('style');
    styleNode.textContent = hideCSS;
    document.documentElement.appendChild(styleNode);

    console.log("[CE Fight Simulator] background style injected");

    // GM_addStyle(`
    //     #mainBackground > div.container > div > div.col-12 > div.mb-4.card {
    //         visibility: hidden;
    //     }
    // `);

    debugLoggingEnabled =
        GM_getValue("debugLoggingEnabled", false);    // Extra debug logging
    GM_setValue("debugLoggingEnabled", debugLoggingEnabled);

    // ========================= Options/settings ==================================

    const groupIdToId = (optId) => { return (optId + 'fsim'); }
    const groupIds = { "gbl": { "id": "global", "title": "General Fight Simulator Options" },
                       //"prv": { "id": "private", "title": "Private Chat Options" },
                       //"ctl": { "id": "cartel", "title": "Cartel Chat Options" },
                       //"app": { "id": "appearance", "title": "Appearance" },
                       //"mnt": { "id": "maintenance", "title": "Maintenance" },
                     };

    function isStringified(str) { try {  return JSON.parse(str);  } catch(ex) { return str; } }

    var settingsInit = false;

    var settings = {};
    function initSettings(optObject) {
        debug("[initSettings] can init properties AFTER this call.");
        debug("[initSettings] Settings: ", settings, " optObject: ", optObject);
        let keys = Object.keys(optObject);
        for (let idx=0; idx<keys.length; idx++) {
            let key = keys[idx];
            let value = optObject[key];
            debug("[initSettings] key: ", key, " value: ", value);

            // Save defaults if not set
            let tmp  = GM_getValue(key, JSON.stringify(value));
            log("tmp: ", tmp);
            let val = isStringified(tmp);

            debug("[initSettings] key: ", key, " val: ", val);
            debug("[initSettings] settings[key]: ", settings[key]);
            settings[key] = val;

            debug("[initSettings] ", key, settings[key], optObject[key]);

            // Quick check for new properties, may change version to version
            let propKeys = Object.keys(optObject[key]);
            propKeys.forEach(pkey => {
                if (settings[key] !== null && typeof settings[key] === 'object') {
                    debug("[initSettings] check key ", pkey, " in ", settings[key], ": ", settings[key][pkey], isValid((settings[key][pkey])));
                    if (!isValid((settings[key][pkey]))) {
                        debug("[initSettings] adding missing key: ", key, value, "\n", settings[key], optObject[key]);
                        settings[key][pkey] = optObject[key][pkey];
                    }
                }
            });

            GM_setValue(key, JSON.stringify(settings[key]));
        }
        settingsInit = true;
    }

    const defSettings = {
        "enableFightSim":  { "on": true, "desc": "Enable fight simulations",
                                  "visible": true, "grp": "gbl" ,
                                  "style": "checkbox" },
        "attackSpeed":  { "on": true, "desc": "How long each turn takes, in milliseconds",
                                  "visible": true, "grp": "gbl" ,
                                  "style": "number", "min": 0, "max": 10000, "value": 1000 }
    };

    initSettings(defSettings);

    // var enableFightSim = GM_getValue("enableFightSim", true);
    // GM_setValue("enableFightSim", enableFightSim);

    var user_id = GM_getValue("user_id", null);
    var user_name = GM_getValue("user_name", null);
    log("user: ", user_name, " id: ", user_id);

    var opponent = { href: "", name: "", id: 0, lifeMax: 0, lifeNow: 0, timestamp: 0, pfp: "", src: "", style: "" };

    const thisURL = window.location.pathname.toLowerCase() || "home";  // Returns path only or home if not specified

    // 'undefined' check is temp for a bug in here somewhere...
    const escapeRegExp = (string) => { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('undefined', ''); }
    const hasPath = (txt) => { return new RegExp(`${escapeRegExp(txt)}`, 'gi').test(thisURL); }

    const isSettingsPage = () => { return hasPath("/settings"); }
    const isUserPage = () => { return location.href.indexOf("/user/") > -1; }
    const isFightPage = () => { return location.href.indexOf("/Fight/") > -1; }

    function basicUserCb(response, status, xhr, id) {
        log("[basicUserCb] response: ", response);

        let data = JSON.parse(response);
        if (!data) return log("basicUserCb] Error: no data in response");

        user_id = data.userId;
        user_name = data.name;
        log("basicUserCb] id: ", user_id, " name: ", user_name);
        if (user_id) GM_setValue("user_id", user_id);
        if (user_name) GM_setValue("user_name", user_name);
    }

    function getMyUserInfo() {
        //<img class="rounded img-fluid" src="https://cartelstorage.blob.core.windows.net/user-assets/55266/1774838521966.gif" alt="xedx Profile">
    }

    // ====================== User page ===========================================

    // Scrape some user info, like ID


    function processUserPage(retries=0) {
        let idNode = $("div.order-sm-1 table > tbody > tr:nth-child(1) > td");
        if (!$(idNode).length) return retry(processUserPage, retries);

        let id = $(idNode).text();
        if (parseInt(id) == parseInt(user_id)) return log("[processUserPage] is my id: ", id, user_id, $(idNode));

        opponent.id = id;
        let url = $("#profileImg").css('background-image');
        opponent.pfp = url.split('/').pop().replace(/["')]/g, "");
        opponent.timestamp = new Date().getTime();
        opponent.name = $("span.profileNameTitle").text();
        opponent.src = $("#profileImg").attr("src");
        opponent.style = $("#profileImg").attr("style");

        debug("[processUserPage] pfp: ", opponent.pfp);

        //let lifeNode = $("div.order-sm-1 table > tbody > tr:nth-child(6) > td");
        let parts = $("div.order-sm-1 table > tbody > tr:nth-child(6) > td").text().split("/");
        debug("[processUserPage] parts: ", parts.length, parts);
        if (parts.length) {
            opponent.lifeMax = parseInt(parts[1]);
            opponent.lifeNow = parseInt(parts[0]);
        }

        debug("[processUserPage] opponent: ", opponent);

        let key = "user-" + id;
        GM_setValue(key, JSON.stringify(opponent));
    }

    // ====================== Fight page ===========================================

    // Start revealing the hidden card and result rows
    function showCard() {
        let card = $("#mainBackground > div.container > div > div.col-12 > div.mb-4.card");
        log("Showing card: ", $(card));
        $(card).attr("style", "visibility: visible !important;");
        if (settings.enableFightSim.on != true) return;

        displayResults();
    }

    var thisAttack;
    var fightId;
    let skipClicked = false;
    function attacksCb(response, status, xhr, id) {
        let data = JSON.parse(response);
        if (!data) return log("attacksCb] Error: no data in response");

        // See if this attack is still in the log
        let thisAttack = data.attacks.find(attack => attack.id == fightId);
        log("attacksCb] thisAttack: ", thisAttack);

        // attackType : "attack", cashMugged: "0", created: "1787743458", defenderRepGain: 0,
        // fairFightMultiplier: 1, id: 2914225, initiatorCartelId: 1259, initiatorId: 55266,
        // isWar: false, itemAwarded: null, outcome : "Win", repGained: 115.9,
        // targetCartelId: 84, targetId: 64437, warId: null
    }

    // Grab opponent info saved from the user page
    function getOpponent(retries=0) {
        let row = $("div.table-responsive.fightTable > table > tbody > tr:first-child > td > a");
        if (!$(row).length) {
            if (retries++ < 50) return setTimeout(getOpponent, 250, retries);
            return log("[getOpponent] timed out");
        }
        opponent.href = $(row).attr("href");
        opponent.name = $(row).text();
        opponent.id = opponent.href ? opponent.href.match(/\d+/)[0] : 0;

        if (opponent.id) {
            let key = "user-" + opponent.id;
            let tmp = GM_getValue(key, null);
            if (tmp) {
                opponent = JSON.parse(tmp);
            }
        }

        log("[getOpponent] Opponent: ", opponent);

        return opponent;
    }

    // Display some dripping blood
    function bleedBabyBleed(target) {
        //const bleedingBox = $(`<div class="bloody-box"></div>`);
        $(target).addClass("bloody-box");
        const initialDrips = 15; // Number of drops

        function createDrip(isInitialLoad = false) {
            let leftPos = Math.random() * 95;
            let dripHeight = getRandomIntEx(30, 290);
            let duration = getRandomIntEx(3, 6);

            // If it's the very first batch, stagger the starts so they don't all drop at once.
            // If it's a replacement drop, start it immediately (0s delay).
            let delay = isInitialLoad ? Math.random() * 4 : 0;

            // Optional: randomize thickness slightly for extra realism
            let dripWidth = getRandomIntEx(5, 10); // 5px to 10px

            // Create the drip element
            const drip = $('<div></div>')
              .addClass('blood-drip')
              .css({
                'left': leftPos + '%',
                'width': dripWidth + 'px',
                'height': dripHeight + 'px',
                'animation-delay': delay + 's',
                'animation-duration': duration + 's'
              });

            // When this specific drop finishes its animation loop
            $(drip).on('animationend', function() {
              $(this).remove();  // Delete the old drop to save memory
              createDrip();      // Spawn a completely new random drop
            });

            $(target).append($(drip));
          }

        // Spawn the initial batch of drops
        for (let i = 0; i < initialDrips; i++) {
            createDrip(true);
        }
    }

    // Iterate through result rows, parsing to convert to UI elements
    function displayResults() {
        let rows = $(".fightTable > table > tbody > tr");
        let iStartedIt = false;
        let entry = $(".fightTable > table > tbody > tr:first-child > td").text();
        if (entry && entry.indexOf("You initiated") > -1) iStartedIt = true;


        debug("[displayResults] I started it: ", iStartedIt, " entry: ", entry);

        enableRow(0, iStartedIt);

        function enableRow(idx, iStartedIt) {
            let row = $(rows)[idx];
            $(row).slideToggle();
            processAttackRow($(row), iStartedIt);
            if (skipClicked == true) return;
            if (idx < $(rows).length - 1) return setTimeout(enableRow, settings.attackSpeed.value, ++idx, iStartedIt);

            // End of fight
            $(".fightTable").prev().slideToggle();
            let resSpan = $("#mainBackground > div.container > div div.card.result-card > div.card-body > div.row.mb-3 > div:nth-child(1) > p > span");
            let outcome = $(resSpan).text();
            let target;

            let lastSpan = $(rows).find(".borderFirst");
            let lastTxt = $(lastSpan).text();
            debug("[enableRow] last: ", lastTxt, $(lastSpan));

            // NO!!! Depends on who initiated...
            let chkId = (thisAttack && Object.keys(thisAttack).length) ?
                thisAttack.initiatorId : (iStartedIt == true) ? user_id : opponent.id;
            debug("[enableRow] chkId: ", chkId, " iStartedIt: ", iStartedIt, " user_id: ", user_id, " opponent.id: ", opponent.id);
            if (outcome == 'Win') {
                target = (chkId == user_id) ?
                    $(".player-wrap > .opponent > .img-wrap") : $(".player-wrap > .player > .img-wrap");
            } else if (outcome == 'Loss') {
                target = (chkId == user_id) ?
                    $(".player-wrap > .player > .img-wrap") : $(".player-wrap > .opponent > .img-wrap");
            }

            debug("Fight Outcome: ", $(resSpan), $(resSpan).text());

            if (target)
                bleedBabyBleed(target);
        }

        function getRowResults(resText) {
            if (!resText) return {};
            let parts = resText.split("damage (");
            let damage = parseInt(parts[0].match(/\d+/)[0]);
            let remains = parseInt(parts[1]);
            return { remains: remains, damage: damage };
        }

        // Add random bullet hole
        function addDot(container, result = 'hit') {

            // Generate random percentage coordinates
            const randomX = getRandomIntEx(20, 80);
            const randomY = getRandomIntEx(20, 80);

            let dot = `<div class="bullet-hole ${result}" style="left: ${randomX}%; top: ${randomY}%;"></dot>`;

            debug("[addDot] cont: ", $(container), " dot: ", $(dot));
            $(container).append($(dot));
        }

        function processAttackRow(row, iStartedIt) {
            let outbound = false;
            let inbound = false;
            if ($(row).hasClass("borderFirst") || $(row).hasClass("borderLast")) return;
            if ($(row).hasClass("fight-success")) {
                outbound = (iStartedIt == true) ? true : false;
                inbound = (iStartedIt == true) ? false : true;
                debug("[processAttackRow] has fight-success");
            }
            if ($(row).hasClass("fight-danger")) {
                outbound = (iStartedIt == true) ? false : true;
                inbound = (iStartedIt == true) ? true : false;
                debug("[processAttackRow] has fight-danger");
            }

            debug("[processAttackRow] ib: ", inbound, " ob: ", outbound, " my fault: ", iStartedIt, " row: ", $(row));

            let ftr = (inbound == true) ? $("#player-ftr") : $("#opponent-ftr");
            let other = (inbound == true) ? $("#opponent-ftr") : $("#player-ftr");
            let playerId = (inbound == true) ? user_id : opponent.id;

            let target = (inbound == true) ? $(".player-wrap > .player > .img-wrap") : $(".player-wrap > .opponent > .img-wrap");

            // 1. Fade the text out by adding the CSS class
            $(other).addClass('text-hidden');
            $(other).one('transitionend', function() {
                $(this).text("");
                $(this).removeClass('text-hidden');
            });

            if ($(row).find('td').text().indexOf("missed") > -1) {
                $(ftr).text("Missed!");
                addDot($(target), 'miss');
            }

            if ($(row).find('td').text().indexOf("causing") > -1) {
                let parsed = getRowResults($(row).find('td').text());
                $(`#currentLifeFs-${playerId}`).text(parsed.remains);
                $(ftr).text(`Hit for ${parsed.damage}! (${parsed.remains} left)`);

                addDot($(target));

                let max = parseInt($(`#lifeProgress-${playerId}`).attr("aria-valuemax"));
                let rawPct = parseInt(parsed.remains) / max;
                let pct = parseInt(rawPct * 100);
                let pctTxt = pct.toString() + "%";
                $(`#lifeProgress-${playerId}`).css("width", pctTxt);
                $(`#lifeProgress-${playerId}`).attr("aria-valuenow", parsed.remains);

                debug("[processAttackRow] ",
                      ((outbound == true) ? "outbound, " : "inbound, "), parsed.remains, " of ", max, " is ", pctTxt);
            }
        }
    }

    // Get the user's avatar
    function getFightPic(filename, userId, optEntry) {
        let node;
        if (optEntry) {
            node =
                `<div class="img-wrap player-${userId}"><img class="img-thumbnail mb-3 no-tile" src="${optEntry.src}"
                    style="${optEntry.style}"
                    title="Custom profile image" id="${optEntry.id}-profileImg"></div>`;
        } else {
            node =
                `<div class="img-wrap player-${userId}"><img class="img-thumbnail mb-3 no-tile" src="/build/images/profileOverlay-9d33f4f6f410.webp"
                    style="background-image: URL('https://cartelstorage.blob.core.windows.net/user-assets/${userId}/${filename}')"
                    title="Custom profile image" id="${userId}-profileImg"></div>`;
        }

        return node;
    }

    //nHTML for the opponent's life bar
    function getLifeBar(lifeNow, lifeMax, playerId) {

        let rawPct = parseInt(lifeNow) / parseInt(lifeMax);
        let pct = parseInt(rawPct * 100);
        let pctTxt = pct.toString() + "%";

        let lifeBar =
            `<div id="fsLifeSidebar" class="fs-std-bar progress progressBarStat fightSimBar">
                <div id="lifeProgress-${playerId}" class="progress-bar bg-success progress-bar-striped fightProgBar" role="progressbar"
                     style="width: ${pctTxt};" aria-valuenow="${lifeNow}" aria-valuemin="0" aria-valuemax="${lifeMax}" aria-label="Current Life">
                </div>
                <div class="progress-bar-title-std">
                    <span id="currentLifeFs-${playerId}">${lifeNow}</span> / <span id="maxLifeFs-${playerId}">${lifeMax}</span>
                </div>
            </div>`;

        return lifeBar;
    }

    // Build the two-panel player attack view
    function addProfiles() {
        let card = $("#mainBackground > div.container > div > div.col-12 > div.mb-4.card");
        $(card).addClass("result-card");

        let newNode = `<div id="fightSim" class="card" style="visibility: visible !important;">
                            <div class="fighters row mb-0">
                                <div class="player-wrap">
                                    <span id="player-hdr" class="hdr"></span>
                                    <div class="player">
                                    </div>
                                    <span id="player-ftr" class="ftr fade-text"></span>
                                </div>
                                <div class="player-wrap">
                                    <span id="opponent-hdr" class="hdr"></span>
                                    <div class="opponent">
                                    </div>
                                    <span id="opponent-ftr" class="ftr fade-text"></span>
                                </div>
                           </div>
                        </div>`;

        $(".result-card").before(newNode);
        $(".opponent").append(getFightPic(opponent.pfp, opponent.id, opponent));

        let lb = getLifeBar(opponent.lifeNow, opponent.lifeMax, opponent.id);
        $("#opponent-hdr").append(lb);

        lb = getLifeBar($("#currentLife").text(), $("#maxLife").text(), user_id);
        $("#player-hdr").append(lb);

        let myPfp = GM_getValue("myPfp", "");
        $(".player").append(getFightPic(myPfp, user_id));

    }

    function handleSkipClick(e) {
        skipClicked = true;
        restoreFullTable();
    }

    function handleDisableClick(e) {
        if (settings.enableFightSim.on == true) {
            settings.enableFightSim.on = false;
            $("#disableBtn").text("Enable Replay");
        } else {
            settings.enableFightSim.on = true;
            $("#disableBtn").text("Disable Replay");
        }
        GM_setValue("enableFightSim", JSON.stringify(settings.enableFightSim));
    }

    function addSkipBtn(retries=0) {
        if ($("#skipBtn").length) return debug("Skip/Disable buttons already installed");
        let target = $(".card .header-section")[0];
            if (!$(target).length) {
                if (retries++ < 25) return setTimout(addSkipBtn, 100, retries);
                return log("[addSkipBtn] timed out.");
            }

        GM_addStyle(`
            .flrw { display: flex; flex-flow: row wrap; align-content: center; }
            .skipBtn-wrap, .searchBtn-wrap { margin-left: 20px; }
        `);

        const skipBtn =
              `<span class="skipBtn-wrap"><button id="skipBtn" class="btn btn-sm btn-dark">Stop Replay</button></a></span>
               <span class="skipBtn-wrap"><button id="disableBtn" class="btn btn-sm btn-dark">Disable Replay</button></a></span>`;
        const medsBtn = $("#medsBtn").parent();

        $(target).addClass("flrw");
        if ($(medsBtn).length) {
            $(medsBtn).after(skipBtn);
        } else {
            $(target).find("h2").after(skipBtn);
        }

        $("#skipBtn").on("click", handleSkipClick);
        $("#disableBtn").on("click", handleDisableClick);
        if (settings.enableFightSim.on == false)
            $("#disableBtn").text("Enable Replay");
        else
            $("#disableBtn").text("Disable Replay");
    }

    // Grab my own avatar pic
    function getProfileImage(retries=0) {
        let myPfp = $("#userDropdown > img");
        if (!$(myPfp).length) return retry(getProfileImage, retries);
        let url = $(myPfp).attr("src");
        debug("[getProfileImage] url: ", url);
        let filename = url.split('/').pop();

        GM_setValue("myPfp", filename);

        return filename;
    }

    function idFromFightPage() {
        const pathname = new URL(location.href).pathname;
        const match = pathname.match(/\/(\d+)\/?$/);
        const number = match ? Number(match[1]) : null;
        return number;
    }

    function restoreFullTable(retries) {
        $("#fightSim").remove();
        $(".fightTable").prev().css("display", "block");
        let rows = $(".fightTable > table > tbody > tr");
        if (!$(rows).length) return retry(restoreFullTable, retries);
        for (let idx=0; idx<$(rows).length; idx++) {
            let row = $(rows)[idx];
            $(row).css("display", "block")
        }
    }

    // Entry point when on the fight page
    var apiAttackCallInit = false;
    function processFightPage(retries=0) {
        if (settings.enableFightSim.on != true) return log("Fight simulation disabled");
        fightId = idFromFightPage();
        debug("[processFightPage\ fightId: ", fightId);
        if (apiAttackCallInit == false) {
            // add fight id as a param?
            ce_executeApiCall("user", null, "attacks", attacksCb);
        }

        let rows = $(".fightTable > table > tbody > tr");
        if (!$(rows).length) return retry(processFightPage, retries);
        for (let idx=0; idx<$(rows).length; idx++) {
            let row = $(rows)[idx];
            $(row).css("display", "none")
        }
        $(".fightTable").prev().css("display", "none");

        getOpponent();
        addProfiles();
        showCard();

        addSkipBtn();
    }

    // ====================== Settings page ===========================================

    var installLogged = false;
    function installSettings(retries=0) {
        if (installLogged == false) debug("[installSettings]");
        installLogged = true;
        let root = $("#settingsNav");
        let navTab = $("#settingsNav > div.nav.nav-tabs > button.active");

        if (!$(root).length || !$(navTab).length) return retry(installSettings, retries);

        let tabId = $(navTab).attr("id");
        const selected = (tabId == "v-content-fsim");

        let tabs = $("#settingsNav > div.nav-tabs");
        let content = $("#settingsNav .tab-content");

        debug("[installSettings]", $(tabs), $(content));

        const newTab = `
            <button class="nav-link settings-nav-link" id="v-tab-chat" data-bs-toggle="tab"
            data-bs-target="#v-content-fsim" type="button" role="tab" aria-controls="v-content-fsim"
            aria-selected="${selected.toString()}" tab="fsim" tabindex="-1">Fight Sim</button>`;
        $(tabs).append(newTab);

        $("#v-tab-chat").on('click', function(e) {
            let url = new URL(window.location.href);
            let searchParams = url.searchParams;
            searchParams.set('t', 'fsim');
            url.search = searchParams.toString();
            history.replaceState(null, '', url.toString());
            });

        if (selected == false)
            $("#v-tab-fsim").attr("tabindex", "-1");

        appendSettingsHtml(content);

        if (selected == true) {
            $("#v-content-fsim").addClass("active show");
        }

        let optNames = Object.keys(settings);
        debug("[installSettings] opt names: ", optNames);

        for (let idx=0; idx<optNames.length; idx++) {
            let name = optNames[idx];
            let entry = settings[name];
            if (entry.visible == false) continue;
            let inputIdSelect = "#" + name;
            let on = entry.on;

            debug("[settings] \nentry: ", entry, "\ndefSettings[name]: ", defSettings[name]);
            let grpEntry = groupIds[entry.grp];

            debug("[settings] entry.grp: ", entry.grp);
            if (!grpEntry) {
                console.error("No group entry for ", name, " entry: ", entry);
                continue;
            }
            let tblId = groupIdToId(grpEntry.id);
            debug("[installSettings] ", name, inputIdSelect, on);

            let row = getSettingsRow(name);
            $(`#${tblId}`).append($(row));
            debug("[installSettings] appended row: ", $(`#${tblId}`), $(inputIdSelect));

            $(inputIdSelect).prop('checked', on);
            $(inputIdSelect).on('change', handleSettingsChange);
        }

    }

    function getSettingsRow(key) {
        let name = key;
        let entry = settings[name];
        let enabled = entry.on;
        let isBtn = entry.btn && entry.btn == true;
        let style = entry.style;
        let newRow = "";

        switch (style) {
            case "number": {
                newRow = `<tr class="align-middle settings-row" style="border-bottom-width: 1px;">
                              <td class="flex-r"><span>${entry.desc}</span><span class="settingsVal">
                                   <input class="fsim-w-over settings-input text-center text-xl-start" name="${key}" type="number" value="${entry.value}" min="${entry.min}" max="${entry.max}">
                               </span></td>
                               <td>
                                   <!-- div class="form-check form-switch">
                                        <input class="form-check-input" name="${key}" type="checkbox" id="${key}">
                                   </div -->
                               </td>
                          </tr>`;
                break;
            }
            case "checkbox": {
                newRow = `<tr class="align-middle settings-row" style="border-bottom-width: 1px;">
                              <td class=""><span>${entry.desc}</span></td>
                              <td><div class="form-check form-switch">
                                <input class="form-check-input" name="${key}" type="checkbox" id="${key}">
                            </div></td>
                          </tr>`;

                break;
            }
            default: {
                debug("ERROR: unknown option style: ", style, entry);
                break;
            }

        }

        return newRow;
    }

    function getTblBody(hdrText, bodyId) {
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
            const subBtn = `<input class="btn btn-success mt-2" type="submit" value="Update Settings" id="submitChatOptsBtn">`;
            let settingsHtml = `
                <div class="tab-pane fade" id="v-content-fsim" role="tabpanel" aria-labelledby="v-tab-fsim">
                    <div class="card">
                        <div id="fsim-opts" class="card-body">

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

                $("#fsim-opts").append(newTbl);
            }
            $("#fsim-opts").append(subBtn);
        }

    function handleSettingsChange(e) {
        let name = $(this).attr("name");
        let entry = settings[name];
        entry.on = $(this).prop('checked');
        GM_setValue(name, JSON.stringify(entry));
    }

    function handleSettingsValChange(e) {
        let name = $(this).attr("name");
        let entry = settings[name];
        let newVal = $(this).val();
        entry.val = newVal;
        GM_setValue(name, JSON.stringify(entry));
    }

    // ====================== Entry Point ===========================================

    function handlePageLoad(retries=0) {
        if (isSettingsPage() == true) {
            installSettings();
        }

        let userPage = isUserPage();
        let fightPage = isFightPage();

        if (settings.enableFightSim.on != true) {
            showCard();
            if (fightPage) addSkipBtn();
            return;
        }

        getProfileImage();

        if (userPage) processUserPage();
        if (fightPage) processFightPage();
    }

    //////////////////////////////////////////////////////////////////////
    // Main.
    //////////////////////////////////////////////////////////////////////

    logScriptStart();

    validateApiKey();

    if (!user_id || !user_name) {
        ce_executeApiCall("user", null, "basic", basicUserCb);
    }

    addStyles();

    callOnContentLoaded(handlePageLoad);


    // Add any styles here
    function addStyles() {

        const imgHeight = '300px';
        const imgWidth = '250px';

        // Dripping blood...
        GM_addStyle(`
            .bloody-box {
              /* position: relative;
              width: 500px;
              height: 250px; */
              background-color: #111;
              color: #fff;
              /* padding: 20px;
              margin: 50px auto; */
              overflow: hidden; /* Keeps falling drops inside the container */
            }

            /* Base style for the injected drips */
            .blood-drip {
              position: absolute;
              top: 0;
              width: 8px; /* Thickness of the drip */
              background-color: #8b0000;
              border-radius: 0 0 8px 8px;
              transform-origin: top center;
              /* animation: dynamic-drip 4s infinite ease-in-out; */
              animation: dynamic-drip 4s ease-in-out;
              transform: scaleY(0);
              opacity: 0;
            }

            @keyframes dynamic-drip {
              0% {
                transform: scaleY(0);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              50% {
                /* Grows to its maximum assigned height via CSS variable */
                transform: scaleY(1);
                opacity: 1;
              }
              75% {
                /* Simulates the droplet detaching and stretching downward */
                transform: scaleY(1.3) translateY(20px);
                opacity: 0;
              }
              100% {
                transform: scaleY(0) translateY(20px);
                opacity: 0;
              }
            }
        `);

        GM_addStyle(`
            .fsim-w-over  {
                width: 320px !important;
                margin-right: 20px;
            }
        `);

        // bullet holes
        GM_addStyle(`
            .bullet-hole {
                position: absolute;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                box-shadow: 0 0 4px rgba(0,0,0,0.5);
                transform: translate(-50%, -50%);
                pointer-events: none;
                animation: spawnPulse 0.4s ease-out forwards;
            }
            .hit {
                background-color: red;
                width: 12px;
                height: 12px;
                border: 2px solid black;
            }
            .miss {
                background-color: silver;
                width: 12px;
                height: 12px;
                border: 2px solid black;
            }
            @keyframes spawnPulse {
                0% {
                    transform: translate(-50%, -50%) scale(2);
                    opacity: 0.5;
                }
                50% {
                    transform: translate(-50%, -50%) scale(2.5); /* Slight pop/overshoot */
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
            }
        `);

        // progress bar, for life left
        GM_addStyle(`
            .progress-bar-title-fs {
                overflow: hidden;
                height: 18px;
                width: 98%;
                display: flex;
                justify-content: space-between;
            }
            .progress-bar-title-std {
                position: absolute;
                text-align: center;
                line-height: 1.2rem;
                font-size: 0.85rem;
                overflow: hidden;
                color: #3c3c3c;
                right: 0;
                left: 0;
                top: -2px;
                text-shadow: 0px 1px 3px white;
            }
            .progressBarStatFs {
                height: 12px;
                border: 1px solid rgba(155, 193, 7, 0.5);
            }

            .fightSimBar {
                margin: 20px 20px 10px 20px;
            }
            .fightProgBar {
                min-height: 24px;
                height: 100%;
            }
        `);

        GM_addStyle(`
            .fighters {
                display: flex;
                flex-flow: row wrap;
                justify-content: space-evenly;
            }
            .fighters img {
                position: relative;
                width: ${imgWidth};
                height: ${imgHeight};
            }
            .player, .opponent {
                /* width: 40%; */
            }
            .img-wrap {
                position: relative;
                width: ${imgWidth};
                height: ${imgHeight};
                transform: translate(50%);
            }
            .no-tile {
                background-repeat: no-repeat;
                background-position: center;
                background-size: cover;
            }
            .player-wrap {
                display: flex;
                flex-direction: column;
                width: 50% !important;
            }
            .player-wrap > .hdr, .player-wrap > .ftr {
                height: 48px;
            }
            .player-wrap > .ftr {
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                margin-top: 10px;
                box-shadow:
                    inset 2px 2px 5px rgba(0, 0, 0, 0.8),       /* 1. Dark top-left inner shadow */
                    inset -2px -2px 5px rgba(255, 255, 255, 0.1), /* 2. Soft bottom-right inner highlight */
                    0px 1px 1px rgba(255, 255, 255, 0.15);
            }
            span.fade-text {
                color: var(--bs-body-color); /* Starting text color */
                transition: color 0.4s ease-out; /* Animates ONLY the color */
            }

            span.fade-text.text-hidden {
                color: transparent; /* Text vanishes, shadows stay */
            }
            #player-ftr { margin-left: 10px; }
            #opponent-ftr { margin-right: 10px; }
        `);

    }

})();