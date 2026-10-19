"""Protesto Türkiye — 12 kısa videonun metinleri ve sahne görselleri.

Her satır seslendirilir ve altyazı olarak ekrana gelir. `*yıldızlı*` kelimeler
altyazıda kırmızı vurgulanır. Rakamlar ekranda rakamla yazılır; seslendirme
için `audio.speakable` bunları Türkçe okunuşa çevirir. Okunuşu otomatik
çıkmayan satırlarda `say=` ile seslendirme metni ayrıca verilir.

`v=` o satırla birlikte ekrana gelen büyük görseldir; bir sonraki görsel
gelene kadar ekranda kalır. Bütün rakamların kaynağı README.md'de.
"""

CTA = "Sen de bize katıl. *Bize destek ol.*"


def L(show, v=None, say=None, pause=None):
    return {"show": show, "v": v, "say": say, "pause": pause}


def stat(value, label, sub=None, count=True):
    return {"kind": "stat", "value": value, "label": label, "sub": sub, "count": count}


def big(text, sub=None, red=False):
    return {"kind": "big", "text": text, "sub": sub, "red": red}


def bars(items, n, label=None, unit="TL"):
    return {"kind": "bars", "items": items, "n": n, "label": label, "unit": unit}


def listing(items, n):
    return {"kind": "list", "items": items, "n": n}


def stamp(items, sub=None):
    return {"kind": "stamp", "items": items, "sub": sub}


def quote(text, cite):
    return {"kind": "quote", "text": text, "cite": cite}


CHART = {"kind": "chart"}
CLOCK = {"kind": "clock"}
SCALE = {"kind": "scale"}
CTA_CARD = {"kind": "cta"}

SCHOOL_ATTACKS = [
    ("2 MART", "ÇEKMEKÖY"),
    ("14 NİSAN", "SİVEREK"),
    ("15 NİSAN", "KAHRAMANMARAŞ"),
    ("22 EYLÜL", "TURGUTLU"),
    ("6 EKİM", "BAŞAKŞEHİR"),
]

WAGE_BARS = [
    ("ASGARİ ÜCRET", 28075),
    ("AÇLIK SINIRI", 37801),
    ("YOKSULLUK SINIRI", 123130),
]

