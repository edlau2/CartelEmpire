// ==UserScript==
// @name         CE BlackJack Helper
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  This script does...
// @author       xedx [2100735]
// @match        https://cartelempire.online/Casino/Blackjack*
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

    debugLoggingEnabled = GM_getValue("debugLoggingEnabled", true);    // Extra debug logging
    GM_setValue("debugLoggingEnabled", debugLoggingEnabled);

    // ============================ Stat vars =============================

    function safeNum(val) {
        let num = parseInt(val ? val.toString().replace(/\D/g, "") : 0);
        return isNaN(num) ? 0 : num;
    }

    var cashWinTotal = safeNum(GM_getValue("cashWinTotal", 0));
    var cashWinCurrent = GM_getValue("cashWinCurrent", 0);
    var cashLoseTotal = safeNum(GM_getValue("cashLoseTotal", 0));
    var cashLoseCurrent = GM_getValue("cashLoseCurrent", 0);

    var winTotal = safeNum(GM_getValue("winTotal", 0));
    var winCurrent = GM_getValue("winCurrent", 0);
    var loseTotal = safeNum(GM_getValue("loseTotal", 0));
    var loseCurrent = GM_getValue("loseCurrent", 0);

    var bustTotal = safeNum(GM_getValue("winTotal", 0));
    var bustCurrent = GM_getValue("winCurrent", 0);
    var pushTotal = safeNum(GM_getValue("loseTotal", 0));
    var pushCurrent = GM_getValue("loseCurrent", 0);
    var blackjackTotal = safeNum(GM_getValue("blackjackTotal", 0));
    var blackjackCurrent = GM_getValue("blackjackCurrent", 0);

    var winLosePctTotal = safeNum(GM_getValue("winLosePctTotal", 0));
    var winLosePctCurrent = GM_getValue("winLosePctCurrent", 0);

    var profitTotal = safeNum(GM_getValue("profitTotal", 0));
    var profitCurrent = GM_getValue("profitCurrent", 0);

    var totalHands = safeNum(GM_getValue("totalHands", 0));
    var currentHands = GM_getValue("currentHands", 0);

    var currBetAmt = 0;

    function updateStats() {
        profitTotal = (safeNum(cashWinTotal) - safeNum(cashLoseTotal));
        profitCurrent = (safeNum(cashWinCurrent) - safeNum(cashLoseCurrent));

        GM_setValue("cashWinTotal", safeNum(cashWinTotal));
        GM_setValue("cashWinCurrent", safeNum(cashWinCurrent));
        GM_setValue("cashLoseTotal", safeNum(cashLoseTotal));
        GM_setValue("cashLoseCurrent", safeNum(cashLoseCurrent));
        GM_setValue("winTotal", safeNum(winTotal));
        GM_setValue("winCurrent", safeNum(winCurrent));
        GM_setValue("bustTotal", safeNum(winTotal));
        GM_setValue("bustCurrent", safeNum(winCurrent));
        GM_setValue("pushTotal", safeNum(winTotal));
        GM_setValue("pushCurrent", safeNum(winCurrent));
        GM_setValue("loseTotal", safeNum(loseTotal));
        GM_setValue("loseCurrent", safeNum(loseCurrent));
        GM_setValue("profitTotal", safeNum(profitTotal));
        GM_setValue("profitCurrent", safeNum(profitCurrent));
        GM_setValue("winLosePctTotal", safeNum(winLosePctTotal));
        GM_setValue("winLosePctCurrent", safeNum(winLosePctTotal));
        GM_setValue("totalHands", safeNum(totalHands));
        GM_setValue("currentHands", safeNum(currentHands));
        GM_setValue("blackjackTotal", safeNum(blackjackTotal));
        GM_setValue("blackjackCurrent", safeNum(blackjackCurrent));

        updateStatsTable();
    }

    function updateStatsTable(){
        $("#cashWinTotal").text(asCurrency(cashWinTotal));
        $("#cashWinCurrent").text(asCurrency(cashWinCurrent));
        $("#cashLoseTotal").text(asCurrency(cashLoseTotal));
        $("#cashLoseCurrent").text(asCurrency(cashLoseCurrent));
        $("#winTotal").text(winTotal);
        $("#winCurrent").text(winCurrent);
        $("#bustTotal").text(bustTotal);
        $("#bustCurrent").text(bustCurrent);
        $("#pushTotal").text(pushTotal);
        $("#pushCurrent").text(pushCurrent);
        $("#loseTotal").text(loseTotal);
        $("#loseCurrent").text(loseCurrent);
        $("#profitTotal").text(asCurrency(profitTotal));
        $("#profitCurrent").text(asCurrency(profitCurrent));
        $("#winLosePctTotal").text(winLosePctTotal);
        $("#winLosePctCurrent").text(winLosePctTotal);
        $("#totalHands").text(totalHands);
        $("#currentHands").text(currentHands);
        $("#blackjackCurrent").text(blackjackCurrent);
        $("#blackjackTotal").text(blackjackTotal);
    }

    function resetCurrStats() {
        cashWinCurrent = 0;
        cashLoseCurrent = 0;
        winCurrent = 0;
        bustCurrent = 0;
        pushCurrent = 0;
        loseCurrent = 0;
        profitCurrent = 0;
        currentHands = 0;
        blackjackCurrent = 0;

        updateStats();
    }

    //
    // ========================= helper functions =========================
    //
    const dealersRow = () => {return $("#blackjackGame > div:nth-child(1)"); }
    const playersRow = () => {return $("#blackjackGame > div:nth-child(2)"); }

    const dealerScore = () => { return parseInt($("#dealerScore").text()); }
    const playerScore = () => { return parseInt($("#playerScore").text()); }

    const dealerCards = () => { return $("#dealerCards > span.blackjackCard > p.blackjackCardText"); }
    const dealerCardsText = () => { return $("#dealerCards > span.blackjackCard > p.blackjackCardText").text(); }

    const playerCards = () => { return $("#playerCards > span.blackjackCard > p.blackjackCardText"); }
    const playerCardsText = () => { return $("#playerCards > span.blackjackCard > p.blackjackCardText").text(); }

    const getBtns = () => { return $("#blackjackCardGroup  button.btn.btn-success"); }
    const btns = ['deal', 'hit', 'stand', 'double', 'split', 'continue', 'surrender'];
    const btnHandlers = { 'deal': handleDeal, 'hit': handleAction, 'stand': handleAction, 'double': handleAction,
                         'split': handleAction, 'continue': handleContinue, 'surrender': handleAction};
    const whichBtn = (btn) => { return $(btn).attr("id"); }

    const canSplit = () => { return !$("#split").prop("disabled"); }
    const canDouble = () => { return !$("#double").prop("disabled"); }
    const canSurrender = () => { return !$("#surrender").prop("disabled"); }
    const canContinue = () => { return !($("#continue").css("display") == 'none'); }

    const result = () => { return $("#result").text(); }

     //
    // ========================= Global variables =========================
    //
    const player = { "cards": "", "score": 0, };
    const dealer = { "cards": "", "score": 0, };

    //
    // ========================= Betting tables =========================
    //
    // Key is player's total. Array (value) is dealer's up card, 2...A
    // Since arrays are indexed at 0, subtract 2 from the card to get index.
    // "s": stand, "h": hit, "D": double or hit if not allowed,
    // "d": double or stand,
    const hardTotals = {
        17: [ 's', 's', 's', 's', 's', 's', 's', 's', 's', 's'],
        16: [ 's', 's', 's', 's', 's', 'h', 'h', 'h', 'h', 'h'],
        15: [ 's', 's', 's', 's', 's', 'h', 'h', 'h', 'h', 'h'],
        14: [ 's', 's', 's', 's', 's', 'h', 'h', 'h', 'h', 'h'],
        13: [ 's', 's', 's', 's', 's', 'h', 'h', 'h', 'h', 'h'],
        12: [ 'h', 'h', 's', 's', 's', 'h', 'h', 'h', 'h', 'h'],
        11: [ 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'],
        10: [ 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'h', 'h'],
        9:  [ 'h', 'D', 'D', 'D', 'D', 'h', 'h', 'h', 'h', 'h'],
        8:  [ 'h', 'h', 'h', 'h', 'h', 'h', 'h', 'h', 'h', 'h']
    };

    const softTotals = {
        9: [ 's', 's', 's', 's', 's', 's', 's', 's', 's', 's'],
        8: [ 's', 's', 's', 's', 'd', 's', 's', 's', 's', 's'],
        7: [ 'd', 'd', 'd', 'd', 'd', 's', 's', 'h', 'h', 'h'],
        6: [ 's', 'D', 'D', 'D', 'D', 'h', 'h', 'h', 'h', 'h'],
        5: [ 'h', 'h', 'D', 'D', 'D', 'h', 'h', 'h', 'h', 'h'],
        4: [ 'h', 'h', 'D', 'D', 'D', 'h', 'h', 'h', 'h', 'h'],
        3: [ 'h', 'h', 'h', 'D', 'D', 'h', 'h', 'h', 'h', 'h'],
        2: [ 'h', 'h', 'D', 'D', 'D', 'h', 'h', 'h', 'h', 'h']
    };

    // Pair splitting - 11 is pair aces, 10 face cards, etc
    const splitTable= {
        11: [ 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y'],
        10: [ 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n'],
        9:  [ 'y', 'y', 'y', 'y', 'y', 'n', 'y', 'y', 'n', 'n'],
        8:  [ 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y'],
        7:  [ 'y', 'y', 'y', 'y', 'y', 'y', 'n', 'n', 'n', 'n'],
        6:  [ 'y', 'y', 'y', 'y', 'y', 'n', 'n', 'n', 'n', 'n'],
        5:  [ 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n'],
        4:  [ 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n', 'n'],
        3:  [ 'n', 'n', 'y', 'y', 'y', 'y', 'n', 'n', 'n', 'n'],
        2:  [ 'n', 'n', 'y', 'y', 'y', 'y', 'n', 'n', 'n', 'n'],
    }

    const actionBtns = { 'h': 'hit', 's': 'stand', 'd': 'double', 'D': 'double', 'p': 'split' };

    function hardTotalBet() {
        let val;
        let dealerIdx = parseInt(dealer.score) - 2;
        if (dealerIdx < 0 || dealerIdx > 9) debugger;
        if (player.score >= 17)
            val = 's';
        else if (player.score <= 8)
            val = 'h';
        else {
            val = hardTotals[player.score][dealerIdx];
            debug("[hardTotalBet] val: ", val, `hardTotals[${player.score}]: `, hardTotals[player.score]);
        }

        debug("[hardTotalBet] player: ", player, " dealer: ", dealer);
        debug("[hardTotalBet] dealerIdx: ", dealerIdx, " dealer score: ", dealer.score, " player score: ", player.score, playerScore(),
              " val: ", val, (player.score >= 17), (player.score <= 8));
        return val;
    }

    function softTotalBet() {
        if (player.cards.indexOf('A') == -1) {
            debugger;
            return debug("[softTotalBe] Error, no ace: ", player);
        }
        debug("softTotalBet");

        let val;
        let dealerIdx = parseInt(dealer.score) - 2;
        let tmp = player.cards.replace('A', '');
        let cardVal = parseInt(tmp);

        //("[softTotalBet] player: ", player, " dealer: ", dealer);
        //debug("[softTotalBet] dealerIdx: ", dealerIdx, " cardVal: ", cardVal);

        if (cardVal >= 9)
            val = 's';
        else {
            val = softTotals[cardVal][dealerIdx];
            debug("[softTotalBet] val: ", val, " cardVal: ", cardVal, ` softTotals[${cardVal}]: `, softTotals[cardVal]);

        debug("[softTotalBet] dealerIdx: ", dealerIdx, " dealer score: ", dealer.score, " player score: ", player.score, playerScore(),
              " val: ", val, " ardVal: ", cardVal, (cardVal >= 9));
        }

        //debug("[softTotalBet] return val: ", val);
        return val;
    }

    function shouldSplit0() {
        let card = player.cards[0];
        let val = parseInt(card);
        debug("[shouldSplit] card: ", card, " val: ", val);
    }

    function shouldSplit() {
        update();
        let val1, val2;
        let dealerIdx = parseInt(dealer.score) - 2;
        let card1 = player.cards[0];
        let card2 = player.cards[1];
        debug("[shouldSplit] card1: ", card1, " card2: ", card2);
        if (card1 == 'A') return true;
        if (player.score > 18) return false;

        val1 = parseInt(card1);
        val2 = parseInt(card2);

        let res = splitTable[val1][dealerIdx];

        debug("[shouldSplit] card1: ", card1, " card2: ", card2, " val1: ", val1, " val2: ", val2,
              "\nDealer: ",dealer.score, dealerIdx, " res: ", res);

        return (res == 'y') ? true : false;
    }

    function numPlayerCards() {
        player.cards = playerCardsText();
        let numCards = player.cards.length;
        if (player.cards.indexOf('1') > -1) numCards = numCards - 1;
        return numCards;
    }

    var lastBtnId;
    var isDeal = false;
    var dlrPrev = {};
    var plrPrev = {};
    function update() {
        dealer.cards = dealerCardsText();
        dealer.score = parseInt(dealerScore());
        player.cards = playerCardsText();
        player.score = parseInt(playerScore());
    }

    function playerHasPair() {
        if (!player.cards) {debugger; return false;}

        let pair = false;
        let count = player.cards.length;
        if (count == 3 || count > 4) {debug("[playerHasPair] bad count!"); return false;}
        if (player.cards && player.cards.indexOf('1') > -1) {
            if (player.score == 20) {
                if (player.cards.length == 4)
                    pair = true;
            }
            //debug("[playerHasPair] has a 10, pair? ", pair, player.cards);
        } else if (player.cards[0] == player.cards[1] && count == 2) {
            pair = true;
        }
        debug("[playerHasPair] has pair? ", pair);
        return pair;
    }

    function highlightBestBet(bet) {
        $(".best-bet").removeClass("best-bet");
        $(`#${actionBtns[bet]}`).addClass("best-bet");
    }

    function handleDisabledClick(e) {
        // if (confirm("A hit right now is a bad idea!\nYou should stand." +
        //             "\nYou can press OK if you want to lose, or cancel to stay safe.") == true) {
        //     //$("#hit").click();
        //     // let propogate...
        // } else {
        //     e.preventDefault();
        //     e.stopPropagation();
        //     return false;
        // }
    }

    function disableHitBtn(disable=true) {
        debug("[getBestBet][disableHitBtn] disable? ", disable);
        if (disable == true) {
            $("#hit").addClass("disableHit");
            //$("#hit").on("click.xedx", handleDisabledClick);
        } else {
            $("#hit").removeClass("disableHit");
            //$("#hit").off("click.xedx");
        }
    }

    function getBestBet(retries=0) {
        debug("[getBestBet]\nPlayer: ", player, "\nDealer: ", dealer, " last btn: ", lastBtnId);
        let recommended;
        let done = false;
        let split = false;

        if (isDeal == false) disableHitBtn(false);

        debug("[getBestBet] card check: ", isDeal, numPlayerCards(), lastBtnId);

        if (isDeal == false && numPlayerCards() < 3 && lastBtnId == 'hit') {
            if (retries++ < 30) return setTimeout(getBestBet, 100, retries);
            return log("[getBestBet] timeout waiting for cards!");
        }

        if (retries > 0) update();

        if (plrPrev.score) if (plrPrev.score == player.score &&
            dlrPrev.score == dealer.score) {
            debug("**** [update] No Change???\n", isDeal, lastBtnId, "\n", dlrPrev, dealer, "\n", plrPrev, player);
        }
        dlrPrev = dealer;
        plrPrev = player;

        debug("[getBestBet] Blackjack?? player: ", player, " player.score: ", player.score,
              " (player.score == 21)? ", (player.score == 21), (+player.score == 21));

        if (isNaN(player.score)) {
            isDeal = false;
            return debug("[getBestBet] Invalid player score!");
        }

        if (+player.score != parseInt(playerScore())) {
            debugger;
            update();
        }

        let hasPair = playerHasPair();
        let softBet = ((isDeal == true) && player.cards.indexOf('A') > -1);
        disableHitBtn(false);

        if (+player.score == 21 || parseInt(playerScore()) == 21) {
            // Blackjack!
            debug("[getBestBet] Blackjack!! player: ", player, " dealer: ", dealer);
            recommended = 's';
            done = true;

            disableHitBtn();
        } else if (softBet == false && (+player.score >= 17 || parseInt(playerScore()) >= 17)) {
            debug("[getBestBet] hardbet, over 17, stand: ", player.score, playerScore());
            recommended = 's';
            done = true;
            disableHitBtn();
        } else if (canSplit() && hasPair == true) { //canSplit() && playerHasPair()) {
            split = shouldSplit();
                debug("[getBestBet] has pair, split? ", split);
            if (split == true) {
                recommended = 'p';
                done = true;
            }
        }

        if (done == false) {
            //if ((isDeal == true) && player.cards.indexOf('A') > -1)

            if (softBet == true)
                recommended = softTotalBet();
            else
                recommended = hardTotalBet();
        }

        isDeal = false;

        // Check for d and D, as well as canDouble()

        debug("[getBestBet] player: ", player, " dealer: ", dealer);
        debug("[getBestBet] best bet: ", recommended, " can double: ", canDouble());

        if (recommended == 'D' && !canDouble()) recommended = 'h';
        if (recommended == 'd' && !canDouble()) recommended = 's';

        highlightBestBet(recommended);

        return recommended;
    }

    function handleAction(e) {
        debug("[handleAction]");
        lastBtnId = e.currentTarget.id;

        debug("[handleAction] id: ", lastBtnId);
        setTimeout(handleAction2, 250, e);
    }

    var handActive = false;
    var newNodeTxt= '';
    function handleAction2(e, retries=0) {
        debug("[handleAction2] ", e, retries, lastBtnId, $(this), canContinue(),
              "\nresult: ", $("#result"), "\ntext: ", $("#result").text(),
             "\nnewNodeTxt: ", newNodeTxt);

        let savedNewTxt = newNodeTxt;
        newNodeTxt = '';
        let done = false;
        if (($("#result").length > 0 && $("#result").text()) || canContinue()) {
            done = true;
            let fullRes = $("#result").text();
            let shortRes = resultFromText(fullRes);

            let parts = fullRes ? fullRes.split('£') : [];
            let amt = -1;
            if (parts.length > 1) {
                amt = parseInt(parts[1].replace(',', ''));
            }

            debug("****[handleAction2] amt: ", amt, " parts: ", parts, " savedNewTxt: ", savedNewTxt, " fullRes: ", fullRes);

            debug("***** FINDING STATS ***** continue: ", canContinue(), " active: ", handActive, " short res: ",
                  shortRes, " amt: ", amt, " bet: ", currBetAmt);
            if (handActive == true) {
                if (shortRes == "Win" || shortRes.indexOf('lackjack') > -1) {
                    if (shortRes.indexOf('lackjack') > -1) {
                        blackjackTotal++; blackjackCurrent++;
                    }
                    winTotal++; winCurrent++;
                    cashWinTotal += safeNum(amt);

                    let old = cashWinCurrent;
                    cashWinCurrent += safeNum(amt);
                    debug("***** win curr: ", cashWinCurrent, " amt: ", amt, " old: ", old);
                } else if (shortRes == "Lose") {
                    loseTotal++; loseCurrent++;
                    cashLoseTotal += safeNum(currBetAmt);
                    let old = cashLoseCurrent;
                    cashLoseCurrent += safeNum(currBetAmt);
                    debug("***** lose curr: ", cashLoseCurrent, " amt: ", amt, " old: ", old);
                } else if (shortRes == "Push") {
                    pushTotal++; pushCurrent++;
                    debug("*****  PUSH");
                } else if (shortRes == "Bust") {
                    bustTotal++; bustCurrent++;
                    cashLoseTotal += safeNum(currBetAmt);
                    let old = cashLoseCurrent;
                    cashLoseCurrent += safeNum(currBetAmt);
                    debug("***** bust, lose curr: ", cashLoseCurrent, " amt: ", amt, " old: ", old);
                } else {
                    debugger;
                }
                debug("***** set active FALSE!");
                handActive = false;
            }

            debug("*** [handleAction2] amt: ", amt, " bet: ", currBetAmt, " lose total: ", cashLoseTotal, " win total: ", cashWinTotal);
            debug("[handleAction2] short: ", shortRes);
            debug("[handleAction2] full: ", fullRes);

            updateStats();
        }

        update();
//             debug("[handleAction2] player: ", plrPrev, player, "\ndealer: ", dlrPrev, dealer);
//             if (dlrPrev.cards == dealer.cards && plrPrev.cards == player.cards) {
//                 if (retries++ < 20) return setTimeout(handleAction2, 50, retries);
//                 debug("[handleAction2] same cards????");
//                 //debugger;
//             }
        if (canContinue()) {
            if ($("#result").length > 0 && (!$("#result").text() || !$("#result").text().length)) {
                if (retries++ < 20) return setTimeout(handleAction2, 100, e, retries);
            }
        }

        if (!canContinue()) {
            getBestBet();
        }
    }

    function resultFromText(text) {
        if (!text) return "Error, no text!";

        const results = ['Win', 'Lose', 'Blackjack', 'Push', 'Bust'];
        let found = "unknown, '" + text + "'";
        results.forEach(res => {
            if (text.indexOf(res) > -1) {
                found = res;
            }
        });
        return found;
    }

    function handleContinue(e) {
        debug("[handleContinue] ", $(this));
    }

    function handleDeal(e, retries=0) {
        currBetAmt = $("#betAmountInput").val();
        debug("[handleDeal][betAmountInput] ", $("#betAmountInput"), currBetAmt, $("#betAmountInput").text());
        let p = playerCards();
        if ($(p).length < 2) {
            if (retries++ < 50) return setTimeout(handleDeal, 100, null, retries);
            return debug("[handleDeal] timed out");
        }

        totalHands++;
        currentHands++;
        updateStats();

        handActive = true;
        update();
        isDeal = true;
        let bestBet = getBestBet();
    }

    function handleButtons(e) {
        lastBtnId = whichBtn($(this));
        let wasActive = handActive;
        if (lastBtnId == 'deal') handActive = true;
        debug("[handleButtons] click: ", lastBtnId, $(this), " active: ", handActive, " was: ", wasActive);

        let fn = btnHandlers[lastBtnId];
        if (fn) {
            //fn(e);
            setTimeout(fn, 250, e);
        }
    }

    // ============================= Statistics table ==============================
    function getStatsTable() {

        const hdr = `<div class="row mb-0"><div class="col-12"><div class="header-section"><h2>Statistics</h2></div></div></div>`;
        const bodyWrap = `<div class="card-body"></div>`;

        const bodyUnderneath = `
            <tbody>
                <tr><th></th><th>Total</th><th>Current</th><th><button class="btn btn-success" id="resetStats">Reset</button></th><th>Total</th><th>Current</th></tr>
                <tr>
                    <th>Wins</th><td id='winTotal'></td><td id='winCurrent'></td>
                    <th>Money Won</th><td id='cashWinTotal'></td><td id='cashWinCurrent'></td>
                </tr>
                <tr>
                    <th>Losses</th><td id='loseTotal'></td><td id='loseCurrent'></td>
                    <th>Money Lost</th><td id='cashLoseTotal'></td><td id='cashLoseCurrent'></td>
                </tr>
                <tr>
                    <th>Busts</th><td id='bustTotal'></td><td id='bustCurrent'></td>
                    <th>Win/Lose %</th><td id='winLosePctTotal'></td><td id='winLosePctCurrent'></td>
                </tr>
                <tr>
                    <th>Push</th><td id='pushTotal'></td><td id='pushCurrent'></td>
                    <th>Net Profit</th><td id='profitTotal'></td><td id='profitCurrent'></td>
                </tr>
                <tr>
                    <th>Blackjack</th><td id="blackjackTotal"></td><td id="blackjackCurrent"></td>
                    <th>Hands</th><td id="totalHands"></td><td id="currentHands"></td>
                </tr>
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
        debug("[initTableData]");
        return updateStatsTable();

        // ********* unused ************
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
    }

    function handleShowStats(e) {
        debug("[handleShowStats]");
        $("#statsContainer").slideToggle("slow", function() {
            if ($("#statsContainer").css('display') == 'none')
                $("#showStats").text("Show Stats");
            else
                $("#showStats").text("Hide Stats");
        });
    }

    function addShowTbleBtn() {
        let showStatsBtn = //`<div class="stat-btn-wrap"><button class="btn btn-sm btn-outline-dark" id="showStats">Show Stats</button></div>`;
            `<div class="stat-btn-wrap"><button class="btn btn-success" id="showStats">Show Stats</button></div>`;
        $("#buttonPanel").append(showStatsBtn);
        let wrap = $("#showStats").parent();
        let wp = $(wrap).prev().outerWidth();
        //let pp = $(wrap).position();
        let pt = $(wrap).css("top");
        //let pr = $(wrap).position("right");
        //debug("[addShowTblBtn] pp: ", pp, " pt: ", pt, " pr: ", pr);
        $(wrap).css("width", (wp + "px"));
        $(wrap).css("top", pt);
        debug("[addShowTbleBtn] btn: ", $("#showStats"));

        $("#showStats").on('click', handleShowStats);
    }

    // =======================================================

    function installObserver(retries=0) {
        let target = $("#result");
        if (!$(target).length) {
            if (retries++ < 50) return setTimeout(installObserver, 100, retries);
            return debug("[installObserver' timed out");
        }

        const dataChangeObserver = new MutationObserver(function(mutationsList, observer) {
            for (const mutation of mutationsList) {
                debug("[blackjack] mutation: ", mutation.type, mutation);
                if (mutation.type === 'characterData') {
                    debug("[blackjack] characterData mutation: ", mutation,
                         "\nisDeal: ", isDeal);
                    setTimeout(handleAction2, null, 250);
                }
                if (mutation.type === 'childList') {
                    debug("**** [blackjack] childList: ", $(mutation.target).text(), mutation.addedNodes);
                    //mutation.addedNodes.forEach(node => {
                    for (let idx=0; idx<mutation.addedNodes.length; idx++) {
                        let node = mutation.addedNodes[idx];
                        newNodeTxt = $(node).text();
                        debug("**** [blackjack] added node: ", $(node), $(node).text());
                        setTimeout(handleAction2, null, 250);
                    }
                }
            }
        });

        const config = { childList: true, subtree: true, characterData: true };
        dataChangeObserver.observe($(target)[0], config);
        debug("[blackjack] dataChangeObserver started");

    }

    // =========================== Entry at page load =======================================

    function handlePageLoad(retries=0) {
        debug("[handlePageLoad]", retries);
        if (getBtns().length < btns.length) {
            if ($("#buttonPanel").length > 0 && !$("#showStats").length) addShowTbleBtn();
            if (retries++ < 50) return setTimeout(handlePageLoad, 100, retries);
            /*return*/ debug("[handlePageLoad] timed out");
        }

        if (getBtns().length > 0) {
            getBtns().on('click.xedx', handleButtons);
            debug("[handlePageLoad]: ", getBtns());

            $("#betAmountInput").on('change', function() {
                currBetAmt = $("#betAmountInput").val();
                debug("[on change] betAmountInput: ", currBetAmt);
            });
        }

        if (!$("#showStats").length) addShowTbleBtn();

        let target = $("#blackjackCardGroup");
        let table = getStatsTable();
        debug("[handlePageLoad]: target: ", $(target), " table: ", $(table));
        $(target).after($(table));

        $("#resetStats").on('click', resetCurrStats);
        initTableData();
        installObserver();
    }

    //////////////////////////////////////////////////////////////////////
    // Main.
    //////////////////////////////////////////////////////////////////////

    logScriptStart();

    addStyles();
    callOnContentLoaded(handlePageLoad);


    // Add any styles here
    function addStyles() {
        GM_addStyle(`
            .best-bet {
                border: 1px solid blue;
                transform: scale(1.1, 1.2);
            }
        `);

        GM_addStyle(`
            .disableHit {
                 cursor: not-allowed !important;
                 border: 2px solid red;
            }
            #resetStats {

            }
            .stat-btn-wrap {
                position: absolute;
                top: 88%;
                display: flex;
                justify-content: flex-end;
            }
            .ss-hide { display: none !important; }
            #showStats {
                margin-right: 20px;
                width: 89px;
            }
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
    }

})();