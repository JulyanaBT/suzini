// assets/js/admin-header.js


import {
  isAdminConnected
} from "./admin-session.js";


/* ========================================
   CIBLE DU HEADER
======================================== */

const headerTarget =
  document.getElementById(
    "siteHeader"
  );


if(!headerTarget){

  throw new Error(
    "Élément #siteHeader introuvable."
  );

}


/* ========================================
   PROTECTION INTERFACE ADMIN
======================================== */

const currentPath =
  window.location.pathname;


const isAdminHome =
  currentPath.endsWith("/admin/") ||
  currentPath.endsWith("/admin/index.html");


if(
  !isAdminConnected() &&
  !isAdminHome
){

  window.location.href =
    "index.html";

}


/* ========================================
   PAGE ACTUELLE
======================================== */

const currentPage =
  document.body.dataset.page ||
  "accueil";


/* ========================================
   CORRESPONDANCE ADMIN → PUBLIC
======================================== */

const publicPages = {

  accueil:
    "../index.html",

  inscriptions:
    "../inscriptions.html",

  inscription:
    "../inscriptions.html",

  participants:
    "../participants.html",

  tirage:
    "../tirage.html",

  programmation:
    "../programmation.html",

  classement:
    "../classement.html",

  parametres:
    "../index.html",

  maintenance:
    "../index.html"

};


const publicTarget =
  publicPages[currentPage] ||
  "../index.html";


/* ========================================
   STYLES NAVIGATION ADMIN
======================================== */

const navStyle =
  document.createElement(
    "style"
  );


navStyle.textContent = `

  /*
   * HEADER ADMIN
   */

  #siteHeader
  .admin-header {

    background: #101010;

    border-bottom:
      2px solid var(--orange);

  }


  #siteHeader
  .admin-header
  .header-top {

    background: #101010;

  }


  #siteHeader
  .admin-header
  .header-event span {

    color: var(--orange);

  }


  #siteHeader
  .admin-header
  .header-event strong {

    color: white;

  }


  /*
   * NAVIGATION
   */

  #siteHeader
  .admin-header
  .main-nav-shell {

    position: relative;

    width: 100%;

    overflow: hidden;

    background: #101010;

  }


  #siteHeader
  .admin-header
  .main-nav {

    display: flex !important;

    flex-direction: row !important;

    flex-wrap: nowrap !important;

    align-items: stretch;

    justify-content: flex-start !important;

    gap: 4px;

    width: 100%;

    max-width: 100%;

    box-sizing: border-box;

    overflow-x: auto !important;

    overflow-y: hidden !important;

    padding:
      5px 28px
      6px 28px;

    scroll-behavior: smooth;

    scrollbar-width: none;

    -webkit-overflow-scrolling:
      touch;

    overscroll-behavior-x:
      contain;

  }


  #siteHeader
  .admin-header
  .main-nav::-webkit-scrollbar {

    display: none;

  }


  #siteHeader
  .admin-header
  .main-nav > a {

    flex:
      0 0 auto !important;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    min-width: 78px;

    width: auto !important;

    white-space: nowrap;

    box-sizing: border-box;

    color: #aaa;

  }


  #siteHeader
  .admin-header
  .main-nav > a.active {

    color: var(--orange);

  }


  #siteHeader
  .admin-header
  .main-nav .nav-icon {

    flex: 0 0 auto;

  }


  #siteHeader
  .admin-header
  .main-nav .nav-label {

    display: block;

    white-space: nowrap;

  }


  /*
   * LOGO JUL'YANA
   *
   * En mode admin, le logo permet
   * de revenir à la page publique
   * correspondante.
   */

  #siteHeader
  .admin-header
  .admin-public-switch {

    cursor: pointer;

    -webkit-tap-highlight-color:
      transparent;

  }


  /*
   * FLÈCHES DE NAVIGATION
   */

  #siteHeader
  .admin-header
  .nav-scroll-arrow {

    position: absolute;

    z-index: 30;

    top: 50%;

    transform:
      translateY(-50%);

    display: flex;

    align-items: center;

    justify-content: center;

    width: 25px;

    height: 38px;

    padding: 0;

    border: 0;

    background:
      rgba(16,16,16,.94);

    color: white;

    font-size: 25px;

    font-weight: 1000;

    line-height: 1;

    cursor: pointer;

  }


  #siteHeader
  .admin-header
  .nav-scroll-arrow[hidden] {

    display: none !important;

  }


  #siteHeader
  .admin-header
  .nav-scroll-left {

    left: 0;

    background:
      linear-gradient(
        90deg,
        #101010 60%,
        rgba(16,16,16,.80)
      );

  }


  #siteHeader
  .admin-header
  .nav-scroll-right {

    right: 0;

    background:
      linear-gradient(
        270deg,
        #101010 60%,
        rgba(16,16,16,.80)
      );

  }

`;


document.head.appendChild(
  navStyle
);


/* ========================================
   HEADER ADMIN
======================================== */

