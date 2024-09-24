import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

 cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECREATE // Click 'View API Keys' above to copy your API secret
 });

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null

    const response = await cloudinary.uploader.upload(
      localFilePath, {
      resource_type:'auto'
    })
    // file has been uploaded success full
    // console.log("file is uploaded on cloudinary ", response.url)
    // console.log("response : ", response);
    
    fs.unlinkSync(localFilePath)
    return response
  } catch (error) {
    fs.unlinkSync(localFilePath)
    // remove the locally saved temporary file as the upload operation got failed
    return null
  }
}

const deleteFromCloudinary = async (oldurl) => {
  const publicId = extractPublicIdFromUrl(oldurl); // You'll need a function to extract public ID from Cloudinary URL
  await cloudinary.uploader.destroy(publicId);
}

const extractPublicIdFromUrl = (url) => {
  const parts = url.split('/');
  const publicIdWithExtension = parts[parts.length - 1];
  return publicIdWithExtension.split('.')[0]; // Removes the file extension
};

export {uploadOnCloudinary,deleteFromCloudinary}