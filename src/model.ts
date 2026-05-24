// import { config } from "./configuration/config"
import * as Sequelize from 'sequelize';

export class Model {
    // public connectionObj = new config();
    public Op: typeof Sequelize.Op;
    public Model: any;

    constructor(name: string, schema: {}, options: {}) {

        //this.connectionObj.connectPgDB();
        this.Op = Sequelize.Op;
        this.Model = global.connectionObj.define(name, schema, options);
    }

    public findByAnyOne(dataobj: object): Promise<object> {
        return this.Model.findOne(dataobj);
    }

    public countAllByAny(dataobj: object): Promise<number> {
        return this.Model.count(dataobj);
    }

    public countAllByAnyNot(dataobj: any, field: string, value: string | number): number {
        dataobj[field] = {
            [Sequelize.Op.ne] : value
        };
        return this.Model.count({
            where: dataobj,
        });
    }

    public updateAnyRecord(dataobj: object, whereobj = {}): Promise<object> {
        
        let that = this;
        return new Promise(function (resolve, reject) {
            that.Model.update(dataobj, whereobj)
                .then((saveData: []) => {
                    let returnData: [] = saveData;
                    return resolve(returnData);
                })
                .catch((error: any) => {
                    let returnData: object = {
                        status: 0,
                        data: error
                    };
                    return reject(returnData);
                });
        });
    }
    public addNewRecord(dataobj: object): Promise<object> {
        return this.Model.build(dataobj).save();
    }

    public deleteByAny(dataobj: object) {
        return this.Model.destroy({
            where: dataobj
        })
    }

    public bulkInsert(data_arr: {}[]) {
        return this.Model.bulkCreate(data_arr, { returning: true });
    }

    public findAllByAny(dataobj: object) {
        return this.Model.findAll(dataobj);
    }
}