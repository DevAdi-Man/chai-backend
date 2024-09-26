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
    console.error("Error uploading to Cloudinary:", error); 
    fs.unlinkSync(localFilePath)
    // remove the locally saved temporary file as the upload operation got failed
    return null
  }
}

// Delete file from Cloudinary
const deleteFromCloudinary = async (oldUrl) => {
  const publicId = extractPublicIdFromUrl(oldUrl); // Extract public ID from the URL
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Deleted from Cloudinary:", result); // Log the result of deletion
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error); // Log error for debugging
  }
};

// Extract public ID from Cloudinary URL
const extractPublicIdFromUrl = (url) => {
  const parts = url.split('/');
  const publicIdWithExtension = parts[parts.length - 1];
  return publicIdWithExtension.split('.')[0]; // Returns the public ID without the extension
};

export {uploadOnCloudinary,deleteFromCloudinary}