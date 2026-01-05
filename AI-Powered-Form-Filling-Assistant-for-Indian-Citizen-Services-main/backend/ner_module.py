import re

# Lightweight entity extraction using regex and heuristics.
# If spaCy or transformer models are available, they can be integrated here.
def extract_entities(text):
    if not text:
        return {}
    data = {}
    # Normalize whitespace
    t = ' '.join(text.split())
    # Name: look for labels 'Name' or capitalized sequences
    m = re.search(r'Name[:\s]*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})', text)
    if m:
        data['name'] = m.group(1).strip()
    else:
        # fallback: first capitalized phrase of 2 words
        m2 = re.search(r'([A-Z][a-z]+\s+[A-Z][a-z]+)', text)
        if m2:
            data['name'] = m2.group(1).strip()

    # DOB patterns: DD-MM-YYYY or DD/MM/YYYY or YYYY-MM-DD
    m = re.search(r'(\d{2}[\-/]\d{2}[\-/]\d{4})', text)
    if m:
        data['dob'] = m.group(1)

    # Aadhaar pattern (12 digits, sometimes spaced): 4-4-4
    m = re.search(r'(?:Aadhaar[:\s]*)?(\d{4}[\s-]?\d{4}[\s-]?\d{4})', text)
    if m:
        data['aadhaar'] = m.group(1).replace(' ', '').replace('-', '')

    # PAN pattern: 5 letters, 4 digits, 1 letter (uppercase)
    m = re.search(r'([A-Z]{5}[0-9]{4}[A-Z])', text)
    if m:
        data['pan'] = m.group(1)

    # PIN code / Postal: 6 digits
    m = re.search(r'\b(\d{6})\b', text)
    if m:
        data['pincode'] = m.group(1)

    # Address heuristic: look for 'Address' label then grab up to 80 chars
    m = re.search(r'Address[:\s]*([A-Za-z0-9,\-\s]{10,200})', text)
    if m:
        data['address'] = m.group(1).strip()

    return data
