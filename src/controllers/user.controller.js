import { asyncHandler } from '../utils/asynhandler.js'
import { User } from '../models/user.model.js'
import { ApiError } from "../utils/Apierror.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
  if (!username || !email) {
    throw new ApiError(400,"username or email is required")
  }

  const user = await User.findOne({
    $or : [{username},{email}]
  })

  if (!user) {
    throw new ApiError(404,"User does not exist ")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401,"Password is wrong ")
  }

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

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200,{},"User logout "))
})

export {
  registerUser,
  loginUser,
  logoutUser
}






