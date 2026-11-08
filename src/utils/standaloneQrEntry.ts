import QRCode from 'qrcode';

(window as Window & { StandaloneQRCode?: typeof QRCode }).StandaloneQRCode = QRCode;
