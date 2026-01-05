# AI-Powered Form Filler - Demo (Mini Project)

This repository is a compact, runnable demo of an AI-powered form filling assistant. It demonstrates:
- Uploading scanned documents (images/PDF)
- OCR (via Tesseract/pytesseract)
- Lightweight entity extraction (regex heuristics; optional spaCy/transformers integration)
- Filling a PDF template with extracted fields (overlay method using ReportLab + pypdf)
- Simple web UI for review and download

**Important:** This is a demo project intended for local experimentation. For production-quality systems consider stronger OCR models, NER fine-tuning, security, and robust PDF form field handling (AcroForms).

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

## Setup (local)

1. Install system dependencies:
   - **Tesseract OCR** (required for OCR). On Ubuntu: `sudo apt install tesseract-ocr`
   - (Optional) install Hindi traineddata: place `hin.traineddata` into Tesseract's `tessdata` directory
   - (Optional) Poppler for PDF->image conversion: `sudo apt install poppler-utils`

2. Create a Python virtual environment and install dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r backend/requirements.txt
   ```

3. Run the Flask app:
   ```bash
   cd backend
   python app.py
   ```
   The app runs on `http://0.0.0.0:7860/` by default.

4. Open the web UI by visiting `http://localhost:7860/` in your browser. Upload `sample_docs/sample_passport.png` and click **Upload & Extract**. After review, choose a template and click **Fill PDF & Download**.

## Notes and next steps
- The current NER is heuristic regex-based. For higher accuracy (>90%) integrate spaCy/en_core_web_sm or fine-tuned transformer-based NER (e.g., AI4Bharat IndicNER)
- For forms that have real AcroForm fields, use `pypdf`'s `update_page_form_field_values` instead of overlay merging.
- Speech support requires Vosk models and WAV (PCM) audio; the speech module contains a stub that uses Vosk if installed.
- Consider adding file-type checks, PDF page extraction, image preprocessing, and unit tests.
