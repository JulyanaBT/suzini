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

    margin:12px 0 4px;

    color:#999;

    font-size:9px;

    font-style:italic;

    font-weight:600;

    text-align:center;
  }


  .support-note-heart{

    color:#e53935;

    font-style:normal;
  }

`;

document.head.appendChild(style);


/* ========================================
   INITIALISATION
======================================== */

insertSupportNote();
