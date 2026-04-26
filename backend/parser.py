import io
import re


def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using PyMuPDF with pdfplumber fallback."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        if text.strip():
            return clean_text(text)
    except Exception:
        pass

    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        if text.strip():
            return clean_text(text)
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {e}")

    raise ValueError("PDF appears to be empty or unreadable.")


def clean_text(text: str) -> str:
    """Normalize whitespace in extracted text."""
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    return text.strip()
