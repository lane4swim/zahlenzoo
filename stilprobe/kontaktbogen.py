from playwright.sync_api import sync_playwright
import pathlib
R=pathlib.Path(__file__).parent; P=R/'png'
def im(n,w,h=None,style=''): return f'<img src="file://{P}/{n}.png" width="{w}" {f"height={h}" if h else ""} style="{style}">'
exprs=['neutral','froh','jubelnd','nachdenklich','muede']
row1=''.join(f'<figure>{im(f"affenwald_affe_{e}_512",230)}<figcaption>{e}</figcaption></figure>' for e in exprs)
idle=''.join(im(f"affenwald_affe_idle_{i}_512",120) for i in range(6))
ui=''.join(im(n,96) for n in ['ui_taste_leer_96','ui_stern_voll_96','ui_stern_leer_96','ui_hinweis_gluehbirne_96','ui_richtig_haken_96','ui_nochmal_wolke_96'])+im('ui_karte_leer_240x140',240)
math=im('mathe_zehnerfeld_7_328x136',328)+im('mathe_zehnerfeld_leer_328x136',328)+im('mathe_einer_64',64)+im('mathe_zaehler_orange_64',64)+im('mathe_zaehler_wasser_64',64)+im('mathe_zehner_48x480',24,240)
scene=f'''<div style="position:relative;width:1024px;height:768px">{im("affenwald_hintergrund_1024x768",1024)}
<div style="position:absolute;left:232px;top:150px;width:560px;height:330px;"></div>
{im("affenwald_affe_neutral_512",300,None,"position:absolute;left:612px;top:360px")}
{im("mathe_zehnerfeld_7_328x136",328,None,"position:absolute;left:348px;top:240px")}
{im("ui_karte_leer_240x140",240,None,"position:absolute;left:392px;top:420px")}
{im("ui_taste_leer_96",96,None,"position:absolute;left:300px;top:560px")}{im("ui_taste_leer_96",96,None,"position:absolute;left:410px;top:560px")}{im("ui_taste_leer_96",96,None,"position:absolute;left:520px;top:560px")}
{im("ui_stern_voll_96",64,None,"position:absolute;left:16px;top:16px")}{im("ui_stern_voll_96",64,None,"position:absolute;left:76px;top:16px")}{im("ui_stern_leer_96",64,None,"position:absolute;left:136px;top:16px")}
{im("ui_hinweis_gluehbirne_96",80,None,"position:absolute;left:920px;top:670px")}</div>'''
html=f'''<html><body style="margin:0;padding:20px;background:#fdfaf3;font-family:sans-serif;width:1240px">
<h3>Ausdrücke</h3><div style="display:flex;gap:6px">{row1}</div>
<h3>Idle-Bilder (Atmen, Blinzeln)</h3><div style="background:#BFE6F2;display:inline-block">{idle}</div>
<h3>Oberfläche</h3><div style="display:flex;gap:14px;align-items:center;background:#BFE6F2;padding:10px">{ui}</div>
<h3>Mathebausteine</h3><div style="display:flex;gap:14px;align-items:flex-end;background:#BFE6F2;padding:10px">{math}</div>
<h3>Zusammenspiel (Aufgabenszene, Mock-up 1024 × 768)</h3>{scene}</body></html>'''
(R/'kontakt.html').write_text(html)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1280,'height':900}); pg.goto(f'file://{R}/kontakt.html')
    pg.screenshot(path=str(R/'kontaktbogen.png'),full_page=True); b.close()
