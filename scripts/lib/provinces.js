// Buyer name -> province. The OCDS feed has no location field, so this is a fallback.
// Order: province name in buyer -> place-name keyword -> local body (unknown) -> national body.

const PROVINCE_NAMES = [
  ["Eastern Cape", /\beastern cape\b/i],
  ["Free State", /\bfree state\b/i],
  ["Gauteng", /\bgauteng\b/i],
  ["KwaZulu-Natal", /\bkwa-?\s?zulu[- ]?natal\b/i],
  ["Limpopo", /\blimpopo\b/i],
  ["Mpumalanga", /\bmpumalanga\b/i],
  ["North West", /\bnorth[- ]west\b/i],
  ["Northern Cape", /\bnorthern cape\b/i],
  ["Western Cape", /\bwestern cape\b/i],
];

// Municipalities, metros, districts, and local entities named after a place.
// Names shared by two provinces (Emalahleni, Naledi, Richmond) are only listed with a disambiguating suffix.
const PLACES = {
  "Eastern Cape": [
    "buffalo city", "nelson mandela bay", "mandela bay", "gqeberha", "port elizabeth", "east london", "mthatha",
    "amathole", "chris hani", "joe gqabi", "or tambo", "o.r. tambo", "o r tambo", "alfred nzo", "sarah baartman",
    "mbhashe", "mnquma", "great kei", "amahlathi", "ngqushwa", "raymond mhlaba", "enoch mgijima", "intsika yethu",
    "engcobo", "sakhisizwe", "inxuba yethemba", "elundini", "senqu", "walter sisulu", "ingquza hill", "ngquza hill",
    "port st johns", "nyandeni", "mhlontlo", "king sabata dalindyebo", "matatiele", "umzimvubu", "mbizana",
    "winnie madikizela-mandela", "ntabankulu", "dr beyers naude", "blue crane route", "makana", "ndlambe",
    "sundays river valley", "kouga", "koukamma", "kou-kamma", "coega",
  ],
  "Free State": [
    "mangaung", "bloemfontein", "centlec", "xhariep", "letsemeng", "kopanong", "mohokare", "lejweleputswa",
    "masilonyana", "tokologo", "tswelopele", "matjhabeng", "nala local", "thabo mofutsanyana", "setsoto", "dihlabeng",
    "nketoana", "maluti-a-phofung", "maluti a phofung", "phumelela", "mantsopa", "fezile dabi", "moqhaka", "ngwathe",
    "metsimaholo", "mafube", "welkom", "sasolburg", "kroonstad", "naledi - fs",
  ],
  Gauteng: [
    "johannesburg", "joburg", "city power", "tshwane", "pretoria", "ekurhuleni", "sedibeng", "emfuleni", "midvaal",
    "lesedi", "west rand", "mogale city", "merafong", "rand west", "rand water", "soweto", "germiston", "vereeniging",
  ],
  "KwaZulu-Natal": [
    "ethekwini", "durban", "ugu district", "umzumbe", "umuziwabantu", "ray nkonyeni", "umdoni", "umgungundlovu",
    "msunduzi", "pietermaritzburg", "umshwathi", "umngeni", "mpofana", "impendle", "mkhambathini", "richmond - kz",
    "uthukela", "okhahlamba", "inkosi langalibalele", "alfred duma", "ladysmith", "umzinyathi", "endumeni", "nquthu",
    "msinga", "umvoti", "amajuba", "newcastle", "emadlangeni", "dannhauser", "zululand", "edumbe", "uphongolo",
    "abaqulusi", "nongoma", "ulundi", "umkhanyakude", "umhlabuyalingana", "jozini", "mtubatuba", "big five hlabisa",
    "king cetshwayo", "umfolozi", "umhlathuze", "richards bay", "umlalazi", "mthonjaneni", "nkandla", "ilembe",
    "mandeni", "kwadukuza", "ndwedwe", "maphumulo", "harry gwala", "greater kokstad", "ubuhlebezwe", "umzimkhulu",
    "dr nkosazana dlamini zuma", "isimangaliso", "ezemvelo", "luthuli museum", "mhlathuze water",
  ],
  Limpopo: [
    "polokwane", "capricorn", "blouberg", "molemole", "lepelle-nkumpi", "lepelle northern water", "mopani",
    "greater giyani", "greater letaba", "greater tzaneen", "ba-phalaborwa", "maruleng", "vhembe", "thulamela",
    "musina", "makhado", "collins chabane", "waterberg", "thabazimbi", "lephalale", "bela-bela", "mogalakwena",
    "modimolle", "mookgophong", "sekhukhune", "fetakgomo", "tubatse", "makhuduthamaga", "elias motsoaledi",
    "ephraim mogale",
  ],
  Mpumalanga: [
    "mbombela", "nelspruit", "ehlanzeni", "bushbuckridge", "nkomazi", "thaba chweu", "nkangala", "emakhazeni",
    "steve tshwete", "thembisile hani", "dr js moroka", "victor khanye", "gert sibande", "albert luthuli",
    "msukaligwa", "mkhondo", "isaka seme", "lekwa local", "dipaleseng", "govan mbeki", "inkomati", "emalahleni - mp",
  ],
  "North West": [
    "bojanala", "rustenburg", "madibeng", "moses kotane", "kgetlengrivier", "moretele", "ngaka modiri molema",
    "mahikeng", "mafikeng", "ditsobotla", "ramotshere moiloa", "ratlou", "tswaing", "ruth segomotsi mompati",
    "naledi - nw", "kagisano-molopo", "mamusa", "greater taung", "lekwa-teemane", "kenneth kaunda", "jb marks",
    "matlosana", "maquassi hills", "klerksdorp", "potchefstroom",
  ],
  "Northern Cape": [
    "sol plaatje", "kimberley", "frances baard", "dikgatlong", "magareng", "phokwane", "john taolo gaetsewe",
    "joe morolong", "ga-segonyana", "gamagara", "namakwa", "richtersveld", "nama khoi", "kamiesberg", "hantam",
    "karoo hoogland", "khai-ma", "pixley ka seme", "umsobomvu", "emthanjeni", "kareeberg", "renosterberg",
    "thembelihle", "siyathemba", "siyancuma", "zf mgcawu", "dawid kruiper", "kai !garib", "kai garib", "!kheis",
    "tsantsabane", "kgatelopele", "upington",
  ],
  "Western Cape": [
    "cape town", "west coast district", "matzikama", "cederberg", "bergrivier", "saldanha bay", "swartland",
    "cape winelands", "witzenberg", "drakenstein", "stellenbosch", "breede valley", "breede-gouritz", "langeberg",
    "overberg", "theewaterskloof", "overstrand", "cape agulhas", "swellendam", "garden route", "kannaland",
    "hessequa", "mossel bay", "george municipality", "oudtshoorn", "bitou", "knysna", "central karoo", "laingsburg",
    "prince albert", "beaufort west", "iziko", "artscape", "south cape tvet", "false bay tvet", "northlink", "boland college",
  ],
};

