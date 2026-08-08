import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  fullname: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  avatar: {
    type: String
  },
  coverImage: {
    type: String
  },
  limit: {
    type: Number,
    default: 100
  },
  watchHistory: {
    videoIds: {
      type: [Schema.Types.ObjectId],
      ref: "Video",
      default: []
    },
    shortIds: {
      type: [Schema.Types.ObjectId],
      ref: "Short",
      default: []
    }
  },
  watchLater: {
    videoIds: {
      type: [Schema.Types.ObjectId],
      ref: "Video",
      default: []
    },
    shortIds: {
      type: [Schema.Types.ObjectId],
      ref: "Short",
      default: []
    }
  },
  password: {
    type: String,
  },
  otp: {
    type: String
  },
  otpExpiry: {
    type: Date
  },
  refreshToken: {
    type: String
  },
  idToken: {
    type: String
  }
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.hasPassword = !!ret.password;
    delete ret.password;
    return ret;
  }
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password)
    this.password = await bcrypt.hash(this.password, 10);
  next();
})
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
}
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  }
  )
}
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY
  }
  )
}
userSchema.methods.generatePasswordResetToken = function () {
  const secret = process.env.PASSWORD_RESET_TOKEN_SECRET + this.password;
  return jwt.sign({ _id: this._id }, secret, { expiresIn: process.env.PASSWORD_RESET_TOKEN_EXPIRY });
}
export const User = model("User", userSchema)