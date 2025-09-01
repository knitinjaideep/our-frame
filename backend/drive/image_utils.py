from io import BytesIO
from PIL import Image

# Optional HEIC/HEIF support (for iPhone photos)
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except Exception:
    pass

def open_image(raw: bytes) -> Image.Image:
    """Open raw bytes as a PIL image."""
    img = Image.open(BytesIO(raw))
    img.load()
    return img

def to_jpeg_bytes(img: Image.Image, quality: int = 85) -> BytesIO:
    """Convert PIL Image to optimized JPEG bytes."""
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    buf.seek(0)
    return buf
