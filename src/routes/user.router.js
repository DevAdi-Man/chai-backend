import { Router } from 'express';
import { loginUser, logoutUser, registerUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateUserDetail,getUserChannelProfile, updateUserAvtar, updateUserCoverImage, getwatchHistory } from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount:1
    },
    {
      name: "coverImage",
      maxCount:1
    }
  ])
  , registerUser);

router.route('/login').post(loginUser)
  
//secure route
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateUserDetail)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvtar)
router.route("/coverImage").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT,getwatchHistory)

export default router;