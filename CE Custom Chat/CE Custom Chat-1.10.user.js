// ==UserScript==
// @name         CE Custom Chat
// @namespace    http://tampermonkey.net/
// @version      1.10
// @description  This script allows Chat to be customized in a bunch of ways, always changing...
// @author       xedx [2100735]
// @match        https://cartelempire.online/*
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      https://raw.githubusercontent.com/edlau2/CartelEmpire/master/Helpers/ce_js_utils.js
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

    const myId = initUserId();

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

    debugLoggingEnabled =
        GM_getValue("debugLoggingEnabled", false);    // Extra debug logging

    const statusIcon = `<div class="lastActiveContainer d-flex align-items-center">` +
                       `<svg class="svg-wrap" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="rgba(255, 250, 240, 0.6)" viewBox="0 0 16 16">` +
                       `<circle cx="8" cy="8" r="8"></circle></svg></div>`;

    // Helper to parse user ID from an href
    const idFromHref = (href) => { return href.substring(href.lastIndexOf('/') + 1); }

    var options = {
        //"chatActiveOpacity": false,
        //"draggableChat": false,
    };

    function initOptions(optObject) {
        $.each(optObject, function(key, value) {
            options[key] = GM_getValue(key, value);
            GM_setValue(key, options[key]);
        });
    }

    var savedChatDates = JSON.parse(GM_getValue("savedChatDates", JSON.stringify({})));

    // Style properties, dynamic
    var chatProps = {
        // Entire chat box
        "chatbox-bg-opacity": GM_getValue("chatbox-bg-opacity", "0"),
        "chatbox-bg-color": GM_getValue("chatbox-bg-color", "rgba(25, 25, 25, var(--chatbox-bg-opacity))"),

        // My messages:
        "my-border-color": GM_getValue("my-border-color" , "green"),
        "my-chat-border": GM_getValue("my-chat-border" , "1px solid var(--my-border-color)"),
        "my-chat-color": GM_getValue("my-chat-color" , "red"),
        "my-bg-color": GM_getValue("my-bg-color", "#000"),

        // Other's messages:
    };

    function initDefProps() {
        $.each(chatProps, function(key, value) {
            setPropertyValue(key, value);
        });
    }

    function keyToVarName(key) {return "--" + key.replaceAll("_", "-").toLowerCase();}
    function setPropertyValue(key, val) {
        let root = document.documentElement;
        let variant = keyToVarName(key);
        if (val == 'default') {
            root.style.removeProperty(variant, val);
        } else {
            root.style.setProperty(variant, val);
        }
    }

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
        log("Private chats: ", $(".chatContainer.xstat > .chat-btn").not(".xlg"));

        log("xxx savedChatDates: ", savedChatDates);
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

            log("xxx savedChatDates[chatId]: ", chatId, savedChatDates[chatId]);

            if (savedChatDates[chatId]) {
                lastOpen = savedChatDates[chatId]["lastOpened"];
                log("xxx found saved chat ID", lastOpen);
                $(this).attr("data-last-looked", lastOpen);
            }

            log("xxx lastOpen && lastMsg: ", lastOpen, lastMsg, (parseInt(lastMsg) > parseInt(lastOpen)));
            if (lastOpen && lastMsg) {
                let cb = $(this).find("[class*='chat-btn']");
                log("xxx Chat button? ", $(cb));
                if (parseInt(lastMsg) > parseInt(lastOpen)) {
                    log("xxx adding 'xunopened' class");
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
        observeChatList(targets);

        // Add an observer for new chats
        let chatRootTarget = $(chatRowSel);
        if ($(chatRootTarget)) {
            debug("Installing observer for root: ", $(chatRootTarget));
            installObserver(chatRootTarget);
        }

        checkUnreadNotifications();
    }

    //////////////////////////////////////////////////////////////////////
    // Main.
    //////////////////////////////////////////////////////////////////////

    logScriptStart();
    //initStorage();

    initOptions(options);
    initOptions(chatProps);
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
                background: linear-gradient(to bottom, #b4ddb4 0%,#83c783 12%,#52b152 25%,#52b152 50%,#008a00 76%,#005700 91%,#002400 100%);
            }
            .xlb {
                /*background: linear-gradient(to bottom, #4c4c4c 0%,#595959 12%,#666666 25%,#2c2c2c 50%,#111111 50%,#2b2b2b 76%,#1c1c1c 91%,#131313 100%);*/
                background: linear-gradient(to bottom, #4c4c4c 0%,#595959 12%,#666666 25%,#2c2c2c 50%,#2b2b2b 76%,#1c1c1c 91%,#131313 100%);
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
