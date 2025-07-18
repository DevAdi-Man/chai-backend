import { asyncHandler } from '../utils/asynhandler.js'
import { User } from '../models/user.model.js'
import { ApiError } from "../utils/Apierror.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import  jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    
    return { accessToken, refreshToken }
    
  } catch (error) {
    throw new ApiError(500,"Something went wrong while generating access and refresh token ")
  }
}

const registerUser = asyncHandler(async (req, res) => {
    
  const { fullName, email, username, password } = req.body;
  // console.log("email : ", email);
  // console.log("password : ", password);
  // console.log("res body : ",res.body);
  
  //eha pe hum agla-alag kr ke bhe kr skte the like email check or username etc.. ke name khali chhodh rakha hai y nhi 
  if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "all fields are required");
  }

  //here we are checking if user registering with username or email  for existing user
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, "user with email or username already exist");
  }

  // console.log("req files : ",req.files);
  
  const avatarLocalPath = req.files?.avatar[0]?.path
  const coverImageLocalPath = req.files?.coverImage[0]?.path

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  });

  const createuser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  console.log(createuser)

  if (!createuser) {
    throw new ApiError(500,"something went wrong while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createuser, "user register success full")
  );

  
});


const loginUser = asyncHandler(async (req, res) => {
  // req body se -> data
  // username or email
  // find the user (means database mai check kr ke dekhe ge ke hai ya nhi)
  // password  check
  // access and refresh token (generate)
  // send cookies
  
  const { email, username, password } = req.body
  if (!username && !email) {
    throw new ApiError(400,"username or email is required")
  }

  const user = await User.findOne({
    $or : [{username},{email}]
  })
 
  console.log("user req.body_id is : ",req.body)


  console.log("==>user : ",user);
  

  if (!user) {

    throw new ApiError(404,"User does not exist ")
  }

  console.log("User test 1 ");
  

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401,"Password is wrong ")
  }

  console.log("test 2")

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
  
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const option = {
    httpOnly: true,
    secure:true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(200,
        {
          user : loggedInUser,accessToken,refreshToken
        },
        "user logged in successfull"
      )
    )
  
})


const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken:undefined
      }
    }, {
      new:true
    }
  )

  const option = {
    httpOnly: true,
    secure:true
  }

  console.log("User is log out");
  

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200,{},"User logout "))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  // console.log("===> incomingRefreshToken : ",incomingRefreshToken)

  if (!incomingRefreshToken) {
    throw new ApiError(401,"unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new  ApiError(401,"Invalid refresh token")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401,"Refresh Token is expired or used ")
    }

    const option = {
      httpOnly: true,
      secure:true
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

    // console.log(`===>accessToken ${accessToken} ===>newRefreshToken ${newRefreshToken} ==> option ${option}`);
    
    
    return res
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refreshed"
        )
      )
  } catch (error) {
    throw new ApiError(401,"invalid refresh token ")
  }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  console.log(`oldPassword ==> ${oldPassword} newPassword ==> ${newPassword}`)
  
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect) {
    throw new ApiError(400,"Invalid Password")
  }

  console.log("is password is  : ",isPasswordCorrect);
  
  user.password = newPassword
  await user.save({ validateBeforeSave: true })
  
  return res
    .status(200)
    .json(new ApiResponse(200,{},"Password CHnage SuccessFul"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  // console.log("current user")
  return res
    .status(200)
    .json(new ApiResponse(200,req.user,"user fetch succesful"))
})

const updateUserDetail = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  
  if (!fullName || !email) {
    throw new ApiError(400,"all deatila are reqiured")
  }

  console.log(fullName,email)

  const user = await User.findByIdAndUpdate(
    req.body?._id,
    {
      $set: {
        fullName,
        email
      }
    },
    {new:true}
  ).select("-password")
  return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated succfully"))
})

//geting error here
const updateUserAvtar = asyncHandler(async (req, res) => {
  const avatarLoaclPath = req.file?.path

  if (!avatarLoaclPath) {
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLoaclPath)

  console.log("Avatar ",avatar)
  

  if (!avatar.url) {
    throw new ApiError(400,"Error while uplading file")
  }

  const user = await User.findById(req.user?._id)

  if (!user) {
    throw new ApiError(400, "user does not exist")
  }

  const oldAvatar = user.avatar //storing old avatar
  console.log("oldavtar",oldAvatar)


  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar : avatar.url
      }
    },
    {
      new : true
    }
  ).select("-password")

  if (oldAvatar) {
    await deleteFromCloudinary(oldAvatar)
  }

  return res.status(200).json(new ApiResponse(200,updatedUser,"Avatar image update successful"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const CoverImageLoaclPath = req.file?.path

  if (!CoverImageLoaclPath) {
    throw new ApiError(400,"Avatar file is missing")
  }

  const coverImage = await uploadOnCloudinary(CoverImageLoaclPath)

  if (!coverImage.url) {
    throw new ApiError(400,"Error while uplading file")
  }

  const user = await User.findById(req.user?._id)
  if (!user) {
    throw new ApiError(400,"user does not exist ")
  }

  const oldCoverImage = user.coverImage

  const updateUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage : coverImage.url
      }
    },
    {
      new : true
    }
  ).select("-password")

  if (oldCoverImage) {
    await deleteFromCloudinary(oldCoverImage)
  }

  return res.status(200).json(new ApiResponse(200,updateUser,"Avatar image update successful"))
})

const getUserChannelProfile = asyncHandler(async (req,res) => {
  const { username } = req.params
  console.log("req params : ", req.params)
  if (!username?.trim()) {
    throw new ApiError(400,"Username is missing")
  }

  const Channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from:"subsciptions",
        localField: "_id",
        foreignField: "channel",
        as:"subscribers"
      }
    },
    {
      $lookup: {
        from:"subsciptions",
        localField: "_id",
        foreignField: "subscriber",
        as:"subscribeTo"
      }
    },
    {
      $addFields: {
        SubscriberCount: {
          $size:"$subscribers"
        },
        channelSubscribeToCount: {
          $size:"$subscribeTo"
        },
        issubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else:false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        SubscriberCount: 1,
        issubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email:1
      }
    }
  ])

  if (!Channel?.length) {
    throw new ApiError(400,"Channel does not exists")
  }
  console.log("channel is ",Channel)

  return res
    .status(200)
    .json(new ApiResponse(200,Channel[0],"Channel fetch successfully"))


})

const getwatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id:new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: "owner",
              foreignField:"_id",

              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
    .status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"watch history fetch Successfully"))
})


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetail,
  updateUserAvtar,
  updateUserCoverImage,
  getUserChannelProfile,
  getwatchHistory
}






