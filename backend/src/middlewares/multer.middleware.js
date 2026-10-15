import multer from "multer"; // import the multer library, which is used for handling file uploads in Node.js applications
import crypto from "crypto";
import path from "path";

const storage = multer.diskStorage({ // configure the storage settings for multer, specifying how and where the uploaded files should be stored
    destination: function (req, file, cb) {
      cb(null, "./public/temp")  // specify the destination directory where the uploaded files will be stored temporarily 
    }, // meaning of callback is that it is a function that you call when you are done with the asynchronous operation. In this case, it is used to signal that the destination directory has been set and the file can be stored there.
    filename: function (req, file, cb) {
      // FIX [2026-09-01]: Using crypto.randomUUID() to generate secure filenames and prevent Path Traversal.
      // Old error: Filename was set using `file.originalname` directly, which could contain malicious paths (e.g. `../../../etc/passwd`).
      const extension = path.extname(file.originalname);
      const safeFilename = `${crypto.randomUUID()}${extension}`;
      cb(null, safeFilename); // specify a secure random filename to prevent path traversal and collisions
    }
  })
  
export const upload = multer({  // create a multer instance with the defined storage settings, which can be used as middleware in routes to handle file uploads
    storage, 
})