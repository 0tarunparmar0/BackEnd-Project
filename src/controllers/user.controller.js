import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandler } from "../utils/ApiErrorHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  // usl se aya hua data hame body mai nhi milta hai
  
  const {fullName, email, username, password} = req.body

  console.log("email is  : ",email);

  if(fullName === ""){
    throw new ApiErrorHandler  (400, "fullname is required")
  }
});

export { registerUser };
