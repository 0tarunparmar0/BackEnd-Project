import mongoose, {Schema} from "mongoose";

const subscripitionSchema = new Schema({  

  subscriber : {
    type: Schema.type.ObjectId,
    ref: "User"
  },
  channel : {
    type: Schema.type.ObjectId,
    ref: "User"
  } 

},{timestamps: true})  

export const Subscripition = mongoose.model("Subscripition", subscripitionSchema); 