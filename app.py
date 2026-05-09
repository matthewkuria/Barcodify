# =========================================================
# app.py
# Lightweight QR & Barcode Generator
# =========================================================

import os
import io
import time
import zipfile
import base64

from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    send_file
)

import qrcode
import barcode

from barcode.writer import ImageWriter

from PIL import (
    Image,
    ImageDraw
)

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader

# =========================================================
# APP CONFIG
# =========================================================

app = Flask(__name__)

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "uploads"
)

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

# =========================================================
# HELPERS
# =========================================================

SUPPORTED_BARCODES = [
    "code128",
    "code39",
    "ean13"
]

# =========================================================
# APPLY GRADIENT
# =========================================================

def apply_gradient(image):

    width, height = image.size

    gradient = Image.new(
        "RGB",
        (width, height)
    )

    draw = ImageDraw.Draw(gradient)

    for y in range(height):

        r = int(255 * (y / height))
        g = 80
        b = 200

        draw.line(
            (0, y, width, y),
            fill=(r, g, b)
        )

    return Image.blend(
        image,
        gradient,
        0.25
    )

# =========================================================
# IMAGE TO BASE64
# =========================================================

def img_to_b64(img):

    buffer = io.BytesIO()

    img.save(
        buffer,
        format="PNG"
    )

    buffer.seek(0)

    return base64.b64encode(
        buffer.read()
    ).decode()

# =========================================================
# SAVE IMAGE
# =========================================================

def save_image(img):

    filename = f"qr_{int(time.time())}.png"

    path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    img.save(path)

    latest = os.path.join(
        UPLOAD_FOLDER,
        "last_generated.png"
    )

    img.save(latest)

    return path

# =========================================================
# HOME
# =========================================================

@app.route("/")
def index():

    return render_template(
        "index.html"
    )

# =========================================================
# GENERATE QR / BARCODE
# =========================================================

@app.route(
    "/generate",
    methods=["POST"]
)
def generate():

    try:

        data = request.form

        text = data.get(
            "url",
            ""
        ).strip()

        if not text:

            return jsonify({
                "error": "Please enter URL or text"
            }), 400

        code_type = data.get(
            "code_type",
            "qrcode"
        )

        qr_color = data.get(
            "qr_color",
            "#000000"
        )

        bg_color = data.get(
            "bg_color",
            "#ffffff"
        )

        barcode_type = data.get(
            "barcode_type",
            "code128"
        ).lower()

        use_gradient = (
            data.get("use_gradient") == "true"
        )

        # =================================================
        # QR CODE
        # =================================================

        if code_type == "qrcode":

            qr = qrcode.QRCode(
                version=None,
                error_correction=qrcode.constants.ERROR_CORRECT_H,
                box_size=12,
                border=4,
            )

            qr.add_data(text)

            qr.make(fit=True)

            img = qr.make_image(
                fill_color=qr_color,
                back_color=bg_color
            ).convert("RGB")

            # Gradient Effect

            if use_gradient:

                img = apply_gradient(img)

        # =================================================
        # BARCODE
        # =================================================

        else:

            if barcode_type not in SUPPORTED_BARCODES:

                return jsonify({
                    "error": "Unsupported barcode type"
                }), 400

            BarcodeClass = barcode.get_barcode_class(
                barcode_type
            )

            buffer = io.BytesIO()

            bc = BarcodeClass(
                text,
                writer=ImageWriter()
            )

            bc.write(buffer)

            buffer.seek(0)

            img = Image.open(
                buffer
            ).convert("RGB")

        # =================================================
        # SAVE IMAGE
        # =================================================

        save_image(img)

        return jsonify({

            "success": True,

            "image": img_to_b64(img)

        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

# =========================================================
# EXPORT PDF
# =========================================================

@app.route(
    "/export-pdf",
    methods=["POST"]
)
def export_pdf():

    try:

        latest = os.path.join(
            UPLOAD_FOLDER,
            "last_generated.png"
        )

        if not os.path.exists(latest):

            return jsonify({
                "error": "Generate code first"
            }), 400

        data = request.json

        url_label = data.get(
            "url",
            ""
        )

        buffer = io.BytesIO()

        pdf = canvas.Canvas(
            buffer,
            pagesize=letter
        )

        pdf.setFont(
            "Helvetica-Bold",
            22
        )

        pdf.drawString(
            50,
            770,
            "QR / Barcode Export"
        )

        pdf.setFont(
            "Helvetica",
            12
        )

        pdf.drawString(
            50,
            740,
            f"Data: {url_label[:100]}"
        )

        image = ImageReader(latest)

        pdf.drawImage(
            image,
            120,
            300,
            width=350,
            height=350
        )

        pdf.save()

        buffer.seek(0)

        return send_file(
            buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="qr_export.pdf"
        )

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

# =========================================================
# BATCH ZIP EXPORT
# =========================================================

@app.route(
    "/batch-zip",
    methods=["POST"]
)
def batch_zip():

    try:

        txt_file = request.files.get(
            "txt_file"
        )

        if not txt_file:

            return jsonify({
                "error": "No file uploaded"
            }), 400

        lines = txt_file.read().decode().splitlines()

        if len(lines) > 100:

            return jsonify({
                "error": "Maximum 100 entries allowed"
            }), 400

        memory_file = io.BytesIO()

        with zipfile.ZipFile(
            memory_file,
            "w"
        ) as zf:

            for i, line in enumerate(lines):

                line = line.strip()

                if not line:
                    continue

                qr = qrcode.make(line)

                img_buffer = io.BytesIO()

                qr.save(
                    img_buffer,
                    format="PNG"
                )

                zf.writestr(
                    f"qr_{i + 1}.png",
                    img_buffer.getvalue()
                )

        memory_file.seek(0)

        return send_file(
            memory_file,
            mimetype="application/zip",
            as_attachment=True,
            download_name="batch_qr.zip"
        )

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

# =========================================================
# HEALTH CHECK
# =========================================================

@app.route("/ping")
def ping():

    return jsonify({
        "status": "running"
    })

# =========================================================
# START APP
# =========================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5050,
        debug=True
    )