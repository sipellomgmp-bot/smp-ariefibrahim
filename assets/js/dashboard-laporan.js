/**
 * dashboard-laporan.js — script "tempel satu baris" untuk dashboard
 * Operator / Super Admin, Kepala Sekolah, dan Wali Kelas.
 *
 * Yang dilakukan script ini:
 * 1) Mengubah panel placeholder "Grafik belum tersedia" menjadi grafik kehadiran nyata
 * 2) Mengisi panel: Rekap Absensi per Kelas, Top 5 Siswa Paling Rajin / Ranking & Klasemen,
 *    Guru Paling Rajin / Performa Guru, Ringkasan Hari Ini
 * 3) Mengisi kartu statistik Wali Kelas (Hadir/Terlambat/Tidak Hadir/Izin-Sakit hari ini)
 * 4) Menghubungkan menu "Laporan Harian", "Laporan Bulanan", "Absensi Siswa", "Absensi Guru",
 *    "Kehadiran Siswa/Guru", "Absensi Kelas", "Grafik Kehadiran" ke halaman laporan
 *
 * Cara pakai: tambahkan SATU baris ini tepat sebelum </body> di dashboard-operator,
 * dashboard-kepsek, dan dashboard-wali-kelas:
 *   <script src="../../assets/js/dashboard-laporan.js"></script>
 */
