// assets/js/admin-session.js


/* ==============================
   CONFIGURATION
============================== */

const ADMIN_STORAGE_KEY =
  "suziniBtAdmin";


const ADMIN_PASSWORD =
  "Mel@nie.28";


/* ==============================
   ÉTAT DE LA SESSION
============================== */

export function isAdminConnected(){

  return (
    localStorage.getItem(
      ADMIN_STORAGE_KEY
    ) === "true"
  );

}


/* ==============================
   CONNEXION
============================== */

export function loginAdmin(password){

  if(password !== ADMIN_PASSWORD){

    return false;

  }


  localStorage.setItem(
    ADMIN_STORAGE_KEY,
    "true"
  );


  return true;

}


/* ==============================
   DÉCONNEXION
============================== */

export function logoutAdmin(){

  localStorage.removeItem(
    ADMIN_STORAGE_KEY
  );

}


/* ==============================
   PROTECTION DES PAGES ADMIN
============================== */

export function requireAdmin(){

  if(isAdminConnected()){

    return true;

  }


  window.location.href =
    "index.html";


  return false;

}


/* ==============================
   ACCÈS AUX OUTILS ADMIN
============================== */

export function canAccessAdmin(){

  return isAdminConnected();

}
