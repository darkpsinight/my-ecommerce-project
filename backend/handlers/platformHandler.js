const { Category } = require("../models/category");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/responseHelpers");
const { isValidUrl, validateUrl } = require("../utils/urlValidator");
const mongoose = require("mongoose");

/**
 * Add a new platform to a specific category
 */
const addPlatform = async (request, reply) => {
  try {
    const { categoryId } = request.params;
    const platformData = request.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return sendErrorResponse(reply, 400, "Invalid category ID format");
    }

    // Validate imageUrl if provided
    if (platformData.imageUrl) {
      const urlError = validateUrl(platformData.imageUrl, true);
      if (urlError) {
        return sendErrorResponse(reply, 400, urlError);
      }
    }

    // Find the category
    const category = await Category.findById(categoryId);

    if (!category) {
      return sendErrorResponse(reply, 404, "Category not found");
    }

    // Check if platform with same name already exists
    const platformExists = category.platforms.some(
      platform => platform.name.toLowerCase() === platformData.name.toLowerCase()
    );

    if (platformExists) {
      return sendErrorResponse(reply, 409, "Platform with this name already exists in this category");
    }

    // Add the platform to the category
    category.platforms.push(platformData);

    // Add updater information
    if (request.user && request.user._id) {
      category.updatedBy = request.user._id;
    } else {
      category.updatedBy = new mongoose.Types.ObjectId();
      request.log.warn('Using placeholder user ID for platform creation - this should only happen in testing');
    }

    await category.save();

    // Return the newly added platform
    const newPlatform = category.platforms[category.platforms.length - 1];

    sendSuccessResponse(reply, {
      statusCode: 201,
      message: "Platform added successfully",
      data: newPlatform
    });
  } catch (error) {
    request.log.error(`Error adding platform: ${error.message}`);
    sendErrorResponse(reply, 500, "Error adding platform");
  }
};

/**
 * Get all platforms for a specific category
 */
const getPlatforms = async (request, reply) => {
  try {
    const { categoryId } = request.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return sendErrorResponse(reply, 400, "Invalid category ID format");
    }

    const category = await Category.findById(categoryId);

    if (!category) {
      return sendErrorResponse(reply, 404, "Category not found");
    }

    sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Platforms retrieved successfully",
      data: category.platforms
    });
  } catch (error) {
    request.log.error(`Error fetching platforms: ${error.message}`);
    sendErrorResponse(reply, 500, "Error fetching platforms");
  }
};

/**
 * Get a specific platform by name from a category
 */
const getPlatformByName = async (request, reply) => {
  try {
    const { categoryId, platformName } = request.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return sendErrorResponse(reply, 400, "Invalid category ID format");
    }

    const category = await Category.findById(categoryId);

    if (!category) {
      return sendErrorResponse(reply, 404, "Category not found");
    }

    const platform = category.platforms.find(
      p => p.name.toLowerCase() === platformName.toLowerCase()
    );

    if (!platform) {
      return sendErrorResponse(reply, 404, "Platform not found in this category");
    }

    sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Platform retrieved successfully",
      data: platform
    });
  } catch (error) {
    request.log.error(`Error fetching platform: ${error.message}`);
    sendErrorResponse(reply, 500, "Error fetching platform");
  }
};

/**
 * Update a platform in a category
 */
const updatePlatform = async (request, reply) => {
  try {
    const { categoryId, platformName } = request.params;
    const updateData = request.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return sendErrorResponse(reply, 400, "Invalid category ID format");
    }

    // Validate imageUrl if provided
    if (updateData.imageUrl) {
      const urlError = validateUrl(updateData.imageUrl, true);
      if (urlError) {
        return sendErrorResponse(reply, 400, urlError);
      }
    }

    const category = await Category.findById(categoryId);

    if (!category) {
      return sendErrorResponse(reply, 404, "Category not found");
    }

    // Find the platform index
    const platformIndex = category.platforms.findIndex(
      p => p.name.toLowerCase() === platformName.toLowerCase()
    );

    if (platformIndex === -1) {
      return sendErrorResponse(reply, 404, "Platform not found in this category");
    }

    // If name is being updated, check if the new name already exists
    if (updateData.name &&
        updateData.name.toLowerCase() !== platformName.toLowerCase() &&
        category.platforms.some(p => p.name.toLowerCase() === updateData.name.toLowerCase())) {
      return sendErrorResponse(reply, 409, "Platform with this name already exists in this category");
    }

    // Update the platform
    const updatedPlatform = {
      ...category.platforms[platformIndex].toObject(),
      ...updateData
    };

    category.platforms[platformIndex] = updatedPlatform;

    // Add updater information
    if (request.user && request.user._id) {
      category.updatedBy = request.user._id;
    } else {
      category.updatedBy = new mongoose.Types.ObjectId();
      request.log.warn('Using placeholder user ID for platform update - this should only happen in testing');
    }

    await category.save();

    sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Platform updated successfully",
      data: category.platforms[platformIndex]
    });
  } catch (error) {
    request.log.error(`Error updating platform: ${error.message}`);
    sendErrorResponse(reply, 500, "Error updating platform");
  }
};

/**
 * Delete a platform from a category
 */
const deletePlatform = async (request, reply) => {
  try {
    const { categoryId, platformName } = request.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return sendErrorResponse(reply, 400, "Invalid category ID format");
    }

    const category = await Category.findById(categoryId);

    if (!category) {
      return sendErrorResponse(reply, 404, "Category not found");
    }

    // Find the platform index
    const platformIndex = category.platforms.findIndex(
      p => p.name.toLowerCase() === platformName.toLowerCase()
    );

    if (platformIndex === -1) {
      return sendErrorResponse(reply, 404, "Platform not found in this category");
    }

    // Remove the platform
    category.platforms.splice(platformIndex, 1);

    // Add updater information
    if (request.user && request.user._id) {
      category.updatedBy = request.user._id;
    } else {
      category.updatedBy = new mongoose.Types.ObjectId();
      request.log.warn('Using placeholder user ID for platform deletion - this should only happen in testing');
    }

    await category.save();

    sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Platform deleted successfully"
    });
  } catch (error) {
    request.log.error(`Error deleting platform: ${error.message}`);
    sendErrorResponse(reply, 500, "Error deleting platform");
  }
};

module.exports = {
  addPlatform,
  getPlatforms,
  getPlatformByName,
  updatePlatform,
  deletePlatform
};
