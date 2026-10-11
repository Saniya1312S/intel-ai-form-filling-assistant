# Project Notes

Design notes, extraction rules and test observations for the AI-Powered Form Filling Assistant.

## 1. Design decisions

| Decision | Reason |
|---|---|
| Regex-based extraction instead of an ML NER model | Identity numbers (PAN, Aadhaar, PIN) have fixed formats, so rules are fast, transparent and need no training data |
| Human review step before PDF fill | OCR and heuristics are imperfect, so the user confirms or corrects every field |
| ReportLab overlay + `pypdf` merge | Works on any flat PDF template without needing AcroForm fields |
| Flask + plain JS frontend | Minimal setup; the whole flow is easy to read and demo |
| Optional modules (Vosk, spaCy, transformers) | Core flow stays lightweight; heavy dependencies are opt-in |

## 2. Data flow

```
image file
  -> OpenCV: grayscale -> median blur (3) -> Otsu threshold
  -> Tesseract (pytesseract.image_to_string, lang="eng")
  -> raw text
  -> regex extraction -> { name, dob, aadhaar, pan, pincode, address }
  -> user edits fields in the UI
  -> ReportLab overlay (key: value lines) merged onto templates/<form>.pdf
  -> output/filled_<form>.pdf (downloaded by the browser)
```

## 3. Extracted fields and patterns

| Key | Pattern idea | Example value |
|---|---|---|
| `name` | `Name` label followed by 1-4 capitalised words | `SAMPLE PERSON` |
| `dob` | Two digits, separator, two digits, separator, four digits | `01-01-1990` |
| `aadhaar` | 12 digits as 4-4-4, separators stripped | `999900001111` |
| `pan` | `[A-Z]{5}[0-9]{4}[A-Z]` | `ABCDE9999F` |
| `pincode` | Standalone 6 digits | `560001` |
| `address` | Text after `Address` label | `123 Fctona Lane` (OCR-noisy) |

## 4. Test observations (bundled fictional samples)

| Sample | Reliable | Needs manual correction |
|---|---|---|
| `sample_aadhaar.png` | dob, aadhaar, pincode | name (trailing `DOB` captured), address (OCR noise, truncated at `.`) |
| `sample_pan.png` | dob, pan, pincode | name (trailing `Father` captured), address (OCR noise, truncated at `.`) |

Filling works end to end for all four templates. The overlay is placed at fixed coordinates, so values may overlap the template's printed labels.

## 5. Ideas for evaluation

- Build a small labelled set of synthetic ID images (varied fonts, noise, rotation)
- Measure per-field exact-match accuracy for regex vs. spaCy / transformer NER
- Compare preprocessing variants (adaptive threshold, deskew, upscaling) on OCR quality

## 6. Live demo (GitHub Pages)

- Hosted from the repository root (`index.html`, `demo/`, `templates/`, `sample_docs/`), so no files are duplicated.
- `demo/extract.js` ports the regex rules from `backend/ner_module.py`; name and address stop at line ends and father's name / gender are added.
- `demo/fill.js` writes each value beside its template label (label positions measured from the template PDFs) using pdf-lib.
- Verified outside the browser: the extraction rules on the OCR text from the Python run, and PDF filling of all four templates. The in-browser OCR step needs Tesseract.js from a CDN, so check it on the deployed site.
