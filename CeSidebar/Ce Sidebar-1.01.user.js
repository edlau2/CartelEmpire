// ==UserScript==
// @name         Ce Sidebar
// @namespace    http://tampermonkey.net/
// @version      1.01
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

    const useLiClass = sidebarStyle;
    const liRow = `<li class="ind sb-row ${useLiClass}">`;

    const boosterCdSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
          <g xmlns="http://www.w3.org/2000/svg" transform="translate(-720 0)" clip-path="url(#clip34_1845_10698)">
            <path d="M724.648 15.755C723.858 15.755 722.778 15.155 721.818 14.195C721.198 13.565 720.708 12.875 720.448 12.235C720.168 11.525 720.198 10.955 720.528 10.625L727.208 3.945L732.068 8.805L725.388 15.485C725.208 15.665 724.958 15.755 724.648 15.755Z" fill="url(#paint157_linear_1845_10698)"/>
            <path d="M727.208 4.295L731.718 8.805L725.208 15.315C725.078 15.445 724.878 15.515 724.648 15.515C723.958 15.515 722.918 14.955 721.988 14.025C720.748 12.785 720.168 11.335 720.698 10.805L727.208 4.295ZM727.208 3.585L726.858 3.935L720.348 10.445C720.108 10.685 719.778 11.245 720.218 12.325C720.488 12.995 720.988 13.725 721.638 14.365C722.648 15.375 723.798 15.995 724.648 15.995C725.118 15.995 725.408 15.805 725.558 15.645L732.068 9.135L732.418 8.785L732.068 8.435L727.558 3.925L727.208 3.575V3.585Z" fill="#AAAAAA"/>
            <path d="M722.998 8.505L721.778 9.725C721.248 10.255 721.818 11.695 723.068 12.945C724.318 14.195 725.758 14.765 726.288 14.235L731.718 8.805L731.418 8.505H722.998Z" fill="url(#paint158_linear_1845_10698)"/>
            <path d="M727.008 9.505C729.217 9.505 731.008 9.05728 731.008 8.505C731.008 7.95272 729.217 7.505 727.008 7.505C724.799 7.505 723.008 7.95272 723.008 8.505C723.008 9.05728 724.799 9.505 727.008 9.505Z" fill="#C43534"/>
            <path d="M731.738 8.675C730.948 8.675 729.868 8.075 728.908 7.115C728.288 6.485 727.798 5.795 727.538 5.155C727.258 4.445 727.288 3.875 727.618 3.545C727.798 3.365 728.048 3.275 728.358 3.275C729.148 3.275 730.228 3.875 731.188 4.835C732.568 6.225 733.128 7.755 732.478 8.405C732.298 8.585 732.048 8.675 731.738 8.675Z" fill="url(#paint159_radial_1845_10698)"/>
            <path d="M728.348 3.515C729.038 3.515 730.078 4.075 731.008 5.005C732.248 6.245 732.828 7.695 732.298 8.225C732.168 8.355 731.968 8.425 731.738 8.425C731.048 8.425 730.008 7.865 729.078 6.935C727.838 5.695 727.258 4.245 727.788 3.715C727.918 3.585 728.118 3.515 728.348 3.515ZM728.348 3.015C727.878 3.015 727.588 3.205 727.438 3.365C727.198 3.605 726.868 4.165 727.308 5.245C727.578 5.915 728.078 6.645 728.728 7.285C729.738 8.295 730.888 8.915 731.738 8.915C732.208 8.915 732.498 8.725 732.648 8.565C732.888 8.325 733.218 7.765 732.778 6.685C732.508 6.015 732.008 5.285 731.358 4.645C730.348 3.635 729.198 3.015 728.348 3.015Z" fill="#AAAAAA"/>
            <path d="M731.869 6.165C731.499 6.165 730.989 5.895 730.549 5.455C729.979 4.885 729.609 4.105 729.999 3.725L732.839 0.885L735.129 3.165L732.289 6.005C732.219 6.075 732.089 6.165 731.869 6.165Z" fill="url(#paint160_radial_1845_10698)"/>
            <path d="M732.849 1.235L734.779 3.165L732.119 5.825C732.059 5.885 731.979 5.915 731.879 5.915C731.579 5.915 731.139 5.675 730.739 5.275C730.209 4.745 729.959 4.125 730.189 3.895L732.849 1.235ZM732.849 0.535L732.499 0.885L729.839 3.545C729.389 3.995 729.619 4.855 730.389 5.635C730.879 6.125 731.439 6.415 731.879 6.415C732.179 6.415 732.369 6.285 732.469 6.185L735.129 3.525L735.479 3.175L735.129 2.825L733.199 0.895L732.849 0.545V0.535Z" fill="#AAAAAA"/>
            <path d="M735.179 2.855C734.809 2.855 734.299 2.585 733.859 2.145C733.579 1.865 733.359 1.545 733.239 1.255C733.049 0.775 733.199 0.515 733.309 0.405C733.379 0.335 733.509 0.245 733.729 0.245C734.099 0.245 734.609 0.515 735.049 0.955C735.329 1.235 735.549 1.555 735.669 1.845C735.859 2.325 735.709 2.585 735.599 2.695C735.529 2.765 735.399 2.855 735.179 2.855Z" fill="#888888"/>
            <path d="M733.729 0.505C734.029 0.505 734.469 0.745 734.869 1.145C735.399 1.675 735.649 2.295 735.419 2.525C735.359 2.585 735.279 2.615 735.179 2.615C734.879 2.615 734.439 2.375 734.039 1.975C733.509 1.445 733.259 0.825 733.489 0.595C733.549 0.535 733.629 0.505 733.729 0.505ZM733.729 0.00500011C733.429 0.00500011 733.239 0.135 733.139 0.235C732.989 0.385 732.769 0.735 733.019 1.345C733.149 1.665 733.389 2.015 733.689 2.315C734.179 2.805 734.739 3.095 735.179 3.095C735.479 3.095 735.669 2.965 735.769 2.865C736.219 2.415 735.989 1.555 735.219 0.775C734.739 0.295 734.179 0.00500011 733.729 0.00500011Z" fill="#AAAAAA"/>
            <path d="M730.938 14.005H731.008V11.005H733.008V14.005H733.078L732.008 14.865L730.938 14.005Z" fill="#C9C13C"/>
            <path d="M732.508 11.505V13.825L732.008 14.225L731.508 13.825V11.505H732.508ZM733.508 10.505H730.508V13.505H729.508L732.008 15.505L734.508 13.505H733.508V10.505Z" fill="#C99339"/>
          </g>
        </svg>
    `;

    const medCdSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
        <g xmlns="http://www.w3.org/2000/svg" transform="translate(-835 0)"  clip-path="url(#clip40_1845_10698)">
            <path d="M839.5 13.575H839.57V10.575H841.57V13.575H841.65L840.57 14.435L839.5 13.575Z" fill="#D1A238"/>
            <path d="M841.07 11.075V13.395L840.57 13.795L840.07 13.395V11.075H841.07ZM842.07 10.075H839.07V13.075H838.07L840.57 15.075L843.07 13.075H842.07V10.075Z" fill="#C87944"/>
            <path d="M831.529 15.395C830.819 15.395 829.989 14.995 829.319 14.325C828.819 13.825 828.459 13.225 828.319 12.645C828.159 12.025 828.269 11.485 828.619 11.135C828.859 10.895 829.199 10.765 829.589 10.765C830.299 10.765 831.129 11.165 831.799 11.835C832.889 12.925 833.199 14.325 832.509 15.015C832.269 15.255 831.929 15.385 831.539 15.385L831.529 15.395Z" fill="url(#paint181_radial_1845_10698)"/>
            <path d="M829.59 11.025C830.21 11.025 830.98 11.385 831.62 12.025C832.6 13.005 832.91 14.265 832.33 14.855C832.13 15.055 831.85 15.145 831.53 15.145C830.91 15.145 830.14 14.785 829.5 14.145C828.52 13.165 828.21 11.905 828.79 11.315C828.99 11.115 829.27 11.025 829.59 11.025ZM829.59 10.525C829.13 10.525 828.73 10.675 828.44 10.965C828.03 11.375 827.9 12.005 828.08 12.705C828.24 13.325 828.62 13.965 829.15 14.495C829.87 15.215 830.76 15.645 831.54 15.645C832 15.645 832.4 15.495 832.69 15.205C833.48 14.415 833.17 12.855 831.98 11.665C831.26 10.945 830.37 10.515 829.59 10.515V10.525Z" fill="#AAAAAA"/>
            <path d="M830.919 13.435L830.209 12.725L833.039 9.905H834.449L830.919 13.435Z" fill="#AAAAAA"/>
            <path d="M835.07 11.855C834.36 11.855 833.53 11.455 832.86 10.785C832.36 10.285 832 9.685 831.86 9.105C831.7 8.485 831.809 7.945 832.159 7.605L837.45 2.315L841.34 6.205L836.05 11.495C835.81 11.735 835.47 11.865 835.08 11.865L835.07 11.855Z" fill="url(#paint182_radial_1845_10698)"/>
            <path d="M837.45 2.665L840.99 6.205C840.99 6.205 836.07 11.125 835.87 11.325C835.67 11.525 835.39 11.615 835.07 11.615C834.45 11.615 833.68 11.255 833.04 10.615C832.06 9.635 831.75 8.375 832.33 7.785C832.53 7.585 837.45 2.665 837.45 2.665ZM837.45 1.955L837.1 2.305L831.98 7.425C831.57 7.835 831.44 8.465 831.62 9.165C831.78 9.785 832.16 10.425 832.69 10.955C833.41 11.675 834.3 12.105 835.08 12.105C835.54 12.105 835.94 11.955 836.23 11.665L841.35 6.545L841.7 6.195L841.35 5.845L837.81 2.305L837.46 1.955H837.45Z" fill="#AAAAAA"/>
            <path d="M840.979 6.195L837.439 2.655C837.439 2.655 832.519 7.575 832.319 7.775C831.729 8.365 832.049 9.625 833.029 10.605C834.009 11.585 835.269 11.895 835.859 11.315C836.059 11.115 840.979 6.195 840.979 6.195Z" fill="url(#paint183_linear_1845_10698)"/>
            <path d="M840.73 6.205C840.02 6.205 839.19 5.805 838.52 5.135C838.02 4.635 837.66 4.035 837.52 3.455C837.36 2.835 837.47 2.295 837.82 1.945C838.06 1.705 838.4 1.575 838.79 1.575C839.5 1.575 840.33 1.975 841 2.645C842.09 3.735 842.4 5.135 841.71 5.825C841.47 6.065 841.13 6.195 840.74 6.195L840.73 6.205Z" fill="url(#paint184_radial_1845_10698)"/>
            <path d="M838.78 1.825C839.4 1.825 840.17 2.185 840.81 2.825C841.79 3.805 842.1 5.065 841.52 5.655C841.32 5.855 841.04 5.945 840.72 5.945C840.1 5.945 839.33 5.585 838.69 4.945C837.71 3.965 837.4 2.705 837.98 2.115C838.18 1.915 838.46 1.825 838.78 1.825ZM838.78 1.325C838.32 1.325 837.92 1.475 837.63 1.765C837.22 2.175 837.09 2.805 837.27 3.505C837.43 4.125 837.81 4.765 838.34 5.295C839.06 6.015 839.95 6.445 840.73 6.445C841.19 6.445 841.59 6.295 841.88 6.005C842.67 5.215 842.36 3.655 841.17 2.465C840.45 1.745 839.56 1.315 838.78 1.315V1.325Z" fill="#AAAAAA"/>
            <path d="M840.46 3.895L839.75 3.185L842.58 0.355H844L840.46 3.895Z" fill="#AAAAAA"/>
        </g>
        </svg>
    `;

    const sidebar = `
        <div id="sidebarroot" class="xedx-locked">
            <!-- div id="sb-icons">
                <span class="icons border-dbg">
                    ${boosterCdSvg}
                </span>
                <span class="icons border-dbg">
                    ${medCdSvg}
                </span>
            </div -->
            <div id="sidebar-content">
                <div id="sb-link-list"  class="sb-area ${useLiClass}">

                    <!------------------------ Links in the city ----------------------->
                    <li id="city-links" class="sb-row-root sb-header">City
                        <span class="sb-caret"><i class="fa fa-caret-down" data-target="nav-city"></i></span>
                    </li>

                    <ul id="nav-city" class="sb-area ${useLiClass}">
                        ${liRow}<a href="/Town/ArmedSurplus">Armed Surplus</a></li>
                        ${liRow}<a href="/Town/Pharmacy">Alberto's Pharmacy</a></li>
                        ${liRow}<a href="/Market">La Paz Market</a></li>
                        ${liRow}<a href="/Town/Mateos">Mateo's Antiques</a></li>
                        ${liRow}<a href="/Casino">Casino</a></li>
                        ${liRow}<a href="/PetShop">Victor's Pet Shop</a></li>
                        ${liRow}<a href="/Town/EstateAgent">Estate Agent</a></li>
                        ${liRow}<a href="/Hospital">Hospital</a></li>
                        ${liRow}<a href="/Jail">San Pedro Prison</a></li>
                        ${liRow}<a href="/Bank">Bank</a></li>
                        ${liRow}<a href="/Town/Diablos">Diablo's</a></li>
                        ${liRow}<a href="/Town/DrugDen">Drug Den</a></li>
                        ${liRow}<a href="/Bounty">Winston's Bounties</a></li>
                        ${liRow}<a href="/Town/Club">Julio's Club</a></li>
                        ${liRow}<a href="/Town/Dealership">Car Dealership</a></li>
                        ${liRow}<a href="/Town/Construction">Carlo's Construction</a></li>
                        ${liRow}<a href="/Town/PoliceAuction">Police Auction</a></li>
                        ${liRow}<a href="/Church">Church</a></li>
                    </ul>

                    <li class="dummy-row"></li>

                    <!------------------------ Links in the Casino ----------------------->
                    <li id="casino-links" class="sb-row-root sb-header">Casino
                        <span class="sb-caret"><i class="fa fa-caret-down" data-target="nav-casino"></i></span>
                    </li>

                    <ul id="nav-casino" class="sb-area ${useLiClass}">
                        ${liRow}<a href="/Casino/Spinner">Spin The Wheel</a></li>
                        ${liRow}<a href="Casino/Pot-O-Plata">Pot O' Plata</a></li>
                        ${liRow}<a href="/Casino/Lottery">Lottery</a></li>
                    </ul>

                    <li class="dummy-row"></li>

                    <!------------------------ Links in the Market ----------------------->
                    <li id="market-links" class="sb-row-root sb-header">Market
                        <span class="sb-caret"><i class="fa fa-caret-down" data-target="nav-market"></i></span>
                    </li>
                    <ul id="nav-market" class="sb-area ${useLiClass}">
                        ${liRow}<a href="/Market?sort=price&dir=asc&p=Luxury">Luxury</a></li>
                        ${liRow}<a href="/Market?sort=price&dir=asc&p=Weapon">Weapons</a></li>
                        ${liRow}<a href="/Market?sort=price&dir=asc&p=Enhancement">Enhancements</a></li>
                        ${liRow}<a href="/Market?sort=price&dir=asc&p=Car">Cars</a></li>
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

    function hashChangeHandler() {
        debug("[hashChangeHandler]: ", location.href);
        callOnContentLoaded(handlePageLoad);
    }

    function pushStateChanged(e) {
        debug("[pushStateChanged]: ", location.href);
        callOnContentLoaded(handlePageLoad);
    }

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

        // Add event handlers
        // $('#sb-addpage').on('click', handleAddPage);
        // $('#sb-rempage').on('click', handleRemovePage);
        // $('#sb-favedit').on('click', handleEditFaves);

        $(".fa").on('click', handleCaret);

        //$('.dropdown-options li.faveLink').on('click', handleFavoriteClick);

        function handleCaret(e) {
            let targetId = $(this).attr("data-target");
            let target = document.getElementById(targetId);

            debug("[ceSidebar][handleCaret] ", targetId, $(this), $(target));
            $(target).slideToggle("slow");
            $(this).toggleClass('fa-caret-down fa-caret-right');
        }




    }

    function handlePageLoad(retries=0) {

        installSidebarContents();
    }

    //////////////////////////////////////////////////////////////////////
    // Main.
    //////////////////////////////////////////////////////////////////////

    logScriptStart();

    if ($("#sidebarroot").length > 0) return log("Sidebar already exists!");

    addStyles();

    installSidebarContents();

    callOnHashChange(hashChangeHandler);
    installPushStateHandler(pushStateChanged);

    //callOnContentLoaded(handlePageLoad);


    // Add any styles here
    function addStyles() {
        GM_addStyle(`
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
                border-radius: 4px;
                margin: 1px 0px 1px 0px !important;
                padding: 0px 0px 0px 0px !important;
                border-top: 1px solid #8888;
            }
            #sidebarroot li.rnd-btn-3:hover {
                transform: translate(1px, 1px);
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




