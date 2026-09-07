require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");
require("./src/config/redis"); // establishes redis connection on import

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
});

// Guard against unhandled promise rejections crashing the process silently
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});
