import { asynHandler } from '../utils/asynhandler.js'

const registerUser = asynHandler(async (req, res) => {
  res.status(200).json({
    message: 'mera name aditya raj hai'
  })
});

export {registerUser}