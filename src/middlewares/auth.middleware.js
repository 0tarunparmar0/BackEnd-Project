import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { ApiErrorHandler } from "../utils/ApiErrorHandler";
import { asyncHandler } from "../utils/asyncHandler";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // why we use ?  because agr cookies se na aye toh kuch ( par kyu nhi ayegi hamne toh behja hai na, yeh tab hota haio jab user mobile se ata hai or etc idk..)  isliye we also ser user: ...  (header) toh use ham usse check kr lenge. par yh apr keyword thode difficut use hua hai
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiErrorHandler(401, "Unauthorized Request");
    }

    const decodedToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiErrorHandler(401, "Invalid Access Token");
    }

    req.user = user;

    next();
  } catch (error) {
      throw new ApiErrorHandler(401, error?.message || "Invalid Access Token");

  }
});
