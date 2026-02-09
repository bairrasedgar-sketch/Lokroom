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

// Détection de l'environnement Vercel (read-only filesystem)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;

// Transport pour fichiers avec rotation (seulement si pas sur Vercel)
const fileRotateTransport = !isVercel ? new DailyRotateFile({
  filename: "logs/app-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    customFormat
  ),
}) : null;

// Transport pour erreurs uniquement (seulement si pas sur Vercel)
const errorFileTransport = !isVercel ? new DailyRotateFile({
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
}) : null;

// Transport console (toujours actif)
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
    // Sur Vercel, utiliser seulement console
    // En local, utiliser fichiers + console en dev
    ...(isVercel
      ? [consoleTransport]
      : [
          fileRotateTransport!,
          errorFileTransport!,
          ...(process.env.NODE_ENV !== "production" ? [consoleTransport] : []),
        ]
    ),
  ].filter(Boolean),
  exitOnError: false,
});

// Logger pour les requêtes HTTP
export const httpLogger = winston.createLogger({
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    customFormat
  ),
  transports: isVercel
    ? [consoleTransport]
    : [
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
  transports: isVercel
    ? [consoleTransport]
    : [
        new DailyRotateFile({
          filename: "logs/business-%DATE%.log",
          datePattern: "YYYY-MM-DD",
          maxSize: "20m",
          maxFiles: "30d",
        }),
      ],
});
