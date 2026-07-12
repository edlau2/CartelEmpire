// ==UserScript==
// @name         Ce Sidebar
// @namespace    http://tampermonkey.net/
// @version      1.03
// @description  Adds a sidebar to Cartel Empire pages
// @author       xedx [55266]
// @match        https://cartelempire.online/*
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      http://code.jquery.com/ui/1.14.2/jquery-ui.js
// @require      https://raw.githubusercontent.com/edlau2/CartelEmpire/master/Helpers/ce_js_utils.js
// @run-at       document-body
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
    GM_setValue("debugLoggingEnabled", debugLoggingEnabled);

    let sidebarStyle = GM_getValue("sidebarStyle", "rnd-btn-3");
    GM_setValue("sidebarStyle", sidebarStyle);

    const user_id = initUserId();
    //const user_name = 'xedx';

    const secsInMin = 60 * 60;
    const secsInHr = secsInMin * 60;
    const secsInDay = secsInHr * 24;

    function capWord(word) {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    function handleCaret(e) {
        let targetId = $(this).attr("data-target");
        let target = document.getElementById(targetId);

        let isDown = $(this).hasClass("fa-caret-down");
        let key = targetId + "-pos";
        GM_setValue(key, (isDown ? "fa-caret-right" : "fa-caret-down"));

        debug("[ceSidebar][handleCaret] ", targetId, $(this), $(target));
        $(target).slideToggle("slow");
        $(this).toggleClass('fa-caret-down fa-caret-right');
    }

    // ====================================== Sidebar HTML =======================================
    const cityLinks = [
        { href: "/Town/ArmedSurplus", name: "Armed Surplus", visible: true },
        { href: "/Town/Pharmacy", name: "Alberto's Pharmacy", visible: true },
        { href: "/Market", name: "La Paz Market", visible: true },
        { href: "/Town/Mateos", name: "Mateo's Antiques", visible: true },
        { href: "/Casino", name: "Casino", visible: true },
        { href: "/PetShop", name: "Victor's Pet Shop", visible: true },
        { href: "/Town/EstateAgent", name: "Estate Agent", visible: true },
        { href: "/Hospital", name: "Hospital", visible: true },
        { href: "/Jail", name: "San Pedro Prison", visible: true },
        { href: "/Bank", name: "Bank", visible: true },
        { href: "/Town/Diablos", name: "Diablo's", visible: true },
        { href: "/Town/DrugDen", name: "Drug Den", visible: true },
        { href: "/Bounty", name: "Winston's Bounties", visible: true },
        { href: "/Town/Club", name: "Julio's Club", visible: true },
        { href: "/Town/Dealership", name: "Car Dealership", visible: true },
        { href: "/Town/Construction", name: "Carlo's Construction", visible: true },
        { href: "/Town/PoliceAuction", name: "Police Auction", visible: true },
        { href: "/Church", name: "Church", visible: true },
    ];

    const useLiClass = sidebarStyle;
    const liRow = `<li class="ind sb-row ${useLiClass}">`;

    let cityClass = GM_getValue("nav-city-pos", "fa-caret-down");
    let casinoClass = GM_getValue("nav-casino-pos", "fa-caret-down");
    let marketClass = GM_getValue("nav-market-pos", "fa-caret-down");
    let inventoryClass = GM_getValue("nav-inventory-pos", "fa-caret-down");

    const sidebar = `
        <div id="sidebarroot" class="xedx-locked">
            <div id="sidebar-content">
                <div id="sb-link-list"  class="sb-area ${useLiClass}">

                    <!------------------------ Links in the city ----------------------->
                    <li id="city-links" class="sb-row-root sb-header">City
                        <span class="sb-caret"><i class="fa ${cityClass}" data-target="nav-city"></i></span>
                    </li>

                    <ul id="nav-city" class="sb-area ${useLiClass}">
                    </ul>

                    <li class="dummy-row"></li>

                    <!------------------------ Links in the Casino ----------------------->
                    <li id="casino-links" class="sb-row-root sb-header">Casino
                        <span class="sb-caret"><i class="fa ${casinoClass}" data-target="nav-casino"></i></span>
                    </li>

                    <ul id="nav-casino" class="sb-area ${useLiClass}">
                        ${liRow}<a href="/Casino/Spinner">Spin The Wheel</a></li>
                        ${liRow}<a href="Casino/Pot-O-Plata">Pot O' Plata</a></li>
                        ${liRow}<a href="/Casino/Lottery">Lottery</a></li>
                    </ul>

                    <li class="dummy-row"></li>

                    <!------------------------ Links in the Market ----------------------->
                    <li id="market-links" class="sb-row-root sb-header">Market
                        <span class="sb-caret"><i class="fa ${marketClass}" data-target="nav-market"></i></span>
                    </li>
                    <ul id="nav-market" class="sb-area ${useLiClass}">
                        ${liRow}<a href="/Market?sort=price&dir=asc&p=Luxury">Luxury</a></li>
                        ${liRow}<a href="/Market?sort=price&dir=asc&p=Weapon">Weapons</a></li>
                        ${liRow}<a href="/Market?sort=price&dir=asc&p=Enhancement">Enhancements</a></li>
                        ${liRow}<a href="/Market?sort=price&dir=asc&p=Car">Cars</a></li>
                    </ul>

                    <li class="dummy-row"></li>

                    <!------------------------ Links for Inventory ----------------------->
                    <li id="inventory-links" class="sb-row-root sb-header">Inventory
                        <span class="sb-caret"><i class="fa ${inventoryClass}" data-target="nav-inventory"></i></span>
                    </li>
                    <ul id="nav-inventory" class="sb-area ${useLiClass}">
                        ${liRow}<a href="/Inventory?filter=Alcohol">Alcohol</a></li>
                        ${liRow}<a href="/Inventory?filter=Drugs">Drugs</a></li>
                    </ul>

                    <li class="dummy-row"></li>

                    <!------------------------ Misc for testing ----------------------->
                    <li id="area-links" class="sb-row-root sb-header">Areas
                        <span class="sb-caret"><i class="fa fa-caret-down" data-target="nav-areas"></i></span>
                    </li>
                    <ul id="nav-areas" class="sb-area ${useLiClass}">
                        <li class="ind sb-row ${useLiClass}"><a href="/Achievements">Achievements</a></li>
                        <li class="ind sb-row ${useLiClass}"><a href="/Connections?t=enemies">Enemies</a></li>
                        <li class="ind sb-row ${useLiClass}"><a href="/Inventory">Inventory</a></li>
                    </ul>

                    <li class="dummy-row"></li>
                    <li class="dummy-row"></li>

                    <li id="sb-options" class="favFooter">Options</li>

                    <!-- li id="sb-addpage" class="favFooter">Add This Page</li>
                    <li id="sb-rempage" class="favFooter">Remove This Page</li>
                    <li id="sb-favedit" class="favFooter">Edit List</li -->
                </div>
            </div>
        </div>
    `;

    // =============================== Cooldown bars ======================================

    const formatSecondsToTime = (totalSeconds) => {
        let time = new Date(totalSeconds * 1000).toISOString().slice(11, 19);
        debug("[cooldownsCallback] totalSeconds: ", totalSeconds, time);
        return time;
    };

    const minPerHr = 60;
    const maxMedCd = minPerHr * 12;
    const maxDrugCd = minPerHr * 24;
    const maxBoosterCd = minPerHr * 24;

    var medCdNow = 0, drugCdNow = 0, boosterCdNow = 0;
    var medCdPct = 0, drugCdPct = 0, boosterCdPct = 0;
    var medCdSecs = 0, boosterCdSecs = 0, drugCdSecs = 0;

    var progBarTimer;
    var lastCdStats = readCdStats();

    function readCdStats() {
        lastCdStats = JSON.parse(GM_getValue("lastCdStats", JSON.stringify({ drug: 0, med: 0, booster: 0 })));
        medCdPct = lastCdStats.med;
        drugCdPct = lastCdStats.drug;
        boosterCdPct = lastCdStats.booster;
        return lastCdStats;
    }

    function writeCdStats() {
        lastCdStats.drug = drugCdPct = parseInt((drugCdNow / +maxDrugCd) * 100);
        lastCdStats.booster = boosterCdPct = parseInt((boosterCdNow / +maxBoosterCd) * 100);
        lastCdStats.med = medCdPct = parseInt((medCdNow / +maxMedCd) * 100);

        GM_setValue("lastCdStats", JSON.stringify(lastCdStats));
    }

    // Update times from the API, and save pct's to restore on refresh/reload
    function doStats() {
        writeCdStats();
        ce_getUserStats(user_id, 'cooldowns', cooldownsCallback);
    }

    function updateProgBars() {
        medCdPct = parseInt((medCdNow / +maxMedCd) * 100);
        $("#currentMedicalCdSb").text(secsToClock(+medCdSecs, true) + ' / ');
        $("#maxMedicalCdSb").text(secsToClock(+maxMedCd * 60));
        $("#medicalCdProgressSb").attr("style", `Width: ${medCdPct}%`);

        boosterCdPct = parseInt((boosterCdNow / +maxBoosterCd) * 100);
        $("#currentBoosterCdSb").text(secsToClock(+boosterCdSecs, true) + ' / ');
        $("#maxBoosterCdSb").text(secsToClock(+maxBoosterCd * 60));
        $("#boosterCdProgressSb").attr("style", `Width: ${boosterCdPct}%`);

        drugCdPct = parseInt((drugCdNow / +maxDrugCd) * 100);
        $("#currentDrugCdSb").text(secsToClock(+drugCdSecs, true) + ' / ');
        $("#maxDrugCdSb").text(secsToClock(+maxDrugCd * 60));
        $("#drugCdProgressSb").attr("style", `Width: ${drugCdPct}%`);

        if (!progBarTimer) {
            progBarTimer = setInterval(updateProgBarClocks, 1000);
        }

        function updateProgBarClocks() {
            if (drugCdSecs > 0) {
                drugCdSecs = +drugCdSecs - 1;
                // bigHrs = true, showDays = false
                $("#currentDrugCdSb").text(secsToClock(+drugCdSecs, true, false) + ' / ');
            }
            if (medCdSecs > 0) {
                medCdSecs = +medCdSecs - 1;
                $("#currentMedCdSb").text(secsToClock(+medCdSecs) + ' / ');
            }
            if (boosterCdSecs > 0) {
                boosterCdSecs = +boosterCdSecs - 1;
                $("#currentBoosterCdSb").text(secsToClock(+boosterCdSecs) + ' / ');
            }
        }
    }

    function cooldownsCallback(response, status, xhr, id) {
            const secsPerDay = 60 * 60 * 24;
            const cdDiffSecs = (d) => { return (d.getTime() - new Date().getTime()) / 1000; }
            const cdValid = (d) => { return (cdDiffSecs(d) > 0 && cdDiffSecs(d) < secsPerDay); }

            let data = JSON.parse(response);
            //debug("[cooldownsCallback] data: ", data);

            let d = new Date(parseInt(data["drugCooldown"]) * 1000);
            let m = new Date(parseInt(data["medicalCooldown"]));
            let b = new Date(parseInt(data["boosterCooldown"] ));

            let timeNow = new Date().getTime();
            //debug("[cooldownsCallback]\nDrug: ", d, cdValid(d), "\nMed: ", m, cdValid(m), "\nBooster: ", b, cdValid(b));

            drugCdSecs = cdDiffSecs(d);
            medCdSecs = cdDiffSecs(m);
            boosterCdSecs = cdDiffSecs(b);

            medCdNow = parseInt(medCdSecs / 60);
            if (medCdNow <= 0) medCdNow = 0;
            //updateProgBar("medical");
            let cdTxt = (medCdNow == 0) ? "You have no medical cooldown." :
                                       `You have ${secsToClock(medCdNow)} medical cooldown.`;

            drugCdNow = parseInt(drugCdSecs / 60);
            if (drugCdNow <= 0) drugCdNow = 0;
            //updateProgBar("drug");
            cdTxt = (drugCdNow == 0) ? "You have no drug cooldown." :
                                       `You have ${secsToClock(drugCdNow)} drug cooldown.`;

            boosterCdNow = parseInt(boosterCdSecs / 60);
            if (boosterCdNow <= 0) {
                boosterCdNow = 0;
            }
            //updateProgBar("booster");
            cdTxt = (boosterCdNow == 0) ? "You have no booster cooldown." :
                                       `You have ${secsToClock(boosterCdNow)} booster cooldown.`;

            updateProgBars();
        }

    // =============================== Construct/install the sidebar ==========================

    function buildSbHdr() {

        let drugCdBar = getProgBarDiv("drug");
        let medCdBar = getProgBarDiv("medical");
        let boosterCdBar = getProgBarDiv("booster");

        let newDiv = `
            <div id="sb-top-hdr">
                ${drugCdBar}
                ${medCdBar}
                ${boosterCdBar}
            </div>
        `;

        return newDiv;

        function getProgBarDiv(barName) {
            readCdStats();
            const capName = capWord(barName);
            let usePct = barName == 'drug' ? drugCdPct : barName == 'booster' ? boosterCdPct : medCdPct;
            let bar = `
               <div id="${barName}CdWrapSb" title="original" data-html="true">
                    <div class="progress-bar-title-sb">
                        <span>${capName[0]}:</span><span id="current${capName}CdSb">22:27:51 / </span><span id="max${capName}CdSb">24:00:00</span>
                    </div>
                    <div class="progress progressBarStatSb ${barName}Border">
                        <div class="progress-bar bg-info progress-bar-striped" id="${barName}CdProgressSb" role="progressbar" style="Width: ${usePct}%" aria-valuenow="undefined" aria-valuemin="0" aria-valuemax="1440" aria-label="Current ${capName} CD"></div>
                        <!-- div class="progress-bar-title">
                            <span id="current${capName}CdSb">22:27:51 / </span><span id="max${capName}CdSb">24:00:00</span>
                        </div -->
                    </div>
                </div>
            `;
            return bar;
        }
    }

    var statsTimer = 0;
    function installSidebarContents(retries=0) {

        if ($("#sidebarroot").length > 0) return log("Sidebar already exists!");
        let root = $("#contentContainer");
        if (!$(root).length) {
            if (retries++ < 25) return setTimeout(installSidebarContents, 100, retries);
            return log("[installSidebarContents] timed out.");
        }

        $(root).css("display", "flex");
        $(root).css("position", "relative");
        $(root).prepend(sidebar);
        $("#contentContainer > div.row").css({"margin-left": "167px", "width": "90%"});

        let topHdr = buildSbHdr();
        $("#sidebar-content").prepend(topHdr);

        let collapsed = $("#sidebarroot .fa-caret-right");
        for (let idx=0; idx<$(collapsed).length; idx++) {
            let li = $(collapsed)[idx];
            let target = $(li).attr("data-target");
            $(`#${target}`).css("display", "none");
        }

        // { href: "/Town/ArmedSurplus", name: "Armed Surplus", visible: true },
        cityLinks.forEach(entry => {
            if (entry.visible == true) {
                const row = `${liRow}<a href="${entry.href}">${entry.name}</a></li>`;
                $("#nav-city").append(row);
            }
        });

        doStats();
        if (statsTimer) clearInterval(statsTimer);
        statsTimer = setInterval(doStats, 5000);

        // Add event handlers
        // $('#sb-addpage').on('click', handleAddPage);
        // $('#sb-rempage').on('click', handleRemovePage);
        // $('#sb-favedit').on('click', handleEditFaves);

        $(".fa").on('click', handleCaret);

        //$('.dropdown-options li.faveLink').on('click', handleFavoriteClick);
    }

    // =========================================================================


    function hashChangeHandler() {
        debug("[hashChangeHandler]: ", location.href);
        callOnContentLoaded(handlePageLoad);
    }

    function pushStateChanged(e) {
        debug("[pushStateChanged]: ", location.href);
        callOnContentLoaded(handlePageLoad);
    }

    function handlePageLoad(retries=0) {

        installSidebarContents();
    }

    //////////////////////////////////////////////////////////////////////
    // Main.
    //////////////////////////////////////////////////////////////////////

    logScriptStart();

    if ($("#sidebarroot").length > 0) return log("Sidebar already exists!");


    validateApiKey();
    addStyles();

    installSidebarContents();

    callOnHashChange(hashChangeHandler);
    installPushStateHandler(pushStateChanged);

    //callOnContentLoaded(handlePageLoad);


    // Add any styles here
    function addStyles() {

        GM_addStyle(`
            [id*='CdWrapSb'] {
                width: 100%;
                /*height: 14px;*/
                display: flex;
                flex-direction: column;
                padding-bottom: 4px;
            }
            [id*='CdProgressSb'] {
                height: 10px;
            }
            .progress-bar-title-sb {
                overflow: hidden;
                height: 18px;
                width: 98%;
            }
            .progressBarStatSb {
                height: 12px;
                border: 1px solid rgba(155, 193, 7, 0.5);
            }
            .drugBorder { border: 1px solid rgba(155, 193, 7, 0.5); }
            .boosterBorder { border: 1px solid rgba(179, 56, 44, 0.5); }
            .medicalBorder { border: 1px solid rgba(107, 131, 217, 0.5);}

            #drugCdProgressSb {
                background-color: rgb(155, 193, 7) !important;
            }
            #medicalCdProgressSb {
                background-color: rgb(107, 131, 217) !important;
            }
            #boosterCdProgressSb {
                background: linear-gradient(#cc7032 0,#b3382c);
            }

            .icons {
                width: 32px;
                height: 32px;
                cursor: pointer;
            }
            .icons:hover {
                transform: scale(1.1);
            }
            #sidebarroot {
                width: 167px;
                min-width: 167px;
                display: flex;
                flex-direction: column;
                margin-top: 142px;
                height: 100vh;
            }
            #sidebar-content {
                max-height: 75vh;
                overflow-y: auto;
            }
            .border-dbg {
                border: 1px solid green;
            }
            .xedx-locked {
                height: 95vh;
                max-height: 95vh;
                overflow-y: auto;
                position: fixed;
                top: 0;
            }
            #sidebarroot ul {
                padding: 0px 0px 0px 0px !important;
            }
            #sidebarroot li.rnd-btn-1 {
                background: linear-gradient(to bottom, #4c4c4cFF 0%,
                        #595959FF 12%, #666666FF 25%, #2c2c2cFF 50%,
                        #2b2b2bFF 76%, #1c1c1cFF 91%, #131313FF 100%);
                display: list-item;
                list-style-type: none;
                height: 32px;
                border-radius: 4px;
                margin: 0px 0px 0px 0px !important;
                padding: 0px 0px 0px 0px !important;
            }
            #sidebarroot li.rnd-btn-2 {
                font-family: arial;
                font-weight: 400;
                font-size: 12px;
                font-stretch: 100%;
                color: rgb(221, 221, 221);
                background-color: rgb(51, 51, 51);
                border-bottom-color: rgb(68, 68, 68);
                border-bottom-left-radius: 0px;
                border-bottom-right-radius: 5px;
                border-bottom-style: solid;
                border-bottom-width: 1px;
                line-height: 16px;
                cursor: pointer;
                margin: 0px 0px 0px 0px !important;
                padding: 0px 0px 0px 0px !important;
                display: block;
                height: 22px;
            }
            #sidebarroot li.rnd-btn-3 {
                display: list-item;
                list-style-type: none;
                height: 32px;
                margin: 2px 0px 2px 0px !important;
                padding: 5px 0px 0px 0px !important;
                border-top: 1px solid #8888;
                border-bottom: 1px solid #111;
                border-bottom-right-radius: 5px;
                border-top-right-radius: 5px;
            }
            #sidebarroot li.rnd-btn-3:hover {
                transform: translate(5px, 1px);
                background-color: #222;
            }
            #sidebarroot li.rnd-btn-3:hover a {
                transform: translate(1px, 1px);
                background-color: #222;
            }
            #sb-options {
                cursor: pointer;
            }
            #sb-options:hover {
                font-size: 15px;
                color: #b1d2f4;
            }
            #sb-top-hdr {
                padding-top: 15px;
                border-top: 1px solid black;
            }
            .sb-area {
                border-top-right-radius: 5px;
                border-bottom-right-radius: 5px;
                margin-top: 2px;
                overflow: hidden;
                padding: 0px 0px 0px 0px !important;
            }

            .sb-row, .sb-row-root {
                background-color: #333;
                cursor: pointer;
                vertical-align: top;
                border-top-right-radius: 5px;
                border-bottom-right-radius: 5px;
                position: relative;
                overflow: hidden;
                padding: 0px 0px 0px 0px !important;
            }
            .sb-row > a {
                padding-left: 20px;
                text-decoration: none;
            }
            .sb-row:hover, .sb-row:hover > a {
                background-color: #454545;
                color: #ffc107;
            }
            .ind {
                /*display: flex !important;
                justify-content: center;*/
                padding-left: 20px !important;
                margin: 0px 5px 0px 15px !important;
            }
            #sb-link-list {
                display: flex;
                flex-direction: column;
                padding: 5px;
            }
            .dummy-row {
                visibility: hidden;
                height: 4px !important;
            }

            .sb-caret {
                position: absolute;
                cursor: pointer;
                transition: all .2s ease-in-out;
                right: 12px;
            }

            .fa:hover {
                color: #ffc107;
            }

            .sb-header {
                padding: 0px 4px 2px 0px;
                display: flex;
                border-radius: inherit;
                height: 32px;
                font-size: 16px;
            }





        `);
    }



            // ${liRow}<a href="/Town/ArmedSurplus">Armed Surplus</a></li>
            // ${liRow}<a href="/Town/Pharmacy">Alberto's Pharmacy</a></li>
            // ${liRow}<a href="/Market">La Paz Market</a></li>
            // ${liRow}<a href="/Town/Mateos">Mateo's Antiques</a></li>
            // ${liRow}<a href="/Casino">Casino</a></li>
            // ${liRow}<a href="/PetShop">Victor's Pet Shop</a></li>
            // ${liRow}<a href="/Town/EstateAgent">Estate Agent</a></li>
            // ${liRow}<a href="/Hospital">Hospital</a></li>
            // ${liRow}<a href="/Jail">San Pedro Prison</a></li>
            // ${liRow}<a href="/Bank">Bank</a></li>
            // ${liRow}<a href="/Town/Diablos">Diablo's</a></li>
            // ${liRow}<a href="/Town/DrugDen">Drug Den</a></li>
            // ${liRow}<a href="/Bounty">Winston's Bounties</a></li>
            // ${liRow}<a href="/Town/Club">Julio's Club</a></li>
            // ${liRow}<a href="/Town/Dealership">Car Dealership</a></li>
            // ${liRow}<a href="/Town/Construction">Carlo's Construction</a></li>
            // ${liRow}<a href="/Town/PoliceAuction">Police Auction</a></li>
            // ${liRow}<a href="/Church">Church</a></li>


           /* ------------------- contents -------------------- */

            // #sb-inner-list {
            //     /* max-height: 50vh; */
            //     max-height: 210px;
            //     overflow-y: scroll;
            //     overflow-x: hidden;
            // }
            // .mkt-opt {
            //     display: flex;
            //     justify-content: space-between;
            // }
            // #favesMenu > select > option:first-child {
            //     pointer-events: none;
            // }
            // .custom-dropdown {
            //     position: relative;
            //     border: 1px solid #ccc;
            //     border-radius: var(--bs-border-radius);
            //     cursor: pointer;
            //     /* --bs-progress-border-radius: var(--bs-border-radius); */
            // }
            // #sb-addpage {
            //     border-top: 1px solid #ccc;
            //     padding-top: 4px;
            // }
            // .dropdown-header {
            //     padding: 0px 4px 2px 0px;
            //     display: flex;
            //     border-radius: inherit;
            //     height: 32px;
            //     font-size: 16px;
            // }
            // .sb-dropdown-options {
            //     list-style: none;
            //     padding: 0;
            //     margin: 0;
            //     width: 100%;
            //     background-color: var(--bs-body-bg);
            //     border: 1px solid #ccc;
            //     border-radius: 0 0 8px 8px;
            //     z-index: 1;
            // }
            // .sb-dropdown-options li {
            //     padding: 0px 10px;
            //     white-space: nowrap;
            //     color: #ccc;
            // }
            // .favFooter {
            //     display: flex;
            //     justify-content: center;
            //     background-color: var(--bs-tertiary-bg)
            // }
            // .sb-dropdown-options li:last-child {
            //     border-radius: 0 0 10px 10px;
            // }
            // .sb-dropdown-options li:hover {
            //     background-color: #454545;
            //     color: #ffc107;
            // }



//         function liStartFromEntry(entry) {
//             return `<li id="${entry.id}" class="faveLink" data-idx=${entry.idx} draggable="true" contenteditable="true" data-old-title="${entry.title}" ` +
//                 `data-title="${entry.desc}" data-value="${entry.url}">`;
//         }

//         function favesEntryToHtml(entry) {
//             return `<li id="${entry.id}" class="faveLink" data-idx=${entry.idx} draggable="true" ` +
//                     `contenteditable="true" data-old-title="${entry.title}" data-title="${entry.desc}" data-value="${entry.url}">${entry.desc}</li>`;
//         }

//         function logLiIdx(lis) {
//             let idxArray = $(lis).map(function() {
//                 return $(this).attr('data-idx');
//             }).get();
//             let nameArray = $(lis).map(function() {
//                 return $(this).attr('data-title');
//             }).get();
//             debug("[faves][logfave] li indexes: ", idxArray, "\nnames: ", nameArray);
//         }

//         function logEntryIdx(list) {
//             let idxArray = [];
//             let nameArray = [];
//             $.each(list, function(key, value) {
//                 idxArray.push(value.idx);
//                 nameArray.push(value.title);
//             });
//             debug("[faves][logfave] entry indexes: ", idxArray, "\nnames: ", nameArray);
//         }

//         function saveFavorites() {
//             debug("[faveSelect][saveFavorites] faveDefs: ", faveDefs);
//             logEntryIdx($(faveDefs)[0]);
//             GM_setValue(savedFavesKey, JSON.stringify(faveDefs));
//         }

//         function loadFavorites() {
//             faveDefs = JSON.parse(GM_getValue(savedFavesKey, JSON.stringify({})));
//             $("#favesMenu ul.dropdown-options #inner-list").empty();
//             $(".dropdown-options li.faveLink").remove();
//             let keys = Object.keys(faveDefs);

//             let tmpArr = [];
//             for (let idx=0; idx<keys.length; idx++) {
//                 let id = keys[idx];
//                 let entry = faveDefs[id];
//                 entry.title = entry.desc;
//                 entry.order = 0; //entry.idx;
//                 faveDefs[id] = entry;
//                 tmpArr.push({ "id": entry.id, "idx": entry.idx });
//             }

//             tmpArr.sort((a, b) => a.idx - b.idx);
//             tmpArr.forEach(item => {
//                 let nodeHtml = favesEntryToHtml(faveDefs[item.id]);
//                 $("#favesMenu ul.dropdown-options #inner-list").append(nodeHtml);
//             });

//             debug("[faveSelect][loadFavorites] list: ", $("#favesMenu ul.dropdown-options #inner-list li"));
//             $("#favesMenu ul.dropdown-options #inner-list li").on('click', handleFavoriteClick);
//         }

//         function getPageTitleSmall() {
//             let pgTitle = $($("title")[0]).text();
//             if (pgTitle)
//                 pgTitle = pgTitle.replace("| Cartel Empire", '').trim();

//             const urlParams = new URLSearchParams(window.location.search);
//             let selected = urlParams ? urlParams.get("p") : null;
//             if (!selected) selected = urlParams ? urlParams.get("t") : null;
//             if (selected) pgTitle = pgTitle + ' - ' + selected;
//             return pgTitle;
//             return pgTitle;
//         }

//         function getHeaderText(li) {
//             let txt = "Favorites";
//             if ($(li).attr('id') == "sb-rempage") return txt;
//             if ($(li).attr('id') == "sb-addpage") return getPageTitleSmall();
//             let nodeTxt = $(li).attr('data-title');
//             if (nodeTxt) return nodeTxt;
//         }

//         function getRelURL() {
//             return (window.location.pathname +
//                     window.location.search +
//                     window.location.hash);
//         }

//         function addReferrerToPath(path, entry) {
//             debug("[faveSelect][]addReferrerToPath] path: ", path);
//             if (!path) {
//                 console.error("Bad Path! entry: ", entry);
//                 return;
//             }
//             let fullPath = window.location.origin + path;
//             const currentUrl = new URL(fullPath);
//             const params = currentUrl.searchParams;
//             if (params) params.append('ref', entry.id);

//             const newPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
//             debug("[faveSelect][]addReferrerToPath] fullPath: ", fullPath, "\nnewPath: ", newPath);

//             return newPath;
//         }

//         function handleFavoriteClick(e) {
//             e.stopPropagation();
//             //e.preventDefault();
//             let selectedValue = $(this).attr('data-value');
//             let id = $(this).attr("id");
//             let entry = faveDefs[id];
//             let url = entry.url;
//             if (!url) url = $(this).attr("data-value");
//             // let selectedText = getHeaderText($(this));
//             // $('.dropdown-header').text(entry.desc);
//             // $('.dropdown-options').slideUp(); // Hide options

//             let newPath = addReferrerToPath(url, entry)
//             window.location.href = newPath;
//         }

//         function handleAddPage() {
//             let smTitle = getPageTitleSmall();
//             //let tmp = $(`.faveLink[data-title="${smTitle}"]`);
//             let url = getRelURL();

//             debug("[faveSelect][handleAddPage] getting hash for ", url);
//             hashUrlToId(url).then(hashedId => {
//                 debug("[faveSelect][handleAddPage]: got hash: ", hashedId, smTitle);
//                 let test = faveDefs[hashedId];
//                 if (test) {
//                     debug("[faveSelect][handleAddPage] hash collision, already exists? \n", faveDefs, "\hhashed: ", hashedId);
//                     return doToggle();
//                 }
//                 //if ($(tmp).length > 0) return doToggle();

//                 let entry = {"desc": smTitle, "title": smTitle, "url": getRelURL(), "id": hashedId, "order": 0, "idx": faveDefs.length};
//                 let newOptHtml = favesEntryToHtml(entry);
//                 faveDefs[hashedId] = entry;

//                 $("#inner-list").append(newOptHtml);
//                 let newOpt = $("#inner-list > li:last-child");
//                 $('.dropdown-header').text(getPageTitleSmall());
//                 $(newOpt).on('click', handleFavoriteClick);
//                 entry.idx = $(newOpt).index();
//                 debug("[faveSelect][handleAddPage] added page: ", $(newOpt), "\nPath: ", getRelURL());
//                 doToggle();
//                 saveFavorites();
//                 loadFavorites();
//             });

//         }

//         function handleRemovePage() {
//             debug("[faveSelect][handleRemovePage]");
//             let relUrl = getRelURL();
//             let opt = $('#favesMenu ul').find(`li[data-value='${relUrl}']`);
//             if (!$(opt).length)
//                 opt = $('#favesMenu ul').find(`li[data-value*='${window.location.pathname}']`);
//             let id = $(opt).attr("id");
//             let entry = faveDefs[id];
//             delete faveDefs[id];
//             $(opt).remove();
//             debug("[faveSelect] removed page: ", id, entry);

//             saveFavorites();
//         }

//         function handleEditRemoveEntry(e) {
//             e.stopPropagation();
//             let li = $(this).closest("li");
//             let id = $(li).attr("id");
//             let url = $(li).attr("data-value");
//             let opt = $('#favesMenu ul').find(`li[data-value='${url}']`);

//             let entry = faveDefs[id];

//             debug("[handleEditRemoveEntry] li: ", $(li), " id: ", id, " url: ", url, " opt: ", opt, " entry: ", entry);

//             delete faveDefs[id];
//             $(opt).remove();
//             $(li).remove();
//             saveFavorites();
//         }

//         function makeEditLiFromEntry(entry) {
//             let li = //`<li style="order: ${entry.order};">` +
//                  liStartFromEntry(entry) +
//                      `<span class="fav-edit-span" data-id="${entry.id}" contenteditable="true">${entry.desc}</span>` +
//                      `<span style="width:10px;"></span><span class="fes2">X</span>` +
//                  `</li>`;
//             return li;
//         }

//         function saveFavesHelp() {
//             let helpDiv = `
//                 <div id="FavesHelp" class="xopts-ctr-screen xopts-def-size xopts-bg xopt-border-ml6">
//                     <div class='inner'>
//                         <p>
//                             To remove an entry, click the 'X' to the right of the entry<br><br>
//                             To edit the text, simply click on it and start typing<br><br>
//                             You can drag the entries to re-order them<br><br>
//                             When finished, select 'Close' and your changes will be saved
//                         </p>
//                     </div>
//                     <div class="footer">
//                         <button id="help-fav-close" class="btn btn-success btn-dark">Close</button>
//                     </div>
//                 </div>
//             `;

//             $("#FavesEdit").replaceWith(helpDiv);

//             $("#help-fav-close").on("click", function(e) {
//                 $("#FavesHelp").remove();
//                 $("#FavesEdit").remove();
//                 debug("[favesHelp][help-fav-close]  \nhelp: ", $("#FavesHelp"), "\nedit: ", $("#FavesEdit"));
//                 handleEditFaves();
//             });
//         }

//         function saveFavesEdits() {
//             debug("[saveFavesEdits] faves: ", faveDefs);
//             let nodes = $("#FavesEdit > div.inner > ul > li > span.fav-edit-span");
//             for (let idx=0; idx< $(nodes).length; idx++) {
//                 let node = $(nodes)[idx];
//                 let desc = $(node).text();
//                 let id = $(node).attr("data-id");
//                 let entry = faveDefs[id];

//                 if (!entry) {
//                     log("Error, no entry: ", id, faveDefs);
//                     debugger;
//                 }
//                 entry.desc = desc;
//                 entry.title = desc;
//                 faveDefs[id] = entry;
//                 debug("[saveFavesEdits] new entry: ", entry);
//             }
//             saveFavorites();
//             loadFavorites();
//             debug("[saveFavesEdits] done: ", faveDefs);
//         }

//         function handleEditFaves(e) {
//             debug("[handleEditFaves]");
//             let editDiv = `
//                 <div id="FavesEdit" class="xopts-ctr-screen xopts-def-size xopts-bg xopt-border-ml6">
//                     <div class='inner'>
//                         <ul>

//                         </ul>
//                     </div>
//                     <div class="footer">
//                         <button id="edit-fav-save" class="btn btn-success btn-dark" type="button">Save</button>
//                         <button id="edit-fav-help" class="btn-fav-help btn btn-success btn-dark" type="button">?</button>
//                         <button id="edit-fav-close" class="btn btn-success btn-dark">Close</button>
//                     </div>
//                 </div>
//             `;

//             $('body').append(editDiv);

//             let ul = $("#FavesEdit > div.inner > ul");
//             let keys = Object.keys(faveDefs);
//             let tmpArr = [];
//             for (let idx=0; idx<keys.length; idx++) {
//                 let id = keys[idx];
//                 let entry = faveDefs[id];
//                 tmpArr.push({ "id": id, "idx": entry.idx });
//             }

//             tmpArr.sort((a, b) => a.idx - b.idx);
//             tmpArr.forEach(item => {
//                 let li = makeEditLiFromEntry(faveDefs[item.id]);
//                 $(ul).append(li);
//             });

//             $("#edit-fav-close").on('click', function() {$("#FavesEdit").remove();});
//             $("#edit-fav-save").on('click', saveFavesEdits);
//             $("#edit-fav-help").on('click', saveFavesHelp);

//             $(".fes2").on("click", handleEditRemoveEntry);

//             // ===== Drag support =====
//             let draggedItem = null;
//             let draggableList = $("#FavesEdit ul")[0];
//             $("#FavesEdit ul").on('dragstart', (e) => {
//                 if (e.target.tagName === 'LI') {
//                     e.target.contentEditable = 'false';
//                     draggedItem = e.target;
//                     e.originalEvent.dataTransfer.setData('text/plain', e.target.id);
//                     debug("[faves-drag] dragstart, id: ", e.target.id, " idx: ", $(e.target).index());
//                 } else {
//                     e.preventDefault();
//                 }
//             });

//             $("#FavesEdit ul").on('dragover', (e) => {
//                 e.preventDefault();
//                 const target = e.target.closest('li');
//                 if (target && target !== draggedItem) {
//                     const boundingBox = target.getBoundingClientRect();
//                     const offset = e.clientY - boundingBox.top;
//                     if (offset > boundingBox.height / 2) {
//                         draggableList.insertBefore(draggedItem, target.nextSibling);
//                     } else {
//                         draggableList.insertBefore(draggedItem, target);
//                     }
//                 }
//             });

//             $("#FavesEdit ul").on('drop', (e) => {
//                 e.preventDefault();
//                 const data = e.originalEvent.dataTransfer.getData('text/plain');
//                 const element = document.getElementById(data);

//                 let targetElement = e.target;
//                 while (targetElement && targetElement.tagName !== 'LI') {
//                     targetElement = targetElement.parentElement;
//                 }

//                 if (targetElement && element) {
//                     if (targetElement.id !== element.id) {
//                         debug("[faves-drag] drop: ", $(targetElement), $(element));
//                         e.target.appendChild(element);
//                     } else {
//                         element.contentEditable = 'true';
//                     }
//                 }

//                 debug("[faves-drag] drop, id: ", element.id, " idx: ", $(element).index());

//                 document.querySelectorAll('li[contenteditable="true"]').forEach(item => {
//                     if (item !== element) { // Skip the item we just moved, if it is being re-enabled
//                         item.contentEditable = 'true';
//                     }
//                 });
//                 draggedItem = null; // Clear the dragged item variable
//             });

//             $("#FavesEdit ul").on('dragend', (e) => {
//                 // Make all list items editable again after drag ends
//                 const id = e.target.id;
//                 debug("[faves-drag] dragend, id: ", id, $(`#${id}`));
//                 let lis = $("#FavesEdit ul li");

//                 let editedEntries = {};
//                 for (let idx=0; idx < $(lis).length; idx++) {
//                     let item = $(lis)[idx];
//                     let entry = faveDefs[item.id];
//                     debug("[faves-drag] change idx from: ", entry.idx, " to: ", idx, " index: ", $(item).index(), entry.title);
//                     entry.idx = idx;
//                     item.contentEditable = 'true';
//                     faveDefs[item.id] = JSON.parse(JSON.stringify(entry));
//                     editedEntries[idx] = entry;
//                 }

//                 $(".dropdown-options li.faveLink").remove();
//                 let keys = Object.keys(editedEntries);
//                 for (let idx=0; idx<keys.length; idx++) {
//                     let itemIdx = keys[idx];
//                     let entry = editedEntries[itemIdx];
//                     let nodeHtml = favesEntryToHtml(entry);
//                     $("#favesMenu ul.dropdown-options #inner-list").append(nodeHtml);
//                 }

//                 //logEntryIdx($(faveDefs)[0]);
//                 saveFavorites();
//                 loadFavorites();
//                 //logEntryIdx($(faveDefs)[0]);

//             });

//         }




})();




