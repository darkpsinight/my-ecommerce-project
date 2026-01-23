const fastify = require("fastify")({
  logger: {
    level: "info",
    transport:
      process.env.NODE_ENV === "development"
        ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
            messageFormat: "{msg}",
            singleLine: true,
            levelFirst: false,
            charset: "utf-8",
          },
        }
        : undefined,
    stream: process.stdout,
  },
});

const { configs, keywords, loadConfigsFromDB } = require("./configs");
const { connectDB } = require("./models/connectDB");
const { getErrorHandler } = require("./plugins/errorHandler");
const { authenticationRoutes } = require("./routes/authentication");
const { oauth2Routes } = require("./routes/oauth2Provider");
const { getSwaggerOptions } = require("./utils/utils");
const helmet = require("fastify-helmet");
const { adminRoutes } = require("./routes/admin");
const publicRoutes = require("./routes/public");
const { sellerRoutes } = require("./routes/seller");
const { sellerFinancialRoutes } = require("./routes/sellerFinancials");
const { listingsRoutes } = require("./routes/listings");
const { imageUploadRoutes } = require("./routes/imageUpload");
const { walletRoutes } = require("./routes/wallet");
const { orderRoutes } = require("./routes/orders");
const { reviewRoutes } = require("./routes/reviews");
const cartRoutes = require("./routes/cart");
const checkoutRoutes = require("./routes/checkout");
const wishlistRoutes = require("./routes/wishlist");
const viewedProductRoutes = require("./routes/viewedProducts");
const impressionRoutes = require("./routes/impressions");
const performanceRoutes = require("./routes/performanceRoutes");
const webhookRoutes = require("./routes/webhooks");
const { sendSuccessResponse } = require("./utils/responseHelpers");
const { getRefreshTokenOptns } = require("./models/refreshToken");
const fastifyCsrf = require("fastify-csrf");
const fastifyCookie = require("fastify-cookie");
const adminRemediationRoutes = require("./routes/adminRemediation");
const adminFinancialRoutes = require("./routes/adminFinancials");
const { configCache } = require("./services/configCache");
const {
  registerWithFastify: registerImageKitWithFastify,
} = require("./handlers/imageUploadHandler");
const { initializeJobs } = require("./jobs");

// fastify-helmet adds various HTTP headers for security
if (configs.ENVIRONMENT !== keywords.DEVELOPMENT_ENV) {
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
  fastify.register(helmet, { contentSecurityPolicy: false });
}

if (configs.COOKIE_SECRET) {
  fastify.register(fastifyCookie, {
    secret: configs.COOKIE_SECRET, // For signing cookies
  });

  // Create CSRF cookie options without expiration (session cookie)
  const csrfCookieOpts = {
    httpOnly: true,
    path: "/",
    signed: true,
    sameSite:
      configs.ENVIRONMENT !== keywords.DEVELOPMENT_ENV ? "strict" : "lax",
    secure: configs.ENVIRONMENT !== keywords.DEVELOPMENT_ENV,
  };

  fastify.register(fastifyCsrf, {
    cookieOpts: csrfCookieOpts,
  });
}

// Enable swagger ui in development environment
if (configs.ENVIRONMENT.toLowerCase() === keywords.DEVELOPMENT_ENV) {
  fastify.register(require("fastify-swagger"), getSwaggerOptions());
}

// If cors is enabled then register CORS origin
if (configs.ALLOW_CORS_ORIGIN) {
  fastify.register(require("fastify-cors"), {
    origin: configs.ALLOW_CORS_ORIGIN.split(","),
    credentials: true,
  });
}

// Use real IP address if x-real-ip header is present
fastify.addHook("onRequest", async (request, reply) => {
  request.ipAddress =
    request.headers["x-real-ip"] || // nginx
    request.headers["x-client-ip"] || // apache
    request.ip;
});

// Rate limits based on IP address
fastify.register(require("fastify-rate-limit"), {
  max: 100,
  timeWindow: "1 minute",
  keyGenerator: function (req) {
    return (
      req.headers["x-real-ip"] || // nginx
      req.headers["x-client-ip"] || // apache
      req.ip // fallback to default
    );
  },
});

// Set error Handler
fastify.setErrorHandler(getErrorHandler(fastify));

// Register Routes required for authentication
fastify.register(authenticationRoutes, { prefix: "/api/v1/auth" });

// Register oauth2 routes
fastify.register(oauth2Routes, { prefix: "/api/v1/auth/oauth" });

// Register admin routes
fastify.register(adminRoutes, { prefix: "/api/v1/admin" });

