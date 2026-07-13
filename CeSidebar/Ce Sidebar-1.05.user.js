// ==UserScript==
// @name         Ce Sidebar
// @namespace    http://tampermonkey.net/
// @version      1.05
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

    const groupIdToId = (optId) => { return (optId + 'Group'); }
    const thisURL = window.location.pathname.toLowerCase() || "home";
    const escapeRegExp = (string) => { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('undefined', ''); }
    const hasPath = (txt) => { return new RegExp(`${escapeRegExp(txt)}`, 'gi').test(thisURL); }
    const isSettingsPage = () => { return hasPath("/settings"); }

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

    const groupIds = [
        { id: 'city', title: "City Links" },
        { id: 'inventory', title: "Inventory Links" },
        { id: 'market', title: "Market Links" },
        { id: 'area', title: "Area Links" },
        { id: 'casino', title: "Casino Links" },
        { id: 'extra', title: "Extra Links" },
    ];

    const defCityLinks = [
        { href: "/Town/ArmedSurplus", inputId: "ArmedSurplus", name: "Armed Surplus", visible: true },
        { href: "/Town/Pharmacy", inputId: "Pharmacy", name: "Alberto's Pharmacy", visible: true },
        { href: "/Market", inputId: "Market", name: "La Paz Market", visible: true },
        { href: "/Town/Mateos", inputId: "Mateos", name: "Mateo's Antiques", visible: true },
        { href: "/Casino", inputId: "Casino", name: "Casino", visible: true },
        { href: "/PetShop", inputId: "PetShop", name: "Victor's Pet Shop", visible: true },
        { href: "/Town/EstateAgent", inputId: "EstateAgent", name: "Estate Agent", visible: true },
        { href: "/Hospital", inputId: "Hospital", name: "Hospital", visible: true },
        { href: "/Jail", inputId: "Jail", name: "San Pedro Prison", visible: true },
        { href: "/Bank", inputId: "Bank", name: "Bank", visible: true },
        { href: "/Town/Diablos", inputId: "Diablos", name: "Diablo's", visible: true },
        { href: "/Town/DrugDen", inputId: "DrugDen", name: "Drug Den", visible: true },
        { href: "/Bounty", inputId: "Bounty", name: "Winston's Bounties", visible: true },
        { href: "/Town/Club", inputId: "Club", name: "Julio's Club", visible: true },
        { href: "/Town/Dealership", inputId: "Dealership", name: "Car Dealership", visible: true },
        { href: "/Town/Construction", inputId: "Construction", name: "Carlo's Construction", visible: true },
        { href: "/Town/PoliceAuction", inputId: "PoliceAuction", name: "Police Auction", visible: true },
        { href: "/Church", inputId: "Church", name: "Church", visible: true },
    ];
    const cityLinks = JSON.parse(GM_getValue("cityLinks", JSON.stringify(defCityLinks)));

    const defInventoryLinks = [
        { name: "Alcohol", filter: "Alcohol", visible: true }, { name: "Armour", filter: "Armour", visible: true },
        { name: "Car", filter: "Car", visible: true }, { name: "Collectible", filter: "Collectible", visible: true },
        { name: "Construction", filter: "Construction", visible: true }, { name: "Drug", filter: "Drug", visible: true },
        { name: "Enhancement", filter: "Enhancement", visible: true }, { name: "Food", filter: "Food", visible: true },
        { name: "Luxury", filter: "Luxury", visible: true }, { name: "Medical", filter: "Medical", visible: true },
        { name: "Production", filter: "Production%20Supply", visible: true }, { name: "Thrown", filter: "Thrown", visible: true },
        { name: "Weapon", filter: "Weapon", visible: true },
    ];
    const inventoryLinks = JSON.parse(GM_getValue("inventoryLinks", JSON.stringify(defInventoryLinks)));

    const defMarketLinks = [
        { name: "Weapons", filter: "Weapon", visible: true }, { name: "Thrown", filter: "Thrown", visible: true },
        { name: "Armour", filter: "Armour", visible: true }, { name: "Special", filter: "Special", visible: true },
        { name: "Alcohol", filter: "Alcohol", visible: true }, { name: "Medical", filter: "Medical", visible: true },
        { name: "Drugs", filter: "Drug", visible: true }, { name: "Production", filter: "Production", visible: true },
        { name: "Construction", filter: "Construction", visible: true }, { name: "Food", filter: "Food", visible: true },
        { name: "Collectible", filter: "Collectible", visible: true }, { name: "Luxury", filter: "Luxury", visible: true },
        { name: "Cars", filter: "Car", visible: true }, { name: "Enhancement", filter: "Enhancement", visible: true },
        { name: "Smuggling Enhancement", filter: "Smuggling+Enhancement", visible: true },
        { name: "Points", filter: "Points", visible: true },

    ];
    const marketLinks = JSON.parse(GM_getValue("marketLinks", JSON.stringify(defMarketLinks)));

    const defAreaLinks = [
        { href: "/Town", name: "Town", visible: true },
        { href: "/inventory", name: "Inventory", visible: true }, { href: "/Gym", name: "Gym", visible: true },
        { href: "/Jobs", name: "Jobs", visible: true },
        { href: "/Production", name: "Production", visible: true }, { href: "/University", name: "University", visible: true },
        { href: "/Expedition", name: "Expeditions", visible: true },
        { href: "/Property", name: "Property", visible: true }, { href: "/Bank", name: "Bank", visible: true },
        { href: "/Cartel", name: "Cartel", visible: true }, { href: "/Missions", name: "Missions", visible: true },
        { href: "/Forum", name: "Forum", visible: true },
     ];
    const areaLinks = JSON.parse(GM_getValue("areaLinks", JSON.stringify(defAreaLinks)));

    const defExtraLinks = [
        { href: "/Trade", name: "Trades", visible: true }, { href: "/Events", name: "Events", visible: true },
        { href: "/Mail", name: "Mail", visible: true },
        { href: "/Connections?t=friends", name: "Friends", visible: true },
        { href: "/Connections?t=enemies", name: "Enemies", visible: true },
        { href: "/Achievements", name: "Achievements", visible: true },
        { href: "/User/Stats", name: "Statistics", visible: true },
    ];
    const extraLinks = JSON.parse(GM_getValue("extraLinks", JSON.stringify(defExtraLinks)));

    const defCasinoLinks = [
        { href: "/Casino/Blackjack", name: "Blackjack", visible: true },
        { href: "/Casino/Spinner", inputId: "Wheel", name: "Wheel Of Fortune", visible: true },
        { href: "/Casino/Slots", name: "Slots", visible: true },
        { href: "/Casino/Lottery", name: "Lottery", visible: true },
        { href: "/Casino/Pot-O-Plata",  inputId: "PotOPlata", name: "Pot O' Plata", visible: true },
    ];
    const casinoLinks = JSON.parse(GM_getValue("casinoLinks", JSON.stringify(defCasinoLinks)));

    function saveLinksTable(tblName) {
        switch (tblName) {
            case "cityLinks": return GM_setValue("cityLinks", JSON.stringify(cityLinks));
            case "inventoryLinks": return GM_setValue("inventoryLinks", JSON.stringify(inventoryLinks));
            case "marketLinks": return GM_setValue("marketLinks", JSON.stringify(marketLinks));
            case "areaLinks": return GM_setValue("areaLinks", JSON.stringify(areaLinks));
            case "casinoLinks": return GM_setValue("casinoLinks", JSON.stringify(casinoLinks));
            case "extraLinks": return GM_setValue("extraLinks", JSON.stringify(extraLinks));
        }
    }

    const useLiClass = sidebarStyle;
    const liRow = `<li class="ind sb-row ${useLiClass}">`;

    let cityClass = GM_getValue("nav-city-pos", "fa-caret-down");
    let casinoClass = GM_getValue("nav-casino-pos", "fa-caret-down");
    let marketClass = GM_getValue("nav-market-pos", "fa-caret-down");
    let inventoryClass = GM_getValue("nav-inventory-pos", "fa-caret-down");
    let areasClass = GM_getValue("nav-areas-pos", "fa-caret-down");
    let extraClass = GM_getValue("nav-extra-pos", "fa-caret-down");

    const sidebar = `
        <div id="sidebarroot" class="xedx-locked">
            <div id="sidebar-content">
                <div id="sb-link-list"  class="sb-area ${useLiClass}">

                    <li class="row-separator"></li>
                    <li class="dummy-row"></li>

                    <!------------------------ General Areas ----------------------->
                    <li id="area-links" class="sb-row-root sb-header">Areas
                        <span class="sb-caret"><i class="fa ${areasClass}" data-target="nav-areas"></i></span>
                    </li>
                    <ul id="nav-areas" class="sb-area ${useLiClass}">
                        <li class="ind sb-row ${useLiClass}"><a href="/">Home</a></li>
                    </ul>

                    <li class="dummy-row"></li>

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
                    </ul>

                    <li class="dummy-row"></li>

                    <!------------------------ Links in the Market ----------------------->
                    <li id="market-links" class="sb-row-root sb-header">Market
                        <span class="sb-caret"><i class="fa ${marketClass}" data-target="nav-market"></i></span>
                    </li>
                    <ul id="nav-market" class="sb-area ${useLiClass}">
                    </ul>

                    <li class="dummy-row"></li>

                    <!------------------------ Links for Inventory ----------------------->
                    <li id="inventory-links" class="sb-row-root sb-header">Inventory
                        <span class="sb-caret"><i class="fa ${inventoryClass}" data-target="nav-inventory"></i></span>
                    </li>
                    <ul id="nav-inventory" class="sb-area ${useLiClass}">
                    </ul>

                    <li class="dummy-row"></li>

                    <!------------------------ Links for Extra areas ----------------------->
                    <li id="extra-links" class="sb-row-root sb-header">Extra Areas
                        <span class="sb-caret"><i class="fa ${extraClass}" data-target="nav-extra"></i></span>
                    </li>
                    <ul id="nav-extra" class="sb-area ${useLiClass}">
                    </ul>


                    <li class="dummy-row"></li>
                    <li class="row-separator"></li>
                    <li class="dummy-row"></li>

                    <li id="sb-options" class="favFooter"><a href="/settings?ref=sidebar">Options</a></li>
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
        $("#currentMedicalCdSb").text(secsToClock(+medCdSecs, true)); // + ' / ');
        $("#maxMedicalCdSb").text(secsToClock(+maxMedCd * 60));
        $("#medicalCdProgressSb").attr("style", `Width: ${medCdPct}%`);

        boosterCdPct = parseInt((boosterCdNow / +maxBoosterCd) * 100);
        $("#currentBoosterCdSb").text(secsToClock(+boosterCdSecs, true)); // + ' / ');
        $("#maxBoosterCdSb").text(secsToClock(+maxBoosterCd * 60));
        $("#boosterCdProgressSb").attr("style", `Width: ${boosterCdPct}%`);

        drugCdPct = parseInt((drugCdNow / +maxDrugCd) * 100);
        $("#currentDrugCdSb").text(secsToClock(+drugCdSecs, true)); // + ' / ');
        $("#maxDrugCdSb").text(secsToClock(+maxDrugCd * 60));
        $("#drugCdProgressSb").attr("style", `Width: ${drugCdPct}%`);

        if (!progBarTimer) {
            progBarTimer = setInterval(updateProgBarClocks, 1000);
        }

        function updateProgBarClocks() {
            if (drugCdSecs > 0) {
                drugCdSecs = +drugCdSecs - 1;
                // bigHrs = true, showDays = false
                $("#currentDrugCdSb").text(secsToClock(+drugCdSecs, true, false)); // + ' / ');
            }
            if (medCdSecs > 0) {
                medCdSecs = +medCdSecs - 1;
                $("#currentMedCdSb").text(secsToClock(+medCdSecs)); // + ' / ');
            }
            if (boosterCdSecs > 0) {
                boosterCdSecs = +boosterCdSecs - 1;
                $("#currentBoosterCdSb").text(secsToClock(+boosterCdSecs)); // + ' / ');
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

        let drugCdBar = getCdProgBarDiv("drug");
        let medCdBar = getCdProgBarDiv("medical");
        let boosterCdBar = getCdProgBarDiv("booster");

        let eBar = getEnergyProgBarDiv();
        let lBar = getLifeProgBarDiv();
        let rBar = getRepProgBarDiv();
        let cBar = getCashProgBarDiv();

        let headerDiv = `
            <div id="sb-top-hdr">
                ${eBar}
                ${lBar}
                ${rBar}
                ${cBar}
                <!-- div style="height: 12px !important; background-color: #444;"></div -->
                ${drugCdBar}
                ${medCdBar}
                ${boosterCdBar}
            </div>
        `;

        // TBD: combine into one...
        setInterval(updateEnergyBar, 2000);
        setInterval(updateLifeBar, 2000);

        // TBD - remaining bars, also points bar

        return headerDiv;

        function getCurrE() { return $("#currentEnergy").text() ? $("#currentEnergy").text() : ""; }
        function getMaxE() { return $("#energyProgress").attr("aria-valuemax") ? $("#energyProgress").attr("aria-valuemax") : 200; }

        function getCdProgBarDiv(barName) {
            readCdStats();
            const capName = capWord(barName);
            let usePct = barName == 'drug' ? drugCdPct : barName == 'booster' ? boosterCdPct : medCdPct;
            let bar = `
               <div id="${barName}CdWrapSb" title="original" data-html="true">
                    <div class="progress-bar-title-sb">
                        <span>${capName}:</span><span id="current${capName}CdSb">22:27:51 / </span>
                        <!-- span id="max${capName}CdSb">24:00:00</span -->
                    </div>
                    <div class="progress progressBarStatSb ${barName}Border">
                        <div class="progress-bar bg-info progress-bar-striped" id="${barName}CdProgressSb" role="progressbar" style="Width: ${usePct}%"` +
                          ` aria-valuenow="0" aria-valuemin="0" aria-valuemax="1440" aria-label="Current ${capName} CD"></div>
                    </div>
                </div>
            `;
            return bar;
        }

        var maxE = 0;
        function getEnergyProgBarDiv() {
            let currE = getCurrE();
            if (!maxE) maxE = getMaxE();
            return `
                <div id="energySidebar" class="sb-std-bar progress progressBarStat">
                    <div class="progress-bar bg-warning progress-bar-striped progress-bar-animated" id="energyProgressSb" role="progressbar" ` +
                        `style="width: 55%;" aria-valuenow="${currE}" aria-valuemin="0" aria-valuemax="${maxE}" aria-label="Current Energy">
                    </div>
                    <div class="progress-bar-title">
                        <span id="currentEnergySb">${currE}</span> / <span id="maxEnergySb">${maxE}</span>
                    </div>
                </div>
            `;
        }

        function updateEnergyBar() {
            let currE = getCurrE();
            if (!maxE) maxE = getMaxE();
            let pct = parseInt((+currE / +maxE) * 100) + "%";
            $("#energyProgressSb").attr("aria-valuenow", $("#energyProgress").attr("aria-valuenow") );
            $("#energyProgressSb").attr("aria-valuemax", $("#energyProgress").attr("aria-valuemax") );
            $("#energyProgressSb").css("width", pct);
            $("#currentEnergySb").text($("#energyProgress").attr("aria-valuenow"));
            $("#maxEnergySb").text($("#energyProgress").attr("aria-valuemax"));
        }

        function getLifeProgBarDiv() {
            return `
                <div id="lifeSidebar" class="sb-std-bar progress progressBarStat">
                    <div class="progress-bar bg-success progress-bar-striped" id="lifeProgressSb" role="progressbar" ` +
                        `style="Width: 100%" aria-valuenow="${$("#lifeProgress").attr("aria-valuenow")}" aria-valuemin="0" aria-valuemax="${$("#lifeProgress").attr("aria-valuemax")}" aria-label="Current Life">
                    </div>
                    <div class="progress-bar-title">
                        <span id="currentLifeSb">${$("#lifeProgress").attr("aria-valuenow")}</span> / <span id="maxLifeSb">${$("#lifeProgress").attr("aria-valuemax")}</span>
                    </div>
                </div>
            `;
        }

        function updateLifeBar() {
            let currE = $("#lifeProgress").attr("aria-valuenow");
            let maxE = $("#lifeProgress").attr("aria-valuemax");
            let pct = parseInt((+currE / +maxE) * 100) + "%";
            $("#lifeProgressSb").attr("aria-valuenow", $("#lifeProgress").attr("aria-valuenow") );
            $("#lifeProgressSb").attr("aria-valuemax", $("#lifeProgress").attr("aria-valuemax") );
            $("#lifeProgressSb").css("width", pct);
            $("#currentLifeSb").text($("#lifeProgress").attr("aria-valuenow"));
            $("#maxLifeSb").text($("#lifeProgress").attr("aria-valuemax"));
        }

        function getRepProgBarDiv() {
            return `
                <div id="repSidebar" class="sb-std-bar progress progressBarStat">
                    <div class="progress-bar bg-white" role="progressbar" style="Width: 100%" aria-valuenow="100" aria-valuemin="0" ` +
                                `aria-valuemax="100" aria-label="Reputation">
                    </div>
                    <div class="progress-bar-title">
                        <span></span>
                    </div>
                </div>
            `;
        }

        function getCashProgBarDiv() {
            return `
                <div id="cashSidebar" class="sb-std-bar progress progressBarStat">
                    <div class="progress-bar bg-white" role="progressbar" style="Width: 100%" aria-valuenow="100" aria-valuemin="0" ` +
                       ` aria-valuemax="100" aria-label="Cash">
                    </div>
                    <div class="progress-bar-title">
                        <span class="cashDisplay" value="0">0</span>
                    </div>
                </div>
            `;
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

        // figure out top margin...
        // $("#contentContainer > div.row > div.col-12.bg-dark.text-white").height();
        // $("body > div.topNav.sticky-top > nav > div").height()


        // TBD: consolidate these into a loop

        // Add enabled area links
        areaLinks.forEach(entry => {
            if (entry.visible == true) {
                const row = `${liRow}<a href="${entry.href}">${entry.name}</a></li>`;
                $("#nav-areas").append(row);
            }
        });

        // Add enabled city links
        cityLinks.forEach(entry => {
            if (entry.visible == true) {
                const row = `${liRow}<a href="${entry.href}">${entry.name}</a></li>`;
                $("#nav-city").append(row);
            }
        });

        // Add enabled market links
        marketLinks.forEach(entry => {
            if (entry.visible == true) {
                const row = `${liRow}<a href="/Market?sort=price&dir=asc&p=${entry.filter}">${entry.name}</a></li>`;
                $("#nav-market").append(row);
            }
        });

        // Add enabled inventory links
        inventoryLinks.forEach(entry => {
            if (entry.visible == true) {
                const row = `${liRow}<a href="/Inventory?filter=${entry.filter}">${entry.name}</a></li>`;
                $("#nav-inventory").append(row);
            }
        });

        // Add enabled casino links
        casinoLinks.forEach(entry => {
            if (entry.visible == true) {
                const row = `${liRow}<a href="${entry.href}">${entry.name}</a></li>`;
                $("#nav-casino").append(row);
            }
        });

        // Add enabled 'extra' links
        extraLinks.forEach(entry => {
            if (entry.visible == true) {
                const row = `${liRow}<a href="${entry.href}">${entry.name}</a></li>`;
                $("#nav-extra").append(row);
            }
        });

        // Collapse as appropriate
        let collapsed = $("#sidebarroot .fa-caret-right");
        for (let idx=0; idx<$(collapsed).length; idx++) {
            let li = $(collapsed)[idx];
            let target = $(li).attr("data-target");
            $(`#${target}`).css("display", "none");
        }

        doStats();
        if (statsTimer) clearInterval(statsTimer);
        statsTimer = setInterval(doStats, 5000);

        $(".fa").on('click', handleCaret);
    }

    // ============================ Build a settings page ============================

    function installSettings(retries=0) {
        let root = $("#settingsNav");
        let navTab = $("#settingsNav > div.nav.nav-tabs > button.active");

        if (!$(root).length || !$(navTab).length) {
            if (retries++ < 25) return setTimeout(installSettings, 100, retries);
            return log("[installSettings] timed out");
        }

        let tabId = $(navTab).attr("id");
        const selected = (tabId == "v-content-sidebar");
        debug("[settings] selected: ", selected, " id: ", tabId, " nav tab: ", $(navTab));

        let tabs = $("#settingsNav > div.nav-tabs");
        let content = $("#settingsNav .tab-content");

        debug("[installSettings]", $(tabs), $(content));

        const newTab = `
            <button class="nav-link settings-nav-link" id="v-tab-sidebar" data-bs-toggle="tab"
            data-bs-target="#v-content-sidebar" type="button" role="tab" aria-controls="v-content-sidebar"
            aria-selected="${selected.toString()}" tab="sidebar" tabindex="-1">Sidebar</button>`;
        $(tabs).append(newTab);

        if (location.href.indexOf("ref=sidebar") > -1) {
            $("#v-tab-sidebar").css("color", "dodgerblue");
        }

        $("#v-tab-sidebar").on('click', function(e) {
            let url = new URL(window.location.href);
            let searchParams = url.searchParams;
            searchParams.set('t', 'sidebar');
            url.search = searchParams.toString();
            history.replaceState(null, '', url.toString());
            });

        if (selected == false)
			$("#v-tab-sidebar").attr("tabindex", "-1");

        debug("[installSettings] new tab: ", $("#v-tab-sidebar"));

        appendSettingsHtml(content);
        //$(content).append(newContent);
        debug("[installSettings] appended content: ", $("#v-content-sidebar"));

        if (selected == true) {
            debug("[installSettings] adding active class");
			$("#v-content-sidebar").addClass("active show");
        }


        // TBD: market, casino...
        istallGroupOptions(areaLinks, 'areaGroup');
        istallGroupOptions(cityLinks, 'cityGroup');
        istallGroupOptions(marketLinks, 'marketGroup');
        istallGroupOptions(inventoryLinks, 'inventoryGroup');
        istallGroupOptions(casinoLinks, 'casinoGroup');
        istallGroupOptions(extraLinks, 'extraGroup');

        $(".sidebar-switch").on("click", handleSettingsChange);

        //$(".form-btn").on('click', handleSettingsBtn);

        function handleSettingsChange(e) {
            let name = $(this).attr("name");
            let idx = $(this).attr("data-idx");
            let tableId = $(this).closest("tbody").attr("id");
            let rowId = $(this).attr("id");
            let checked = $(this).prop("checked");

            switch (tableId) {
                case "cityGroup": {
                    cityLinks[idx].visible = checked;
                    saveLinksTable("cityLinks");
                    break;
                }
                case "marketGroup": {
                    marketLinks[idx].visible = checked;
                    saveLinksTable("marketLinks");
                    break;
                }
                case "areasGroup": {
                    areasLinks[idx].visible = checked;
                    saveLinksTable("areasLinks");
                    break;
                }
                case "inventoryGroup": {
                    inventoryLinks[idx].visible = checked;
                    saveLinksTable("inventoryLinks");
                    break;
                }
                case "casinoGroup": {
                    casinoLinks[idx].visible = checked;
                    saveLinksTable("casinoLinks");
                    break;
                }
                case "extraGroup": {
                    extraLinks[idx].visible = checked;
                    saveLinksTable("extraLinks");
                    break;
                }
            }
        }

        function istallGroupOptions(groupLinks, tblId) {
            let idx = 0;
            groupLinks.forEach(entry => {
                debug("Install option: ", entry);
                let name = entry.name;
                let inputId = entry.inputId;
                let inputIdSelect = "#" + (inputId ? inputId : name);
                let row = getSettingsRow(entry, idx++);
                $(`#${tblId}`).append($(row));

                $(inputIdSelect).prop('checked', (entry.visible == true));
                //$(inputIdSelect).on('change', handleSettingsChange);
            });
        }

        function getSettingsRow(link, idx) {
            let name = link.name;
            let enabled = link.visible;

            let rowInput =
                    `<div class="form-check form-switch">
                        <input class="form-check-input sidebar-switch" name="${name}" data-idx="${idx}" type="checkbox" id="${name}">
                    </div>`;

            let newRow =
                  `<tr class="align-middle settings-row" style="border-bottom-width: 1px;">
                      <td><span style="margin-left: 20px;">${name}</span></td>
                      <td>${rowInput}</td>
                  </tr>`;

            return newRow;
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
            const subBtn = `<input class="btn btn-success mt-2" type="submit" value="Update Sidebar Links" id="submitSidebarLinksBtn">`;
            let settingsHtml = `
                <div class="tab-pane fade" id="v-content-sidebar" role="tabpanel" aria-labelledby="v-tab-sidebar">
                    <div class="card">
                        <div id="sidebar-opts" class="card-body">

                        </div>
                    </div>
                </div>`;

            $(content).append(settingsHtml);

            //let ids = Object.keys(groupIds);
            //for (let idx=0; idx<ids.length; idx++) {
            groupIds.forEach(entry => {
                let tblId = groupIdToId(entry.id);
                let newTbl = getTblBody(entry.title, tblId);

                $("#sidebar-opts").append(newTbl);
            });

            $("#sidebar-opts").append(subBtn);

            debug("[settings][appendSettingsHtml] ", $("#v-content-sidebar"));

            //return $(settingsHtml);
        }

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

        if (isSettingsPage() == true) {
            installSettings();
        }
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

    callOnContentLoaded(handlePageLoad);


    // Add any styles here
    function addStyles() {

        GM_addStyle(`
            [id*='CdWrapSb'] {
                width: 90%;
                /*height: 14px;*/
                display: flex;
                flex-direction: column;
                padding-bottom: 4px;
            }
            [id*='CdProgressSb'] {
                height: 10px;
            }
            .sb-std-bar {
                height: 12px !important;
                margin-top: 10px;
                width: 90%;
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
            .row-separator {
                height: 4px !important;
                background-color: #777;
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

    function getBatterySvg() {
        return `
            <svg class="bi bi-battery-full" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M9.585 2.568a.5.5 0 0 1 .226.58L8.677 6.832h1.99a.5.5 0 0 1 .364.843l-5.334 5.667a.5.5 0 0 1-.842-.49L5.99 9.167H4a.5.5 0 0 1-.364-.843l5.333-5.667a.5.5 0 0 1 .616-.09z"></path>
                <path d="M2 4h4.332l-.94 1H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.38l-.308 1H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2"></path>
                <path d="M2 6h2.45L2.908 7.639A1.5 1.5 0 0 0 3.313 10H2zm8.595-2-.308 1H12a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H9.276l-.942 1H12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
                <path d="M12 10h-1.783l1.542-1.639q.146-.156.241-.34zm0-3.354V6h-.646a1.5 1.5 0 0 1 .646.646M16 8a1.5 1.5 0 0 1-1.5 1.5v-3A1.5 1.5 0 0 1 16 8"></path>
            </svg>
        `;
    }


})();