// Towns, suburbs and well-known sites (power stations, ports, airports) that tell us where the work is when the
// buyer is a national body. Only used to read the tender's own text, never the buyer's name.
const SITES = {
  "Eastern Cape": ["gqeberha", "port elizabeth", "east london", "mthatha", "coega", "ngqura", "queenstown", "komani", "qonce", "king william's town", "makhanda", "grahamstown", "uitenhage", "kariega", "butterworth", "port alfred", "aliwal north", "mzimvubu"],
  "Free State": ["lethabo", "bethlehem", "harrismith", "parys", "bloemfontein", "sasolburg", "kroonstad", "welkom", "qwaqwa", "phuthaditjhaba"],
  Gauteng: ["megawatt park", "sunninghill", "braamfontein", "sandton", "midrand", "centurion", "kempton park", "benoni", "boksburg", "springs", "randburg", "roodepoort", "krugersdorp", "vanderbijlpark", "alberton", "hatfield", "arcadia", "rosslyn", "lanseria", "ortia", "eikenhof", "soshanguve", "mamelodi", "atteridgeville", "tembisa", "alexandra", "diepsloot", "orange farm", "pretoria", "tshwane", "johannesburg", "soweto", "germiston", "vereeniging", "ekurhuleni"],
  "KwaZulu-Natal": ["durban", "pinetown", "port shepstone", "empangeni", "howick", "king shaka", "eshowe", "richards bay", "pietermaritzburg", "newcastle", "ladysmith", "vryheid", "kokstad", "umhlanga", "stanger", "kzn"],
  Limpopo: ["matimba", "medupi", "tzaneen", "thohoyandou", "mokopane", "phalaborwa", "lephalale", "giyani", "polokwane", "musina", "louis trichardt", "bela-bela", "modimolle", "burgersfort", "jane furse"],
  Mpumalanga: ["kendal", "duvha", "matla", "kriel", "hendrina", "arnot", "komati", "camden", "grootvlei", "tutuka", "majuba", "kusile", "witbank", "emalahleni", "secunda", "standerton", "ermelo", "mbombela", "nelspruit", "white river", "barberton", "lydenburg", "mashishing", "kwamhlanga"],
  "North West": ["brits", "mahikeng", "mafikeng", "rustenburg", "potchefstroom", "klerksdorp", "vryburg", "lichtenburg", "zeerust", "schweizer reneke", "schweizer-reneke", "hartbeespoort"],
  "Northern Cape": ["kimberley", "upington", "springbok", "kuruman", "de aar", "sutherland", "kathu", "postmasburg", "alexander bay"],
  "Western Cape": ["koeberg", "cape town", "paarl", "worcester", "saldanha", "clanwilliam", "bellville", "khayelitsha", "mitchells plain", "stellenbosch", "george airport", "mossel bay", "wilderness section", "knysna", "beaufort west", "atlantis"],
};

