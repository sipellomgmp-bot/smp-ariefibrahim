/**
 * menu-tambahan.js (VERSI TAHAP 3) — menambah menu ke sidebar sesuai role:
 *  - Operator/Super Admin : Pusat QR, Kelas Kosong, Keterangan Siswa, Ganti Password
 *  - Petugas Absensi (Hale): Kelas Kosong, Ganti Password
 *  - Wali Kelas            : Keterangan Siswa, Ganti Password
 *  - Guru/Kepala Sekolah   : Ganti Password
 */
(function () {
  "use strict";
  var user = {};
  try { user = JSON.parse(sessionStorage.getItem("smp_user") || "{}"); } catch (e) {}
  if (!user.role || !sessionStorage.getItem("smp_token")) return;

  var S = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + d + "</svg>"; };
  var IKON = {
    qr: S('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM17 17h3v3h-3z"/>'),
    kosong: S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>'),
    ket: S('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>'),
    pass: S('<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M7 10V7a5 5 0 0110 0v3"/>')
  };

  var role = user.role;
  var admin = role === "operator" || role === "super_admin";
  var MENU = [];
  if (admin) MENU.push(["Pusat QR (Cetak Kartu)", IKON.qr, "../pusat-qr/index.html"]);
  if (admin || role === "hale") MENU.push(["Monitoring Kelas Kosong", IKON.kosong, "../kelas-kosong/index.html"]);
  if (admin || role === "wali_kelas") MENU.push(["Keterangan Siswa", IKON.ket, "../keterangan/index.html"]);
  MENU.push(["Ganti Password", IKON.pass, "../profil/index.html"]);

  function pasang() {
    var nav = document.querySelector(".nav-scroll");
    if (!nav || nav.getAttribute("data-menu-tambahan")) return;
    nav.setAttribute("data-menu-tambahan", "1");

    var label = document.createElement("div");
    label.className = "nav-group-label";
    label.textContent = "MENU TAMBAHAN";
    nav.appendChild(label);

    MENU.forEach(function (m) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "nav-item"; // tanpa data-tab agar tidak dipegang pindahTab()
      b.innerHTML = m[1] + m[0];
      b.addEventListener("click", function () { window.location.href = m[2]; });
      nav.appendChild(b);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pasang);
  else pasang();
})();
