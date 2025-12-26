// ==UserScript==
// @name         CE Slot Stats
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  This script adds a statistics table beneath the slot wheels.
// @author       xedx [2100735]
// @match        https://cartelempire.online/Casino/Slots*
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

    debugLoggingEnabled =
        GM_getValue("debugLoggingEnabled", false);    // Extra debug logging

    var cashWinTotal = GM_getValue("cashWinTotal", 0);
    var cashWinCurrent = GM_getValue("cashWinCurrent", 0);
    var cashLoseTotal = GM_getValue("cashLoseTotal", 0);
    var cashLoseCurrent = GM_getValue("cashLoseCurrent", 0);
    var winTotal = GM_getValue("winTotal", 0);
    var winCurrent = GM_getValue("winCurrent", 0);
    var loseTotal = GM_getValue("loseTotal", 0);
    var loseCurrent = GM_getValue("loseCurrent", 0);
    var winLosePctTotal = GM_getValue("winLosePctTotal", 0);
    var winLosePctCurrent = GM_getValue("winLosePctCurrent", 0);
    var profitTotal = GM_getValue("profitTotal", 0);
    var profitCurrent = GM_getValue("profitCurrent", 0);
    var totalSpins = GM_getValue("totalSpins", 0);
    var currentSpins = GM_getValue("currentSpins", 0);
    var currBetAmt = 0;
    var winStreak = GM_getValue("winStreak", 0);
    var loseStreak = GM_getValue("loseStreak", 0);
    var lastRes;

    const getCashOnHand = () => {
        cashOnHand = $(".cashDisplay").attr("value");
        $("#cashOnHand").text(asCurrency(cashOnHand));
        return cashOnHand;
    }

    const getTokens = () => {
        let txt = $("#casinoTokens").parent().text().split('(')[1];
        return txt ? txt.replace(')', '') : null;
    }

    var cashOnHand = getCashOnHand();

    function handleRstBtn(e) {
        debug("[handleRstBtn]");
        currentSpins = 0
        winStreak = 0;
        loseStreak = 0;
        profitCurrent = 0;
        winLosePctCurrent = 0;
        cashWinCurrent = 0;
        cashLoseCurrent = 0;
        winCurrent = 0;
        profitCurrent = 0;
        loseCurrent = 0;
        winLosePctCurrent = 0;

        updateStats();
        $("#loseCurrent").text(loseCurrent);
        $("#cashLoseCurrent").text(asCurrency(cashLoseCurrent));
        $("#winCurrent").text(winCurrent);
        $("#cashWinCurrent").text(asCurrency(cashWinCurrent));
        $("#winLosePctCurrent").text(winLosePctCurrent.toFixed(2) + '%');
        $("#profitCurrent").text(asCurrency(profitCurrent));
        $("#currentSpins").text(currentSpins);
        $("#winStreak").text(winStreak);
        $("#loseStreak").text(loseStreak);
    }

    function updateStats() {
        GM_setValue("cashWinTotal", cashWinTotal);
        GM_setValue("cashWinCurrent", cashWinCurrent);
        GM_setValue("cashLoseTotal", cashLoseTotal);
        GM_setValue("cashLoseCurrent", cashLoseCurrent);
        GM_setValue("winTotal", winTotal);
        GM_setValue("winCurrent", winCurrent);
        GM_setValue("loseTotal", loseTotal);
        GM_setValue("profitTotal", profitTotal);
        GM_setValue("profitCurrent", profitCurrent);
        GM_setValue("loseCurrent", loseCurrent);
        GM_setValue("winLosePctTotal", winLosePctTotal);
        GM_setValue("winLosePctCurrent", winLosePctTotal);
        GM_setValue("totalSpins", totalSpins);
        GM_setValue("currentSpins", currentSpins);
        GM_setValue("winStreak", winStreak);
        GM_setValue("loseStreak", loseStreak);
    }

    function initStorage() {
        GM_setValue("debugLoggingEnabled", debugLoggingEnabled);
        updateStats();
    }

    function getSlotStatsTable() {
        const bodyUnderneath = `
            <tbody>
                <tr><th></th><th>Total</th><th>Current</th><th></th><th>Total</th><th>Current</th></tr>
                <tr><th>Wins</th><td id='winTotal'></td><td id='winCurrent'></td><th>Money Won</th><td id='cashWinTotal'></td><td id='cashWinCurrent'></td></tr>
                <tr><th>Losses</th><td id='loseTotal'></td><td id='loseCurrent'></td><th>Money Lost</th><td id='cashLoseTotal'></td><td id='cashLoseCurrent'></td></tr>
                <tr><th>Win/Lose %</th><td id='winLosePctTotal'></td><td id='winLosePctCurrent'></td><th>Net Profit</th><td id='profitTotal'></td><td id='profitCurrent'></td></tr>
                <tr><th>Win/Lose Streak</th><td id='winLoseStreak'></td><td id="tokens"></td><th>Cash On Hand</th><td>${asCurrency(cashOnHand)}</td>
                <td style="padding: 4px 4px 4px 6px;"><button id="rstBtn" class="btn btn-dark">Reset</td></tr>
            </tbody>`;

        let statsTblUnderneath = `
            <div class="mt-3 text-center" id="statsContainer" style="display: none;">
                <div class="separator-shadow"></div>
                <div id='stat-wrap-inner' class="row row-cols-3 row-header align-items-center">
                    <div id='slot-stats'>
                        <table id='stats-tbl'>
                            ${bodyUnderneath}
                        </table>
                    </div>
                </div>
                <div class="separator-shadow"></div>
            </div>
        `;

        return statsTblUnderneath;
    }

    function initTableData() {
        $("#loseTotal").text(loseTotal);
        $("#loseCurrent").text(loseCurrent);
        $("#cashLoseTotal").text(asCurrency(cashLoseTotal));
        $("#cashLoseCurrent").text(asCurrency(cashLoseCurrent));
        $("#winTotal").text(winTotal);
        $("#winCurrent").text(winCurrent);
        $("#cashWinTotal").text(asCurrency(cashWinTotal));
        $("#cashWinCurrent").text(asCurrency(cashWinCurrent));
        $("#winLosePctTotal").text(winLosePctTotal.toFixed(2) + '%');
        $("#winLosePctCurrent").text(winLosePctCurrent.toFixed(2) + '%');
        $("#profitTotal").text(asCurrency(profitTotal));
        $("#profitCurrent").text(asCurrency(profitCurrent));
        $("#cashOnHand").text(asCurrency(cashOnHand));
        $("#tokens").text(getTokens());
    }

    function handleShowStats(e) {
        debug("[handleShowStats]");
        $("#statsContainer").slideToggle("slow", function() {
                if ($("#statsContainer").css('display') == 'none')
                    $("#showStats").text("Show Stats");
                else
                    $("#showStats").text("Hide Stats");
            });

        /*
        let newH = $("#statsContainer").hasClass("ss-hide") ? "166px" : "0px";
        $("#stat-wrap-inner").animate({height: newH}, 100, function() {
            $("#statsContainer").toggleClass("ss-hide");
            if ($("#statsContainer").hasClass("ss-hide"))
                $("#showStats").text("Show Stats");
            else
                $("#showStats").text("Hide Stats");
        });
        */
    }

    function addShowTbleBtn() {
        let showStatsBtn = `<button class="btn btn-sm btn-outline-dark" id="showStats">Show Stats</button>`;
        $("#showPaytable").before(showStatsBtn);
        $("#showStats").on('click', handleShowStats);
    }

    function handleResult(mutation) {
        if (!mutation) return;
        debug("[handleResult]: ", $(mutation.target), mutation.type);
        if (!mutation.target) return;
        let result = $(mutation.target).text();
        if (!result) return;
        totalSpins++; currentSpins++;
        let isLoss = result.indexOf('Lost') > -1;
        let parts = result.split('£');
        let amt = parseInt(parts[1].replace(',', ''));
        debug("[handleResult], cashOnHand: ", cashOnHand, " amt: ", (isLoss ? -1 * Number(amt) : (amt - currBetAmt)));
        cashOnHand = Number(cashOnHand) + (isLoss ? -1 * Number(amt) : (amt - currBetAmt));
        $("#tokens").text(getTokens());
        debug("[handleResult], cashOnHand: ", cashOnHand);
        $("#cashOnHand").text(asCurrency(cashOnHand));
        debug("Result: ", result, " Parsed: ", (isLoss ? " Lost " : " Won "), amt);
        if (isLoss) {
            loseTotal++; loseCurrent++;
            cashLoseTotal += amt; cashLoseCurrent += amt;
            $("#loseTotal").text(loseTotal);
            $("#loseCurrent").text(loseCurrent);
            $("#cashLoseTotal").text(asCurrency(cashLoseTotal));
            $("#cashLoseCurrent").text(asCurrency(cashLoseCurrent));
        } else {
            winTotal++; winCurrent++;
            cashWinTotal += (amt - currBetAmt); cashWinCurrent += (amt - currBetAmt);
            $("#winTotal").text(winTotal);
            $("#winCurrent").text(winCurrent);
            $("#cashWinTotal").text(asCurrency(cashWinTotal));
            $("#cashWinCurrent").text(asCurrency(cashWinCurrent));
        }
        winLosePctTotal = (winTotal/(winTotal + loseTotal)) * 100;
        winLosePctCurrent = (winCurrent/(winCurrent + loseCurrent)) * 100;
        profitTotal = cashWinTotal - cashLoseTotal;
        profitCurrent = cashWinCurrent - cashLoseCurrent;
        $("#winLosePctTotal").text(winLosePctTotal.toFixed(2) + '%');
        $("#winLosePctCurrent").text(winLosePctCurrent.toFixed(2) + '%');
        $("#profitTotal").text(asCurrency(profitTotal));
        $("#profitCurrent").text(asCurrency(profitCurrent));

        if (!lastRes) {
            let text;
            if (isLoss == true) {
                lastRes = "loss"; loseStreak = 1; winStreak = 0;
                text = `${loseStreak} losses`;
            } else {
                lastRes = "win"; loseStreak = 0; winStreak = 1;
                text = `${winStreak} wins`;
            }
            $("#winLoseStreak").text(text);
        } else {
            let thisRes = (isLoss == true) ? 'loss' : 'win';
            if (thisRes == lastRes) {
                if (thisRes == 'loss') loseStreak++;
                else winStreak++
            } else {
                if (thisRes == 'loss') {
                    loseStreak = 1; winStreak = 0;
                } else {
                    loseStreak = 0; winStreak = 1;
                }
            }
            lastRes = thisRes;
            let text = (thisRes == 'loss') ?
                `${loseStreak} losses` : `${winStreak} wins`;
            $("#winLoseStreak").text(text);
        }

        updateStats();
    }

    function installResultObserver(retries=0) {
        let target = $("#resultDisplay > #result");
        if (!$(target).length) {
            if (retries++ < 50) return setTimeout(installResultObserver, 250, retries);
            return log("[installResultObserver] timed out.");
        }
        const observer = new MutationObserver(function(mutationsList, observer) {
            for (const mutation of mutationsList) {
                debug("Mutation: ", mutation.type, "\nMutation: ", mutation);
                if (mutation.type === 'characterData' || mutation.type == 'attributes') {
                    handleResult(mutation);
                }
            }
        });
        const config = { characterData: true, characterDataOldValue: true, subtree: true, attributes: true };
        observer.observe($(target)[0], config);
        debug("Result observer installed on ", $(target));

        $("#bet1000").on('click', function() { currBetAmt = 1000; });
        $("#bet10000").on('click', function() { currBetAmt = 10000; });
        $("#bet100000").on('click', function() { currBetAmt = 100000; });
    }

    function handlePageLoad(retries=0) {
        let target = $("#paytableContainer");
        if (!$(target).length) {
            if (retries++ < 50) return setTimeout(handlePageLoad, 250, retries);
            return log("[handlePageLoad] timed out.");
        }

        $(target).before(getSlotStatsTable());
        addShowTbleBtn();

        $("#rstBtn").on('click', handleRstBtn);

        cashOnHand = getCashOnHand();
        initTableData();
        installResultObserver();
    }

    //////////////////////////////////////////////////////////////////////
    // Main.
    //////////////////////////////////////////////////////////////////////

    logScriptStart();
    debug("[cashOnHand]: ", cashOnHand);
    initStorage();
    addStyles();

    callOnVisibilityChange(function(isVisible) { if (isVisible == true) setTimeout(getCashOnHand, 1000); });

    callOnContentLoaded(handlePageLoad);

    // Add any styles here
    function addStyles() {
        GM_addStyle(`
            .ss-hide { display: none !important; }
            #rstBtn {
                width: 100%;
                height: 32px;
                font-size: 16px;
                border: none;
                box-shadow: none;
                background-color: rgb(33,33,33);
            }
            #rstBtn:hover {
                color: var(--bs-btn-hover-color);
                background-color: var(--bs-btn-hover-bg) !important;
            }
            #showStats { margin-right: 20px; }
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
            #slot-stats {
                width: 800px;
            }
            #stats-tbl {
                width: 100%;
                table-layout: auto;
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
        `);

        GM_addStyle(`
            .separator-shadow {
                height: 2px;
                background-color: #222;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3); /* Offset-y, blur, spread, color */
                width: 100%;
            }
        `);
    }


})();