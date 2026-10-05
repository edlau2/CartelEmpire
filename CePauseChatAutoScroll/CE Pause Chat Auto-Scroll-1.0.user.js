// ==UserScript==
// @name         CE Pause Chat Auto-Scroll
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  This script does whaat the title implies.
// @author       xedx [55266]
// @match        https://cartelempire.online/*
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @grant        GM_addStyle
// @grant        unsafeWindow
// ==/UserScript==

/* eslint no-undef: 0*/

(function() {
    'use strict';

    const log = (...data) => { console.log(GM_info.script.name + ': ', ...data);}

    const callOnContentComplete = (callback) => {
        if (document.readyState == 'complete') {
            callback();
        } else {
            document.addEventListener('readystatechange',
                event => {if (document.readyState == 'complete') callback();});
        }
    }

    function handleChatHdrClick(e) {
        e.preventDefault();
        $(this).parent().next().toggleClass('disable-auto-scroll');
        $(this).toggleClass("stop-scroll-hdr");
        $(this).find("a.text-decoration-none").toggleClass("cg");

        // $(this).parent().next().on('wheel mousewheel DOMMouseScroll mousedown touchmove', function() {
        //     if (!$(this).hasClass('disable-auto-scroll')) {
        //         $(this).addClass('disable-auto-scroll');
        //         $(this).prev().css('color', 'red');
        //     }
        // });
    }

    function addScrollBlock() {
        let nodes = $(".chatContainer > div.wrapper > div.header > h6").not(".processed");
        for (let idx=0; idx<$(nodes).length; idx++) {
            let node = $(nodes)[idx];
            log("[addScrollBlock] node: ", $(node));
            if ($(node).length && !$(node).hasClass('processed')) {
                $(node).on('contextmenu', handleChatHdrClick);
                $(node).addClass('processed');
            }
        }
        // Add mutation observer at some point, for now, just periodically re-check
        setTimeout(addScrollBlock, 2000);
    }

    function handleContentComplete(retries=0) {
        const originalScrollTopDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');
        Object.defineProperty(Element.prototype, 'scrollTop', {
            get: function() {
                return originalScrollTopDescriptor.get.call(this);
            },
            set: function(value) {
                if (this.classList && this.classList.contains('disable-auto-scroll')) {
                    // Trap the write attempt completely so it stays perfectly still
                    return;
                }
                originalScrollTopDescriptor.set.call(this, value);
            },
            configurable: true
        });

        addScrollBlock();
    }

    //////////////////////////////////////////////////////////////////////
    // Main.
    //////////////////////////////////////////////////////////////////////

    log(GM_info.script.name + ' version ' + GM_info.script.version + ' script started');

    addStyles();

    callOnContentComplete(handleContentComplete);

    function addStyles() {
        GM_addStyle(`
            .stop-scroll {
                overflow: hidden !important; /* disables scrolling - but also from the mouse!!! */
            }
            .stop-scroll-hdr { color: green; }
            .cg { color: green !important; }
        `);
    }

})();