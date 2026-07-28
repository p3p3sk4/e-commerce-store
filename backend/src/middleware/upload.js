import multer from 'multer';
import path from 'path';
import fs from 'fs';

// NOTA: esto guarda los archivos en disco local, útil para desarrollo.
// En producción (Render/Railway) el disco no es persistente entre despliegues,
// así que antes de desplegar habrá que migrar esto a un storage en la nube
// (ej. Cloudinary o un bucket S3-compatible) — lo resolvemos en el paso de despliegue.
const uploadDir = 'uploads/proofs';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `orden-${req.params.id}-${Date.now()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
});
