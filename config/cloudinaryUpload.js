// const cloudinary = require("cloudinary").v2;
// require("dotenv").config(); // Ensure env variables are loaded


// // Configure Cloudinary
// cloudinary.config({
//     cloud_name:process.env.cloud_name, 
//     api_key:process.env.api_key, 
//     api_secret:process.env.api_secret,
// });

// const Upload = {
//   uploadFile: async (filePath) => {
//     try {
//       const result = await cloudinary.uploader.upload(filePath);
//       return result; // Return the upload result
//     } catch (error) {
//       throw new Error("Upload failed: " + error.message);
//     }
//   },
// };

// module.exports = Upload;
