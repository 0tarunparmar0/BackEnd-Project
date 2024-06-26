import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandler } from "../utils/ApiErrorHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponseHandler } from "../utils/ApiResponseHandler.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";



const generateAccessAndRefreshTokens  = async (userId) => {
    try{
      const user = await User.findById(userId)

      const accessToken = await user.generateAccessToken()
      const refreshToken = await user.generateRefreshToken()
          

      user.refreshToken = refreshToken

      // Here when we are saving the refresh token in database it also hits the password and ask for it but we are not passing the password and we dont want to so that e=we are making the validate before save to off / false;
      await user.save({validateBeforeSave : false})

      console.log("validating before save")


      // returning the tokens
      return { accessToken, refreshToken}
      
    }catch(err){
      throw new ApiErrorHandler(501, "something went wrong while generating Access and Refresh Token",err.message)
    }
  }


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




  const { fullName, email, username, password } = req.body;

  console.log("email is  : ", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiErrorHandler(400, "All Fields are required");
  }

  // check if user already exists: username, email

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiErrorHandler(409, "User Already existed");
  }

  // check for images, check for avatar
  // console.log(req.files);
  console.log("email is 1 : ", email);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // console.log("email is  2: ", email);

  // This Js Code is Not Right so  instead of this 
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // This Code is Been used

  let coverImageLocalPath; 
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
  }
  
// who issachin tendulkar
  if (!avatarLocalPath) {
    throw new ApiErrorHandler(401, "Avatar is Required");
  }


// upload them to cloudinary, avatar

const avatar = await uploadOnCloudinary(avatarLocalPath);

const coverImage = await uploadOnCloudinary(coverImageLocalPath);

// (check bcz avatar is required field (ki vo pahucha ki nahi))

if (!avatar) {
  throw new ApiErrorHandler(500, "Avatar is not entered in DataBase");
}

// create user object - create entry in db

const user = await User.create({
  fullName,
  avatar: avatar.url,
  coverImage: coverImage ? coverImage.url : "",
  email,
  password,
  username: username.toLowerCase(),
});

// remove password and refresh token field from response

const userCreated = await User.findById(user._id).select(
  "-password -refresToken"
);

// check for user creation
if (!userCreated) {
  throw new ApiErrorHandler(500, "Error : User Not Registerd ");
}

// return res
return res.status(201)
  .json(
    new ApiResponseHandler(201, userCreated, " User Registerd SuccesFully ")
  );
});

const loginUser = asyncHandler(async (req, res) => {
  //  get for data
  //  validate - not empty
  //  check username is correct or not
  //  password check
  //  access and refresh token
  //  send the tokens in cookies )(ecure cookies)
  //  return response
  //  Forget Password
  //  send the verifcation code to the user mail address

  const { email, username, password } = req.body;

  // One of them is must requied
  if (!(username || email)) {
    throw new ApiErrorHandler(400, "username or email is requireds");
  }

  // find user using $or ( it is mongo db operator ). here we are checking for or by passing an array of objects
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  // user not exist
  if (!user) {
    throw new ApiErrorHandler(400, "user does not exist");
  }

  // check for password
  const isPasswordValid = await user.isPasswordCorrect(password);

  // incorrect password 
  if (!isPasswordValid) {
    throw new ApiErrorHandler(400, "Invalid Password ");
  }

  // genetaed the access and refresh token by the methods created
  const {accessToken, refreshToken } =  await generateAccessAndRefreshTokens(user._id)


  // Send into the cookies
  // Now we have to send or return the user or the data, but we are not going to send imp credentials like password and also we can send "user" but our user (above) does not have accessTokens and Refresh Tokens bcz at that time we have not generated them .now we have two options we can simply update the tokens in "user" or we can again do the db call (which can be expensive if the data is large, but here not) . so now it is your choice.
  
  
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

    // Now we Sent Cookies

    const options = {

      // That means the cookies are only modiefied by server only  but you can see them
      httpOnly : true,
      secure: true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
      new ApiResponseHandler(200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User Logged in Successfully"
      )
    )
    

})

const logoutUser = asyncHandler(async (req, res) => {
  
  // Remove refresh token 
  // Remove cookies

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken: undefined
      }
    },{
      new: true
    }
  )

  const options = {
    httpOnly:true,
    secure: true,
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(
    new ApiResponseHandler(200,{}, "User logged Out Sucessfully")
  )
  
})

const refreshAccessToken = asyncHandler(async (req, res) =>{

    const incomingRefreshToken = await req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
      throw new ApiErrorHandler(400,"unauthorised request - bcz of incomingRefreshToken")
    }
    
    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
      )
      
      const user = await User.findById(decodedToken?._id)
      
      if(!user){
        throw new ApiErrorHandler(
          400,
          "Invalid refresh token - bcz of user/decodedToken"
        );
      }
      
      if(incomingRefreshToken !== user.refreshToken){
        throw new ApiErrorHandler(401, "Refresh token is expired")
      }
  
      // Generain new Access Token
  
      const options = {
        httpOnly : true,
        secure : true,
      }
      
      const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
      
      return res
      .status(200)
      .cookie("accessToken",accessToken)
      .cookie("refreshToken",newRefreshToken)
      .json(
        new ApiResponseHandler(200,
          {accessToken,newRefreshToken}, 
          "Access Token Refreshed",
        )
      )
    } catch (error) {
        throw new ApiErrorHandler(401, error?.message ||  "Invalid refresh token");
    }

  })

const changeCurrentPassword =  asyncHandler(async (req, res) =>{

  const {oldPassword, newPassword} = req.body

  const userId = req.user?._id


  if(!userId){
    throw new ApiErrorHandler(400,"Not able to get userId from backend")
  }

  const user = await User.findById(userId)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiErrorHandler(400, "old Password is wrong :(")
  }

  user.password = newPassword

  await user.save({validateBeforeSave : false})

  return res
  .status(200)
  .json(new ApiResponseHandler(200, {} , "Password changed Succesfullly :) "))

})

 const getCurrentUser =  asyncHandler( (req, res) => {
  
  return res.
  status(200)
  .json(new ApiResponseHandler(200, req.user , "User Fetched Successfully"))
})

const updateAccountDetails = asyncHandler( (req, res) =>{
    const {fullName , email} = req.body

    if(!fullName || !email){
      throw new ApiErrorHandler(400,"All fields are required")
    }

    const user = User.findByIdAndUpdate(
      req.user?._id,
      {
        $set :{
          fullName : fullName,
          email : email
        }
      },
      { new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponseHandler(200, user, "Account details updated"))
})

const updateAvatar =  asyncHandler(async (req, res) =>{

  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiErrorHandler(400, "Avatar file is Not Present")
  }
  
  
  const avatar =  await uploadOnCloudinary(avatarLocalPath)
  
  if(!avatar.url){
    throw new ApiErrorHandler(400, "Avatar uploading failed")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
  .status(200)
  .json(new ApiResponseHandler(200, user, "Avatar updated sucessfully"))
})


const updateCoverImage =  asyncHandler(async (req, res) =>{

  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiErrorHandler(400, "CoverImage file is Not Present")
  }

  
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  
  if(!coverImage.url){
    throw new ApiErrorHandler(400, "coverImage uploading failed")
  }

  const user =  await User.findByIdAndUpdate(
    req.user?._id,
    { 
      $set:{
        coverImage : coverImage.url
      }
    },
    {new : true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponseHandler(200, user, "coverImage updated sucessfully"))
})
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
};