VIDEOS = [
    {
        "slug": "01-enflasyon",
        "title": "ENFLASYON",
        "kicker": "Türkiye'deki enflasyon artışı",
        "lines": [
            L("Market fişine bir bak.", big("ZAM", "her gün · her üründe", red=True)),
            L("Geçen yıl aldığın her şey, bugün *çok daha pahalı.*"),
            L("TÜİK'e göre yıllık enflasyon: *%29,73.*",
              stat("%29,73", "TÜİK · YILLIK TÜFE · EYLÜL 2026")),
            L("Bağımsız ekonomistlerin kurduğu ENAG'a göre: *%46,61.*",
              stat("%46,61", "ENAG · YILLIK · EYLÜL 2026")),
            L("Neredeyse beş yıl boyunca enflasyon %30'un üzerinde kaldı.", CHART),
            L("Rakam düşse bile *fiyatlar düşmüyor.*"),
            L("Sadece daha yavaş artıyor."),
            L("Asgari ücret yılda bir kez artıyor. *Fiyatlar her gün.*",
              big("ÜCRET: YILDA 1\nFİYAT: HER GÜN")),
            L("Bu bir rakam değil. *Bu bizim hayatımız.*", big("HAYATIMIZ", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "02-adaletsiz-maas",
        "title": "ADALETSİZ MAAŞ",
        "kicker": "Türkiye'deki maaş düzeni",
        "lines": [
            L("Net asgari ücret: *28.075 lira.*",
              stat("28.075 TL", "NET ASGARİ ÜCRET · 2026")),
            L("Dört kişilik bir ailenin sadece mutfak masrafı, yani açlık sınırı: *37.801 lira.*",
              bars(WAGE_BARS, 2, "TÜRK-İŞ · EYLÜL 2026")),
            L("Yani asgari ücret, *açlık sınırının bile altında.*"),
            L("Yoksulluk sınırı ise *123.130 lira.*",
              bars(WAGE_BARS, 3, "TÜRK-İŞ · EYLÜL 2026")),
            L("Bir milletvekili maaşı, asgari ücretin *yaklaşık on katı.*",
              stat("≈10×", "MİLLETVEKİLİ MAAŞI ÷ ASGARİ ÜCRET · 2026", count=False)),
            L("Milyonlarca çalışan, aynı ücrete mahkûm.",
              big("AYNI ÜCRET\nAYNI YOKSULLUK")),
            L("Alın teri bu kadar ucuz olmamalı."),
            L("Adil ücret sadaka değil, *haktır.*", big("ADİL ÜCRET", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "03-okullarda-guvenlik",
        "title": "OKULLAR GÜVENLİ Mİ?",
        "kicker": "Okullarda önlem alınmıyor",
        "lines": [
            L("2 Mart. Çekmeköy. Bir öğretmen hayatını kaybetti.",
              listing(SCHOOL_ATTACKS, 1)),
            L("14 Nisan. Siverek. On altı kişi yaralandı.", listing(SCHOOL_ATTACKS, 2)),
            L("15 Nisan. Kahramanmaraş. *Öğrencilerimiz ve öğretmenimiz* hayatını kaybetti.",
              listing(SCHOOL_ATTACKS, 3)),
            L("22 Eylül. Turgutlu. On bir öğrenci yaralandı.", listing(SCHOOL_ATTACKS, 4)),
            L("6 Ekim. Başakşehir. *Yine bir okul.*", listing(SCHOOL_ATTACKS, 5)),
            L("Hepsi tek bir yılda: *2026.*", big("2026", "tek bir yılda", red=True)),
            L("Her saldırıdan sonra genelge, soruşturma, görevden alma.",
              big("GENELGE\nSORUŞTURMA\nGÖREVDEN ALMA")),
            L("Ama okulların çoğunda kapıda bir güvenlik görevlisi bile yok.",
              big("KAPIDA\nKİMSE YOK")),
            L("Çocuklarımız okula korkarak değil, *güvenle* gitmeli.",
              big("GÜVENLİ OKUL", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "04-okul-saatleri-08-18",
        "title": "08:00 – 18:00",
        "kicker": "Okul saatleri",
        "lines": [
            L("Sabah sekiz.", CLOCK),
            L("Akşam altı."),
            L("*On saat.*"),
            L("Ders, etüt, kurs, ödev...", big("DERS\nETÜT\nKURS\nÖDEV")),
            L("Haftada 50 saat. *Bir yetişkinin yasal mesaisinden bile fazla.*",
              bars([("YETİŞKİN · YASAL SINIR", 45), ("ÖĞRENCİ · 08–18", 50)], 2,
                   "İŞ KANUNU MD. 63 · HAFTALIK EN ÇOK 45 SAAT", unit="SAAT")),
            L("Çocuklar güneşi, okulun penceresinden görüyor."),
            L("Oyun yok. Spor yok. *Uyku yok.*", big("OYUN YOK\nSPOR YOK\nUYKU YOK")),
            L("Uzun saatler başarı getirmez, *tükenmişlik* getirir.",
              big("TÜKENMİŞLİK", red=True)),
            L("Çocuklarımız robot değil.", big("ROBOT\nDEĞİLİZ")),
            L("Daha kısa, *daha nitelikli* bir eğitim istiyoruz."),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "05-ic-savasa-hayir",
        "title": "İÇ SAVAŞA HAYIR",
        "kicker": "Bizi birbirimize düşürmeyin",
        "lines": [
            L("Sınırımızın hemen ötesinde, Suriye'de iç savaş *13 yıl* sürdü.",
              stat("13 YIL", "SURİYE · 2011–2024")),
            L("Yüz binlerce insan öldü. Milyonlar evini terk etti.",
              big("YÜZ BİNLERCE ÖLÜ\nMİLYONLARCA GÖÇ")),
            L("İç savaş bir günde başlamaz.", big("BİR GÜNDE\nBAŞLAMAZ")),
            L("Önce dil sertleşir. Sonra komşu, *düşman* ilan edilir.",
              big("NEFRET DİLİ", red=True)),
            L("Türk, Kürt, Alevi, Sünni... Biz ve onlar diye ayrılırız.",
              {"kind": "split", "left": "BİZ", "right": "ONLAR"}),
            L("Bu ülkenin insanlarını birbirine düşürmek isteyenlere *izin vermeyeceğiz.*"),
            L("Kutuplaşmaya hayır. Nefrete hayır.", big("KUTUPLAŞMAYA\nHAYIR")),
            L("*İç savaşa hayır. Barışa evet.*", big("BARIŞ", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "06-plansiz-goc",
        "title": "PLANSIZ GÖÇ",
        "kicker": "Mülteci politikası",
        "lines": [
            L("Türkiye, yıllarca dünyada en çok mülteci barındıran ülke oldu.",
              big("DÜNYADA\n1 NUMARA", "BMMYK · KÜRESEL EĞİLİMLER RAPORLARI")),
            L("Bugün hâlâ *2,2 milyonu aşkın* Suriyeli geçici koruma altında.",
              stat("2,2 MİLYON+", "GEÇİCİ KORUMA · GÖÇ İDARESİ · 2026", count=False)),
            L("Kayıt dışı göçün gerçek boyutu ise *belirsiz.*", big("KAYIT DIŞI\n?", red=True)),
            L("Kentlerde kira artıyor, ucuz emek sömürülüyor, gerginlik büyüyor.",
              big("KİRA\nSÖMÜRÜ\nGERGİNLİK")),
            L("Bedelini hem bu ülkenin yoksulları, hem de savaştan kaçan insanlar ödüyor."),
            L("Mesele insanlar değil. *Mesele plansızlık.*", big("PLANSIZLIK", red=True)),
            L("Şeffaf, planlı ve insani bir göç politikası istiyoruz.",
              big("ŞEFFAF\nPLANLI\nİNSANİ")),
            L("Nefreti değil, *çözümü* savunuyoruz."),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "07-siyasi-baski",
        "title": "İRADEYE SAYGI",
        "kicker": "Siyasi baskılar",
        "lines": [
            L("Halkın oyuyla seçilen İstanbul Büyükşehir Belediye Başkanı, *Mart 2025'ten beri tutuklu.*",
              big("TUTUKLU", "SEÇİLMİŞ İBB BAŞKANI · MART 2025'TEN BERİ", red=True)),
            L("Yüzlerce sanıklı davalarla Silivri'de yargılanıyor.",
              stat("407 SANIK", "İBB DAVASI · SİLİVRİ · 2026")),
            L("Seçilmiş belediye başkanlarının yerine *kayyumlar* atandı.", big("KAYYUM")),
            L("Ana muhalefet partisinin kurultayı, istinaf kararıyla *mutlak butlan* denilerek iptal edildi.",
              big("MUTLAK\nBUTLAN", "İSTİNAF KARARI · 21 MAYIS 2026")),
            L("Muhalif bir televizyona kayyum atandı, *yayını durduruldu.*",
              big("YAYIN\nDURDU", "14 EKİM 2026", red=True)),
            L("Siyaset sandıkta değil, mahkeme salonlarında belirleniyorsa...",
              big("SANDIK MI?\nMAHKEME Mİ?")),
            L("demokrasi *alarm* veriyor demektir."),
            L("Halkın iradesine *saygı* istiyoruz.", big("İRADEYE\nSAYGI", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "08-yasaklar",
        "title": "YASAKLAR",
        "kicker": "Gelen yasaklar",
        "lines": [
            L("Instagram: *dokuz gün* erişim engeli.", stamp(["INSTAGRAM"], "AĞUSTOS 2024"),
              say="İnstagram: dokuz gün erişim engeli."),
            L("Roblox. Discord. *Erişim engeli.*", stamp(["ROBLOX", "DISCORD"], "2024"),
              say="Robloks. Diskord. Erişim engeli."),
            L("Mart 2025: İstanbul'da dört gün eylem yasağı, sosyal medyaya *bant daraltma.*",
              big("EYLEM\nYASAĞI", "İSTANBUL · MART 2025", red=True)),
            L("2026: on beş yaş altına *sosyal medya yasağı.*",
              stat("15 YAŞ ALTI", "SOSYAL MEDYA YASAĞI · 7578 SAYILI KANUN", count=False)),
            L("Valilikler art arda eylem ve etkinlik yasakları ilan ediyor.",
              big("YASAK\nYASAK\nYASAK")),
            L("Sorunu çözmek yerine, *sorunu konuşanı susturmak.*", big("SUSTURMAK", red=True)),
            L("Yasaklarla bir gençlik susturulamaz."),
            L("Özgürlük bir lütuf değil, *haktır.*", big("ÖZGÜRLÜK")),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "09-gecim-derdi",
        "title": "GEÇİNEMİYORUZ",
        "kicker": "Mali geçim",
        "lines": [
            L("Ayın sonunu değil, *ortasını* getiremiyoruz.", big("AYIN\nORTASI", red=True)),
            L("Bekâr bir çalışanın aylık yaşam maliyeti: *48.884 lira.*",
              bars([("YAŞAM MALİYETİ · BEKÂR", 48884), ("NET ASGARİ ÜCRET", 28075)], 1,
                   "TÜRK-İŞ · EYLÜL 2026")),
            L("Asgari ücret ise *28.075 lira.*",
              bars([("YAŞAM MALİYETİ · BEKÂR", 48884), ("NET ASGARİ ÜCRET", 28075)], 2,
                   "TÜRK-İŞ · EYLÜL 2026")),
            L("Kirada yasal artış sınırı bile *%31'in üzerinde.*",
              stat("%31+", "KİRA ARTIŞ SINIRI · 12 AYLIK TÜFE ORT. · 2026", count=False)),
            L("Market, fatura, ulaşım, okul masrafı...",
              big("MARKET\nFATURA\nULAŞIM\nOKUL")),
            L("Gençler evden çıkamıyor. Aileler kredi kartıyla yaşıyor.",
              big("KREDİ KARTIYLA\nYAŞAM")),
            L("Biz lüks istemiyoruz."),
            L("*İnsanca yaşamak istiyoruz.*", big("İNSANCA\nYAŞAM", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "10-polis-ve-protesto",
        "title": "POLİS VE PROTESTO",
        "kicker": "Polislerin protestoculara tavrı",
        "lines": [
            L("Anayasa, madde 34.",
              quote("Herkes, önceden izin almaksızın, silahsız ve saldırısız toplantı "
                    "ve gösteri yürüyüşü düzenleme hakkına sahiptir.",
                    "T.C. ANAYASASI · MADDE 34")),
            L("Herkes, önceden izin almaksızın, silahsız ve saldırısız toplantı ve gösteri yürüyüşü "
              "düzenleme *hakkına sahiptir.*"),
            L("Peki sahada ne oldu?"),
            L("Mart 2025: biber gazı, tazyikli su, *plastik mermi.*",
              big("BİBER GAZI\nTAZYİKLİ SU\nPLASTİK MERMİ", "SARAÇHANE · MART 2025")),
            L("İçişleri Bakanlığı'na göre *1.879 gözaltı*, 260 tutuklama.",
              stat("1.879", "GÖZALTI · İÇİŞLERİ BAKANLIĞI · MART 2025", sub="260 TUTUKLAMA")),
            L("Barolar ve insan hakları örgütleri kötü muamele iddialarını raporladı.",
              big("KÖTÜ MUAMELE\nİDDİALARI", "İSTANBUL BAROSU · İHD · AF ÖRGÜTÜ")),
            L("Sonra mahkeme, yargılanan 87 kişiyi *beraat* ettirdi.",
              stat("87 BERAAT", "SARAÇHANE DAVASI · İSTANBUL 62. ASLİYE CEZA")),
            L("Çünkü barışçıl protesto, *anayasal bir hak.*"),
            L("Polis halkın karşısında değil, *yanında* olmalı.", big("HALKIN\nYANINDA", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "11-verilen-cezalar",
        "title": "VERİLEN CEZALAR",
        "kicker": "Düşüncenin bedeli",
        "lines": [
            L("Bir paylaşım. Bir slogan. Bir haber.", big("PAYLAŞIM\nSLOGAN\nHABER")),
            L("Gazeteci Alican Uludağ, sosyal medya paylaşımları yüzünden *tutuklandı.*",
              big("TUTUKLAMA", "GAZETECİ · ŞUBAT 2026", red=True)),
            L("Üç ay cezaevinde kaldı.", stat("3 AY", "CEZAEVİNDE · ŞUBAT–MAYIS 2026")),
            L("Saraçhane'de gözaltına alınan 87 kişi aylarca yargılandı, sonunda *beraat* etti.",
              big("BERAAT", "AMA AYLAR SONRA")),
            L("Ceza bazen hükümle değil, *sürecin kendisiyle* veriliyor.",
              big("SÜREÇ\nCEZASI", red=True)),
            L("Gözaltı, tutukluluk, yurt dışı yasağı...",
              big("GÖZALTI\nTUTUKLULUK\nYURT DIŞI YASAĞI")),
            L("Düşünceni söylemenin bedeli bu kadar ağır olmamalı."),
            L("Ceza adalet içindir. *Gözdağı için değil.*", big("GÖZDAĞI\nDEĞİL", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "12-adalet-nerede",
        "title": "ADALET NEREDE?",
        "kicker": "Adaletin olmadığı bir ülke",
        "lines": [
            L("Dünya Adalet Projesi, Hukukun Üstünlüğü Endeksi.", SCALE),
            L("Türkiye, 143 ülke arasında *118'inci.*",
              stat("118 / 143", "WJP HUKUKUN ÜSTÜNLÜĞÜ ENDEKSİ · 2025")),
            L("Hükümet yetkilerinin sınırlandırılmasında *136'ncı.*",
              stat("136.", "HÜKÜMET YETKİLERİNİN SINIRLANDIRILMASI")),
            L("Temel haklarda *134'üncü.*", stat("134.", "TEMEL HAKLAR")),
            L("Yargı bağımsız değilse, kimse güvende değildir.", SCALE),
            L("Bugün gazeteci. Yarın öğrenci. *Öbür gün sen.*",
              big("BUGÜN O\nYARIN SEN", red=True)),
            L("Adalet, herkese bir gün lazım olur."),
            L("Bağımsız yargı, *eşit hukuk* istiyoruz.", big("BAĞIMSIZ\nYARGI")),
            L(CTA, CTA_CARD),
        ],
    },
]
