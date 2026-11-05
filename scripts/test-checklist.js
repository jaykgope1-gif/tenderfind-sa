// Checks scripts/lib/checklist.js ("What you'll need to submit") on small pieces of text shaped like real tender
// documents. The rule: list only what the text says, keep the evidence, and say so when nothing can be read.
//   node scripts/test-checklist.js
const assert = require("assert");
const { findReturnables } = require("./lib/checklist");

const pad = "Tender document. ".repeat(20); // real documents have plenty of other text around the list
const keys = (r) => r.items.map((i) => i.key);

// 1. A returnables table (Johannesburg Water style): every listed document, with the line it came from.
const table = findReturnables([`${pad}
ADMINISTRATIVE REQUIREMENTS
PLEASE SUPPLY THE FOLLOWING DOCUMENTS TO ENABLE US TO EVALUATE YOUR SUBMISSION:
Returnable Documents Description Yes/No
1 Original Valid Tax Clearance Certificate /valid SARS PIN COMPULSORY
2 A certified BBBEE certificate /affidavit COMPULSORY
3 Municipal rates and taxes (Must not be older than 90 days in arrears) COMPULSORY
4 Signed Declaration of Interest form (MBD 4) COMPULSORY
5 Declaration of Bidders past supply chain management practices (MBD 8) COMPULSORY
6 Certificate of Independent Proposal Determination (MBD 9) COMPULSORY
7 Proof of CSD registration /MAAA Supplier Number COMPULSORY
8 Company registration documents with ID copies of directors COMPULSORY
${pad}`]);
assert.strictEqual(table.status, "found");
assert.strictEqual(table.section, true, "found inside a returnables list");
assert.deepStrictEqual(keys(table), ["mbd-4", "mbd-8", "mbd-9", "csd", "tax", "bbbee", "company", "id", "rates"], "forms first, then documents, in a fixed order");
assert.ok(table.items.every((i) => i.snippet && i.snippet.length <= 160), "every item keeps a short piece of evidence");
assert.ok(table.items.find((i) => i.key === "mbd-4").snippet.includes("Declaration of Interest"), "evidence is the document's own line");
assert.ok(table.items.filter((i) => /^(sbd|mbd)-/.test(i.key)).every((i) => /^(SBD|MBD) [\d.]+ form$/.test(i.label)), "form labels are the code only, never a name we made up");

// 2. A table of contents mentions "Returnable Documents" but lists nothing: that alone is not a list.
const toc = findReturnables([`${pad}\nPart T2 Returnable Documents\nT2.1 List of Returnable Documents\nT2.2 Returnable Schedules\nThe Contract\nPart C1: Agreement and Contract Data\n${pad}`]);
assert.strictEqual(toc.status, "none-found", "a table of contents is not a list");

// 3. No list, but the standard forms are in the pack: only those forms, marked as not from a list.
const forms = findReturnables([`${pad}\nSBD 4 BIDDER'S DISCLOSURE\n1. PURPOSE OF THE FORM\n${pad}\nSBD 6.1 PREFERENCE POINTS CLAIM FORM IN TERMS OF THE PREFERENTIAL PROCUREMENT REGULATIONS 2022\nThe CIDB grading table: 1GB 2GB 3GB 4GB\n${pad}`]);
assert.strictEqual(forms.status, "found");
assert.strictEqual(forms.section, false);
assert.deepStrictEqual(keys(forms), ["sbd-4", "sbd-6.1"], "outside a list, only SBD/MBD forms count (not CIDB from a grading table)");

// 4. "Not applicable" lines and forms only the winner signs later are left out.
const na = findReturnables([`${pad}
Returnable documents checklist:
1. SBD 1 Invitation to bid
2. SBD 4 Bidder's disclosure
3. Tax compliance status PIN
4. Joint venture agreement: Not applicable
5. PSIRA registration: N/A
THE SUCCESSFUL BIDDER WILL BE REQUIRED TO FILL IN AND SIGN A WRITTEN CONTRACT FORM
(SBD 7.1).
${pad}`]);
assert.deepStrictEqual(keys(na), ["sbd-1", "sbd-4", "tax"], "not-applicable items and the winner's contract form are left out");

// 5. Nothing readable (scanned, no PDF, download error): say so, never guess.
assert.deepStrictEqual(findReturnables([]), { status: "unreadable", section: false, items: [] });
assert.strictEqual(findReturnables(["   \n  "]).status, "unreadable", "a scanned page has no text");
assert.strictEqual(findReturnables([`${pad}\nThe scope of work is the cleaning of offices.\n${pad}`]).status, "none-found", "read, but no list");

// 6. Look-alikes don't count: "ASBD 4", "SBD 44", a COIDA guess from a PSIRA letter, a "registration number" field.
const look = findReturnables([`${pad}
List of returnable documents:
ASBD 4 is not a form. SBD 44 is not one either.
Letter of Good Standing with PSIRA
Company registration number: ..........
Tax clearance certificate
CSD supplier number (MAAA)
SBD 9 Certificate of independent bid determination
${pad}`]);
assert.ok(!keys(look).includes("sbd-4") && !keys(look).includes("sbd-44"), "codes inside other words or longer numbers");
assert.ok(!keys(look).includes("coida"), "a PSIRA letter of good standing is not a COIDA letter");
assert.ok(!keys(look).includes("company"), "a registration number field is not a registration document");
assert.deepStrictEqual(keys(look), ["sbd-9", "csd", "tax", "psira"]);

// 7. Professional bodies are named as the document names them.
const prof = findReturnables([`${pad}\nMandatory documents:\n1. ECSA registration of the engineer\n2. SACPCMP registration of the safety agent\n3. Tax compliance status PIN\n4. CSD report\n${pad}`]);
assert.ok(prof.items.some((i) => i.label === "Professional registration (ECSA, SACPCMP)"));
// …and a stretch with fewer than 3 known items is a mention, not a list.
assert.strictEqual(findReturnables([`${pad}\nMandatory documents: ECSA registration and a tax PIN.\n${pad}`]).status, "none-found");

console.log("test-checklist: all checks passed");
