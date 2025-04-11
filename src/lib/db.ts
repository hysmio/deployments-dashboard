import "reflect-metadata";
import { DataSource } from "typeorm";
import { Service } from "./models/service";
import { Instance } from "./models/instance";
import { Event } from "./models/event";
import { Deployment } from "./models/deployment";
import * as dotenv from "dotenv";
import { getDeploymentsByEnvironment } from "./data";

// Load environment variables from .env file if in development
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

let AppDataSource: DataSource;

// Initialize data source
let initialized = false;

export async function initializeDB() {
  if (!initialized) {
      try {
        AppDataSource = new DataSource({
        type: 'postgres',
        url: process.env.DB_URL,
        logging: process.env.NODE_ENV !== "production",
        entities: [Service, Instance, Deployment, Event],
        migrations: [],
        subscribers: [],
      });
      await AppDataSource.initialize();
      console.log("Data Source has been initialized!");
      initialized = true;
    } catch (error) {
      console.error("Error during Data Source initialization", error);
      throw error;
    }
  }
  return AppDataSource;
}