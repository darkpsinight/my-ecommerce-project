const { verifyAuth } = require("../plugins/authVerify");
const { User } = require("../models/user");

const sellerRoutes = async (fastify, opts) => {
  // Get seller profile
  fastify.route({
    method: "GET",
    url: "/profile",
    preHandler: verifyAuth(["seller"]),
    handler: async (request, reply) => {
      try {
        return reply.code(200).send({
          success: true,
          data: request.user,
        });
      } catch (error) {
        request.log.error(`Error in seller profile: ${error.message}`);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
        });
      }
    },
  });

  // Update seller profile
  fastify.route({
    method: "PUT",
    url: "/profile",
    preHandler: verifyAuth(["seller"]),
    schema: {
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          // Add other fields that can be updated
        },
      },
    },
    handler: async (request, reply) => {
      try {
        // Get user ID from authenticated user
        const uid = request.user.uid;
        const updateData = request.body;

        // Find the user by uid
        const user = await User.findOne({ uid });

        if (!user) {
          return reply.code(404).send({
            success: false,
            error: "User not found",
          });
        }

        // Update allowed fields
        if (updateData.name) {
          user.name = updateData.name;
        }

        // Email updates require additional verification, so we'll skip for now
        // Add other fields as needed

        // Save the updated user
        await user.save();

        return reply.code(200).send({
          success: true,
          message: "Profile updated successfully",
          data: {
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      } catch (error) {
        request.log.error(`Error updating seller profile: ${error.message}`);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
        });
      }
    },
  });

  // Get seller's products
  fastify.route({
    method: "GET",
    url: "/products",
    preHandler: verifyAuth(["seller"]),
    handler: async (request, reply) => {
      try {
        // Add logic to fetch seller's products
        return reply.code(200).send({
          success: true,
          data: [],
        });
      } catch (error) {
        request.log.error(`Error fetching seller products: ${error.message}`);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
        });
      }
    },
  });

  // Get seller's orders
  fastify.route({
    method: "GET",
    url: "/orders",
    preHandler: verifyAuth(["seller"]),
    handler: async (request, reply) => {
      try {
        // Add logic to fetch seller's orders
        return reply.code(200).send({
          success: true,
          data: [],
        });
      } catch (error) {
        request.log.error(`Error fetching seller orders: ${error.message}`);
        return reply.code(500).send({
          success: false,
          error: "Internal server error",
        });
      }
    },
  });
};

module.exports = {
  sellerRoutes,
};
