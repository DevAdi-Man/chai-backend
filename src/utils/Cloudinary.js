import { V2 as cloudinary } from 'cloudinary'
import fs from 'fs'

 cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECREATE // Click 'View API Keys' above to copy your API secret
 });

const uploadOnCloudinary = async (localFilePath) => {
  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
       resource_type:'auto'
    })
    // file has been uploaded success full
    console.log("file is uploaded on cloudinary ", response.url)
    return response
  } catch (error) {
    fs.unlinkSync(localFilePath)
    // remove the locally saved temporary file as the upload operation got failed
    return null
  }
}

export {uploadOnCloudinary}