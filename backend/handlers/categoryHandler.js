const { Category } = require("../models/category");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/responseHelpers");
const mongoose = require("mongoose");

// Create a new category
const createCategory = async (request, reply) => {
  try {
    const categoryData = request.body;
    
    // Add the creator information (admin user)
    // Check if user exists in request, otherwise use a placeholder ID for testing
    if (request.user && request.user._id) {
      categoryData.createdBy = request.user._id;
    } else {
      // For testing only - use a valid MongoDB ObjectId format
      categoryData.createdBy = new mongoose.Types.ObjectId();
      request.log.warn('Using placeholder user ID for category creation - this should only happen in testing');
    }
    
    const category = new Category(categoryData);
    await category.save();

    sendSuccessResponse(reply, {
      statusCode: 201,
      message: "Category created successfully",
      data: category
    });
  } catch (error) {
    request.log.error(`Error creating category: ${error.message}`);
    
    if (error.code === 11000) {
      return sendErrorResponse(reply, 409, "Category with this name already exists");
    }
    
    sendErrorResponse(reply, 500, "Error creating category");
  }
};

// Get all categories with pagination
const getCategories = async (request, reply) => {
  try {
    const { page = 1, limit = 10, isActive } = request.query;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }
    
    // Get total count for pagination
    const total = await Category.countDocuments(filter);
    
    // Fetch categories with pagination
    const categories = await Category.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Categories retrieved successfully",
      data: categories,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    request.log.error(`Error fetching categories: ${error.message}`);
    sendErrorResponse(reply, 500, "Error fetching categories");
  }
};

// Get a single category by ID
const getCategoryById = async (request, reply) => {
  try {
    const { id } = request.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(reply, 400, "Invalid category ID format");
    }
    
    const category = await Category.findById(id);
    
    if (!category) {
      return sendErrorResponse(reply, 404, "Category not found");
    }
    
    sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Category retrieved successfully",
      data: category
    });
  } catch (error) {
    request.log.error(`Error fetching category: ${error.message}`);
    sendErrorResponse(reply, 500, "Error fetching category");
  }
};

// Update a category
const updateCategory = async (request, reply) => {
  try {
    const { id } = request.params;
    const updateData = request.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(reply, 400, "Invalid category ID format");
    }
    
    // Add the updater information if user exists in request
    if (request.user && request.user._id) {
      updateData.updatedBy = request.user._id;
    } else {
      // For testing only
      updateData.updatedBy = new mongoose.Types.ObjectId();
      request.log.warn('Using placeholder user ID for category update - this should only happen in testing');
    }
    
    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return sendErrorResponse(reply, 404, "Category not found");
    }
    
    sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Category updated successfully",
      data: category
    });
  } catch (error) {
    request.log.error(`Error updating category: ${error.message}`);
    
    if (error.code === 11000) {
      return sendErrorResponse(reply, 409, "Category with this name already exists");
    }
    
    sendErrorResponse(reply, 500, "Error updating category");
  }
};

// Delete a category
const deleteCategory = async (request, reply) => {
  try {
    const { id } = request.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(reply, 400, "Invalid category ID format");
    }
    
    const result = await Category.findByIdAndDelete(id);
    
    if (!result) {
      return sendErrorResponse(reply, {
        statusCode: 404,
        message: "Category not found"
      });
    }
    
    sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Category deleted successfully"
    });
  } catch (error) {
    request.log.error(`Error deleting category: ${error.message}`);
    sendErrorResponse(reply, 500, "Error deleting category");
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
