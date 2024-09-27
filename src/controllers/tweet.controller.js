import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model";
import { asyncHandler } from "../utils/asynhandler";
import { ApiError } from "../utils/Apierror";
import { ApiResponse } from "../utils/ApiResponse";
import { Tweet } from "../models/tweet.model";


// user hai ya nhi 
/*
  

*/
const createTweet = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body 
    
    if (!content) {
      throw new ApiError(404 ,"Content is missing ")
    }

    const tweet = new Tweet.create({
      owner: req.body.user?._id,
      content
    })

    if (!tweet) {
      throw new ApiError(500,"something went wrong while creating tweet")
    }

    return res
      .status(200)
      .json(new ApiResponse(200,tweet ,"content successfully create"))
    
  } catch (error) {
    throw new ApiError(400,"tweet is not created ")
  }
})


const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  
  const userId = req.params
  
  if (!userId || isValidObjectId(userId)) {
    throw new ApiError(400,"user is not found")
  }

  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: userId
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as:"ownerTweet"
      }  
    },
    {
      $unwind: "$ownerTweet" 
    },
    {
      $project: {
        owner: "$ownerTweet",
        content:1
      }
    }
  ])

  return res.status(200).json(
    new ApiResponse(200,userTweets,"successfully get user Tweet")
  )

})

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  //content or tweetId lete hai 
  //check or validate kr te hai ke tweet id same hai ya nhi 
  //check kr te he ke content same hai ya nhi
  //tweet tweet id se find by id keya 
  //shi hai ya nhi
  //and ab tweet ko update kr do
  
  const {content} = req.body
  const { tweetId } = req.params
  
  if (!tweetId || isValidObjectId(tweetId)) {
    throw new ApiError(500,"check again that tweet is present")
  }

  if (!content) {
    throw new ApiError(400,"content is missing again in update tweet")
  }

  const tweet = await Tweet.findByIdAndUpdate(tweetId, {
    $set: {
      content
    }
  }, {
    new : true
  })

  return res
    .status(200)
    .json(
      new ApiResponse(200,tweet,"tweet is updated successfully")
  )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet
}
