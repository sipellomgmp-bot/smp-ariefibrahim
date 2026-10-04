/**
 * menu-tambahan.js — menambah menu "Ganti Password" (semua role) dan
 * "Keterangan Siswa" (Operator, Super Admin, Wali Kelas) ke sidebar.
 * Pasang SATU baris sebelum </body> di setiap dashboard:
 *   <script src="../../assets/js/menu-tambahan.js"></script>
 */
(function () {
  "use strict";
  var user = {};
  try { user = JSON.parse(sessionStorage.getItem("smp_user") || "{}"); } catch (e) {}
  if (!user.role || !sessionStorage.getItem("smp_token")) return;

  var IKON_PROFIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M7 10V7a5 5 0 0110 0v3"/></svg>';
  var IKON_KET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>';

  function tombol(teks, ikon, url) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "nav-item"; // tanpa data-tab, jadi tidak dipegang fungsi pindahTab
    b.innerHTML = ikon + teks;
    b.addEventListener("click", function () { window.location.href = url; });
    return b;
  }

  function pasang() {
    var nav = document.querySelector(".nav-scroll");
    if (!nav || nav.getAttribute("data-menu-tambahan")) return;
    nav.setAttribute("data-menu-tambahan", "1");

    var label = document.createElement("div");
    label.className = "nav-group-label";
    label.textContent = "AKUN & KETERANGAN";
    nav.appendChild(label);

    if (["operator", "super_admin", "wali_kelas"].indexOf(user.role) !== -1) {
      nav.appendChild(tombol("Keterangan Siswa", IKON_KET, "../keterangan/index.html"));
    }
    nav.appendChild(tombol("Ganti Password", IKON_PROFIL, "../profil/index.html"));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pasang);
  else pasang();
})();
