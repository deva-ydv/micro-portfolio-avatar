const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const themeEnum = ["light", "dark", "sunset", "forest", "ocean"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never return password by default
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    bio: {
      type: String,
      maxlength: 200,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    theme: {
      type: String,
      enum: themeEnum,
      default: "light",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving, only if it was modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Shape returned on public profile lookups
userSchema.methods.toPublicJSON = function () {
  return {
    name: this.name,
    slug: this.slug,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    theme: this.theme,
  };
};

module.exports = mongoose.model("User", userSchema);
