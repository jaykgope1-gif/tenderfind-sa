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

// A province named in the tender's own description beats the buyer's location.
function descriptionProvince(text) {
  const found = PROVINCE_NAMES.filter(([, re]) => re.test(text || "")).map(([p]) => p);
  return found.length === 1 ? found[0] : null;
}

module.exports = { buyerProvince, descriptionProvince, PROVINCE_NAMES };
