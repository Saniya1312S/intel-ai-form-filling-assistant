# AI-Powered Form Filler 

This repository is a compact, runnable demo of an AI-powered form filling assistant. It demonstrates:
- Uploading scanned documents (images/PDF)
- OCR (via Tesseract/pytesseract)
- Lightweight entity extraction (regex heuristics; optional spaCy/transformers integration)
- Filling a PDF template with extracted fields (overlay method using ReportLab + pypdf)
- Simple web UI for review and download


## Project structure

```
form-filler-project/
├── backend/
│   ├── app.py              # Main Flask app defining API endpoints
│   ├── ocr_module.py       # Functions for OCR (uses pytesseract + OpenCV)
│   ├── ner_module.py       # NER pipeline (spaCy & regex heuristics)
│   ├── speech_module.py    # Speech recognition (Vosk stub - optional)
│   ├── form_module.py      # PDF loading/filling (using ReportLab + pypdf)
│   └── requirements.txt    # pip dependencies
├── frontend/
│   ├── index.html          # Upload form, preview UI
│   ├── main.js             # JS for handling file uploads, AJAX, audio
│   └── style.css           # Basic CSS
├── templates/              # PDF form templates (sample)
│   ├── passport_form.pdf
│   └── voter_id_form.pdf
├── sample_docs/            # Sample scanned documents
│   ├── sample_passport.png
│   └── sample_address_proof.pdf
└── README.md
```
g.
- Speech support requires Vosk models and WAV (PCM) audio; the speech module contains a stub that uses Vosk if installed.
- Consider adding file-type checks, PDF page extraction, image preprocessing, and unit tests.
