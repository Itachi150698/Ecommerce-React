import Product from "../models/productModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import APIFunctionality from "../utils/apiFunctionality.js";

//creating  products
export const createProducts = handleAsyncError(async (req, res, next) => {
  req.body.user = req.user.id;
  console.log("User ID:", req.user);
  
  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product
  });
})

//get all products
export const getAllProducts = handleAsyncError(async (req, res, next) => {
  const resultPerPage = 3;
  const apiFeatures = new APIFunctionality(Product.find(), req.query).search().filter();

  //Getting filtered query before pagination
  const filteredQuery = apiFeatures.query.clone();
  const productCount = await filteredQuery.countDocuments();

  // Calculate total pages based on filtered product count
  const totalPages = Math.ceil(productCount / resultPerPage);
  const page = Number(req.query.page) || 1;

  if( page > totalPages) {
    return next(new HandleError("This page does not exist", 404));
  }

  //Applying pagination
  apiFeatures.pagination(resultPerPage);
  const products = await apiFeatures.query;

  if (!products || products.length === 0) {
    return next(new HandleError("No products found", 404));
  }

  res.status(200).json({
    success: true,
    products,
    productCount,
    resultPerPage,
    totalPages,
    currentPage: page
  });
})

//update product
export const updateProduct = handleAsyncError(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
    if (!product) {
    return next(new HandleError("Product not found", 404));
  }
  res.status(200).json({
    success: true,
    product
  });
})

//delete product
export const deleteProduct = handleAsyncError(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
    return next(new HandleError("Product not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Product deleted successfully"
  });
})

//Accessing single product
export const getSingleProduct = handleAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new HandleError ("Product not found", 404));
  }
  res.status(200).json({
    success: true,
    product
  });
})

//Admin: Get all products
export const getAdminProducts = handleAsyncError(async (req, res, next) => {
  const products = await Product.find();
  if (!products || products.length === 0) {
    return next(new HandleError("No products found", 404));
  }
  res.status(200).json({
    success: true,
    products
  });
})