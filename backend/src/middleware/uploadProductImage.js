import multer from 'multer';

// Las imágenes de producto ahora se suben a Cloudinary, así que solo se
// necesitan en memoria brevemente (no se guardan en el disco del servidor,
// que es efímero y se borra en cada despliegue).
const storage = multer.memoryStorage();

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
