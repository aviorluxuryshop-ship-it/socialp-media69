"""Protesto Türkiye — 12 kısa videonun metinleri ve sahne görselleri.

Her video aynı yapıda: herkese seslenen bir giriş (`hook`), konunun ne
olduğu ve ne zararı olduğu, rakamlar, kapanış çağrısı.

Her satır seslendirilir ve altyazı olarak ekrana gelir. `*yıldızlı*` kelimeler
altyazıda kırmızı vurgulanır. Rakamlar ekranda rakamla yazılır; seslendirme
için `audio.speakable` bunları Türkçe okunuşa çevirir. Okunuşu otomatik
çıkmayan satırlarda `say=` ile seslendirme metni ayrıca verilir.

`v=` o satırla birlikte ekrana gelen büyük görseldir; bir sonraki görsel
gelene kadar ekranda kalır. Bütün rakamların kaynağı README.md'de.
"""

CTA = "Sen de protesto etmek istiyorsan, *bizden haber bekle* ve takipte kal. *Bu sayfayı yay.*"


def L(show, v=None, say=None, pause=None, pace=1.0):
    return {"show": show, "v": v, "say": say, "pause": pause, "pace": pace}


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


def hook(reveal, title):
    """Bütün videolarda aynı giriş; sonunda o videonun konusu açıklanır."""
    fast = {"pause": 0.2, "pace": 0.86}  # giriş daha seri okunur
    return [
        L("Sence neden protesto yapılır?", big("NEDEN\nPROTESTO?"), **fast),
        L("Çünkü ortada, halkın *beğenmediği* bir sebep vardır.", **fast),
        L("Peki biz neden yapmıyoruz?", big("PEKİ\nBİZ?"), **fast),
        L("Sebep yok diyorsunuz.", big("SEBEP\nYOK MU?"), **fast),
        L("*Oysa sebep çok.* İşte biri:", big("SEBEP\nÇOK", red=True), **fast),
        L(f"*{reveal}*", big(title, red=True)),
    ]


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
        "lines": hook("Enflasyon.", "ENFLASYON") + [
            L("Enflasyon nedir? Fiyatların *sürekli ve genel olarak* artması.",
              big("FİYATLAR\nHEP ARTIYOR")),
            L("Yani cebindeki para her gün *biraz daha değersiz.*", big("PARAN\nERİYOR", red=True)),
            L("Maaşın aynı kalır, aldıkların azalır. Birikimin erir.",
              big("MAAŞ AYNI\nSEPET KÜÇÜK")),
            L("TÜİK'e göre yıllık enflasyon: *%29,73.*",
              stat("%29,73", "TÜİK · YILLIK TÜFE · EYLÜL 2026")),
            L("Bağımsız ekonomistlerin kurduğu ENAG'a göre: *%46,61.*",
              stat("%46,61", "ENAG · YILLIK · EYLÜL 2026")),
            L("Neredeyse beş yıldır enflasyon %30'un üzerinde.", CHART),
            L("Asgari ücret yılda bir kez artıyor. *Fiyatlar her gün.*",
              big("ÜCRET: YILDA 1\nFİYAT: HER GÜN")),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "02-adaletsiz-maas",
        "title": "ADALETSİZ MAAŞ",
        "kicker": "Türkiye'deki maaş düzeni",
        "lines": hook("Adaletsiz maaşlar.", "ADALETSİZ\nMAAŞ") + [
            L("Adil ücret nedir? Çalışan birinin *insanca yaşayabilmesi.*",
              big("ADİL ÜCRET\nNEDİR?")),
            L("Ücret adaletsizse çalışan yoksullaşır, *emek değersizleşir.*",
              big("YOKSULLUK\nUMUTSUZLUK", red=True)),
            L("Net asgari ücret: *28.075 lira.*",
              stat("28.075 TL", "NET ASGARİ ÜCRET · 2026")),
            L("Dört kişilik bir ailenin açlık sınırı: *37.801 lira.*",
              bars(WAGE_BARS, 2, "TÜRK-İŞ · EYLÜL 2026")),
            L("Yani asgari ücret, *açlık sınırının bile altında.*"),
            L("Bir milletvekili maaşı ise asgari ücretin *yaklaşık on katı.*",
              stat("≈10×", "MİLLETVEKİLİ MAAŞI ÷ ASGARİ ÜCRET · 2026", count=False)),
            L("Adil ücret sadaka değil, *haktır.*", big("ADİL ÜCRET", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "03-okullarda-guvenlik",
        "title": "OKULLAR GÜVENLİ Mİ?",
        "kicker": "Okullarda önlem alınmıyor",
        "lines": hook("Okullarda güvenlik.", "OKULLAR\nGÜVENLİ Mİ?") + [
            L("Önlem almak ne demek? Kapıda görevli, giriş kontrolü, *psikolojik destek.*",
              big("GÖREVLİ\nKONTROL\nDESTEK")),
            L("Önlem alınmazsa ne olur? *Bu olur:*"),
            L("2 Mart Çekmeköy. 14 Nisan Siverek. 15 Nisan Kahramanmaraş.",
              listing(SCHOOL_ATTACKS, 3)),
            L("22 Eylül Turgutlu. 6 Ekim Başakşehir.", listing(SCHOOL_ATTACKS, 5)),
            L("Öğretmenler ve öğrenciler *hayatını kaybetti*, onlarca kişi yaralandı.",
              big("2026", "tek bir yılda", red=True)),
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
        "lines": hook("Bitmeyen okul saatleri.", "08:00 – 18:00") + [
            L("Sabah sekiz. Akşam altı. *On saat.*", CLOCK),
            L("Ders, etüt, kurs, ödev...", big("DERS\nETÜT\nKURS\nÖDEV")),
            L("Haftada 50 saat. *Bir yetişkinin yasal mesaisinden bile fazla.*",
              bars([("YETİŞKİN · YASAL SINIR", 45), ("ÖĞRENCİ · 08–18", 50)], 2,
                   "İŞ KANUNU MD. 63 · HAFTALIK EN ÇOK 45 SAAT", unit="SAAT")),
            L("Zararı ne? Uykusuzluk, stres, *tükenmişlik.*",
              big("UYKUSUZLUK\nSTRES\nTÜKENMİŞLİK", red=True)),
            L("Oyun yok. Spor yok. Ailene ayıracak vakit yok."),
            L("Çocuklarımız robot değil.", big("ROBOT\nDEĞİLİZ")),
            L("Daha kısa, *daha nitelikli* bir eğitim istiyoruz."),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "05-ic-savasa-hayir",
        "title": "İÇ SAVAŞA HAYIR",
        "kicker": "Bizi birbirimize düşürmeyin",
        "lines": hook("Kutuplaşma.", "KUTUPLAŞMA") + [
            L("Kutuplaşma ilerlerse ne olur? En kötüsü: *iç savaş.*", big("İÇ SAVAŞ", red=True)),
            L("Yani bir ülkenin insanlarının *birbirine düşman* olması.",
              big("KARDEŞ\nKARDEŞE")),
            L("Sınırımızın ötesinde, Suriye'de iç savaş *13 yıl* sürdü.",
              stat("13 YIL", "SURİYE · 2011–2024")),
            L("Yüz binlerce insan öldü. Milyonlar evini terk etti.",
              big("YÜZ BİNLERCE ÖLÜ\nMİLYONLARCA GÖÇ")),
            L("İç savaş bir günde başlamaz. Önce dil sertleşir.", big("NEFRET DİLİ", red=True)),
            L("Türk, Kürt, Alevi, Sünni... Biz ve onlar diye ayrılırız.",
              {"kind": "split", "left": "BİZ", "right": "ONLAR"}),
            L("Kutuplaşmaya hayır. *İç savaşa hayır. Barışa evet.*", big("BARIŞ", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "06-plansiz-goc",
        "title": "PLANSIZ GÖÇ",
        "kicker": "Mülteci politikası",
        "lines": hook("Plansız göç.", "PLANSIZ\nGÖÇ") + [
            L("Göç politikası nedir? Kimin, nasıl ve ne kadar geleceğinin *planlanması.*",
              big("KİM?\nNASIL?\nNE KADAR?")),
            L("Türkiye, yıllarca dünyada en çok mülteci barındıran ülke oldu.",
              big("DÜNYADA\n1 NUMARA", "BMMYK · KÜRESEL EĞİLİMLER RAPORLARI")),
            L("Bugün hâlâ *2,2 milyonu aşkın* Suriyeli geçici koruma altında.",
              stat("2,2 MİLYON+", "GEÇİCİ KORUMA · GÖÇ İDARESİ · 2026", count=False)),
            L("Kayıt dışı göçün gerçek boyutu ise *belirsiz.*", big("KAYIT DIŞI\n?", red=True)),
            L("Plan yoksa kira artar, ucuz emek sömürülür, *gerginlik büyür.*",
              big("KİRA\nSÖMÜRÜ\nGERGİNLİK")),
            L("Mesele insanlar değil. *Mesele plansızlık.*", big("PLANSIZLIK", red=True)),
            L("Şeffaf, planlı ve insani bir göç politikası istiyoruz.",
              big("ŞEFFAF\nPLANLI\nİNSANİ")),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "07-siyasi-baski",
        "title": "İRADEYE SAYGI",
        "kicker": "Siyasi baskılar",
        "lines": hook("Siyasi baskılar.", "SİYASİ\nBASKI") + [
            L("Demokrasi nedir? Ülkeyi kimin yöneteceğine *halkın sandıkta* karar vermesi.",
              big("SANDIK", "demokrasi")),
            L("Halkın seçtiği İstanbul Büyükşehir Belediye Başkanı, *Mart 2025'ten beri tutuklu.*",
              big("TUTUKLU", "SEÇİLMİŞ İBB BAŞKANI · MART 2025'TEN BERİ", red=True)),
            L("Seçilmiş başkanların yerine *kayyumlar* atandı.", big("KAYYUM")),
            L("Ana muhalefetin kurultayı *mutlak butlan* denilerek iptal edildi.",
              big("MUTLAK\nBUTLAN", "İSTİNAF KARARI · 21 MAYIS 2026")),
            L("Muhalif bir televizyona kayyum atandı, *yayını durduruldu.*",
              big("YAYIN\nDURDU", "14 EKİM 2026", red=True)),
            L("Siyaset mahkemede belirlenirse, *oyunun anlamı kalmaz.*",
              big("SANDIK MI?\nMAHKEME Mİ?")),
            L("Halkın iradesine *saygı* istiyoruz.", big("İRADEYE\nSAYGI", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "08-yasaklar",
        "title": "YASAKLAR",
        "kicker": "Gelen yasaklar",
        "lines": hook("Bitmeyen yasaklar.", "YASAKLAR") + [
            L("Instagram: *dokuz gün* erişim engeli.", stamp(["INSTAGRAM"], "AĞUSTOS 2024"),
              say="İnstagram: dokuz gün erişim engeli."),
            L("Roblox. Discord. *Erişim engeli.*", stamp(["ROBLOX", "DISCORD"], "2024"),
              say="Robloks. Diskord. Erişim engeli."),
            L("Mart 2025: İstanbul'da eylem yasağı, sosyal medyaya *bant daraltma.*",
              big("EYLEM\nYASAĞI", "İSTANBUL · MART 2025", red=True)),
            L("2026: on beş yaş altına *sosyal medya yasağı.*",
              stat("15 YAŞ ALTI", "SOSYAL MEDYA YASAĞI · 7578 SAYILI KANUN", count=False)),
            L("Yasakların zararı ne? Sorun çözülmez, *sorunu konuşan susturulur.*",
              big("SUSTURMAK", red=True)),
            L("Yasaklarla bir gençlik susturulamaz."),
            L("Özgürlük bir lütuf değil, *haktır.*", big("ÖZGÜRLÜK")),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "09-gecim-derdi",
        "title": "GEÇİNEMİYORUZ",
        "kicker": "Mali geçim",
        "lines": hook("Geçim derdi.", "GEÇİM\nDERDİ") + [
            L("Geçinmek nedir? Kirayı, mutfağı, faturayı *ay sonuna kadar* çıkarabilmek.",
              big("KİRA\nMUTFAK\nFATURA")),
            L("Biz ayın sonunu değil, *ortasını* getiremiyoruz.", big("AYIN\nORTASI", red=True)),
            L("Bekâr bir çalışanın aylık yaşam maliyeti: *48.884 lira.*",
              bars([("YAŞAM MALİYETİ · BEKÂR", 48884), ("NET ASGARİ ÜCRET", 28075)], 1,
                   "TÜRK-İŞ · EYLÜL 2026")),
            L("Asgari ücret ise *28.075 lira.*",
              bars([("YAŞAM MALİYETİ · BEKÂR", 48884), ("NET ASGARİ ÜCRET", 28075)], 2,
                   "TÜRK-İŞ · EYLÜL 2026")),
            L("Geçinemeyince gençler evden çıkamaz, aileler *borçla* yaşar.",
              big("KREDİ KARTIYLA\nYAŞAM")),
            L("Biz lüks istemiyoruz. *İnsanca yaşamak istiyoruz.*", big("İNSANCA\nYAŞAM", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "10-polis-ve-protesto",
        "title": "POLİS VE PROTESTO",
        "kicker": "Polislerin protestoculara tavrı",
        "lines": hook("Polisin protestocuya tavrı.", "POLİS VE\nPROTESTO") + [
            L("Protesto hakkı nedir? Anayasa, madde 34:",
              quote("Herkes, önceden izin almaksızın, silahsız ve saldırısız toplantı "
                    "ve gösteri yürüyüşü düzenleme hakkına sahiptir.",
                    "T.C. ANAYASASI · MADDE 34")),
            L("Herkes, önceden izin almaksızın, silahsız ve saldırısız toplantı ve gösteri yürüyüşü "
              "düzenleme *hakkına sahiptir.*"),
            L("Peki sahada ne oldu? Biber gazı, tazyikli su, *plastik mermi.*",
              big("BİBER GAZI\nTAZYİKLİ SU\nPLASTİK MERMİ", "SARAÇHANE · MART 2025")),
            L("İçişleri Bakanlığı'na göre *1.879 gözaltı*, 260 tutuklama.",
              stat("1.879", "GÖZALTI · İÇİŞLERİ BAKANLIĞI · MART 2025", sub="260 TUTUKLAMA")),
            L("Sonra mahkeme, yargılanan 87 kişiyi *beraat* ettirdi.",
              stat("87 BERAAT", "SARAÇHANE DAVASI · İSTANBUL 62. ASLİYE CEZA")),
            L("Polis halkın karşısında değil, *yanında* olmalı.", big("HALKIN\nYANINDA", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "11-verilen-cezalar",
        "title": "VERİLEN CEZALAR",
        "kicker": "Düşüncenin bedeli",
        "lines": hook("Verilen cezalar.", "VERİLEN\nCEZALAR") + [
            L("Ceza neden verilir? Suçu önlemek ve *adaleti sağlamak* için.",
              big("CEZA\nNEDEN VAR?")),
            L("Ama bugün bir paylaşım, bir slogan, bir haber bile yetiyor.",
              big("PAYLAŞIM\nSLOGAN\nHABER")),
            L("Gazeteci Alican Uludağ, paylaşımları yüzünden *tutuklandı*, üç ay cezaevinde kaldı.",
              stat("3 AY", "GAZETECİ · CEZAEVİNDE · ŞUBAT–MAYIS 2026")),
            L("Saraçhane'de gözaltına alınan 87 kişi aylarca yargılandı, sonunda *beraat* etti.",
              big("BERAAT", "AMA AYLAR SONRA")),
            L("Ceza bazen hükümle değil, *sürecin kendisiyle* veriliyor.",
              big("SÜREÇ\nCEZASI", red=True)),
            L("Ceza adalet içindir. *Gözdağı için değil.*", big("GÖZDAĞI\nDEĞİL", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "12-adalet-nerede",
        "title": "ADALET NEREDE?",
        "kicker": "Adaletin olmadığı bir ülke",
        "lines": hook("Adalet.", "ADALET\nNEREDE?") + [
            L("Hukukun üstünlüğü nedir? Kuralların *herkese eşit* uygulanması.", SCALE),
            L("Dünya Adalet Projesi'ne göre Türkiye, 143 ülke arasında *118'inci.*",
              stat("118 / 143", "WJP HUKUKUN ÜSTÜNLÜĞÜ ENDEKSİ · 2025")),
            L("Temel haklarda *134'üncü.*", stat("134.", "TEMEL HAKLAR")),
            L("Adalet yoksa ne olur? *Kimse güvende değildir.*", big("KİMSE\nGÜVENDE DEĞİL")),
            L("Bugün gazeteci. Yarın öğrenci. *Öbür gün sen.*",
              big("BUGÜN O\nYARIN SEN", red=True)),
            L("Bağımsız yargı, *eşit hukuk* istiyoruz.", big("BAĞIMSIZ\nYARGI")),
            L(CTA, CTA_CARD),
        ],
    },
    {
        "slug": "13-protestoda-guvenlik",
        "title": "PROTESTODA GÜVENLİK",
        "kicker": "Barışçıl yürüyüş rehberi",
        "lines": [
            L("Protestoya gitmek istiyorsun ama korkuyorsun.", big("KORKUYOR\nMUSUN?"),
              pause=0.2, pace=0.86),
            L("Korkma. *Hazırlan.*", big("KORKMA\nHAZIRLAN", red=True), pause=0.2, pace=0.86),
            L("Silahsız ve saldırısız yürüyüş, *Anayasa'ya göre hakkın.*",
              big("YÜRÜMEK\nHAKKIMIZ", "ANAYASA MD. 34")),
            L("En az 48 saat önce valiliğe *bildirim ver.*",
              stat("48 SAAT", "ÖNCEDEN BİLDİRİM · 2911 SAYILI KANUN MD. 10", count=False)),
            L("Silah ya da yüz örtmek, toplantıyı kanuna aykırı yapar. *Şiddet de bahane olur.*",
              big("SİLAH YOK\nŞİDDET YOK", "2911 SAYILI KANUN MD. 23", red=True)),
            L("Gözün için yüzme gözlüğü tak. Lens takma, yağlı krem sürme.",
              big("YÜZME\nGÖZLÜĞÜ", "LENS YOK · YAĞLI KREM YOK")),
            L("Cildini kapat. Kalın kıyafet, rahat ayakkabı giy.",
              big("KALIN\nKIYAFET")),
            L("Gaz yersen gözünü ovma. *On dakika bol suyla yıka.*",
              big("OVMA\nSUYLA YIKA", "10 DAKİKA", red=True)),
            L("Su, kimlik, şarjlı telefon al. Avukat numarasını koluna yaz.",
              big("SU · KİMLİK\nŞARJ · AVUKAT")),
            L("Arkadaşlarınla git. Çıkış yolunu bil.", big("YALNIZ\nGİTME")),
            L("Ortam gerilirse sakin kal, *kenara çekil.*",
              big("SAKİN KAL\nKENARA ÇEKİL")),
            L("Provokasyona gelme. *Gücümüz barışçıl kalabalık.*",
              big("BARIŞÇIL\nKALABALIK", red=True)),
            L(CTA, CTA_CARD),
        ],
    },
]
