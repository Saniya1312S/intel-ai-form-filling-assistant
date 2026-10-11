/*
 * Browser PDF filler (pdf-lib). Same idea as backend/form_module.py, but each
 * value is written on its own line next to the matching label in the template
 * instead of a fixed list of "key: value" lines.
 */
(function (root) {
  const PAGE_H = 841.89;
  const VALUE_X = 165;
  // [field key, label top y in points measured from the top of the page]
  const LAYOUT = {
    'passport_form.pdf': [['name', 73.27], ['dob', 103.27], ['aadhaar', 133.27], ['address', 163.27]],
    'voter_id_form.pdf': [['name', 73.27], ['dob', 103.27], ['address', 133.27], ['pincode', 163.27]],
    'aadhaar_form.pdf':  [['name', 73.27], ['dob', 103.27], ['aadhaar', 133.27], ['gender', 163.27], ['address', 193.27], ['pincode', 223.27]],
    'pan_form.pdf':      [['name', 73.27], ['father', 103.27], ['pan', 133.27], ['dob', 163.27], ['address', 193.27], ['pincode', 223.27]]
  };

  const clean = (s) => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').replace(/[^\x20-\xFF]/g, '?').trim();

  function wrap(text, font, size, maxW) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (font.widthOfTextAtSize(t, size) > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }

  async function fillTemplate(PDFLib, templateBytes, templateName, fields) {
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const doc = await PDFDocument.load(templateBytes);
    const font = await doc.embedStandardFont(StandardFonts.Helvetica);
    const page = doc.getPages()[0];
    const maxW = page.getWidth() - VALUE_X - 40;
    for (const [key, top] of (LAYOUT[templateName] || [])) {
      const value = clean(fields[key]);
      if (!value) continue;
      const lines = wrap(value, font, 10, maxW).slice(0, 2);
      lines.forEach((ln, i) => {
        page.drawText(ln, { x: VALUE_X, y: PAGE_H - (top + 9) - i * 12, size: 10, font, color: rgb(0.05, 0.15, 0.55) });
      });
    }
    return doc.save();
  }

  const api = { fillTemplate, LAYOUT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FormFill = api;
})(typeof window !== 'undefined' ? window : globalThis);