headerTarget.innerHTML = `

  <header class="site-header admin-header">


    <div class="header-top">


      <!-- LOGO SUZINI -->

      <a
        href="index.html"
        class="header-logo"
        aria-label="Accueil administration"
      >

        <img
          src="../assets/img/blason-suzini.png"
          alt="TC Suzini"
        >

      </a>


      <!-- TITRE -->

      <div class="header-event">

        <span>
          MODE ORGANISATEUR
        </span>

        <strong>
          BT250 - Double Mixte
        </strong>

      </div>


      <!-- BASCULE VERS LE PUBLIC -->

      <a
        href="${publicTarget}"
        class="
          header-logo
          header-logo-right
          admin-public-switch
        "
        aria-label="Passer au site public"
        title="Passer au site public"
      >

        <img
          src="../assets/img/logo-julyana-bt.png"
          alt="Jul'Yana Beach Tennis"
        >

      </a>


    </div>


    <!-- ==================================
         NAVIGATION ADMIN
    =================================== -->

    <div class="main-nav-shell">


      <button
        type="button"
        class="
          nav-scroll-arrow
          nav-scroll-left
        "
        aria-label="Voir les onglets précédents"
        hidden
      >
        ‹
      </button>


      <nav class="main-nav">


        <a
          href="index.html"
          data-nav="accueil"
        >

          <span class="nav-icon">
            🏠
          </span>

          <span class="nav-label">
            Accueil
          </span>

        </a>


        <a
          href="inscriptions.html"
          data-nav="inscriptions"
        >

          <span class="nav-icon">
            ✍️
          </span>

          <span class="nav-label">
            Inscriptions
          </span>

        </a>


        <a
          href="participants.html"
          data-nav="participants"
        >

          <span class="nav-icon">
            👥
          </span>

          <span class="nav-label">
            Équipes
          </span>

        </a>


        <a
          href="tirage.html"
          data-nav="tirage"
        >

          <span class="nav-icon">
            🎲
          </span>

          <span class="nav-label">
            Tirage
          </span>

        </a>


        <a
          href="programmation.html"
          data-nav="programmation"
        >

          <span class="nav-icon">
            🎾
          </span>

          <span class="nav-label">
            Matchs
          </span>

        </a>


        <a
          href="classement.html"
          data-nav="classement"
        >

          <span class="nav-icon">
            🏆
          </span>

          <span class="nav-label">
            Classement
          </span>

        </a>


      </nav>


      <button
        type="button"
        class="
          nav-scroll-arrow
          nav-scroll-right
        "
        aria-label="Voir les onglets suivants"
        hidden
      >
        ›
      </button>


    </div>


  </header>

`;


/* ========================================
   ÉLÉMENTS NAVIGATION
======================================== */

const nav =
  headerTarget.querySelector(
    ".main-nav"
  );


const activeLink =
  currentPage
    ? headerTarget.querySelector(
        `[data-nav="${currentPage}"]`
      )
    : null;


const leftArrow =
  headerTarget.querySelector(
    ".nav-scroll-left"
  );


const rightArrow =
  headerTarget.querySelector(
    ".nav-scroll-right"
  );


/* ========================================
   ONGLET ACTIF
======================================== */

if(activeLink){

  activeLink.classList.add(
    "active"
  );

}


/* ========================================
   FLÈCHES
======================================== */

function updateNavArrows(){

  if(
    !nav ||
    !leftArrow ||
    !rightArrow
  ){

    return;

  }


  const maxScroll =
    nav.scrollWidth -
    nav.clientWidth;


  if(maxScroll <= 2){

    leftArrow.hidden =
      true;

    rightArrow.hidden =
      true;

    return;

  }


  leftArrow.hidden =
    nav.scrollLeft <= 2;


  rightArrow.hidden =
    nav.scrollLeft >=
    maxScroll - 2;

}


/* ========================================
   CENTRER L'ONGLET ACTIF
======================================== */

function centerActiveLink(){

  if(
    !nav ||
    !activeLink
  ){

    updateNavArrows();

    return;

  }


  const linkCenter =
    activeLink.offsetLeft +
    (
      activeLink.offsetWidth / 2
    );


  const targetScroll =
    linkCenter -
    (
      nav.clientWidth / 2
    );


  const maxScroll =
    Math.max(
      0,
      nav.scrollWidth -
      nav.clientWidth
    );


  const finalScroll =
    Math.min(
      Math.max(
        targetScroll,
        0
      ),
      maxScroll
    );


  nav.scrollLeft =
    finalScroll;


  updateNavArrows();

}


/* ========================================
   FLÈCHE GAUCHE
======================================== */

leftArrow?.addEventListener(
  "click",
  () => {

    nav.scrollBy({

      left:
        -(nav.clientWidth * .65),

      behavior:
        "smooth"

    });

  }
);


/* ========================================
   FLÈCHE DROITE
======================================== */

rightArrow?.addEventListener(
  "click",
  () => {

    nav.scrollBy({

      left:
        nav.clientWidth * .65,

      behavior:
        "smooth"

    });

  }
);


/* ========================================
   SCROLL TACTILE
======================================== */

nav?.addEventListener(
  "scroll",
  updateNavArrows,
  {
    passive:true
  }
);


/* ========================================
   REDIMENSIONNEMENT
======================================== */

window.addEventListener(
  "resize",
  centerActiveLink
);


/* ========================================
   INITIALISATION
======================================== */

requestAnimationFrame(
  () => {

    requestAnimationFrame(
      () => {

        centerActiveLink();

        updateNavArrows();

      }
    );

  }
);
