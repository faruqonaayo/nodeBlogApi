const path = require("path");
const fs = require("fs");

const { validationResult } = require("express-validator");

const Post = require("../models/post");
const post = require("../models/post");

module.exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({});
    res.status(200).json({
      message: "fetched posts successfully",
      posts: posts,
    });
  } catch (error) {
    error.message = error._message;
    error.statusCode = 500;
    return next(error);
  }
};

module.exports.createPost = async (req, res, next) => {
  const { errors } = validationResult(req);
  if (errors.length > 0) {
    const error = new Error("Validation failed entered value is incorrect");
    error.statusCode = 422;
    return next(error);
  }
  if (!req.file) {
    const error = new Error("No valid image uploaded");
    error.statusCode = 422;
    return next(error);
  }
  const imageUrl = req.file.path.replace("\\", "/");
  const title = req.body.title;
  const content = req.body.content;
  try {
    const newPost = new Post({
      title: title,
      content: content,
      imageUrl: imageUrl,
      creator: { name: "Faruq" },
    });
    const result = await newPost.save();
    console.log(result);

    res.status(201).json({
      message: "Post created successfully",
      post: {
        _id: Date.now(),
        title,
        content,
        creator: "Faruq",
        createdAt: Date.now(),
      },
    });
  } catch (error) {
    error.message = error._message;
    error.statusCode = 500;
    return next(error);
  }
};

module.exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 422;
      return next(error);
    }
    return res.status(200).json({ message: "post fetched", post: post });
  } catch (error) {
    error.message = error._message;
    error.statusCode = 500;
    return next(error);
  }
};

module.exports.updatePost = async (req, res, next) => {
  const { errors } = validationResult(req);
  if (errors.length > 0) {
    const error = new Error("Validation failed entered value is incorrect");
    error.statusCode = 422;
    return next(error);
  }
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path.replace("\\", "/");
  }
  if (!imageUrl) {
    const error = new Error("no file picked");
    error.statusCode = 422;
    next(error);
  }
  try {
    const postToUpdate = await Post.findById(postId);

    if (!postToUpdate) {
      const error = new Error("Post not found");
      error.statusCode = 422;
      return next(error);
    }
    if (imageUrl !== postToUpdate.imageUrl) {
      clearImage(postToUpdate.imageUrl);
    }
    postToUpdate.title = title;
    postToUpdate.imageUrl = imageUrl;
    postToUpdate.content = content;
    const result = await postToUpdate.save();
    res.status(200).json({ message: "post updated", post: result });
  } catch (error) {
    error.message = error._message;
    error.statusCode = 500;
    return next(error);
  }
};

module.exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const postToDelete = await Post.findById(postId);
    if (!postToDelete) {
      const error = new Error("Post not found");
      error.statusCode = 422;
      return next(error);
    }
    // check logged in user
    clearImage(postToDelete.imageUrl);
    const result = await Post.findByIdAndDelete(postId);
    console.log(result);
    res.status(200).json({ message: "post deleted" });
  } catch (error) {
    error.message = error._message;
    error.statusCode = 500;
    return next(error);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
