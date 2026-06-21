import { AppError } from "../errors/AppError";
import { IConfigforEncryptDecrypt } from "./common_interface";
import * as CryptoJs from "crypto-js"

export class Encryption {
    private algorithm: string;
    private key: CryptoJs.lib.WordArray;
    private salt: string;
    private iv: CryptoJs.lib.WordArray;

    constructor(config: IConfigforEncryptDecrypt) {
        this.algorithm = config.algorithm || "";
        this.salt = config.salt || "";
        this.key = CryptoJs.enc.Utf8.parse(config.encryptionKey);
        this.iv = CryptoJs.enc.Utf8.parse(config.iv);

        if (!this.algorithm && !this.key) {
            throw Error("Encrypion Configuration Error")
        }
    }

    encryptResponse (text: string) {
        if(!text) return ''
        const encryptUsingAES256 = CryptoJs.AES.encrypt(text, this.key, {
            keySize: 16,
            iv: this.iv,
            mode: CryptoJs.mode.ECB,
            padding: CryptoJs.pad.Pkcs7,
        });
        const response = encryptUsingAES256.toString();
        return response;
    }

    decryptRequest = async (text: any) => {
        return CryptoJs.AES.decrypt(text, this.key, {
            keySize: 16,
            iv: this.iv,
            mode: CryptoJs.mode.ECB,
            padding: CryptoJs.pad.Pkcs7,
        }).toString(CryptoJs.enc.Utf8);
    }
}