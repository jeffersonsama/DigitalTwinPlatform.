import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function QRCodeImage({ text, size = 220 }) {
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(text, { width: size, margin: 1, color: { dark: '#17181c', light: '#f1ede4' } })
      .then((url) => !cancelled && setDataUrl(url))
      .catch(() => !cancelled && setDataUrl(null));
    return () => {
      cancelled = true;
    };
  }, [text, size]);

  if (!dataUrl) return <div className="qr-placeholder" style={{ width: size, height: size }} />;
  return <img src={dataUrl} width={size} height={size} alt={`QR : ${text}`} className="qr-image" />;
}
