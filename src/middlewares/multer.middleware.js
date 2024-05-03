import multer from "multer";

// Multer helps in uploading files to localServer(here using multer as middleWare)

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp" )
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname )
  }
});


export const upload = multer({ 
  storage, });