export interface IUser {
    user_id?: number;
    first_name: string;
    email: string;
    password: string;
    added_timestamp?: Date;
    modified_timestamp?: Date;
    is_deleted?: number;
}

export interface IUserRegisterRequest {
    first_name: string;
    email: string;
    password: string;
}

export interface IUserLoginRequest {
    email: string;
    password: string;
}