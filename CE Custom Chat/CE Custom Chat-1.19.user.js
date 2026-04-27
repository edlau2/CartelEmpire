// ==UserScript==
// @name         CE Custom Chat
// @namespace    http://tampermonkey.net/
// @version      1.19
// @description  This script allows Chat to be customized in a bunch of ways, always changing...
// @author       xedx [2100735]
// @match        https://cartelempire.online/*
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      https://raw.githubusercontent.com/edlau2/CartelEmpire/master/Helpers/ce_js_utils.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        unsafeWindow
// ==/UserScript==

/*eslint no-unused-vars: 0*/
/*eslint no-undef: 0*/
/*eslint curly: 0*/
/*eslint no-multi-spaces: 0*/

(function() {
    'use strict';

    // ======================= Configurable Options ==========================

    debugLoggingEnabled =
        GM_getValue("debugLoggingEnabled", false);    // Extra debug logging
    GM_setValue("debugLoggingEnabled", debugLoggingEnabled);

    const curr_ver = parseFloat(GM_getValue('curr_ver', 0));
    const thisVer = parseFloat(GM_info.script.version);
    const resetDefSettings = (curr_ver <= 1.17) || (GM_getValue("resetDefSettings", false) == true);
    const backupSettings = GM_getValue("backupSettings", false);

    GM_setValue('curr_ver', GM_info.script.version);
    GM_setValue("resetDefSettings", false);
    GM_setValue("backupSettings", false);

    function isStringified(str) { try {  return JSON.parse(str);  } catch(ex) { return str; } }

    // Function to backup local script data. Either as a downloadable blob,
    // or as another key in the data storage if toBlob == false. If clearData is true,
    // all data except for the backed up data and API key will be deleted as well.
    function backupAllScriptData(toBlob=true, clearData=false) {
        const keys = GM_listValues();
        let backup = {};

        log("[backupAllScriptData] blob: ", toBlob, " clearData: ", clearData);

        // 2. Build key-value pair object
        keys.forEach(key => {
            backup[key] = GM_getValue(key);
            if (clearData == true && (key.indexOf("tm_backup") == -1) && key != "api_key") {
                deleteValue(key);
            }
        });

        // If desired, create as new key-val in storage
        if (toBlob == false) {
            let backupKey = "tm_backup_" + new Date().toISOString(); //tinyDateStr("backup_" + (new Date()), true) + '_' + tinyTimeStr((new Date().getTime()));
            debug("[backupAllScriptData] key: ", backupKey);
            GM_setValue(backupKey, JSON.stringify(backup));
            log("[backupAllScriptData] data written to key: ", backupKey);
            return;
        }

        // 3. Create JSON and download
        log("[backupAllScriptData] creating downloadable blob");
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "tm_backup_" + new Date().toISOString() + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        log("[backupAllScriptData] download complete");
    }

    // Test backup
    if (backupSettings == true) backupAllScriptData(false);

    // replace/populate with options/chatProps !!!
    var settingsInit = false;

    var settings = {};
    function initSettings(optObject) {
        debug("[initSettings] can init properties AFTER this call.");
        debug("[initSettings] Settings: ", settings, " optObject: ", optObject);
        let keys = Object.keys(optObject);

        //$.each(optObject, function(key, value) {
        for (let idx=0; idx<keys.length; idx++) {
            let key = keys[idx];
            let value = optObject[key];
            debug("[initSettings] key: ", key, " value: ", value);
            // Save defaults if not set
            let tmp  = GM_getValue(key, JSON.stringify(value));
            log("tmp: ", tmp);
            let val = isStringified(tmp);


            // JSON.parse(GM_getValue(key, JSON.stringify(value)));

            debug("[initSettings] key: ", key, " val: ", val);
            debug("[initSettings] settings[key]: ", settings[key]);
            settings[key] = val; //.parse(GM_getValue(key, JSON.stringify(value)));
            // if ($.isEmptyObject(settings[key])) {
            //     settings[key] = JSON.parse(JSON.stringify(value));
            //     GM_setValue(key, JSON.stringify(value));
            // }

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

    const groupIdToId = (optId) => { return (optId + 'Chat'); }
    const groupIds = { "gbl": { "id": "global", "title": "All Chat Options" },
                       "prv": { "id": "private", "title": "Private Chat Options" },
                       "ctl": { "id": "cartel", "title": "Cartel Chat Options" },
                       "app": { "id": "appearance", "title": "Appearance" },
                       "mnt": { "id": "maintenance", "title": "Maintenance" },
                     };

    //const settings = {};
    const defSettings = {

        // all chat boxes
        "chatbox-bg-opacity":  { "on": true, "desc": "Opacity of the chat box background",
                                  "visible": true, "grp": "app" ,
                                  "style": "number", "min": 0, "max": 1, "value": 1 },

        "chatbox-bg-color":    { "on": true, "desc": "Color behind the text in a chatbox",
                                  "visible": true, "grp": "app",
                                  "style": "color", "value": "rgba(25, 25, 25, var(--chatbox-bg-opacity))" },

        // my chat messages
        "my-chat-color":       { "on": true, "desc": "Color of my message text (visible only to me)",
                                  "visible": true, "grp": "app",
                                  "style": "color", "value": "red" },

        "my-chat-uses-border": { "on": true, "desc": "Place border boxes around my messages (visible only to me)",
                                  "visible": true, "grp": "app",
                                  "style": "checkbox", "value": false },

        "my-border-color":     { "on": true, "desc": "Color of my message borders (visible only to me)",
                                  "visible": true, "grp": "app",
                                  "style": "color", "value": "green" },

        "my-chat-border":      { "on": true, "desc": "Styling of my message borders (visible only to me)",
                                  "visible": true, "grp": "app",
                                  "style": "border", "value": "1px solid var(--my-border-color)" },

        "my-bg-color":         { "on": true, "desc": "Background color of my messages (visible only to me)",
                                  "visible": true, "grp": "app",
                                  "style": "color", "value": "#000" },
    }

    initSettings(defSettings);


    // Style properties, dynamic
//     var chatProps = {
//         // Entire chat box
//         "chatbox-bg-opacity": GM_getValue("chatbox-bg-opacity", "0"),
//         "chatbox-bg-color":   GM_getValue("chatbox-bg-color", "rgba(25, 25, 25, var(--chatbox-bg-opacity))"),

//         // My messages:
//         "my-chat-uses-borders": GM_getValue("my-chat-uses-borders", false),
//         "my-border-color":      GM_getValue("my-border-color" , "green"),
//         "my-chat-border":       GM_getValue("my-chat-border" , "1px solid var(--my-border-color)"),
//         "my-chat-color":        GM_getValue("my-chat-color" , "red"),
//         "my-bg-color":          GM_getValue("my-bg-color", "#000"),

//         // Other's messages:
//     };



    function keyToVarName(key) {return "--" + key.replaceAll("_", "-").toLowerCase();}
    function setPropertyValue(key, val) {
        let root = document.documentElement;
        let variant = keyToVarName(key);

        debug("[setPropertyValue] key: ", key, " val: ", val, " variant: ", variant);
        if (val == 'default') {
            root.style.removeProperty(variant, val);
        } else {
            root.style.setProperty(variant, val);
        }
    }

    // This takes the properties used in each setting (if applicable)
    // adds them to root.style properties
    function initDefProps() {
        debug("[initDefProps] settingsInit: ", settingsInit);
        if (settingsInit == false) {
            console.error("CE Custom Chat [initDefProps] opts not initialized!! Initialize options before properties.");
            return log("ERROR opts not initialized!! Initialize options before properties.");
        }
        $.each(settings, function(key, value) {
            debug("[initDefProps] key: ", key, " value: ", value, " val: ", value["value"]);
            setPropertyValue(key, value["value"]);
        });
    }

    const myId = initUserId();

    // Page detection - move to lib!!!
    const thisURL = window.location.pathname.toLowerCase() || "home";  // Returns path only or home if not specified

    // 'undefined' check is temp for a bug in here somewhere...
    const escapeRegExp = (string) => { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('undefined', ''); }
    const hasPath = (txt) => { return new RegExp(`${escapeRegExp(txt)}`, 'gi').test(thisURL); }

    const isSettingsPage = () => { return hasPath("/settings"); }

    // To calc opacity value: 255 x (opacity %), then convert to hex
    // 100% = FF, 90% = 91, 75% = BF, 50% = 80, 25% = 40, 10% = 1A, 0% = 0
    //
    // Accepts either hex (prefix with a '#') or decimal % (postfix with a '%')
    //
    //const chatOpacity = '#BF';    // 75% opacity in hex
    //const chatOpacity = 'BF';     // also 75% opacity in hex
    //const chatOpacity = '75%';      // ...or 75% in decimal

    // TEST to help with scrolling in fac chat
    //$("#faction-44092 [class*='scrollWrapper']")
    // $("[id*='faction-'] [class*='scrollWrapper']")
    GM_addStyle(`
        [id*='faction-'] [class*='scrollWrapper'] {
            overflow-y: auto;
        }
    `);

    var pageIsVisible = true;
    const onVisChange = (isVisible) => { pageIsVisible = isVisible; }

    //var myId = GM_getValue('userId', $("#userId").attr('userId'));

    /* Test...
    function getUserInfo() {
        $.get("/User/getId", (res) => {
            if (res) {
                if (!myId) myId = res.userId;
                let oldInfo = JSON.parse(GM_getValue("userInfo", JSON.stringify({})));
                GM_setValue("userInfo", JSON.stringify(res));
                let newInfo = JSON.parse(GM_getValue("userInfo", JSON.stringify({})));
                log("Old info: ", JSON.stringify(oldInfo, null, 4));
                log("New info: ", JSON.stringify(newInfo, null, 4));
            }
        });
    }

    //getUserInfo();
    */ // End test

    GM_setValue('userId', myId);
    const chatBoxSel = ".MessagesContainer:not('.watched')";
    const chatRowSel = "body > div > div.chats.row";

    const statusIcon = `<div class="lastActiveContainer d-flex align-items-center">` +
                       `<svg class="svg-wrap" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="rgba(255, 250, 240, 0.6)" viewBox="0 0 16 16">` +
                       `<circle cx="8" cy="8" r="8"></circle></svg></div>`;

    const closeBtn = `<a class="closeChat" style="cursor:pointer">
                          <svg class="bi bi-x" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#FFF" viewBox="0 0 16 16">
                          <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z">
                      </path></svg></a>`;

    // Helper to parse user ID from an href
    const idFromHref = (href) => { return href.substring(href.lastIndexOf('/') + 1); }

    var options = {
        //"chatActiveOpacity": false,
        //"draggableChat": false,
    };

    // function initOptions(optObject) {
    //     $.each(optObject, function(key, value) {
    //         options[key] = GM_getValue(key, value);
    //         GM_setValue(key, options[key]);
    //     });
    // }

    var savedChatDates = JSON.parse(GM_getValue("savedChatDates", JSON.stringify({})));

    // Style properties, dynamic
//     var chatProps = {
//         // Entire chat box
//         "chatbox-bg-opacity": GM_getValue("chatbox-bg-opacity", "0"),
//         "chatbox-bg-color": GM_getValue("chatbox-bg-color", "rgba(25, 25, 25, var(--chatbox-bg-opacity))"),

//         // My messages:
//         "my-border-color": GM_getValue("my-border-color" , "green"),
//         "my-chat-border": GM_getValue("my-chat-border" , "1px solid var(--my-border-color)"),
//         "my-chat-color": GM_getValue("my-chat-color" , "red"),
//         "my-bg-color": GM_getValue("my-bg-color", "#000"),

//         // Other's messages:
//     };

//     function initDefProps() {
//         $.each(chatProps, function(key, value) {
//             setPropertyValue(key, value);
//         });
//     }

    // function keyToVarName(key) {return "--" + key.replaceAll("_", "-").toLowerCase();}
    // function setPropertyValue(key, val) {
    //     let root = document.documentElement;
    //     let variant = keyToVarName(key);
    //     if (val == 'default') {
    //         root.style.removeProperty(variant, val);
    //     } else {
    //         root.style.setProperty(variant, val);
    //     }
    // }

    function scrollToBottom(chatWindow, force) {
        chatWindow = $(chatWindow)
        let scrollTop = chatWindow.prop("scrollTop");
        let scrollHeight = chatWindow.prop("scrollHeight");
        let clientHeight = chatWindow.prop("clientHeight");
        let position = scrollHeight - clientHeight;
        let scrollPercent = scrollTop / position;

        if(scrollPercent > 0.85 || force) {
            $(chatWindow).scrollTop($(chatWindow).prop('scrollHeight'))
        }
    }

    /*
    function passThruClick(evt) {
        const x = evt.clientX;
        const y = evt.clientY;

        $(this).css('display', 'none');
        const underlyingElement = document.elementFromPoint(x, y);
        $($(underlyingElement)[0]).trigger('click');
        $(this).css('display', '');
        debug("underlyingElement: ", $(underlyingElement));
    }
    */

    function checkUnreadNotifications() {
        let allChats = $(".chats.row .chatContainer");
        debug("[checkUnreadNotifications] allChats: ", $(allChats));

        for (let idx=0; idx<$(allChats).length; idx++) {
            let chat = $(allChats)[idx];
            let msgsRoot = $(chat).find("div.wrapper div.MessagesContainer");
            let btn = $(chat).find("label.chat-btn");
            let unreadFlag = $(btn).hasClass("newMessage");
            let msgs = $(chat).find("div.wrapper div.MessagesContainer div.messageText");
            let lastMsg = $(chat).find("div.wrapper div.MessagesContainer div.messageText:last-child");
            let fromMe = $(lastMsg).hasClass("cc-my-node");
            debug("[checkUnreadNotifications] \n\tchat: ", $(chat), "\n\tRoot: ", $(msgsRoot),
                  "\n\tMsgs: ", $(msgs), "\n\tLast msg: ", $(lastMsg),
                  "\n\tFrom me: ", fromMe, "\n\tbtn: ", $(btn), "\n\tUnread: ", unreadFlag);

            if (unreadFlag == true && fromMe == true) {
                debug("[checkUnreadNotifications] Mismarked!! ", $(btn));
                //$(btn).css("border", "1px solid blue");
                $(btn).removeClass("newMessage");
            }
        }

        setTimeout(checkUnreadNotifications, 5000);
    }

    function processMyChatMsg(node) {
        if (!$(node).hasClass('cc-my-node'))
            $(node).addClass('cc-my-node');
    }

    function getAbsPos(el) {
        const offset = element.offset();
        const absoluteTop = offset.top;
        const absoluteLeft = offset.left;
    }

    // Change height of chat input
    if (false) {
/*         Change $("input.userMessage") to 'type="textarea"', not text
        Set height, say 52px from 34
        Set $(".wrapper.wrap-cc-bg") to "transform: translateY("-14px")"

        CSS (style?) for the input:

        height: 52px;
        text-align: left !important;
        vertical-align: top !important;
        resize: vertical;
        overflow-wrap: break-word !important;
        word-wrap: break-word;
        word-break: break-all; */

    }

    function getAdvStats(id) {
        if (pageIsVisible == false)
            return setTimeout(getAdvStats, 2000, id); //, 'advanced', processAdvancedResp);
        ce_getUserStats(id, 'advanced', processAdvancedResp);
    }

    function processAdvancedResp(response, status, xhr, id) {
        //logt("[processAdvancedResp]");
        const statColors = {"Active": "green", "Inactive": "red"}; //, "Hospital": "yellow" }; // ???

        let data = JSON.parse(response);
        let s = data.status;
        let color = statColors[s];
        let now = new Date().getTime() / 1000;
        let then = parseInt(data.lastActive);
        if (s != "Inactive" && (now - then) > (30 * 60))
            color = "yellow";

        $(`.status-${id}`).find('svg').attr("fill", color);

        // Check again later (30 secs)
        setTimeout(getAdvStats, 30000, id, 'advanced', processAdvancedResp);
    }

    // Save the time opened, we assume that any messages
    // after this time will be unread, so if the last message
    // is *before* this time, turn off highlighting.
    function handleChatClick(e) {
        // Save the time on this node, and in storage to add back later
        let chatId = $(this).attr("id");
        let ts = parseInt(new Date().getTime() / 1000);
        if (savedChatDates[chatId])
            savedChatDates[chatId]["lastOpened"] = ts;
        else {
            savedChatDates[chatId] = {};
            savedChatDates[chatId]["lastOpened"] = ts;
        }
        $(this).removeClass("xunopened");
        $($(this).find(".xlg")[0]).removeClass("xlg").addClass("xlb");
        GM_setValue("savedChatDates", JSON.stringify(savedChatDates));
        $(this).attr("data-last-looked", ts);
    }

    function addCloseButton(el, id) {

    }

    function addStatusIcon(el, id) {
        let btn = $(el).find("label.chat-btn");
        $(btn).children().first().css("padding-left", "0px");
        let btnIcon = $(statusIcon);
        $(btnIcon).css("width", "fit-content");
        $(btnIcon).addClass(`status-${id}`);
        $(btn).prepend($(btnIcon));

        let hdr = $(el).find(".wrapper .header h6");
        let newIcon = $(statusIcon);
        $(newIcon).addClass(`status-${id}`);
        $(hdr).css("display", "flex");
        $(hdr).prepend($(newIcon));
        $(hdr).closest(".header").css("padding-left", "4px");

        getAdvStats(id, 'advanced', processAdvancedResp);
    }

    function checkStatusIcons() {
        let privateChats = $(".chats.row .chatContainer:not('.xstat')")
            .filter( (idx, e) => {
                return $(e).attr('id') ? $(e).attr('id').indexOf('-') > - 1 : false;
            });


        // $(".chatContainer.xstat > .chat-btn")
        $(".chatContainer.xstat > .chat-btn").not(".xlg").addClass("xlb");
        $(privateChats).each(function(idx, el) {
            let userHref = $(el).find("div.wrapper .header a").attr('href');
            if (userHref) {
                let id = idFromHref(userHref);
                $(el).addClass("xstat");
                addStatusIcon(el, id);
                $(el).on('click', handleChatClick);
            }
            let chatId = $(this).attr("id");
            let lastMsg = $(this).attr("data-aria-latest");
            let lastOpen;

            debug("[checkStatusIcons] savedChatDates[chatId]: ", chatId, savedChatDates[chatId]);

            let lastMsgNode = $(this).find(".MessagesContainer > div.messageText:last-child");
            let lastIsMine = $(lastMsgNode).hasClass("cc-my-node") ? true : false;

            let lbl = $(this).find("label.chat-btn").attr("title");
            let name = "";
            if (lbl) name = lbl.split(" ")[0];

            debug("[checkStatusIcons] from ", name, " lastMsgNode: ", $(lastMsgNode), " from me: ", lastIsMine);

            if (savedChatDates[chatId]) {
                lastOpen = savedChatDates[chatId]["lastOpened"];
                debug("found saved chat ID", lastOpen);
                $(this).attr("data-last-looked", lastOpen);
            }

            //log("xxx lastOpen && lastMsg: ", lastOpen, lastMsg, (parseInt(lastMsg) > parseInt(lastOpen)));
            if (lastOpen && lastMsg) {
                let cb = $(this).find("[class*='chat-btn']");
                //log("xxx Chat button? ", $(cb));
                if (lastIsMine == false && parseInt(lastMsg) > parseInt(lastOpen)) {
                    //log("xxx adding 'xunopened' class");
                    $(this).addClass("xunopened");
                    $(cb).addClass("xlg").removeClass("xlb");
                } else {
                    // remove 'newMessage' class
                    $(cb).removeClass("xlg").addClass("xlb");
                }
            }
        });
    }

/*     var lastDragId = 0;
    function updateDragSupport() {
        let wraps = $(".chatContainer > .wrapper:not('.x-drag')");
        debug("[updateDragSupport] ", $(wraps));
        for (let idx=0; idx<$(wraps).length; idx++) {
            let el = $(wraps)[idx];
            //let posOrg = $(el).offset();
            let newId = 'drag' + lastDragId;
            lastDragId++;

            //let newParent = `<div id="${newId}" class="x-drag" style="display: flex; top: ${posOrg.top}px; left: ${posOrg.left}px;"></div>`;
            //$(el).attr('id', (newId + 'header'));
            //$(el).wrap(newParent);

            $(el).attr('id', newId);
            $(el).addClass('x-drag');
            let innerId = newId + 'header';
            $(`#${newId} > div`).wrapAll(`<div id="${innerId}" class="innerWrap"></div>`);
        }

    } */

    function preProcessChatMsgs(target) {
        let user = $(target).prev().find('a').attr('href');
        debug("Message user: ", user);
        scrollToBottom(target, true);
        let myMsgs = $(target).find(".messageText");
        $(myMsgs).each(function(index, node) {
            let user = $($(node).find('a')[0]).attr('href');
            if (user && user.indexOf(myId) > -1) processMyChatMsg(node);
        });

        checkStatusIcons();

        //checkUnreadNotifications();

//         if (options.draggableChat == true) {
//             updateDragSupport();
//         }
    }

    var observer;
    function installObserver(target, retries=0) {
        debug("[installObserver] install obs. for target: ", $(target));

        // Process existing nodes first
        if ($(target).hasClass("MessagesContainer") && !$(target).hasClass("watched")) {
            preProcessChatMsgs(target);
            //$(target).on('click', passThruClick);
        }

        const config = { childList: true, subtree: true };
        const handleAddedNodes = function(mutationsList, observer) {
            let update = false;
            for (const mutation of mutationsList) {
                let hasChatRow = $(mutation.target).hasClass('chats') && $(mutation.target).hasClass('row');
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
//                     if ($(".chatContainer:not('.x-drag') > .wrapper").length > 0)
//                         updateDragSupport();
                    if ($(mutation.target)[0] === $(chatRowSel)[0]) {
                        let targets = $(mutation.target).find(chatBoxSel);
                        if ($(targets).length > 0)
                            observeChatList(targets);
                    } else {
                        mutation.addedNodes.forEach(node => {
                            if ($(node).hasClass("messageText")) {
                                let userId = 0;
                                let user = $($(node).find('a')[0]).attr('href');
                                if (user && user.indexOf(myId) > -1) processMyChatMsg(node);
                            }
                        });
                        $(".cc-bg").each(function(idx, el) {scrollToBottom(el, true);});
                        checkStatusIcons();
                    }
                }
            }
        };

    if (!observer) observer = new MutationObserver(handleAddedNodes);
    observer.observe($(target)[0], config);
    }

    function observeChatList(targets) {
        for (let idx=0; idx<$(targets).length; idx++) {
            let node = $(targets)[idx];
            if (!$(node).hasClass("watched")) {
                installObserver(node);
                $(node).addClass("watched cc-bg");
                $(node).closest(".wrapper").addClass("wrap-cc-bg");
                $(node).closest(".bg-body").removeClass("bg-body");

/*                 if (options.chatActiveOpacity == true) {
                    $(node).closest(".wrapper").addClass('wrap-cc-bg-active');
                    $(node).on('mouseover', () => {
                        setPropertyValue('chatbox-bg-opacity', ".2");
                    });

                    $(node).on('mouseout', () => {
                        setPropertyValue('chatbox-bg-opacity', chatProps["chatbox-bg-opacity"]);
                    });
                } */
            }
        }
    }

    function handlePageLoad(retries=0) {
        // Add an observer for existing chats
        let targets = $(chatBoxSel);
        debug("[handlePageLoad] found ", $(targets).length, " chat targets");

        if (isSettingsPage() == true) {
            installChatSettings();
        }

        observeChatList(targets);

        // Add an observer for new chats
        let chatRootTarget = $(chatRowSel);
        if ($(chatRootTarget)) {
            debug("Installing observer for root: ", $(chatRootTarget));
            installObserver(chatRootTarget);
        }

        checkUnreadNotifications();
    }

    // ================================ Settings page ============================================

    // ============================= Add our own settings ===============================

    function handleSettingsBtn(e) {
        let fn = $(this).attr("data-fn");
        debug("[handleSettingsBtn]  ", $(this), fn);
        switch (fn) {
            case "testFn": {
                debug("[handleSettingsBtn] making testFn call");
                break;
            }

            case "doSettingsBackup": {
                backupAllScriptData(false);  // TBD: get cb settings to do local or on disk
                break;
            }

            default: {
                debug("[handleSettingsBtn] no handler defined for: ", fn);
                break;
            }

        }
    }

    var installLogged = false;
    function installChatSettings(retries=0) {
        if (installLogged == false) debug("[installChatSettings]");
        installLogged = true;
        let root = $("#settingsNav");
        let navTab = $("#settingsNav > div.nav.nav-tabs > button.active");

        if (!$(root).length || !$(navTab).length) {
            if (retries++ < 25) return setTimeout(installChatSettings, 100, retries);
            return log("[installChatSettings] timed out");
        }

        let tabId = $(navTab).attr("id");
        const selected = (tabId == "v-content-chat");
        debug("[settings] selected: ", selected, " id: ", tabId, " nav tab: ", $(navTab));

        let tabs = $("#settingsNav > div.nav-tabs");
        let content = $("#settingsNav .tab-content");

        debug("[installChatSettings]", $(tabs), $(content));

        const newTab = `
            <button class="nav-link settings-nav-link" id="v-tab-chat" data-bs-toggle="tab"
            data-bs-target="#v-content-chat" type="button" role="tab" aria-controls="v-content-chat"
            aria-selected="${selected.toString()}" tab="chat" tabindex="-1">Chat</button>`;
        $(tabs).append(newTab);

        $("#v-tab-chat").on('click', function(e) {
            let url = new URL(window.location.href);
            let searchParams = url.searchParams;
            searchParams.set('t', 'chat');
            url.search = searchParams.toString();
            history.replaceState(null, '', url.toString());
            });

        if (selected == false)
			$("#v-tab-chat").attr("tabindex", "-1");

        debug("[installChatSettings] new tab: ", $("#v-tab-chat"));

        appendSettingsHtml(content);
        //$(content).append(newContent);
        debug("[installChatSettings] appended content: ", $("#v-content-chat"));

        if (selected == true) {
            debug("[installChatSettings] adding active class");
			$("#v-content-chat").addClass("active show");
        }

        let optNames = Object.keys(settings);
        debug("[installChatSettings] opt names: ", optNames);

        for (let idx=0; idx<optNames.length; idx++) {
            let name = optNames[idx];
            let entry = settings[name];
            if (entry.visible == false) continue;
            let inputIdSelect = "#" + name;
            let on = entry.on;

            // Fixup changed group IDs
            if (defSettings[name] && defSettings[name].grp && defSettings[name].grp != entry.grp) {
                debug("abba ==========================================\nabba [settings] defSettings[name]: ", defSettings[name],
                      "\nabba defSettings[name].grp: ", defSettings[name].grp,
                      "\nabba entry: ", entry, "\nabba entry.grp: ", entry.grp,
                      "\nabba ===============================================\n");

                entry.grp = defSettings[name].grp;
                GM_setValue(name, JSON.stringify(entry));
            }

            debug("[settings] \nentry: ", entry, "\ndefSettings[name]: ", defSettings[name]);
            let grpEntry = groupIds[entry.grp];

            debug("[settings] entry.grp: ", entry.grp);
            if (!grpEntry) {
                console.error("No group entry for ", name, " entry: ", entry);
                continue;
            }
            let tblId = groupIdToId(grpEntry.id);
            debug("[installChatSettings] ", name, inputIdSelect, on);

            let row = getSettingsRow(name);
            debug("[installChatSettings] row before: ", row);
            $(`#${tblId}`).append($(row));
            debug("[installChatSettings] appended row: ", $(`#${tblId}`), $(inputIdSelect));

            $(inputIdSelect).prop('checked', on);
            $(inputIdSelect).on('change', handleSettingsChange);
        }

        // Add backup now row

        let doBackupRow =
                  `<tr class="align-middle settings-row" style="border-bottom-width: 1px;">
                      <td class="flex-r"><span>Backup settings now</span></td>
                      <td>
                          <div class="form-btn-wrap">
                              <input class="form-check-input" name="inStorage" type="checkbox" id="inStorage">
                              <input class="form-check-input" name="toDisk" type="checkbox" id="toDisk">
                              <input class="btn btn-success form-btn" type="submit" data-fn="doSettingsBackup" value="Backup Now" id="doBackup">
                          </div>
                      </td>
                  </tr>`;
        $(`#maintenanceChat`).append($(doBackupRow));

        $(".form-btn").on('click', handleSettingsBtn);
        $(".settings-input").on('change blur', handleSettingsValChange);

        function getSettingsRow(key) {
            let name = key;
            let entry = settings[name];
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

                debug("xxxx[installChatSettings] Button: ", entry["fn"], entry);
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
            let entry = settings[name];
            entry.on = $(this).prop('checked');
            GM_setValue(name, JSON.stringify(entry));

            // Some settings may be able to be turned on/off dynamically without
            // refreshing. Is it worth doing that?
            //doDynamicSettingsUpdate(name);
        }

        function handleSettingsValChange(e) {
            debug("[handleSettingsValChange]");
            let name = $(this).attr("name");
            let entry = settings[name];
            let newVal = $(this).val();
            entry.val = newVal;
            GM_setValue(name, JSON.stringify(entry));

            debug("[handleSettingsValChange] ", name, newVal, entry);
        }

//         function doDynamicSettingsUpdate(key) {
//             let entry = settings[key];
//             if (!entry) return;
//             let enable = entry.on;

//             switch (key) {
//                 case 'customClock': {
//                     if (theClock && enable == false) {
//                         theClock.remove();
//                         theClock = null;
//                     }
//                     if (!theClock && enable == true) {
//                         theClock = new CEClock();
//                     }
//                     break;
//                 }

//                 default: break;
//             }
//         }

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
            const subBtn = `<input class="btn btn-success mt-2" type="submit" value="Update Chat Settings" id="submitChatOptsBtn">`;
            let settingsHtml = `
                <div class="tab-pane fade" id="v-content-chat" role="tabpanel" aria-labelledby="v-tab-chat">
                    <div class="card">
                        <div id="chat-opts" class="card-body">

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

                $("#chat-opts").append(newTbl);
            }
            $("#chat-opts").append(subBtn);

            debug("[settings][appendSettingsHtml] ", $("#v-content-chat"));

            //return $(settingsHtml);
        }
    }

    //////////////////////////////////////////////////////////////////////
    // Main.
    //////////////////////////////////////////////////////////////////////

    logScriptStart();
    //initStorage();

    //initOptions(options);

    //initOptions(chatProps);

    initDefProps();

    validateApiKey();

    callOnVisibilityChange(onVisChange);

    addStyles();

    callOnContentLoaded(handlePageLoad);


    // Add any styles here
    function addStyles() {
//         if (options.draggableChat == true) {
//             addDraggableStyles();
//         }

        // TBD: revisit this option!!!
        let bgOpacity = 'FF';
        // if (chatOpacity.indexOf('%') > -1) {
        //     let pct = parseInt(chatOpacity.replaceAll('%', ''));
        //     let dec = parseInt(255 * (pct/100));
        //     bgOpacity = dec.toString(16);
        // }
        // if (chatOpacity.indexOf('#') > -1)
        //     bgOpacity = chatOpacity.replaceAll('#', '');

        GM_addStyle(`
            .svg-wrap {
                padding: 0px 1px 0px 1px;
                margin: 0px 4px 0px 4px;
            }
            .cc-my-node {
                border-radius: 4px;
                border: var(--my-chat-border);
                padding: 3px 5px;
                margin: 4px 0px 4px 0px;
                background-color: var(--my-bg-color);
            }
            .cc-my-node > a {
                color: var(--my-chat-color);
                pointer-events: auto;
            }
            .cc-bg, .wrap-cc-bg {
                background-color: var(--chatbox-bg-color) !important;
                /*pointer-events: none;*/
                overscroll-behavior: contain;
            }
            .wrap-cc-bg-active {
                pointer-events: none;
            }
            .watched, .chat-form {
                pointer-events: auto;
            }
            #CartelChat > div > div.chat-form {
                pointer-events: auto;
            }
            .xunopened {
                /* border: 1px solid blue; */
            }
            .xunopened:hover {
                /*transform: scale(1.2);*/
            }
            .newMessage2 {
                -webkit-box-shadow: inset -20px -23px 6px -5px #1DC242;
                box-shadow: inset -20px -23px 6px -5px #1DC242;
            }
            .xlg {
                /*background: linear-gradient(to bottom, #b4ddb4 0%,#83c783 17%,#52b152 33%,#008a00 67%,#005700 83%,#002400 100%);*/
                background: linear-gradient(to bottom, #b4ddb4${bgOpacity} 0%, #83c783${bgOpacity} 12%,#52b152${bgOpacity} 25%,#52b152${bgOpacity} 50%,#008a00${bgOpacity} 76%,#005700${bgOpacity} 91%,#002400${bgOpacity} 100%);
            }
            .xlb {
                /*background: linear-gradient(to bottom, #4c4c4c 0%,#595959 12%,#666666 25%,#2c2c2c 50%,#111111 50%,#2b2b2b 76%,#1c1c1c 91%,#131313 100%);*/
                background: linear-gradient(to bottom, #4c4c4c${bgOpacity} 0%,#595959${bgOpacity} 12%,#666666${bgOpacity} 25%,#2c2c2c${bgOpacity} 50%,#2b2b2b${bgOpacity} 76%,#1c1c1c${bgOpacity} 91%,#131313${bgOpacity} 100%);
            }
            .xlb:hover, .xlg:hover {
                transform: translateY(-4px);
            }
            svg.bi.bi-x {
                transition: fill 0.3s ease;
            }
            svg.bi.bi-x:hover {
                fill: #ebeb35;
                transform: scale(1.6);
            }
        `);

    }

})();
