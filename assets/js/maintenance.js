// assets/js/maintenance-guard.js


/* ==========================================
   FIREBASE
========================================== */

import {
  db
} from "./firebase.js";


import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* ==========================================
   SESSION ADMIN
========================================== */

import {
  isAdminConnected
} from "./admin-session.js";


/* ==========================================
   CONFIGURATION
========================================== */

const EVENT_ID =
  "suzini-bt250-mixte-2026-10-02";


const DEFAULT_MESSAGE =
  "Page momentanément en maintenance. Merci de revenir dans quelques minutes.";


const maintenanceRef =
  doc(
    db,
    "events",
    EVENT_ID,
    "config",
    "maintenance"
  );


/* ==========================================
   PAGE COURANTE
========================================== */

function getPageKey(){

  /*
   * On utilise en priorité data-page.
   *
   * Exemples :
   *
   * index.html
   * <body data-page="accueil">
   *
   * inscriptions.html
   * <body data-page="inscription">
   *
   * participants.html
   * <body data-page="participants">
   */


  const page =
    document.body.dataset.page;


  const mapping = {

    accueil:
      "index",

    inscription:
      "inscriptions",

    inscriptions:
      "inscriptions",

    participants:
      "participants",

    programmation:
      "programmation",

    classement:
      "classement",

    tirage:
      "tirage"

  };


  if(
    page &&
    mapping[page]
  ){

    return mapping[page];

  }


  /*
   * Sécurité :
   * si data-page manque,
   * on utilise le nom du fichier.
   */


  const pathname =
    window.location.pathname
      .replace(/\/+$/, "");


  const file =
    pathname
      .split("/")
      .filter(Boolean)
      .at(-1) ||
    "index.html";


  if(
    !file.includes(".")
  ){

    return "index";

  }


  const name =
    file.replace(
      /\.html$/i,
      ""
    );


  return name || "index";

}


/* ==========================================
   ÉCHAPPEMENT HTML
========================================== */

function esc(value){

  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}


/* ==========================================
   ÉCRAN MAINTENANCE
========================================== */

function showMaintenance(message){

  /*
   * On masque immédiatement
   * le contenu existant.
   */

  document.body.innerHTML = `

    <main
      style="
        min-height:100vh;

        display:flex;
        align-items:center;
        justify-content:center;

        padding:24px;

        font-family:
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          Roboto,
          Arial,
          sans-serif;

        background:
          radial-gradient(
            circle at 10% 0%,
            rgba(255,216,77,.35),
            transparent 28%
          ),
          radial-gradient(
            circle at 90% 8%,
            rgba(255,62,138,.22),
            transparent 26%
          ),
          linear-gradient(
            180deg,
            #18b8ff 0%,
            #8ff4ee 42%,
            #fff6d7 100%
          );

        color:#102033;
      "
    >

      <section
        style="
          width:min(520px,100%);

          padding:26px 22px;

          border-radius:28px;

          background:
            rgba(255,255,255,.95);

          box-shadow:
            0 18px 44px
            rgba(16,24,40,.16);

          text-align:center;
        "
      >


        <div
          style="
            font-size:48px;
            line-height:1;
            margin-bottom:12px;
          "
        >
          🔧
        </div>


        <h1
          style="
            margin:0;

            color:#063b72;

            font-size:32px;
            line-height:1;
            font-weight:1000;

            letter-spacing:-.04em;
          "
        >
          Maintenance
        </h1>


        <p
          style="
            margin:16px 0 0;

            color:#475467;

            font-size:16px;
            line-height:1.45;
            font-weight:800;
          "
        >
          ${esc(message)}
        </p>


        <div
          style="
            margin-top:20px;

            padding:12px 14px;

            border-radius:18px;

            background:#fff7d6;
            color:#102033;

            font-size:14px;
            font-weight:1000;
          "
        >
          BT250 Suzini — Double Mixte
          <br>
          02 octobre 2026
        </div>


      </section>

    </main>

  `;

}


/* ==========================================
   VÉRIFICATION
========================================== */

async function checkMaintenance(){

  /*
   * Un appareil connecté à l'admin
   * peut toujours consulter le site.
   */

  if(
    isAdminConnected()
  ){

    return;

  }


  const pageKey =
    getPageKey();


  try{

    const snapshot =
      await getDoc(
        maintenanceRef
      );


    /*
     * Aucune configuration :
     * site accessible.
     */

    if(
      !snapshot.exists()
    ){

      return;

    }


    const data =
      snapshot.data() || {};


    /*
     * Maintenance générale désactivée.
     */

    if(
      data.enabled !== true
    ){

      return;

    }


    /*
     * Vérifie uniquement
     * la page actuelle.
     */

    const pageBlocked =
      data.pages?.[
        pageKey
      ] === true;


    if(
      !pageBlocked
    ){

      return;

    }


    showMaintenance(

      data.message ||
      DEFAULT_MESSAGE

    );

  }

  catch(error){

    /*
     * En cas d'erreur Firestore,
     * on ne bloque pas le site.
     */

    console.error(
      "Erreur maintenance :",
      error
    );

  }

}


/* ==========================================
   INITIALISATION
========================================== */

checkMaintenance();
