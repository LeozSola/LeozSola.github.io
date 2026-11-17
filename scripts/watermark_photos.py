"""Create and verify TrustMark derivatives without modifying source photographs.

See scripts/PHOTOGRAPHY.md for setup and use. No model runs in the browser.
"""

import argparse
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / "images" / "watermarked"
MANIFEST = DIRECTORY / "manifest.json"
CREATOR = "Leonardo Sola"
WEBSITE = "https://leonardosola.com/"
COPYRIGHT = "Copyright Leonardo Sola. All rights reserved."
MODEL = "P"
STRENGTH = 1.0


def variant(name, width, quality=80, crop=None):
    return {"path": f"images/optimized/{name}", "width": width, "quality": quality,
            "format": "JPEG" if name.endswith(".jpg") else "WEBP", "crop": crop}


def photo(source, slug, identifier, variants=()):
    return {"source": f"images/photography/{source}",
            "full": f"images/watermarked/{Path(source).stem}.jpg",
            "preview": f"images/optimized/gallery-{slug}.webp",
            "identifier": identifier, "variants": list(variants)}


PHOTOS = (
    photo("CampingWaterfall.jpg", "camping-waterfall", "LSCAMP01"),
    photo("FireLeaves.jpg", "fire-leaves", "LSFIRE01"),
    photo("twoPlanes.jpg", "two-planes", "LSPLAN01"),
    photo("FloridaSunset.jpg", "florida-sunset", "LSSUNS01", (
        variant("florida-720.webp", 720, 78), variant("florida-1400.webp", 1400))),
    photo("photo2.jpg", "lansdowne", "LSLANS01", (
        variant("lansdowne-720.webp", 720, 78), variant("lansdowne-1400.webp", 1400))),
    photo("photo1.jpg", "aaron", "LSAARO01"),
    photo("photo3.jpg", "long-exposure", "LSTRAI01", (
        variant("long-exposure-720.webp", 720, 78), variant("long-exposure-1400.webp", 1400))),
    photo("Esplanade Skyline Reflection Edit.png", "esplanade", "LSESPL01", (
        variant("skyline-1280.webp", 1280, 78), variant("skyline-1920.webp", 1920, 78),
        variant("og-preview.jpg", 1200, 82, (1200, 630)))),
    photo("NYC Batman Stock 1.png", "batman", "LSBATM01"),
    photo("Building across from Yawkey.png", "yawkey", "LSYAWK01"),
    photo("CDS Warm.png", "cds", "LSCDSW01"),
    photo("photo4.jpg", "rooftop", "LSROOF01"),
    photo("car2.jpg", "storrow", "LSSTOR01"),
    photo("JoeBWPortWoodAl.jpg", "joe", "LSJOEB01"),
    photo("solaChoiceSet-3.jpg", "anniversary", "LSANNI01"),
    photo("Fenway Bridge.png", "fenway", "LSFENW01"),
    photo("solaFinal11.jpg", "skating-coach", "LSCOAC01"),
    photo("solaFinal12.jpg", "skating-gauging", "LSGAUG01"),
    photo("solaFinal16.jpg", "skating-teaching", "LSTEAC01"),
    photo("solaFinal5.jpg", "skating-pair", "LSPAIR01"),
    photo("solaFinal7.jpg", "skating-solo", "LSSOLO07"),
    photo("Tower Chairs Edit.png", "tower-chairs", "LSTOWE01"),
    photo("IMG_20220827_013123.jpg", "suffolk-bridge", "LSSUFF01"),
)


def outputs_for(photo):
    return [{"path": photo["full"], "format": "JPEG", "quality": 95},
            variant(Path(photo["preview"]).name, 1000), *photo["variants"]]


NAMESPACES = {
    "x": "adobe:ns:meta/",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "dc": "http://purl.org/dc/elements/1.1/",
    "xmpRights": "http://ns.adobe.com/xap/1.0/rights/",
}
for prefix, namespace in NAMESPACES.items():
    ET.register_namespace(prefix, namespace)


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def preserve_export(output_name):
    """Keep ordinary image optimization from replacing any protected export."""
    spec = next((photo for photo in PHOTOS
                 if any(Path(output["path"]).name == output_name for output in outputs_for(photo))), None)
    if spec is None:
        return False
    if not MANIFEST.exists():
        raise RuntimeError("Run scripts/watermark_photos.py in the TrustMark environment first")
    report = json.loads(MANIFEST.read_text(encoding="utf-8"))
    photo = next(item for item in report["photos"] if item["source"] == spec["source"])
    output = next(item for item in photo["outputs"] if Path(item["path"]).name == output_name)
    destination = ROOT / output["path"]
    if (not destination.exists() or digest(destination) != output["sha256"]
            or digest(ROOT / spec["source"]) != photo["source_sha256"]):
        raise RuntimeError(f"Regenerate protected photo with scripts/watermark_photos.py: {spec['source']}")
    print(f"Preserving verified TrustMark export: {output_name}")
    return True


