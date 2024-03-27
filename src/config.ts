import "dotenv/config";

export const LOG_LEVEL = process.env.LOG_LEVEL;
export const NODE_ENV = process.env.NODE_ENV || "production";
export const DATADOG_API_KEY = process.env.DATADOG_API_KEY || "no-key";
export const UNSAFE_DATABASE_OPERATIONS =
    process.env.UNSAFE_DATABASE_OPERATIONS || false;
export const DATABASE_HOSTNAME = process.env.DATABASE_HOSTNAME;
export const DATABASE_USERNAME = process.env.DATABASE_USERNAME;
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
export const DATABASE_DATABASE = process.env.DATABASE_DATABASE;
export const DATABASE_PORT = process.env.DATABASE_PORT || 5432;
export const DATABASE_URL = process.env.DATABASE_URL;
export const CACERT = process.env.CACERT;
