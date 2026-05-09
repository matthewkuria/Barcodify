function onScanSuccess(decodedText) {

    document.getElementById("scanResult")
    .innerHTML = `Scanned: ${decodedText}`;
}

const html5QrCode = new Html5QrcodeScanner(
    "reader",
    {
        fps: 10,
        qrbox: 250
    }
);

html5QrCode.render(onScanSuccess);