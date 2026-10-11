/*
 * Browser port of backend/ner_module.py (regex entity extraction).
 * Same rules for dob / aadhaar / pan / pincode.
 * Demo-only differences: name and address stop at the end of the line
 * (the Python regex can run across line breaks), and "father" and "gender"
 * are also extracted so the PAN and Aadhaar templates can be filled.
 */
(function (root) {
  function extractEntities(text) {
    if (!text) return {};
    const data = {};

    let m = text.match(/\bName[ \t]*[:\-]?[ \t]*([A-Z][a-zA-Z]+(?:[ \t]+[A-Z][a-zA-Z]+){0,3})/);
    if (m) {
      data.name = m[1].trim();
    } else {
      const m2 = text.match(/([A-Z][a-z]+[ \t]+[A-Z][a-z]+)/);
      if (m2) data.name = m2[1].trim();
    }

    m = text.match(/Father'?s?[ \t]*Name[ \t]*[:\-]?[ \t]*([A-Z][a-zA-Z]+(?:[ \t]+[A-Z][a-zA-Z]+){0,3})/);
    if (m) data.father = m[1].trim();

    m = text.match(/\b(\d{2}[\-\/]\d{2}[\-\/]\d{4})\b/);
    if (m) data.dob = m[1];

    m = text.match(/(\d{4}[\s-]?\d{4}[\s-]?\d{4})/);
    if (m) data.aadhaar = m[1].replace(/[\s-]/g, '');

    m = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
    if (m) data.pan = m[1];

    m = text.match(/\b(FEMALE|MALE|TRANSGENDER)\b/i);
    if (m) data.gender = m[1].toUpperCase();

    m = text.match(/\b(\d{6})\b/);
    if (m) data.pincode = m[1];

    m = text.match(/Address[ \t]*[:\-]?[ \t]*([^\n]{10,200})/);
    if (m) data.address = m[1].trim();

    return data;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { extractEntities };
  else root.extractEntities = extractEntities;
})(typeof window !== 'undefined' ? window : globalThis);
