/**
 * menu-tambahan.js (VERSI TAHAP 3) — menambah menu ke sidebar sesuai role:
 *  - Operator/Super Admin : Pusat QR, Kelas Kosong, Keterangan Siswa, Ganti Password
 *  - Petugas Absensi (Hale): Kelas Kosong, Ganti Password
 *  - Wali Kelas            : Keterangan Siswa, Ganti Password
 *  - Guru/Wali Kelas/Kepala Sekolah: + Absensi Kehadiran (Wajah) & Daftar Wajah Saya
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
    wajah: S('<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a6 6 0 0116 0v2M3 7V4h3M21 7V4h-3"/>'),
    pass: S('<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M7 10V7a5 5 0 0110 0v3"/>')
  };

  var role = user.role;
  var admin = role === "operator" || role === "super_admin";
  var MENU = [];
  var guruan = role === "guru" || role === "wali_kelas" || role === "kepala_sekolah";
  if (guruan) {
    MENU.push(["Absensi Kehadiran (Wajah)", IKON.wajah, "../absen-wajah/index.html"]);
    MENU.push(["Daftar / Update Wajah Saya", IKON.wajah, "../absen-wajah/index.html?mode=update"]);
  }
  if (admin) MENU.push(["Pusat QR (Cetak Kartu)", IKON.qr, "../pusat-qr/index.html"]);
  if (admin) MENU.push(["Import & Naik Kelas", IKON.ket, "../import-naik-kelas/index.html"]);
  if (admin || role === "hale") MENU.push(["Monitoring Kelas Kosong", IKON.kosong, "../kelas-kosong/index.html"]);
  if (admin || role === "wali_kelas") MENU.push(["Keterangan Siswa", IKON.ket, "../keterangan/index.html"]);
  if (admin || role === "kepala_sekolah") MENU.push(["Monitoring Pembelajaran", IKON.kosong, "../monitoring-pembelajaran/index.html"]);
  if (admin) MENU.push(["Kelola Kegiatan (Ekskul & Program)", IKON.ket, "../kegiatan/index.html"]);
  MENU.push(["Acara & Absensi Wali Murid", IKON.qr, "../acara/index.html"]);
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

  // ---- Ganti menu "Segera Hadir" dengan halaman nyata (sesuai role) ----
  var ALIHKAN = {
    operator: [
      [/^Ekstrakurikuler/i, "../kegiatan/index.html?tab=ekskul"],
      [/^Acara Sekolah/i, "../acara/index.html?tab=daftar"],
      [/^Absensi Wali Murid/i, "../acara/index.html?tab=scan"],
      [/^Buat Acara/i, "../acara/index.html?tab=daftar&baru=1"]
    ],
    super_admin: [
      [/^Ekstrakurikuler/i, "../kegiatan/index.html?tab=ekskul"],
      [/^Acara Sekolah/i, "../acara/index.html?tab=daftar"],
      [/^Absensi Wali Murid/i, "../acara/index.html?tab=scan"],
      [/^Buat Acara/i, "../acara/index.html?tab=daftar&baru=1"]
    ],
    wali_kelas: [
      [/^Siswa Terlambat/i, "../siswa-kehadiran/index.html?mode=terlambat"],
      [/^Siswa Tidak Hadir/i, "../siswa-kehadiran/index.html?mode=tidakhadir"],
      [/^Prestasi/i, "../siswa-kehadiran/index.html?mode=peringkat"],
      [/^Undangan/i, "../acara/index.html?tab=daftar"],
      [/^Jadwal Mengajar/i, "../jurnal-guru/index.html?tab=minggu"],
      [/^Isi Jurnal/i, "../jurnal-guru/index.html?tab=hari"],
      [/^Rekap Jurnal/i, "../jurnal-guru/index.html?tab=riwayat"]
    ],
    guru: [
      [/^Jadwal Mengajar/i, "../jurnal-guru/index.html?tab=minggu"],
      [/^Daftar Kelas/i, "../jurnal-guru/index.html?tab=minggu"],
      [/^Riwayat Absensi/i, "../jurnal-guru/index.html?tab=absensi"],
      [/^Acara/i, "../acara/index.html?tab=daftar"],
      [/^Buat Acara/i, "../acara/index.html?tab=daftar"],
      [/^Profil/i, "../profil/index.html"]
    ],
    kepala_sekolah: [
      [/^Jadwal\s*&\s*Pembelajaran/i, "../monitoring-pembelajaran/index.html?tab=hari"],
      [/^Ranking\s*&\s*Klasemen/i, "../monitoring-pembelajaran/index.html?tab=rajin"],
      [/^Ekstrakurikuler/i, "../kegiatan/index.html?tab=ekskul"],
      [/^Acara Sekolah/i, "../acara/index.html?tab=daftar"],
      [/^Laporan Program Unggulan/i, "../kegiatan/index.html?tab=program"],
      [/^Pengaturan Akun/i, "../profil/index.html"]
    ]
  };
  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest ? e.target.closest(".nav-item, .qa-banner-btn, .quick-btn") : null;
    var daftar = ALIHKAN[role];
    if (!btn || !daftar) return;
    var teks = btn.textContent.replace(/\s+/g, " ").trim();
    for (var i = 0; i < daftar.length; i++) {
      if (daftar[i][0].test(teks)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.location.href = daftar[i][1];
        return;
      }
    }
  }, true);

  // ---- Bar menu bawah (HP) untuk Guru, Wali Kelas, Kepala Sekolah ----
  function pasangBar() {
    if (!guruan || document.getElementById("barBawahGuru")) return;
    var dash = { guru: "dashboard-guru", wali_kelas: "dashboard-wali-kelas", kepala_sekolah: "dashboard-kepsek" }[role];
    var path = location.pathname;
    var aktif = path.indexOf("/absen-wajah/") !== -1 ? "absen" : (path.indexOf("/" + dash + "/") !== -1 ? "beranda" : "");
    var st = document.createElement("style");
    st.textContent =
      "#barBawahGuru{position:fixed;left:0;right:0;bottom:0;height:60px;background:#fff;border-top:1px solid #e3e0d5;display:flex;z-index:90;font-family:Inter,sans-serif}" +
      "#barBawahGuru button{flex:1;border:none;background:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:10px;color:#5b6478;cursor:pointer;font-family:inherit}" +
      "#barBawahGuru button svg{width:20px;height:20px}" +
      "#barBawahGuru button.on{color:#14284d;font-weight:700}" +
      "#barBawahGuru .tengah{position:relative}" +
      "#barBawahGuru .tengah span{position:absolute;top:-18px;width:52px;height:52px;border-radius:50%;background:#14284d;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center}" +
      "#barBawahGuru .tengah span svg{stroke:#e8ca6a;width:24px;height:24px}" +
      "#barBawahGuru .tengah em{font-style:normal;margin-top:34px}" +
      "@media (min-width:1001px){#barBawahGuru{display:none}}";
    document.head.appendChild(st);
    var b = document.createElement("div");
    b.id = "barBawahGuru";
    function item(label, ikon, fn, on, cls) {
      var x = document.createElement("button");
      x.type = "button"; x.className = (cls || "") + (on ? " on" : "");
      x.innerHTML = cls === "tengah" ? "<span>" + ikon + "</span><em>" + label + "</em>" : ikon + label;
      x.addEventListener("click", fn);
      b.appendChild(x);
    }
    var pergi = function (u) { return function () { window.location.href = u; }; };
    item("Beranda", S('<path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>'), pergi("../" + dash + "/index.html"), aktif === "beranda");
    item("Update Wajah", IKON.wajah, pergi("../absen-wajah/index.html?mode=update"), false);
    item("Absensi", IKON.wajah, pergi("../absen-wajah/index.html"), aktif === "absen", "tengah");
    item("Ganti Password", IKON.pass, pergi("../profil/index.html"), path.indexOf("/profil/") !== -1);
    item("Keluar", S('<path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>'), function () { sessionStorage.clear(); window.location.href = "../../index.html"; }, false);
    document.body.appendChild(b);
    document.body.style.paddingBottom = "72px";
  }

  function mulaiSemua() { pasang(); pasangBar(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mulaiSemua);
  else mulaiSemua();
})();