def metadata(identifier):
    exif = Image.Exif()
    exif[315] = CREATOR
    exif[33432] = COPYRIGHT
    exif[270] = f"{WEBSITE} | Photo ID: {identifier}"
    exif[305] = "Adobe TrustMark 0.9.2 (P)"
    ns = lambda prefix, tag: f"{{{NAMESPACES[prefix]}}}{tag}"
    root = ET.Element(ns("x", "xmpmeta"))
    rdf = ET.SubElement(root, ns("rdf", "RDF"))
    description = ET.SubElement(rdf, ns("rdf", "Description"), {ns("rdf", "about"): ""})
    creator = ET.SubElement(description, ns("dc", "creator"))
    sequence = ET.SubElement(creator, ns("rdf", "Seq"))
    ET.SubElement(sequence, ns("rdf", "li")).text = CREATOR
    rights = ET.SubElement(description, ns("dc", "rights"))
    alternative = ET.SubElement(rights, ns("rdf", "Alt"))
    ET.SubElement(alternative, ns("rdf", "li"), {"{http://www.w3.org/XML/1998/namespace}lang": "x-default"}).text = COPYRIGHT
    ET.SubElement(description, ns("dc", "identifier")).text = identifier
    ET.SubElement(description, ns("xmpRights", "Marked")).text = "True"
    ET.SubElement(description, ns("xmpRights", "WebStatement")).text = WEBSITE
    return {"exif": exif.tobytes(), "xmp": ET.tostring(root, encoding="utf-8")}


def validate_metadata(image, identifier):
    exif = image.getexif()
    if exif.get(315) != CREATOR or exif.get(33432) != COPYRIGHT:
        raise RuntimeError("Missing EXIF creator or copyright")
    xmp = ET.fromstring(image.info["xmp"])
    expected = {".//dc:identifier": identifier, ".//dc:creator/rdf:Seq/rdf:li": CREATOR,
                ".//dc:rights/rdf:Alt/rdf:li": COPYRIGHT, ".//xmpRights:WebStatement": WEBSITE}
    for query, value in expected.items():
        if xmp.findtext(query, namespaces=NAMESPACES) != value:
            raise RuntimeError(f"Missing XMP value: {query}")


def model():
    import torch
    from trustmark import TrustMark

    torch.manual_seed(0)
    torch.set_num_threads(4)
    tm = TrustMark(model_type=MODEL, device="cpu", encoding_type=TrustMark.Encoding.BCH_5,
                   loadRemover=False, verbose=False)
    if tm.encoder is None or tm.decoder is None:
        raise RuntimeError("TrustMark models unavailable. First run requires access to Adobe's model download server.")
    return tm


def check_watermark(tm, image, identifier):
    decoded, present, schema = tm.decode(image.convert("RGB"))
    if not present or decoded != identifier or schema != 1:
        raise RuntimeError(f"Watermark verification failed for {identifier}: {decoded!r}, present={present}, schema={schema}")


