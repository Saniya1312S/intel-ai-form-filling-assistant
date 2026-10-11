/* Live demo glue: upload -> preprocess -> OCR (Tesseract.js) -> extract -> review -> fill PDF (pdf-lib) */
(function () {
  const $ = (id) => document.getElementById(id);
  const fileInput = $('file-input'), dropZone = $('drop-zone'), runBtn = $('run-btn');
  const fieldsForm = $('fields-form'), fillBtn = $('fill-btn'), copyBtn = $('copy-json');
  const downloadLink = $('download-link'), statusText = $('status-text');
  let currentFile = null, currentName = '', lastEntities = {}, pdfUrl = null, worker = null;

  const STEPS = ['upload', 'prep', 'ocr', 'extract', 'review', 'fill'];
  function setStep(name, state) {
    const el = document.querySelector('.step[data-step="' + name + '"]');
    if (el) { el.classList.remove('active', 'done'); if (state) el.classList.add(state); }
  }
  function resetSteps() { STEPS.forEach((s) => setStep(s, null)); }
  function progress(p, text) {
    $('progress-wrap').style.display = p == null ? 'none' : 'block';
    if (p != null) $('progress-bar').style.width = Math.round(p * 100) + '%';
    statusText.textContent = text || '';
  }

  /* ---------- upload ---------- */
  function setFile(file, label) {
    currentFile = file; currentName = label || file.name;
    const url = URL.createObjectURL(file);
    $('preview-image').src = url;
    $('preview-card').style.display = 'block';
    runBtn.disabled = false;
    resetSteps(); setStep('upload', 'done');
    statusText.textContent = currentName + ' ready.';
  }
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => { if (e.target.files[0]) setFile(e.target.files[0]); });
  ['dragenter', 'dragover'].forEach((ev) => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.remove('over'); }));
  dropZone.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) setFile(f); });

  document.querySelectorAll('[data-sample]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const path = btn.getAttribute('data-sample');
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const blob = await res.blob();
        setFile(new File([blob], path.split('/').pop(), { type: 'image/png' }));
        runPipeline();
      } catch (err) { alert('Could not load sample: ' + err.message); }
    });
  });

  $('clear-btn').addEventListener('click', () => {
    currentFile = null; lastEntities = {}; fileInput.value = ''; runBtn.disabled = true;
    $('preview-card').style.display = 'none'; $('log-card').style.display = 'none'; $('pdf-card').style.display = 'none';
    fieldsForm.innerHTML = '<div class="col-12 text-muted">No document processed yet.</div>';
    ['stat-conf', 'stat-fields', 'stat-time'].forEach((id) => ($(id).textContent = '–'));
    fillBtn.disabled = true; copyBtn.disabled = true; downloadLink.classList.add('disabled');
    resetSteps(); progress(null, '');
  });

  /* ---------- preprocessing (grayscale + Otsu, mirrors ocr_module.py) ---------- */
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => reject(new Error('Could not read image'));
      img.src = url;
    });
  }
  async function preprocess(file) {
    const img = await loadImage(file);
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height); const px = d.data;
    const gray = new Uint8Array(c.width * c.height); const hist = new Array(256).fill(0);
    for (let i = 0, j = 0; i < px.length; i += 4, j++) {
      const g = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
      gray[j] = g; hist[g]++;
    }
    const total = gray.length; let sum = 0; for (let t = 0; t < 256; t++) sum += t * hist[t];
    let sumB = 0, wB = 0, best = 0, thr = 127;
    for (let t = 0; t < 256; t++) {
      wB += hist[t]; if (!wB) continue;
      const wF = total - wB; if (!wF) break;
      sumB += t * hist[t];
      const mB = sumB / wB, mF = (sum - sumB) / wF, v = wB * wF * (mB - mF) * (mB - mF);
      if (v > best) { best = v; thr = t; }
    }
    for (let i = 0, j = 0; i < px.length; i += 4, j++) { const v = gray[j] > thr ? 255 : 0; px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255; }
    ctx.putImageData(d, 0, 0);
    return c;
  }

  /* ---------- pipeline ---------- */
  async function runPipeline() {
    if (!currentFile) return;
    if (typeof Tesseract === 'undefined') { alert('Tesseract.js failed to load. Check your internet connection and reload.'); return; }
    const t0 = performance.now();
    runBtn.disabled = true; resetSteps(); setStep('upload', 'done');
    try {
      let input = currentFile;
      if ($('prep-toggle').checked) {
        setStep('prep', 'active'); progress(0.05, 'Preprocessing image…');
        input = await preprocess(currentFile);
      }
      setStep('prep', 'done'); setStep('ocr', 'active');
      progress(0.1, 'Loading OCR engine (first run downloads language data)…');
      if (!worker) {
        worker = await Tesseract.createWorker('eng', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') progress(0.2 + 0.75 * m.progress, 'Recognizing text… ' + Math.round(m.progress * 100) + '%');
          }
        });
      }
      const { data } = await worker.recognize(input);
      setStep('ocr', 'done'); setStep('extract', 'active');
      const text = data.text || '';
      const entities = window.extractEntities(text);
      setStep('extract', 'done');

      $('raw-text').textContent = text; $('log-card').style.display = 'block';
      $('stat-conf').textContent = Math.round(data.confidence) + '%';
      $('stat-fields').textContent = Object.keys(entities).length;
      $('stat-time').textContent = ((performance.now() - t0) / 1000).toFixed(1) + 's';
      showFields(entities);
      if (entities.pan) $('template').value = 'pan_form.pdf';
      else if (/aadhaar/i.test(text) || entities.aadhaar) $('template').value = 'aadhaar_form.pdf';
      setStep('review', 'active'); progress(null, 'Done. Review the fields, then fill the PDF.');
    } catch (err) {
      console.error(err); progress(null, ''); alert('Processing failed: ' + err.message);
    } finally { runBtn.disabled = false; }
  }
  runBtn.addEventListener('click', runPipeline);

  /* ---------- review ---------- */
  const LABELS = { name: 'Name', father: "Father's name", dob: 'Date of birth', aadhaar: 'Aadhaar no.', pan: 'PAN', gender: 'Gender', pincode: 'PIN code', address: 'Address' };
  function showFields(entities) {
    lastEntities = entities; fieldsForm.innerHTML = '';
    const keys = Object.keys(entities);
    if (!keys.length) { fieldsForm.innerHTML = '<div class="col-12 text-muted">No fields detected. Try a clearer image, or toggle preprocessing.</div>'; return; }
    keys.forEach((k) => {
      const col = document.createElement('div'); col.className = k === 'address' ? 'col-12' : 'col-md-6';
      col.innerHTML = '<label class="form-label small text-muted mb-1"></label><input class="form-control form-control-sm">';
      col.querySelector('label').textContent = LABELS[k] || k;
      const input = col.querySelector('input'); input.name = k; input.value = entities[k] || '';
      fieldsForm.appendChild(col);
    });
    fillBtn.disabled = false; copyBtn.disabled = false;
  }
  function currentFields() {
    const out = {}; fieldsForm.querySelectorAll('input').forEach((el) => (out[el.name] = el.value)); return out;
  }
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(currentFields(), null, 2)); alert('Extracted JSON copied to clipboard'); }
    catch (e) { alert('Copy failed: ' + e.message); }
  });

  /* ---------- fill PDF ---------- */
  fillBtn.addEventListener('click', async () => {
    const template = $('template').value;
    fillBtn.disabled = true; setStep('review', 'done'); setStep('fill', 'active');
    try {
      const res = await fetch('templates/' + template);
      if (!res.ok) throw new Error('Template not found (' + res.status + ')');
      const bytes = await res.arrayBuffer();
      const out = await window.FormFill.fillTemplate(window.PDFLib, bytes, template, currentFields());
      const blob = new Blob([out], { type: 'application/pdf' });
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      pdfUrl = URL.createObjectURL(blob);
      $('pdf-frame').src = pdfUrl; $('pdf-card').style.display = 'block';
      downloadLink.href = pdfUrl; downloadLink.download = 'filled_' + template; downloadLink.classList.remove('disabled');
      setStep('fill', 'done');
      $('pdf-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) { alert('Failed to fill PDF: ' + err.message); setStep('fill', null); }
    finally { fillBtn.disabled = false; }
  });
})();
