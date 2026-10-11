from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader, PdfWriter
import io

def create_overlay(fields):
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=A4)
    # crude placement: write each field on the page at descending y positions
    x = 100
    y = 750
    for k, v in fields.items():
        c.setFont('Helvetica', 10)
        c.drawString(x, y, f"{k}: {v}")
        y -= 20
    c.save()
    packet.seek(0)
    return packet.read()

def fill_pdf(template_path, output_path, fields):
    # Read the template PDF
    reader = PdfReader(template_path)
    writer = PdfWriter()
    overlay_bytes = create_overlay(fields)
    # create overlay PDF reader
    overlay_pdf = PdfReader(io.BytesIO(overlay_bytes))
    overlay_page = overlay_pdf.pages[0]

    # merge onto each page of template (first page overlay only)
    for p in reader.pages:
        # p is a pypdf._page.PageObject
        p.merge_page(overlay_page)
        writer.add_page(p)
    # write output
    with open(output_path, 'wb') as f:
        writer.write(f)
