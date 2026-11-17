# Protected photography exports

All 23 photographs in the photography gallery have separate TrustMark P
derivatives. Source files in `images/photography/` remain untouched.
Both HTML pages use the protected WebP previews and open the protected,
full-resolution JPEGs in the photo viewer.

The exports contain:

- A pixel-level TrustMark P identifier with BCH_5 error correction, strength 1.0.
- EXIF Artist and Copyright, plus XMP creator, copyright, photo identifier,
  copyright flag, and a link to https://leonardosola.com/.
- The source ICC color profile when one is present.

No capture year is guessed for the copyright notice. Full-size exports retain
the original oriented dimensions and start at JPEG quality 95 with 4:4:4 sampling.
Gallery previews are independently watermarked at their final 1000px width and
saved as WebP quality 80. All alternate homepage photo sizes, the skyline hero
backgrounds, and the social-sharing crop are also watermarked independently at
their final dimensions, starting with their existing compression settings. If
compression prevents watermark recovery, the generator increases export quality
until recovery passes, without changing watermark strength or model. The
generator verifies watermark recovery and metadata from each compressed file
before writing any exports. This covers 55 generated files across 23 photos;
project screenshots, logos, and personal profile images are outside the gallery
watermark registry.

## Command-line setup (Windows PowerShell)

Use an isolated environment; no desktop application or account is needed.
Python 3.12 is used for dependency compatibility. With the `uv` CLI installed:

```powershell
uv venv --python 3.12 .venv-watermark
uv pip install --python .venv-watermark/Scripts/python.exe torch torchvision --index-url https://download.pytorch.org/whl/cpu
$env:PYTHONUTF8 = '1'
uv pip install --python .venv-watermark/Scripts/python.exe -r scripts/watermark-requirements.txt
```

PyTorch is CPU-only. The environment and model files are ignored by Git.
TrustMark downloads Adobe's encoder/decoder model files on first use; the
photos are processed locally and are not uploaded. Subsequent runs use the
downloaded models. See https://github.com/adobe/trustmark for upstream code
and the MIT license, which also covers the model files.

## Generate or verify

```powershell
.venv-watermark/Scripts/python.exe scripts/watermark_photos.py
.venv-watermark/Scripts/python.exe scripts/watermark_photos.py --verify
```

The identifier registry and verification results live in
`images/watermarked/manifest.json`. It records source/output SHA-256 hashes,
dimensions, metadata checks, recovery checks, model settings, and PSNR measured
after compression. PSNR includes export compression, so it does not isolate
watermark visibility. The originals are also decoded as negative controls when
generating exports.

`scripts/optimize_images.py` preserves these protected exports and checks their
hashes against the registry. If a source changes, regenerate its protected
copies with the watermark script rather than replacing a preview with a clean
export. Other image optimization continues as before.

This watermark supports attribution; it does not prevent copying, and recovery
after arbitrary crops, edits, screenshots, or recompression is not guaranteed.
The full-resolution image served by the website already contains the watermark
and metadata. Public originals in GitHub (and their existing static asset URLs)
remain accessible as requested. Ordinary copyright metadata is not a signed
C2PA Content Credential.