def generate():
    import numpy as np

    tm = model()
    pending = []
    records = []
    paths = [output["path"] for photo in PHOTOS for output in outputs_for(photo)]
    if len(paths) != len(set(paths)) or len({photo["identifier"] for photo in PHOTOS}) != len(PHOTOS):
        raise RuntimeError("Duplicate output paths or photo identifiers")
    for photo in PHOTOS:
        source = ROOT / photo["source"]
        original_hash = digest(source)
        with Image.open(source) as original:
            icc = original.info.get("icc_profile")
            cover = ImageOps.exif_transpose(original).convert("RGB")
        _, original_present, _ = tm.decode(cover)
        if original_present:
            raise RuntimeError(f"Unexpected existing TrustMark P watermark in {source.name}; source not re-encoded")
        record = dict(photo, source_sha256=original_hash, original_watermark_detected=False, outputs=[])
        for output in outputs_for(photo):
            image = cover.copy()
            if output.get("crop"):
                image = ImageOps.fit(image, tuple(output["crop"]), Image.Resampling.LANCZOS, centering=(0.5, 0.55))
            elif output.get("width") and image.width > output["width"]:
                width = output["width"]
                image = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
            encoded = tm.encode(image, photo["identifier"], WM_STRENGTH=STRENGTH)
            options = metadata(photo["identifier"])
            if icc:
                options["icc_profile"] = icc
            qualities = sorted({output["quality"], *(q for q in (85, 90, 95, 98, 100) if q > output["quality"])})
            for quality in qualities:
                stream = BytesIO()
                if output["format"] == "JPEG":
                    encoded.save(stream, "JPEG", quality=quality, subsampling=0, optimize=True, progressive=True, **options)
                else:
                    encoded.save(stream, "WEBP", quality=quality, method=6, **options)
                data = stream.getvalue()
                with Image.open(BytesIO(data)) as saved:
                    validate_metadata(saved, photo["identifier"])
                    try:
                        check_watermark(tm, saved, photo["identifier"])
                    except RuntimeError:
                        if quality == qualities[-1]:
                            raise RuntimeError(f"Cannot recover watermark even at quality {quality}: {output['path']}")
                        print(f"Retrying {output['path']} with less compression (quality {quality} did not preserve the watermark)", flush=True)
                        continue
                    if saved.size != image.size:
                        raise RuntimeError("Output dimensions changed")
                    mse = np.mean((np.asarray(image, dtype=np.float32) - np.asarray(saved.convert("RGB"), dtype=np.float32)) ** 2)
                    psnr = round(float(10 * np.log10(255 ** 2 / mse)), 2)
                break
            pending.append((ROOT / output["path"], data))
            record["outputs"].append({"path": output["path"], "dimensions": list(image.size),
                                      "format": output["format"], "quality": quality,
                                      "sha256": sha256(data).hexdigest(), "watermark_verified": True,
                                      "metadata_verified": True, "psnr_db_after_compression": psnr})
            print(f"Verified {output['path']}: {image.width}x{image.height}, {photo['identifier']}, PSNR {psnr} dB", flush=True)
        if digest(source) != original_hash:
            raise RuntimeError(f"Source changed: {source}")
        records.append(record)
    # Publish generated files only after every final encoded output passes decoding.
    for destination, data in pending:
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)
    report = {"creator": CREATOR, "website": WEBSITE, "copyright": COPYRIGHT,
              "trustmark_version": "0.9.2", "model": MODEL, "strength": STRENGTH,
              "encoding": "BCH_5", "photos": records}
    MANIFEST.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


def verify():
    tm = model()
    report = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if {photo["source"] for photo in report["photos"]} != {photo["source"] for photo in PHOTOS}:
        raise RuntimeError("Registry is out of date; regenerate all protected exports")
    if (report["model"], report["strength"], report["encoding"]) != (MODEL, STRENGTH, "BCH_5"):
        raise RuntimeError("Registry settings do not match the configured watermark")
    for photo in report["photos"]:
        spec = next(item for item in PHOTOS if item["source"] == photo["source"])
        if (photo["identifier"] != spec["identifier"]
                or {output["path"] for output in photo["outputs"]} != {output["path"] for output in outputs_for(spec)}):
            raise RuntimeError(f"Output registry is incomplete: {photo['source']}")
        if digest(ROOT / photo["source"]) != photo["source_sha256"]:
            raise RuntimeError(f"Original hash mismatch: {photo['source']}")
        for output in photo["outputs"]:
            path = ROOT / output["path"]
            if digest(path) != output["sha256"]:
                raise RuntimeError(f"Derivative hash mismatch: {path}")
            with Image.open(path) as saved:
                check_watermark(tm, saved, photo["identifier"])
                validate_metadata(saved, photo["identifier"])
                if list(saved.size) != output["dimensions"]:
                    raise RuntimeError(f"Dimension mismatch: {path}")
            print(f"Verified watermark, metadata, dimensions and hash: {output['path']}", flush=True)
    print("Original file hashes unchanged.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify", action="store_true", help="Verify generated files without modifying them")
    args = parser.parse_args()
    verify() if args.verify else generate()
