import * as seq from "sequelize";
import * as fs from "fs";
import * as path from "path";

export class Config {

    private dbName:string = '';
    private dbUserName:string = '';
    private dbUserPass:string = '';

    /**
     * @date : 24-11-2025
     * @description : Mysql connesction using sequelize
    */
    connectPgDB(){

        let connectionConfigObj: any = {
            host: process.env.DB_HOST,
            dialect: process.env.DB_DIALECT,
            timezone: process.env.DB_TIMEZONE,
            logging: process.env.NODE_ENV === 'production' ? false : console.log,
            define: { 
                timestamps: false,
                freezeTableName: true
            },
            pool: {
                max: 5, // max 100 connections 
                min: 0,
                idle: 5000
            }
        };

        if (process.env.NODE_ENV === 'production') {
            connectionConfigObj.dialectOptions = {
                ssl: {
                    ca: fs.readFileSync(path.join(__dirname, 'azure-postgres-ca-bundle.pem'),'utf8'),
                    // require: true,
                    rejectUnauthorized: true
                }
            };
        }

        this.dbName = process.env.DB_NAME as string;
        this.dbUserName = process.env.DB_USERNAME as string;
        this.dbUserPass = process.env.DB_PASS as string;
        let conn = new seq.Sequelize(this.dbName, this.dbUserName, this.dbUserPass, connectionConfigObj);
        if (process.env.NODE_ENV === 'local') {
            conn.authenticate()
            .then(() => {
                console.log('Connection has been established successfully.');
            })
            .catch(err => {
                console.error('Unable to connect to the database:', err);
            });
        }
        return conn
    }
    /*End*/
}