// Said in the tender's own words: the work is spread across the country.
const NATIONWIDE = /\b(nation(al)?[- ]?wide|countrywide|country[- ]wide|all (nine |9 |the )?provinces|across (the country|south africa|all provinces)|national footprint|throughout south africa|various (sites|offices|regions) (across|throughout|in) (the country|south africa)|regional offices nationally)\b/i;

// National bodies whose tenders, when no place is named, are almost always for their head office in Gauteng.
// Site-based buyers (Eskom, Transnet, Airports Company, SANParks) are deliberately not listed.
const GAUTENG_HQ = /^national\s*-|\b(road accident fund|south african revenue service|sars|sassa|social security agency|csir|bureau of standards|sabs|national health laboratory|nhls|sanral|roads agency|development bank|dbsa|industrial development corporation|land bank|state information technology|sita|national credit regulator|national research foundation|sentech|independent communications|icasa|cipc|companies and intellectual property|armscor|denel|nersa|energy regulator|compensation fund|unemployment insurance|public investment corporation|government employees medical|sabc|broadcasting corporation|post office|council for geoscience|human sciences research|hsrc|national lotteries|national treasury|statistics south africa|stats sa|auditor-general|public protector|human rights commission|competition commission|financial sector conduct|fsca|reserve bank|national youth development|nyda|small enterprise development|sefa|national empowerment fund|construction industry development board|council for medical schemes|health products regulatory|sahpra|water research commission|agricultural research council)\b/i;

// Local bodies we couldn't place: say "Not stated" rather than guess.
const LOCAL_BODY = /\b(municipality|metro(politan)?|district|tvet|college)\b/i;

const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();

function buyerProvince(buyer) {
  if (!buyer) return null;
  const b = norm(buyer);
  for (const [p, re] of PROVINCE_NAMES) if (re.test(b)) return p;
  for (const [p, places] of Object.entries(PLACES)) if (places.some((k) => b.includes(k))) return p;
  if (LOCAL_BODY.test(b)) return null;
  return "National"; // national departments, SOEs, SETAs, regulators, agencies
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PLACE_RES = Object.entries(PLACES).map(([p, names]) => [p, new RegExp(`\\b(${[...names, ...SITES[p]].map(escapeRe).join("|")})\\b`, "i")]);

// Every province the tender's own text points to: by name, or by a municipality, town or known site in it.
function textProvinces(text) {
  const t = (text || "").replace(/\bo\.?\s?r\.?\s?tambo international\b/gi, "ortia"); // the airport (Gauteng), not the OR Tambo district (EC)
  const found = new Set(PROVINCE_NAMES.filter(([, re]) => re.test(t)).map(([p]) => p));
  for (const [p, re] of PLACE_RES) if (re.test(t)) found.add(p);
  return [...found];
}

// A single province named or implied in the tender's own description beats the buyer's location.
function descriptionProvince(text) {
  const found = textProvinces(text);
  return found.length === 1 ? found[0] : null;
}

// Where the work is, for national buyers: "nationwide" when the text says so or names 3+ provinces;
// otherwise the province of a Gauteng-based head office, when no place is named at all.
function scope(text, buyer) {
  const found = textProvinces(text);
  if (NATIONWIDE.test(text || "") || found.length >= 3) return { nationwide: true, hq: null };
  if (!found.length && GAUTENG_HQ.test((buyer || "").trim())) return { nationwide: false, hq: "Gauteng" };
  return { nationwide: false, hq: null };
}

module.exports = { buyerProvince, descriptionProvince, textProvinces, scope, PROVINCE_NAMES };
