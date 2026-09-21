/* =========================================================
   SUZINI — BT250 DOUBLE MIXTE
   Header public du tournoi
========================================================= */

import {
  isAdminConnected
} from "./admin-session.js";


/* =========================================================
   PAGE COURANTE
========================================================= */

const currentPage =
  document.body.dataset.page || "accueil";


/* =========================================================
   NAVIGATION PUBLIQUE
========================================================= */

const navItems = [

  {
    page: "accueil",
    label: "🏠 Accueil",
    href: "index.html"
  },

  {
    page: "inscription",
    label: "✍️ Inscription",
    href: "inscriptions.html"
  },

  {
    page: "participants",
    label: "👥 Équipes",
    href: "participants.html"
  },

  {
    page: "programmation",
    label: "🎾 Matchs",
    href: "programmation.html"
  },

  {
    page: "classement",
    label: "🏆 Classement",
    href: "classement.html"
  },

  {
    page: "infos",
    label: "ℹ️ Infos",
    href: "infos.html"
  }

];


/* =========================================================
   CORRESPONDANCE PUBLIC → ADMIN
========================================================= */

const adminPages = {

  accueil:
    "admin/index.html",

  inscription:
    "admin/inscriptions.html",

  inscriptions:
    "admin/inscriptions.html",

  participants:
    "admin/participants.html",

  programmation:
    "admin/programmation.html",

  classement:
    "admin/classement.html",

  tirage:
    "admin/tirage.html",

  infos:
    "admin/index.html"

};


/* =========================================================
   DESTINATION LOGO JUL'YANA
========================================================= */

function getJulyanaTarget(){

  /*
    Si l'appareil possède une session admin,
    le logo Jul'Yana permet d'accéder
    directement à la page admin correspondante.

    Sinon :
    direction vers la page de connexion admin.
  */

  if(!isAdminConnected()){

    return "admin/index.html";

  }


  return (
    adminPages[currentPage] ||
    "admin/index.html"
  );

}


/* =========================================================
   CONSTRUCTION DU MENU
========================================================= */

function buildNavigation(){

  return navItems
    .map(item => {

      const active =
        item.page === currentPage;


      return `
        <a
          href="${item.href}"
          class="nav-link${active ? " active" : ""}"
          data-nav="${item.page}"
          ${active ? 'aria-current="page"' : ""}
        >
          ${item.label}
        </a>
      `;

    })
    .join("");

}


/* =========================================================
   CONSTRUCTION DU HEADER
========================================================= */

function buildHeader(){

  const header =
    document.getElementById(
      "siteHeader"
    );


  if(!header){

    return;

  }


  const julyanaTarget =
    getJulyanaTarget();


  header.innerHTML = `

    <header class="site-header">


      <!-- =================================
           LIGNE PRINCIPALE
      ================================== -->

      <div class="header-top">


        <!-- SUZINI -->

        <a
          href="index.html"
          class="header-logo header-logo-left"
          aria-label="Accueil du tournoi"
        >

          <img
            src="assets/img/blason-suzini.png"
            alt="TC Suzini"
          >

        </a>


        <!-- TITRE -->

        <a
          href="index.html"
          class="header-event"
          aria-label="Accueil BT250 Double Mixte"
        >

          <span class="header-kicker">
            LES VENDREDIS DU BT SUZINI
          </span>

          <strong class="header-title">
            BT250 - Double Mixte
          </strong>

        </a>


        <!-- JUL'YANA -->

        <a
          href="${julyanaTarget}"
          class="header-logo header-logo-right"
          aria-label="${
            isAdminConnected()
              ? "Accéder à l'administration"
              : "Connexion organisateur"
          }"
        >

          <img
            src="assets/img/logo-julyana-bt.png"
            alt="Jul'Yana Beach Tennis"
          >

        </a>


      </div>


      <!-- =================================
           NAVIGATION
      ================================== -->

      <div class="main-nav-shell">


        <button
          class="nav-scroll-arrow nav-scroll-left"
          type="button"
          aria-label="Faire défiler le menu vers la gauche"
        >
          ‹
        </button>


        <nav
          class="main-nav"
          id="mainNav"
          aria-label="Navigation du tournoi"
        >

          ${buildNavigation()}

        </nav>


        <button
          class="nav-scroll-arrow nav-scroll-right"
          type="button"
          aria-label="Faire défiler le menu vers la droite"
        >
          ›
        </button>


      </div>


    </header>

  `;

}


/* =========================================================
   SCROLL NAVIGATION
========================================================= */

function setupNavigationScroll(){

  const nav =
    document.getElementById(
      "mainNav"
    );


  if(!nav){

    return;

  }


  const leftButton =
    document.querySelector(
      ".nav-scroll-left"
    );


  const rightButton =
    document.querySelector(
      ".nav-scroll-right"
    );


  /* ---------------------------------------------------------
     ÉTAT DES FLÈCHES
  --------------------------------------------------------- */

  function updateArrows(){

    const canScroll =
      nav.scrollWidth >
      nav.clientWidth + 2;


    if(!canScroll){

      leftButton?.classList.add(
        "hidden"
      );

      rightButton?.classList.add(
        "hidden"
      );

      return;

    }


    const atStart =
      nav.scrollLeft <= 3;


    const atEnd =
      nav.scrollLeft +
      nav.clientWidth >=
      nav.scrollWidth - 3;


    leftButton?.classList.toggle(
      "hidden",
      atStart
    );


    rightButton?.classList.toggle(
      "hidden",
      atEnd
    );

  }


  /* ---------------------------------------------------------
     FLÈCHE GAUCHE
  --------------------------------------------------------- */

  leftButton?.addEventListener(
    "click",
    () => {

      nav.scrollBy({

        left:
          -Math.max(
            nav.clientWidth * .65,
            150
          ),

        behavior:
          "smooth"

      });

    }
  );


  /* ---------------------------------------------------------
     FLÈCHE DROITE
  --------------------------------------------------------- */

  rightButton?.addEventListener(
    "click",
    () => {

      nav.scrollBy({

        left:
          Math.max(
            nav.clientWidth * .65,
            150
          ),

        behavior:
          "smooth"

      });

    }
  );


  nav.addEventListener(
    "scroll",
    updateArrows,
    {
      passive:true
    }
  );


  window.addEventListener(
    "resize",
    updateArrows
  );


  /* ---------------------------------------------------------
     CENTRAGE DE L'ONGLET ACTIF
  --------------------------------------------------------- */

  const activeLink =
    nav.querySelector(
      ".nav-link.active"
    );


  if(activeLink){

    requestAnimationFrame(
      () => {

        const target =
          activeLink.offsetLeft
          -
          (
            nav.clientWidth
            -
            activeLink.offsetWidth
          ) / 2;


        nav.scrollTo({

          left:
            Math.max(
              0,
              target
            ),

          behavior:
            "auto"

        });


        requestAnimationFrame(
          updateArrows
        );

      }
    );

  }

  else{

    updateArrows();

  }

}


/* =========================================================
   INITIALISATION
========================================================= */

function initHeader(){

  buildHeader();

  setupNavigationScroll();

}


if(
  document.readyState ===
  "loading"
){

  document.addEventListener(
    "DOMContentLoaded",
    initHeader
  );

}

else{

  initHeader();

}
