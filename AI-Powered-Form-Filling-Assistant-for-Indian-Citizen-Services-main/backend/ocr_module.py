import pytesseract
import cv2
import numpy as np
from PIL import Image
import tempfile

def preprocess_image(img_path):
    img = cv2.imread(img_path, cv2.IMREAD_COLOR)
    if img is None:
        raise FileNotFoundError(f'Image not found: {img_path}')
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # simple denoise and threshold
    gray = cv2.medianBlur(gray, 3)
    _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return th

def extract_text(img_path, lang='eng'):
    # supports passing PDF paths converted externally; for images, run preprocessing
    img = preprocess_image(img_path)
    # write to temp file for pytesseract
    import tempfile, os
    fd, tmp = tempfile.mkstemp(suffix='.png')
    try:
        cv2.imwrite(tmp, img)
        # use lang 'eng' by default; user can add 'hin' if tesseract hin traineddata installed
        text = pytesseract.image_to_string(Image.open(tmp), lang=lang)
    finally:
        os.close(fd)
        try:
            os.remove(tmp)
        except Exception:
            pass
    return text
