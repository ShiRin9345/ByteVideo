// Database package entry point
export * from "./client";
export * from "./schema";
export * from "./types";

// Export schema as a namespace for better-auth adapter
import * as schema from "./schema";
export { schema };
