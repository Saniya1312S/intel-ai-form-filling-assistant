import os
try:
    from vosk import Model, KaldiRecognizer
    import wave, json
    VOSK_AVAILABLE = True
except Exception:
    VOSK_AVAILABLE = False

def transcribe(wav_path):
    if not VOSK_AVAILABLE:
        raise RuntimeError('Vosk not installed or unavailable. Install vosk and models to enable speech transcription.')
    # expects wav file PCM 16khz mono
    wf = wave.open(wav_path, "rb")
    if wf.getnchannels() != 1 or wf.getsampwidth() != 2:
        raise RuntimeError('Audio must be WAV PCM mono 16-bit. Convert before sending.')
    model = Model(lang="en-us")  # user should download appropriate model
    rec = KaldiRecognizer(model, wf.getframerate())
    results = []
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            res = rec.Result()
            results.append(res)
    results.append(rec.FinalResult())
    # combine JSON fragments
    texts = []
    for r in results:
        try:
            jr = json.loads(r)
            if 'text' in jr:
                texts.append(jr['text'])
        except Exception:
            pass
    return ' '.join(texts)
