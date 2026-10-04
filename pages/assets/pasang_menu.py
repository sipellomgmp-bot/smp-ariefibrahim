"""
pasang_menu.py — menyisipkan script ke dashboard secara otomatis.
Jalankan dari FOLDER UTAMA proyek (yang berisi folder pages/ dan assets/):
    python pasang_menu.py
Aman dijalankan berulang kali. File asli dicadangkan sebagai index.html.bak
"""
import os, shutil

MENU = '<script src="../../assets/js/menu-tambahan.js"></script>'
LAPORAN = '<script src="../../assets/js/dashboard-laporan.js"></script>'

# dashboard -> script yang harus ada (urut)
TARGET = {
    "pages/dashboard-operator/index.html": [MENU],
    "pages/dashboard-kepsek/index.html": [LAPORAN, MENU],
    "pages/dashboard-wali-kelas/index.html": [LAPORAN, MENU],
    "pages/dashboard-guru/index.html": [MENU],
    "pages/dashboard-hale/index.html": [MENU],
}

TOKEN_LAMA = 'document.getElementById("pgWaToken").value = p.whatsapp_gateway_token || "";'
TOKEN_BARU = ('document.getElementById("pgWaToken").value = "";\n'
              '    document.getElementById("pgWaToken").placeholder = p.whatsapp_token_terisi '
              '? "Token tersimpan. Kosongkan bila tidak diubah" : "Tempel token dari dashboard Fonnte";')

for path, tags in TARGET.items():
    if not os.path.exists(path):
        print("TIDAK ADA :", path)
        continue
    with open(path, "r", encoding="utf-8", newline="") as f:
        isi = f.read()
    asli = isi

    # sisipkan script yang belum ada, tepat sebelum </body> terakhir
    baru = [t for t in tags if t not in isi]
    if baru:
        idx = isi.rfind("</body>")
        if idx == -1:
            print("GAGAL     :", path, "(tidak ada </body>)")
            continue
        isi = isi[:idx] + "\n".join(baru) + "\n" + isi[idx:]

    # perbaikan token WhatsApp (hanya dashboard operator)
    if path.endswith("dashboard-operator/index.html") and TOKEN_LAMA in isi:
        isi = isi.replace(TOKEN_LAMA, TOKEN_BARU)

    if isi == asli:
        print("SUDAH      :", path)
        continue
    shutil.copyfile(path, path + ".bak")
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(isi)
    print("DIPERBARUI :", path)

print("\nSelesai. Cek hasil di atas, lalu upload/commit file index.html yang berubah.")
