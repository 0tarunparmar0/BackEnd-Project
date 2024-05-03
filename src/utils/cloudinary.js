import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (localFilePath) =>{
  try{
    if(!localFilePath){
      // path not found
      return null;
    }

    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath,
      {
        resource_type:"auto"
      })

    // uploaded succesfully
    console.log("File is uploaded succefully on Cloudinary ", response.url);
    return response;n
  
  }catch(err){
    fs.unlinkSync(localFilePath); // It removes  the file from local and it is a synchronous function, meaning it will block the execution of any further code until the deletion operation is completed.
    return null;


  }
}

export { uploadOnCloudinary };