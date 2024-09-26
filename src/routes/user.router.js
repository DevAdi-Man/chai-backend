import { Router } from 'express';
import { loginUser, logoutUser, registerUser,refreshAccessToken,updateUserDetail,getUserChannelProfile } from '../controllers/user.controller.js';
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

// router.route("/updateUserDetail").post(updateUserDetail)
 router.route("/getUserChannelProfile").post(getUserChannelProfile)

export default router;