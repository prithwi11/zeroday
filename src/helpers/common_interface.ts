export interface IConfigforEncryptDecrypt {
    algorithm: string;
    encryptionKey: string;
    salt?: string;
    iv: string;
    idEncryptionKey: string;
    idEncryptionIv: string;
}