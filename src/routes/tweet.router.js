import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
// import { upload } from "../middlewares/multer.middleware";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller";

const router = Router()
router.use(verifyJWT) //for use verify jwt in this route

router.route("/").post(createTweet)
router.route("/user/:userId").get(getUserTweets)
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet)