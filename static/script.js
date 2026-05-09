window.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // ELEMENTS
    // =========================================================

    const form = document.getElementById("generateForm");

    const previewImage =
        document.getElementById("previewImage");

    const previewEmpty =
        document.getElementById("previewEmpty");

    const previewTitle =
        document.getElementById("previewTitle");

    const businessNameInput =
        document.getElementById("businessName");

    const qrColor =
        document.getElementById("qrColor");

    const qrColorText =
        document.getElementById("qrColorText");

    const bgColor =
        document.getElementById("bgColor");

    const bgColorText =
        document.getElementById("bgColorText");

    const loader =
        document.getElementById("loader");

    const statusPill =
        document.getElementById("statusPill");

    const cardsPerRowInput =
        document.getElementById("cardsPerRow");

    const cardsPerPageInput =
        document.getElementById("cardsPerPage");

    const barcodeField =
        document.getElementById("barcodeField");

    const logoInput =
        document.getElementById("logoInput");

    const filePreview =
        document.getElementById("filePreview");

    const logoThumb =
        document.getElementById("logoThumb");

    const removeLogo =
        document.getElementById("removeLogo");

    const dropzone =
        document.getElementById("dropzone");

    const typeQr =
        document.getElementById("typeQr");

    const typeBar =
        document.getElementById("typeBar");

    const themeToggle =
        document.getElementById("themeToggle");

    // Buttons

    const downloadPNG =
        document.getElementById("downloadPNG");

    const downloadPDF =
        document.getElementById("downloadPDF");

    const downloadSVG =
        document.getElementById("downloadSVG");

    const printButton =
        document.getElementById("printCode");

    // =========================================================
    // STATE
    // =========================================================

    let latestBase64 = null;

    // =========================================================
    // HELPERS
    // =========================================================

    function setStatus(text) {
        statusPill.textContent = text;
    }

    function toggleLoader(show) {
        loader.hidden = !show;
    }

    function enableButtons() {

        downloadPNG.disabled = false;
        downloadPDF.disabled = false;
        downloadSVG.disabled = false;
        printButton.disabled = false;

    }

    // =========================================================
    // COLOR SYNC
    // =========================================================

    function syncColor(colorInput, textInput) {

        colorInput.addEventListener("input", () => {

            textInput.value =
                colorInput.value.toUpperCase();

        });

        textInput.addEventListener("input", () => {

            const val = textInput.value.trim();

            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                colorInput.value = val;
            }

        });

    }

    syncColor(qrColor, qrColorText);
    syncColor(bgColor, bgColorText);

    // =========================================================
    // BARCODE TOGGLE
    // =========================================================

    function updateCodeTypeUI() {

        barcodeField.hidden =
            !typeBar.checked;

    }

    typeQr.addEventListener("change", updateCodeTypeUI);
    typeBar.addEventListener("change", updateCodeTypeUI);

    updateCodeTypeUI();

    // =========================================================
    // PRINT LAYOUT LOGIC
    // =========================================================

    cardsPerPageInput.addEventListener("input", () => {

        let total =
            parseInt(cardsPerPageInput.value) || 1;

        if (total < 1) total = 1;
        if (total > 20) total = 20;

        cardsPerPageInput.value = total;

        // Full-page mode

        if (total === 1) {

            cardsPerRowInput.value = 1;

            cardsPerRowInput.disabled = true;

            cardsPerRowInput.style.opacity = "0.5";

        } else {

            cardsPerRowInput.disabled = false;

            cardsPerRowInput.style.opacity = "1";

            if (
                parseInt(cardsPerRowInput.value) < 2
            ) {

                cardsPerRowInput.value = 2;

            }

        }

    });

    // =========================================================
    // DRAG & DROP
    // =========================================================

    dropzone.addEventListener("click", () => {

        logoInput.click();

    });

    ["dragenter", "dragover"].forEach(eventName => {

        dropzone.addEventListener(eventName, e => {

            e.preventDefault();

            dropzone.classList.add("dragover");

        });

    });

    ["dragleave", "drop"].forEach(eventName => {

        dropzone.addEventListener(eventName, e => {

            e.preventDefault();

            dropzone.classList.remove("dragover");

        });

    });

    dropzone.addEventListener("drop", e => {

        const files = e.dataTransfer.files;

        if (files.length > 0) {

            logoInput.files = files;

            showLogoPreview(files[0]);

        }

    });

    logoInput.addEventListener("change", () => {

        if (
            logoInput.files &&
            logoInput.files[0]
        ) {

            showLogoPreview(
                logoInput.files[0]
            );

        }

    });

    function showLogoPreview(file) {

        const reader =
            new FileReader();

        reader.onload = e => {

            logoThumb.src =
                e.target.result;

            filePreview.hidden = false;

            document
                .getElementById("dropzoneContent")
                .hidden = true;

        };

        reader.readAsDataURL(file);

    }

    removeLogo.addEventListener("click", () => {

        logoInput.value = "";

        filePreview.hidden = true;

        document
            .getElementById("dropzoneContent")
            .hidden = false;

    });

    // =========================================================
    // THEME TOGGLE
    // =========================================================

    themeToggle.addEventListener("click", () => {

        document.body.classList.toggle("dark");

        const dark =
            document.body.classList.contains("dark");

        localStorage.setItem("darkMode", dark);

        themeToggle.textContent =
            dark ? "☀️" : "🌙";

    });

    if (localStorage.getItem("darkMode") === "true") {

        document.body.classList.add("dark");

        themeToggle.textContent = "☀️";

    }

    // =========================================================
    // GENERATE
    // =========================================================

    form.addEventListener("submit", async e => {

        e.preventDefault();

        const formData =
            new FormData(form);

        toggleLoader(true);

        setStatus("Generating...");

        try {

            const response =
                await fetch("/generate", {

                    method: "POST",
                    body: formData

                });

            const data =
                await response.json();

            toggleLoader(false);

            if (data.error) {

                alert(data.error);

                setStatus("Error");

                return;

            }

            latestBase64 =
                data.image;

            previewImage.src =
                `data:image/png;base64,${data.image}`;

            previewImage.classList.add("is-visible");

            previewEmpty.style.display = "none";

            enableButtons();

            setStatus("Generated");

            const title =
                businessNameInput.value.trim();

            if (title) {

                previewTitle.hidden = false;

                previewTitle.textContent = title;

            } else {

                previewTitle.hidden = true;

            }

        } catch (error) {

            console.error(error);

            toggleLoader(false);

            setStatus("Server Error");

            alert("Server connection failed");

        }

    });

    // =========================================================
    // DOWNLOAD PNG
    // =========================================================

    downloadPNG.addEventListener("click", () => {

        if (!latestBase64) {
            return alert("Generate first");
        }

        const link =
            document.createElement("a");

        link.href =
            `data:image/png;base64,${latestBase64}`;

        link.download = "barcode.png";

        link.click();

    });

    // =========================================================
    // DOWNLOAD PDF
    // =========================================================

    downloadPDF.addEventListener("click", async () => {

        if (!latestBase64) {
            return alert("Generate first");
        }

        try {

            const response =
                await fetch("/export-pdf", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        url: document
                            .getElementById("urlInput")
                            .value
                    })

                });

            const blob =
                await response.blob();

            const url =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;

            link.download = "qr_export.pdf";

            link.click();

        } catch (error) {

            console.error(error);

            alert("PDF export failed");

        }

    });

    // =========================================================
    // SVG PLACEHOLDER
    // =========================================================

    downloadSVG.addEventListener("click", () => {

        alert(
            "SVG export not implemented yet."
        );

    });

    // =========================================================
    // PRINT ENGINE
    // =========================================================

    printButton.addEventListener("click", () => {

        if (!latestBase64) {
            return alert("Generate first");
        }

        const businessName =
            businessNameInput.value || "Restaurant";

        const cardsPerPage =
            parseInt(cardsPerPageInput.value) || 1;

        const cols =
            parseInt(cardsPerRowInput.value) || 1;

        const isFullPage =
            cardsPerPage === 1;

        const executePrint = (logoSrc = null) => {

            const win =
                window.open("", "_blank");

            win.document.write(`

                <html>

                <head>

                    <title>
                        ${businessName}
                    </title>

                    <style>

                        @page {
                            margin: 0;
                            size: auto;
                        }

                        body {

                            margin: 0;
                            padding: 0;

                            font-family:
                                Arial,
                                Helvetica,
                                sans-serif;

                            background: white;

                        }

                        .page-container {

                            display: grid;

                            grid-template-columns:
                                repeat(${cols}, 1fr);

                            width: 100vw;
                            height: 100vh;

                        }

                        .card {

                            display: flex;

                            flex-direction: column;

                            justify-content: center;

                            align-items: center;

                            text-align: center;

                            padding: 10px;

                            box-sizing: border-box;

                            ${
                                !isFullPage
                                ? "border:1px dashed #ddd;"
                                : ""
                            }

                        }

                        .logo {

                            max-width:
                                ${isFullPage ? "150px" : "60px"};

                            max-height:
                                ${isFullPage ? "130px" : "50px"};

                            object-fit: contain;

                            margin-bottom: 20px;

                        }

                        .qr {

                            width:
                                ${isFullPage ? "60vh" : "30vh"};

                            height:
                                ${isFullPage ? "60vh" : "30vh"};

                            object-fit: contain;

                        }

                        h1 {

                            font-size:
                                ${isFullPage ? "72px" : "28px"};

                            margin: 3px 0;

                            color: #000;

                            text-transform: uppercase;

                            letter-spacing: 2px;

                        }

                        p {

                            font-size:
                                ${isFullPage ? "28px" : "18px"};

                            color: #444;

                            margin-top: 15px;

                            text-transform: uppercase;

                            letter-spacing: 2px;

                        }

                    </style>

                </head>

                <body>

                    <div class="page-container">

                        ${Array(cardsPerPage)
                            .fill(0)
                            .map(() => `

                            <div class="card">

                                ${
                                    logoSrc
                                    ? `<img src="${logoSrc}" class="logo">`
                                    : ""
                                }

                                <h1>
                                    ${businessName}
                                </h1>

                                <img
                                    src="data:image/png;base64,${latestBase64}"
                                    class="qr"
                                >

                                <p>
                                    SCAN ME
                                </p>

                            </div>

                        `).join("")}

                    </div>

                    <script>

                        window.onload = () => {

                            window.print();

                            window.onafterprint =
                                () => window.close();

                        }

                    <\/script>

                </body>

                </html>

            `);

            win.document.close();

        };

        if (
            logoInput.files &&
            logoInput.files[0]
        ) {

            const reader =
                new FileReader();

            reader.onload = e => {

                executePrint(e.target.result);

            };

            reader.readAsDataURL(
                logoInput.files[0]
            );

        } else {

            executePrint();

        }

    });

});