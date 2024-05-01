// here We are writing the code which is used again and again to communicate with the DataBase


const asyncHandler = (requestHandler) => { 
 
  (req, res, next) =>{
    Promise.resolve(requestHandler(req, res, next)).reject((err)=> next(err))
  }
}

export { asyncHandler }

