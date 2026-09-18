// assets/js/header-tournament.js


/* ========================================
   HEADER TOURNOI
======================================== */

const header =
  document.getElementById(
    "siteHeader"
  );


if(header){

  const currentPage =
    document.body.dataset.page || "";


  const tournamentTitle =
    document.body.dataset.title ||
    "BT250 Suzini — Double Mixte";


  const tournamentDate =
    document.body.dataset.date ||
    "02 octobre 2026";


  /* ======================================
     NAVIGATION
  ====================================== */

  const navigation = [

    {
      id: "accueil",
      label: "Accueil",
      href: "index.html"
    },

    {
      id: "inscription",
      label: "Inscription",
      href: "inscriptions.html"
    },

    {
      id: "participants",
      label: "Équipes",
      href: "participants.html"
    },

    {
      id: "programmation",
      label: "Programmation",
      href: "programmation.html"
    },

    {
      id: "classement",
      label: "Classement",
      href: "classement.html"
    },

    {
      id: "tirage",
      label: "Tirage",
      href: "tirage.html"
    }

  ];


  /* ======================================
     CONSTRUCTION DU HEADER
  ====================================== */

  header.innerHTML = `

    <header class="tournament-header">

      <div class="tournament-header-main">


        <!-- SUZINI -->

        <a
          href="index.html"
          class="tournament-header-logo"
          aria-label="Accueil du tournoi"
        >

          <img
            src="assets/img/blason-suzini.png"
            alt="TC Suzini"
          >

        </a>


        <!-- TITRE -->

        <div class="tournament-header-title">

          <div class="tournament-header-name">
            ${tournamentTitle}
          </div>

          <div class="tournament-header-date">
            ${tournamentDate}
          </div>

        </div>


        <!-- JUL'YANA / ADMIN -->

        <a
          href="admin/index.html"
          class="tournament-header-logo"
          aria-label="Administration"
        >

          <img
            src="assets/img/logo-julyana-bt.png"
            alt="Jul’Yana Beach Tennis"
          >

        </a>


      </div>


      <!-- NAVIGATION -->

      <div class="tournament-nav-wrap">

        <div
          class="tournament-scroll-hint left"
          aria-hidden="true"
        >
          ‹
        </div>


        <nav
          class="tournament-nav"
          aria-label="Navigation du tournoi"
        >

          ${navigation
            .map(item => `

              <a
                href="${item.href}"
                class="${
                  item.id === currentPage
                    ? "active"
                    : ""
                }"
              >
                ${item.label}
              </a>

            `)
            .join("")
          }

        </nav>


        <div
          class="tournament-scroll-hint right"
          aria-hidden="true"
        >
          ›
        </div>

      </div>

    </header>

  `;


  /* ======================================
     NAVIGATION HORIZONTALE
  ====================================== */

  const nav =
    header.querySelector(
      ".tournament-nav"
    );


  const leftHint =
    header.querySelector(
      ".tournament-scroll-hint.left"
    );


  const rightHint =
    header.querySelector(
      ".tournament-scroll-hint.right"
    );


  function updateScrollHints(){

    if(!nav){
      return;
    }


    const maxScroll =
      nav.scrollWidth -
      nav.clientWidth;


    if(leftHint){

      leftHint.style.opacity =
        nav.scrollLeft > 8
          ? "1"
          : "0";

    }


    if(rightHint){

      rightHint.style.opacity =
        nav.scrollLeft <
        maxScroll - 8
          ? "1"
          : "0";

    }

  }


  if(nav){

    nav.addEventListener(
      "scroll",
      updateScrollHints,
      {
        passive: true
      }
    );


    window.addEventListener(
      "resize",
      updateScrollHints
    );


    requestAnimationFrame(
      () => {

        const active =
          nav.querySelector(
            ".active"
          );


        if(active){

          active.scrollIntoView({
            behavior: "auto",
            block: "nearest",
            inline: "center"
          });

        }


        updateScrollHints();

      }
    );

  }

}
