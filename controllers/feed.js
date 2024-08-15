const path = require("path");
const fs = require("fs");

const { validationResult } = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");
const { post } = require("../routes/auth");

module.exports.getPosts = async (req, res, next) => {
  try {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    const totalItems = await Post.countDocuments();

    const posts = await Post.find({})
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: "fetched posts successfully",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (error) {
    error.message = error._message;
    error.statusCode = 500;
    return next(error);
  }
};

module.exports.createPost = async (req, res, next) => {
  try {
    const { errors } = validationResult(req);
    if (errors.length > 0) {
      console.log(errors);

      const error = new Error("Validation failed entered value is incorrect");
      error.statusCode = 422;
      throw error;
    }
    if (!req.file) {
      const error = new Error("No valid image uploaded");
      error.statusCode = 422;
      throw error;
    }
    const imageUrl = req.file.path.replace("\\", "/");
    const title = req.body.title;
    const content = req.body.content;
    const newPost = new Post({
      title: title,
      content: content,
      imageUrl: imageUrl,
      creator: req.userId,
    });
    const result = await newPost.save();
    console.log(result);

    const user = await User.findById(req.userId);
    user.posts.push(result);
    const creator = await user.save();
    res.status(201).json({
      message: "Post created successfully",
      post: newPost,
      creator: { _id: creator._id, name: creator.name },
    });
  } catch (error) {
    error.message = error.message || error._message;
    error.statusCode = error.statusCode || 500;
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
  try {
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
    const postToUpdate = await Post.findById(postId);

    if (!postToUpdate) {
      const error = new Error("Post not found");
      error.statusCode = 422;
      return next(error);
    }
    if (postToUpdate.creator.toString() !== req.userId) {
      const error = new Error("Not Authorized");
      error.statusCode = 403;
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
    if (postToDelete.creator.toString() !== req.userId) {
      const error = new Error("Not Authorized");
      error.statusCode = 403;
      throw error;
    }
    clearImage(postToDelete.imageUrl);
    const result = await Post.findByIdAndDelete(postId);
    console.log(result);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
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

module.exports.getStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 403;
      throw error;
    }
    return res
      .status(200)
      .json({ message: "Status fetched sucessfully", status: user.status });
  } catch (error) {
    error.message = error.message || error._message;
    error.statusCode = error.statusCode || 500;
    return next(error);
  }
};

module.exports.updateStatus = async (req, res, next) => {
  try {
    const newStatus = req.body.status;
    console.log(newStatus);
    
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 403;
      throw error;
    }
    user.status = newStatus;
    const result = await user.save();
    return res
      .status(200)
      .json({ message: "Status updated sucessfully", status: result.status });
  } catch (error) {
    error.message = error.message || error._message;
    error.statusCode = error.statusCode || 500;
    return next(error);
  }
};
