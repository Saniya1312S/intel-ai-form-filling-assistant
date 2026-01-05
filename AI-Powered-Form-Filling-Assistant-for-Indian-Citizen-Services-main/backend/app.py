from flask import Flask, request, jsonify, send_file, render_template_string
from werkzeug.utils import secure_filename
import os
from pathlib import Path
from backend import ocr_module, ner_module, form_module, speech_module

app = Flask(__name__, static_folder='../frontend', template_folder='../frontend')
UPLOAD_DIR = Path(__file__).resolve().parent.parent / 'sample_docs'
OUTPUT_DIR = Path(__file__).resolve().parent.parent / 'output'
OUTPUT_DIR.mkdir(exist_ok=True)

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/upload', methods=['POST'])
def upload():
    f = request.files.get('file')
    if not f:
        return jsonify({'error': 'no file uploaded'}), 400
    filename = secure_filename(f.filename)
    save_path = UPLOAD_DIR / filename
    f.save(save_path)
    try:
        text = ocr_module.extract_text(str(save_path))
        entities = ner_module.extract_entities(text)
        return jsonify({'text': text, 'entities': entities})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    f = request.files.get('file')
    if not f:
        return jsonify({'error': 'no audio uploaded'}), 400
    filename = secure_filename(f.filename)
    save_path = UPLOAD_DIR / filename
    f.save(save_path)
    try:
        text = speech_module.transcribe(str(save_path))
        entities = ner_module.extract_entities(text)
        return jsonify({'text': text, 'entities': entities})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/fill_pdf', methods=['POST'])
def fill_pdf():
    data = request.json or {}
    template = data.get('template', 'passport_form.pdf')
    fields = data.get('fields', {})
    templates_dir = Path(__file__).resolve().parent.parent / 'templates'
    template_path = templates_dir / template
    if not template_path.exists():
        return jsonify({'error': f'template {template} not found'}), 400
    out = OUTPUT_DIR / f'filled_{template}'
    try:
        form_module.fill_pdf(str(template_path), str(out), fields)
        return send_file(str(out), as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run development server
    app.run(host='0.0.0.0', port=7860, debug=True)
