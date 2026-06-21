import express from "express"
import http from "http"
import cors from "cors"
import dotenv from "dotenv"
import { Config } from "./configuration/config"
import { Sequelize } from "sequelize"
import pathModule from "path";
import { CommonHelper } from "./helpers/common_helper" // Move import up
import { generateError } from './middlewares/errorHandler'; 
import { Encryption } from "./helpers/encryption_decryption_helper"

dotenv.config()
const app = express()
const server = http.createServer()
const PORT = Number(process.env.PORT) || 3000

// 1. Define global types correctly using the Class blueprints
declare global {
    var Helpers: CommonHelper;
    var connectionObj: Sequelize;
    var path: typeof pathModule;
    var encrypt_decrypt_helper: Encryption;
}

let encrypt_decypt_helper = new Encryption({
    algorithm: process.env.CRYPT_ALGO as string,
    encryptionKey: process.env.ENCRYPT_KEY as string,
    ...(process.env.SALT ? { salt: process.env.SALT } : {}), // Only include if it exists
    iv: process.env.IV as string,
    idEncryptionKey: process.env.ID_ENCRYPT_KEY as string,
    idEncryptionIv: process.env.ID_ENCRYPT_IV as string
})


// 2. Initialize GLOBALS immediately before importing routes
global.path = pathModule;
global.connectionObj = new Config().connectPgDB();
global.Helpers = new CommonHelper(); // Initialize helper immediately
global.encrypt_decrypt_helper = encrypt_decypt_helper

/** ALLOW CORS */
app.use(cors({
    origin : "*",
    optionsSuccessStatus : 200
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/v1/health', (_req: any, res: any) => {
    res.json({status : 'server is running'})
})

// 3. Import routes ONLY after all globals are guaranteed to be populated
import { app_route } from "./app_routing"

(async () => {
    app.use("/v1", app_route);
    app.use(generateError)
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
})();
