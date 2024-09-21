const asynHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise
      .resolve(requestHandler(req, res, next))
      .catch((err) => next(err))
  }
}


export {asynHandler}

/*
const asynHandler = (fun) => async (req, res, next) => {
  try {
    await fun(req,res,next)
  } catch (err) {
    res.status(err.code || 500).json({
      success: false,
      message:err.message
    })
  }
}
*/









/*
const asynHandler = (fun)=>()=>{}

this line of code is nothing but 

const asynHandler = (fun)=>{()=>{}}
  */