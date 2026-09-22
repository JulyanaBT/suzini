/* ========================================
   MENTION DE SUPPORT

   Modifier uniquement ce fichier pour
   changer la mention sur tout le site.
======================================== */


/* ========================================
   CRÉATION
======================================== */

function createSupportNote(){

  const note =
    document.createElement("div");

  note.className =
    "support-note";

  note.innerHTML = `
    I
    <span class="support-note-heart">♥</span>
    Marine
  `;

  return note;
}


/* ========================================
   AJOUT AUTOMATIQUE
======================================== */

function insertSupportNote(){

  const main =
    document.querySelector("main");

  if(!main){
    return;
  }


  /* Évite les doublons */

  if(
    document.querySelector(
      ".support-note"
    )
  ){
    return;
  }


  main.appendChild(
    createSupportNote()
  );

}


/* ========================================
   STYLE
======================================== */

const style =
  document.createElement("style");

style.textContent = `

  .support-note{

    margin:9px 0 2px;

    color:#b8b8b8;

    font-size:7px;

    font-style:italic;

    font-weight:400;

    letter-spacing:.15px;

    text-align:center;

    opacity:.75;
  }


  .support-note-heart{

    color:#d98b8b;

    font-style:normal;
  }

`;

document.head.appendChild(style);


/* ========================================
   INITIALISATION
======================================== */

insertSupportNote();
