"""Generate web-ready image derivatives used by the portfolio.

Original files remain untouched. Run from the repository root with:
    python scripts/optimize_images.py
"""

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "images" / "optimized"
OUTPUT.mkdir(parents=True, exist_ok=True)


def save_webp(source: str, output_name: str, max_width: int, quality: int = 80) -> None:
    with Image.open(ROOT / source) as image:
        image = ImageOps.exif_transpose(image)
        if image.width > max_width:
            height = round(image.height * (max_width / image.width))
            image = image.resize((max_width, height), Image.Resampling.LANCZOS)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")
        image.save(OUTPUT / output_name, "WEBP", quality=quality, method=6)


DERIVATIVES = [
    ("images/BackgroundImgs/Esplanade_Skyline_Reflection_Edit.png", "skyline-1280.webp", 1280, 78),
    ("images/BackgroundImgs/Esplanade_Skyline_Reflection_Edit.png", "skyline-1920.webp", 1920, 78),
    ("images/YearbookPicEdit2.png", "portrait.webp", 420, 92),
    ("images/IMG_1404.png", "about-720.webp", 720, 82),
    ("images/portfolio/natura.png", "natura-720.webp", 720, 80),
    ("images/portfolio/natura.png", "natura-1200.webp", 1200, 82),
    ("images/portfolio/IrecPanel.png", "irec-720.webp", 720, 80),
    ("images/portfolio/IrecPanel.png", "irec-1200.webp", 1200, 82),
    ("images/portfolio/tumor.png", "tumor-720.webp", 720, 80),
    ("images/portfolio/tumor.png", "tumor-1200.webp", 1200, 82),
    ("images/portfolio/EasyNoteLogoHiRes.png", "easynote-720.webp", 720, 80),
    ("images/portfolio/EasyNoteLogoHiRes.png", "easynote-1200.webp", 1200, 82),
    ("images/portfolio/MRIComparison.png", "mri-comparison-1200.webp", 1200, 82),
    ("images/portfolio/TumorPipeline.png", "tumor-pipeline-720.webp", 720, 82),
    ("images/portfolio/MiniHacksData.png", "datathon-720.webp", 720, 82),
    ("images/portfolio/chatGPTInsta.png", "chatgptinsta-1200.webp", 1200, 82),
    ("images/photography/FloridaSunset.jpg", "florida-720.webp", 720, 78),
    ("images/photography/FloridaSunset.jpg", "florida-1400.webp", 1400, 80),
    ("images/photography/photo2.jpg", "lansdowne-720.webp", 720, 78),
    ("images/photography/photo2.jpg", "lansdowne-1400.webp", 1400, 80),
    ("images/photography/photo3.jpg", "long-exposure-720.webp", 720, 78),
    ("images/photography/photo3.jpg", "long-exposure-1400.webp", 1400, 80),
    ("images/photography/photo1.jpg", "gallery-aaron.webp", 1000, 80),
    ("images/photography/photo2.jpg", "gallery-lansdowne.webp", 1000, 80),
    ("images/photography/photo3.jpg", "gallery-long-exposure.webp", 1000, 80),
    ("images/photography/photo4.jpg", "gallery-rooftop.webp", 1000, 80),
    ("images/photography/FloridaSunset.jpg", "gallery-florida-sunset.webp", 1000, 80),
    ("images/photography/Esplanade Skyline Reflection Edit.png", "gallery-esplanade.webp", 1000, 80),
    ("images/photography/NYC Batman Stock 1.png", "gallery-batman.webp", 1000, 80),
    ("images/photography/Building across from Yawkey.png", "gallery-yawkey.webp", 1000, 80),
    ("images/photography/CDS Warm.png", "gallery-cds.webp", 1000, 80),
    ("images/photography/car2.jpg", "gallery-storrow.webp", 1000, 80),
    ("images/photography/JoeBWPortWoodAl.jpg", "gallery-joe.webp", 1000, 80),
    ("images/photography/solaChoiceSet-3.jpg", "gallery-anniversary.webp", 1000, 80),
    ("images/photography/Fenway Bridge.png", "gallery-fenway.webp", 1000, 80),
    ("images/photography/solaFinal11.jpg", "gallery-skating-coach.webp", 1000, 80),
    ("images/photography/solaFinal12.jpg", "gallery-skating-gauging.webp", 1000, 80),
    ("images/photography/solaFinal16.jpg", "gallery-skating-teaching.webp", 1000, 80),
    ("images/photography/solaFinal5.jpg", "gallery-skating-pair.webp", 1000, 80),
    ("images/photography/solaFinal7.jpg", "gallery-skating-solo.webp", 1000, 80),
    ("images/photography/Tower Chairs Edit.png", "gallery-tower-chairs.webp", 1000, 80),
    ("images/photography/IMG_20220827_013123.jpg", "gallery-suffolk-bridge.webp", 1000, 80),
]


for derivative in DERIVATIVES:
    save_webp(*derivative)


with Image.open(ROOT / "images" / "BackgroundImgs" / "Esplanade_Skyline_Reflection_Edit.png") as image:
    image = ImageOps.exif_transpose(image).convert("RGB")
    preview = ImageOps.fit(
        image,
        (1200, 630),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.55),
    )
    preview.save(OUTPUT / "og-preview.jpg", "JPEG", quality=82, optimize=True, progressive=True)


for path in sorted(OUTPUT.iterdir()):
    print(f"{path.relative_to(ROOT)}\t{path.stat().st_size // 1024} KB")