// Register admin remediation routes (Step 17)
fastify.register(adminRemediationRoutes, {
  prefix: '/api/v1/admin/remediation'
});

// Register admin financial observability routes (Step 18)
fastify.register(adminFinancialRoutes, { prefix: "/api/v1/admin" });


// Register public routes
fastify.register(publicRoutes, { prefix: "/api/v1/public" });

// Register seller routes
fastify.register(sellerRoutes, { prefix: "/api/v1/seller" });
fastify.register(sellerFinancialRoutes, { prefix: "/api/v1/seller" });

// Register listings routes
fastify.register(listingsRoutes, { prefix: "/api/v1/listings" });

// Register wallet routes
fastify.register(walletRoutes, { prefix: "/api/v1/wallet" });

// Register order routes
fastify.register(orderRoutes, { prefix: "/api/v1/orders" });

// Register review routes
fastify.register(reviewRoutes, { prefix: "/api/v1/reviews" });

// Register cart routes
fastify.register(cartRoutes, { prefix: "/api/v1/cart" });

// Register checkout routes
fastify.register(checkoutRoutes, { prefix: "/api/v1/checkout" });

// Register wishlist routes
fastify.register(wishlistRoutes, { prefix: "/api/v1/wishlist" });

// Register viewed products routes
fastify.register(viewedProductRoutes, { prefix: "/api/v1/viewed-products" });

// Register impression tracking routes
fastify.register(impressionRoutes, { prefix: "/api/v1" });

// Register multipart content parser for file uploads
fastify.register(require("fastify-multipart"), {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only allow one file per request
  },
  addToBody: false, // Don't add files to the request body
  onFile: async (part) => {
    // This is just to handle the file stream properly
    // The actual processing is done in the route handler
    try {
      for await (const chunk of part.file) {
        // Just consume the stream
      }
    } catch (err) {
      console.error("Error in multipart onFile:", err);
    }
  },
});

// Register image upload routes
fastify.register(imageUploadRoutes, { prefix: "/api/v1/images" });

// Register performance monitoring routes
fastify.register(performanceRoutes, { prefix: "/api/v1" });

// Register webhook routes (Note: Prefix is /api/webhooks to match Stripe config, not /api/v1)
fastify.register(webhookRoutes, { prefix: "/api/webhooks" });

// Auth Service health check
fastify.get("/", async (request, reply) => {
  sendSuccessResponse(reply, {
    statusCode: 200,
    message: "Application is running",
  });
});

// Graceful shutdown handler
const closeGracefully = async (signal) => {
  fastify.log.info(`Received signal to terminate: ${signal}`);

  try {
    // Cleanup config cache and change streams
    await configCache.cleanup();
    fastify.log.info("Config cache cleaned up successfully");

    // Close fastify server
    await fastify.close();
    fastify.log.info("Fastify server closed successfully");

    process.exit(0);
  } catch (error) {
    fastify.log.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

// Listen for shutdown signals
process.on("SIGTERM", () => closeGracefully("SIGTERM"));
process.on("SIGINT", () => closeGracefully("SIGINT"));

// Start the server
const start = async () => {
  try {
    if (
      configs.JWT_KEY &&
      configs.MONGO_URI &&
      configs.COOKIE_SECRET &&
      configs.REFRESH_KEY
    ) {
      // Connect to MongoDB Database
      await connectDB(fastify);

      // Initialize config cache and load configurations
      await loadConfigsFromDB(fastify);

      // Register ImageKit with Fastify to initialize after configs are loaded
      registerImageKitWithFastify(fastify);

      await fastify.listen(configs.PORT, configs.HOST);

      // Setup cron jobs using central loader
      initializeJobs(fastify);

      if (configs.ENVIRONMENT.toLowerCase() === keywords.DEVELOPMENT_ENV) {
        fastify.swagger();
      }

      // Log all registered routes with better formatting
      const routeTree = fastify.printRoutes();

      // Format the route tree with proper characters and indentation
      const formattedRoutes = routeTree
        .split("\n")
        .map((line) => {
          return line
            .replace(/ÔööÔöÇÔöÇ/g, "└──")
            .replace(/Ôö£ÔöÇÔöÇ/g, "├──")
            .replace(/Ôöé\s+/g, "│   ")
            .replace(/ÔöÇ/g, "─");
        })
        .join("\n");

      fastify.log.info("Registered routes:");
      console.log("\nRoute Tree:");
      console.log(formattedRoutes);
    } else {
      fastify.log.error("Please configure the required environment variables");
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
