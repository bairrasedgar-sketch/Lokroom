import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Format personnalisé
const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// Transport pour fichiers avec rotation
const fileRotateTransport = new DailyRotateFile({
  filename: "logs/app-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    customFormat
  ),
});

// Transport pour erreurs uniquement
const errorFileTransport = new DailyRotateFile({
  filename: "logs/error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "30d",
  level: "error",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    customFormat
  ),
});

// Transport console (dev uniquement)
const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize(),
    timestamp({ format: "HH:mm:ss" }),
    customFormat
  ),
});

// Logger principal
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  transports: [
    fileRotateTransport,
    errorFileTransport,
    ...(process.env.NODE_ENV !== "production" ? [consoleTransport] : []),
  ],
  exitOnError: false,
});

// Logger pour les requêtes HTTP
export const httpLogger = winston.createLogger({
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    customFormat
  ),
  transports: [
    new DailyRotateFile({
      filename: "logs/http-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "7d",
    }),
  ],
});

// Logger pour les événements métier
export const businessLogger = winston.createLogger({
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    customFormat
  ),
  transports: [
    new DailyRotateFile({
      filename: "logs/business-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "30d",
    }),
  ],
});