(function () {
  "use strict";

  var DKL_API = "https://script.google.com/macros/s/AKfycbxK1sHgZ3pPPYHS7NdyD8WFpVyPnDlCYs6q-hmnvhGG1CTLlg9dOKF6xYJr6ucihpZX/exec";
  var LAPORAN_URL = "../laporan/index.html";
  var ROLE_OK = ["operator", "super_admin", "kepala_sekolah", "wali_kelas"];
  var CHART_JS = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";

  var token = sessionStorage.getItem("smp_token");
  var user = {};
  try { user = JSON.parse(sessionStorage.getItem("smp_user") || "{}"); } catch (e) {}
  if (!token || ROLE_OK.indexOf(user.role) === -1) return;

  function esc(v) {
    return String(v === undefined || v === null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function api(action, extra) {
    var body = Object.assign({ action: action, token: token }, extra || {});
    return fetch(DKL_API, { method: "POST", body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }

  // ---------- 1. Menu navigasi -> halaman laporan ----------
  var NAV = [
    { re: /^Laporan Harian/i, periode: "harian", jenis: "siswa" },
    { re: /^Laporan Bulanan/i, periode: "bulanan", jenis: "siswa" },
    { re: /^(Absensi Siswa|Kehadiran Siswa|Absensi Kelas)/i, periode: "harian", jenis: "siswa" },
    { re: /^(Absensi Guru|Kehadiran Guru)/i, periode: "harian", jenis: "guru" },
    { re: /^Grafik Kehadiran/i, periode: "bulanan", jenis: "siswa" }
  ];

  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest ? e.target.closest(".nav-item") : null;
    if (!btn) return;
    var teks = btn.textContent.replace(/\s+/g, " ").trim();
    for (var i = 0; i < NAV.length; i++) {
      if (NAV[i].re.test(teks)) {
        if (NAV[i].jenis === "guru" && user.role === "wali_kelas") return;
        e.preventDefault();
        e.stopImmediatePropagation();
        window.location.href = LAPORAN_URL + "?periode=" + NAV[i].periode + "&jenis=" + NAV[i].jenis;
        return;
      }
    }
  }, true);

  // ---------- Chart.js ----------
  function muatChartJs(cb) {
    if (window.Chart) { cb(); return; }
    var s = document.createElement("script");
    s.src = CHART_JS;
    s.onload = cb;
    s.onerror = function () { /* grafik dilewati bila CDN gagal */ };
    document.head.appendChild(s);
  }

  // ---------- Pengambil data (sekali saja) ----------
  var dataGrafik = null;
  var sedangMuatGrafik = false;
  var dataGuru = null;
  var sedangMuatGuru = false;

  function muatGrafik(cb) {
    if (dataGrafik) { cb(); return; }
    if (sedangMuatGrafik) return;
    sedangMuatGrafik = true;
    api("getGrafikKehadiran").then(function (h) {
      sedangMuatGrafik = false;
      if (h.success) { dataGrafik = h.data; cb(); }
    }).catch(function () { sedangMuatGrafik = false; });
  }

  function muatGuru(cb) {
    if (dataGuru) { cb(); return; }
    if (sedangMuatGuru) return;
    sedangMuatGuru = true;
    api("getKlasemenGuruRajin", { periode: "bulan" }).then(function (h) {
      sedangMuatGuru = false;
      if (h.success) { dataGuru = h.data; cb(); }
    }).catch(function () { sedangMuatGuru = false; });
  }

  // ---------- Util panel ----------
  function cariPlaceholder(regex) {
    var judul = document.querySelectorAll(".panel-box-title");
    for (var i = 0; i < judul.length; i++) {
      if (regex.test(judul[i].textContent.replace(/\s+/g, " ").trim())) {
        var next = judul[i].nextElementSibling;
        if (next && next.classList.contains("placeholder-box")) return next;
      }
    }
    return null;
  }

  function ganti(ph, html) {
    var d = document.createElement("div");
    d.className = "dkl-isi";
    d.innerHTML = html;
    ph.replaceWith(d);
    return d;
  }

  var kosong = "<div style='text-align:center;padding:24px 10px;color:#5b6478;font-size:12.5px;'>Belum ada data absensi.</div>";
  var linkLaporan = "<a href='" + LAPORAN_URL + "?periode=bulanan&jenis=siswa' style='display:inline-block;margin-top:10px;font-size:12px;font-weight:600;color:#1a3260;'>Lihat laporan lengkap →</a>";

  var BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

  // ---------- 2. Render panel ----------
  function renderTren(ph) {
    var tren = dataGrafik.tren || [];
    if (tren.length === 0) { ganti(ph, kosong + linkLaporan); return; }
    var h = dataGrafik.hari_ini;
    var box = ganti(ph,
      "<div style='position:relative;height:240px;'><canvas></canvas></div>" +
      "<div style='font-size:12px;color:#5b6478;margin-top:10px;'>Hari ini: <strong>" + esc(h.hadir) + "</strong> hadir, <strong>" +
      esc(h.terlambat) + "</strong> terlambat, <strong>" + esc(h.sakit_izin) + "</strong> izin/sakit, <strong>" + esc(h.belum_absen + h.alpa) +
      "</strong> belum absen/alpa dari " + esc(h.total) + " siswa.</div>" + linkLaporan);
    muatChartJs(function () {
      new window.Chart(box.querySelector("canvas"), {
        type: "bar",
        data: {
          labels: tren.map(function (t) { var p = t.tanggal.split("-"); return p[2] + " " + BULAN[Number(p[1]) - 1]; }),
          datasets: [
            { label: "Hadir", data: tren.map(function (t) { return t.hadir; }), backgroundColor: "#1e7a33" },
            { label: "Terlambat", data: tren.map(function (t) { return t.terlambat; }), backgroundColor: "#d98a1f" },
            { label: "Tidak Hadir", data: tren.map(function (t) { return t.tidak_hadir; }), backgroundColor: "#b3261e" }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } },
          plugins: { legend: { position: "bottom" } }
        }
      });
    });
  }

  function renderPerKelas(ph) {
    var data = dataGrafik.per_kelas || [];
    if (data.length === 0) { ganti(ph, kosong); return; }
    ganti(ph, data.map(function (k) {
      var warna = k.persentase >= 90 ? "#1e7a33" : (k.persentase >= 75 ? "#d98a1f" : "#b3261e");
      return "<div style='margin-bottom:10px;'><div style='display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:3px;'><span>" +
        esc(k.nama_kelas) + "</span><strong>" + esc(k.persentase) + "%</strong></div>" +
        "<div style='height:7px;background:#eee;border-radius:99px;overflow:hidden;'><div style='height:100%;width:" +
        Math.min(Number(k.persentase) || 0, 100) + "%;background:" + warna + ";'></div></div></div>";
    }).join("") + "<div style='font-size:10.5px;color:#9aa4bd;'>Bulan ini</div>");
  }

  function renderTopSiswa(ph) {
    var data = dataGrafik.top_siswa || [];
    if (data.length === 0) { ganti(ph, kosong); return; }
    ganti(ph, data.map(function (s, i) {
      return "<div style='display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid #f1efe9;font-size:12.5px;'>" +
        "<span>" + (i + 1) + ". " + esc(s.nama) + " <span style='color:#9aa4bd;'>(" + esc(s.nama_kelas) + ")</span></span>" +
        "<strong style='color:#1e7a33;'>" + esc(s.persentase) + "%</strong></div>";
    }).join("") + "<div style='font-size:10.5px;color:#9aa4bd;margin-top:6px;'>Bulan ini</div>");
  }

  function renderGuru(ph) {
    var data = (dataGuru || []).slice(0, 5);
    if (data.length === 0) { ganti(ph, "<div style='text-align:center;padding:24px 10px;color:#5b6478;font-size:12.5px;'>Belum ada data jurnal guru.</div>"); return; }
    ganti(ph, data.map(function (g, i) {
      return "<div style='display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid #f1efe9;font-size:12.5px;'>" +
        "<span>" + (i + 1) + ". " + esc(g.nama_lengkap) + "</span>" +
        "<strong style='color:#1e7a33;'>" + esc(g.persentase_rajin) + "%</strong></div>";
    }).join("") + "<div style='font-size:10.5px;color:#9aa4bd;margin-top:6px;'>Berdasarkan pengisian jurnal vs kelas kosong, bulan ini</div>");
  }

  function renderHariIni(ph) {
    var h = dataGrafik.hari_ini;
    function baris(l, v, w) { return "<div style='display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1efe9;font-size:13px;'><span>" + l + "</span><strong style='color:" + w + ";'>" + esc(v) + "</strong></div>"; }
    ganti(ph, baris("Hadir tepat waktu", h.hadir, "#1e7a33") + baris("Terlambat", h.terlambat, "#d98a1f") +
      baris("Izin/Sakit/Dinas", h.sakit_izin, "#6b3fa0") + baris("Alpa", h.alpa, "#b3261e") +
      baris("Belum absen", h.belum_absen, "#5b6478") + baris("Total siswa", h.total, "#14284d"));
  }

  // ---------- 3. Kartu statistik Wali Kelas ----------
  function isiKartuWali() {
    if (user.role !== "wali_kelas" || !dataGrafik) return;
    var h = dataGrafik.hari_ini;
    var peta = {
      "Hadir Hari Ini": h.hadir,
      "Terlambat": h.terlambat,
      "Tidak Hadir": h.alpa + h.belum_absen,
      "Izin/Sakit": h.sakit_izin
    };
    var labels = document.querySelectorAll(".stat-label");
    for (var i = 0; i < labels.length; i++) {
      var nama = labels[i].textContent.trim();
      if (Object.prototype.hasOwnProperty.call(peta, nama)) {
        var nilai = labels[i].parentElement.querySelector(".stat-value");
        if (nilai && nilai.textContent.trim() === "-") nilai.textContent = peta[nama];
      }
    }
  }

  // ---------- Penjalan (idempotent, aman dipanggil berulang) ----------
  var TARGET = [
    { re: /^(Grafik Kehadiran|Tren Kehadiran)/, render: renderTren, butuhGuru: false, bukanWali: false },
    { re: /^Rekap Absensi per Kelas/, render: renderPerKelas, butuhGuru: false, bukanWali: true },
    { re: /^(Top 5 Siswa Paling Rajin|Ranking & Klasemen)/, render: renderTopSiswa, butuhGuru: false, bukanWali: false },
    { re: /^Ringkasan Hari Ini/, render: renderHariIni, butuhGuru: false, bukanWali: false },
    { re: /^(Guru Paling Rajin|Performa Guru)/, render: renderGuru, butuhGuru: true, bukanWali: true }
  ];

  function jalankan() {
    var perluGrafik = false;
    TARGET.forEach(function (t) { if (cariPlaceholder(t.re)) perluGrafik = true; });
    var adaKartuWali = user.role === "wali_kelas" && !!document.querySelector(".stat-label");

    if (perluGrafik || adaKartuWali) {
      muatGrafik(function () {
        TARGET.forEach(function (t) {
          if (t.butuhGuru) return;
          if (t.bukanWali && user.role === "wali_kelas") return;
          var ph = cariPlaceholder(t.re);
          if (ph) t.render(ph);
        });
        isiKartuWali();
      });
    }

    if (user.role !== "wali_kelas") {
      TARGET.forEach(function (t) {
        if (!t.butuhGuru) return;
        if (cariPlaceholder(t.re)) {
          muatGuru(function () {
            var ph = cariPlaceholder(t.re);
            if (ph) t.render(ph);
          });
        }
      });
    }
  }

  var tunda = null;
  function jadwalkan() {
    if (tunda) clearTimeout(tunda);
    tunda = setTimeout(jalankan, 250);
  }

  // Wali Kelas merender panelnya setelah data kelas dimuat -> pantau perubahan DOM
  new MutationObserver(jadwalkan).observe(document.body, { childList: true, subtree: true });
  jadwalkan();
})();
