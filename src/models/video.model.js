import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // From Cloudnary (URL)
      required: true,
    },
    thumbnail: {
      type: String, // From Cloudnary (URL)
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // From Cloudnary (URL)
      required: true,
    },
    viwes: {
      type: Number, // From Cloudnary (URL)
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner:{
      type : Schema.Types.ObjectId,
      ref : "User"
    }
  },
  {
    timestamps: true,
  }
);

videoSchema.pluggon(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
