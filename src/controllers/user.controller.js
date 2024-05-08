import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandler } from "../utils/ApiErrorHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponseHandler } from "../utils/ApiResponseHandler.js";

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

  const avatarLocalPath = req.files?.avatar[0]?.path;


  // This Js Code is Not Right so  instead of this 
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // This Code is Been used

  let  coverImageLocalPath; 
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.lenght > 0){
      coverImageLocalPath = req.files.coverIamge[0].path;
    }


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

export { registerUser };
