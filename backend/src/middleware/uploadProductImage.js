import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Igual que middleware/upload.js (comprobantes de pago), pero para imágenes
// de producto. En producción (Render/Railway) el disco no es persistente
// entre despliegues, así que antes de desplegar habrá que migrar esto a un
// storage en la nube (ej. Cloudinary o un bucket S3-compatible) — se resuelve
// en el paso de despliegue, igual que con los comprobantes.
const uploadDir = 'uploads/products';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `producto-${req.params.id}-${Date.now()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
  }
  cb(null, true);
}

export const uploadProductImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
});
