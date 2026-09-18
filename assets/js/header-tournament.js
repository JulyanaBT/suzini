// assets/js/header-tournament.js

import { auth } from "./firebase.js";
import { getRoleByUid } from "./session.js";


/* ==============================
   CONFIGURATION PAGE
============================== */

const header =
  document.getElementById("siteHeader");

const page =
  document.body.dataset.page || "accueil";

const title =
  document.body.dataset.title || "BT250 Suzini";

const date =
  document.body.dataset.date || "";


/* ==============================
   NAVIGATION PUBLIQUE
============================== */

const navItems = [

  {
    key: "accueil",
    label: "Accueil",
    href: "index.html",
    icon: "🏠"
  },

  {
    key: "inscription",
    label: "Inscription",
    href: "inscriptions.html",
    icon: "📝"
  },

  {
    key: "participants",
    label: "Équipes",
    href: "participants.html",
    icon: "👥"
  },

  {
    key: "programmation",
    label: "Programmation",
    href: "programmation.html",
    icon: "📋"
  },

  {
    key: "classement",
    label: "Classement",
    href: "classement.html",
    icon: "🏆"
  },

  {
    key: "tirage",
    label: "Tirage",
    href: "tirage.html",
    icon: "🎲"
  }

];


/* ==============================
   CRÉATION DU HEADER
============================== */

if(header){

  header.innerHTML = `

    <header class="tournament-header">

      <div class="tournament-header-main">


        <!-- LOGO SUZINI -->

        <a
          href="index.html"
          aria-label="Accueil du tournoi"
        >

          <img
            class="tournament-header-logo"
            src="assets/img/blason-suzini.png"
            alt="TC Suzini"
          >

        </a>


        <!-- TITRE -->

        <div class="tournament-header-title">

          <div class="tournament-header-name">
            ${title}
          </div>

          <div class="tournament-header-date">
            ${date}
          </div>

        </div>


        <!-- LOGO JUL'YANA -->

        <a
          href="#"
          id="julyanaSwitch"
          aria-label="Accéder à l'administration"
        >

          <img
            class="tournament-header-logo"
            src="assets/img/logo-julyana-bt.png"
            alt="Jul'Yana Beach Tennis"
          >

        </a>


      </div>


      <!-- NAVIGATION -->

      <div class="tournament-nav-wrap">

        <span
          class="tournament-scroll-hint left"
          id="hintLeft"
        >
          ‹
        </span>


        <nav
          class="tournament-nav"
          id="tournamentNav"
        >

          ${navItems.map(item => `

            <a
              class="${page === item.key ? "active" : ""}"
              href="${item.href}"
            >

              ${item.icon}

              <strong>
                ${item.label}
              </strong>

            </a>

          `).join("")}

        </nav>


        <span
          class="tournament-scroll-hint right"
          id="hintRight"
        >
          ›
        </span>

      </div>

    </header>

  `;

}


/* ==============================
   ÉLÉMENTS
============================== */

const nav =
  document.getElementById("tournamentNav");

const left =
  document.getElementById("hintLeft");

const right =
  document.getElementById("hintRight");

const julyanaSwitch =
  document.getElementById("julyanaSwitch");


/* ==============================
   ACCÈS ADMIN
============================== */

async function canSwitchToAdmin(){

  if(!auth.currentUser){
    return false;
  }

  const role =
    await getRoleByUid(
      auth.currentUser.uid
    );

  return [
    "admin",
    "jat",
    "arbitre"
  ].includes(role);

}


/* ==============================
   PAGE ADMIN CORRESPONDANTE
============================== */

function adminTargetForPage(){

  const adminPages = {

    accueil:
      "index.html",

    inscription:
      "inscriptions.html",

    participants:
      "participants.html",

    programmation:
      "programmation.html",

    classement:
      "classement.html",

    tirage:
      "tirage.html"

  };


  const target =
    adminPages[page] || "index.html";


  return `admin/${target}`;

}


/* ==============================
   BASCULE JUL'YANA → ADMIN
============================== */

if(julyanaSwitch){

  julyanaSwitch.addEventListener(
    "click",
    async (event) => {

      event.preventDefault();


      const allowed =
        await canSwitchToAdmin();


      if(!allowed){
        return;
      }


      window.location.href =
        adminTargetForPage();

    }
  );

}


/* ==============================
   INDICATEURS DE DÉFILEMENT
============================== */

function updateHints(){

  if(!nav || !left || !right){
    return;
  }


  const max =
    nav.scrollWidth
    - nav.clientWidth;


  if(max < 5){

    left.style.opacity = 0;
    right.style.opacity = 0;

    return;

  }


  left.style.opacity =
    nav.scrollLeft > 5
      ? 1
      : 0;


  right.style.opacity =
    nav.scrollLeft < max - 5
      ? 1
      : 0;

}


/* ==============================
   CENTRER L'ONGLET ACTIF
============================== */

function centerActiveTab(){

  if(!nav){
    return;
  }


  const active =
    nav.querySelector("a.active");


  if(!active){
    return;
  }


  const target =

    active.offsetLeft

    - (nav.clientWidth / 2)

    + (active.clientWidth / 2);


  const max =
    nav.scrollWidth
    - nav.clientWidth;


  nav.scrollTo({

    left:
      Math.max(
        0,
        Math.min(target, max)
      ),

    behavior: "instant"

  });

}


/* ==============================
   RAFRAÎCHISSEMENT NAV
============================== */

function refreshNav(){

  centerActiveTab();

  updateHints();

}


/* ==============================
   ÉVÉNEMENTS
============================== */

if(nav){

  nav.addEventListener(
    "scroll",
    updateHints
  );

}


window.addEventListener(
  "resize",
  refreshNav
);


window.addEventListener(
  "orientationchange",
  refreshNav
);


window.addEventListener(
  "load",
  () => {

    refreshNav();

    setTimeout(
      refreshNav,
      150
    );

  }
);


setTimeout(
  refreshNav,
  50
);


setTimeout(
  refreshNav,
  150
);


setTimeout(
  refreshNav,
  400
);
