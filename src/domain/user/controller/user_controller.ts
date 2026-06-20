import { Request, Response } from 'express';
import { UserModel } from '../model/user_model';
import { AppError } from '../../../errors/AppError';

export class UserController {
    private _userModel = new UserModel();

    registerUser = async(req: Request, res: Response) => {
        const { first_name, email, password } = req.body;
        if (!first_name || !email || !password) {
            throw AppError.badRequest("Please provide required parametres")
        }

        const findUserExists: any = await this._userModel.findByAnyOne({
            attributes: ['user_id'],
            where: {
                email: req.body.email
            }
        });
        console.log("findUserExists: ", findUserExists);
        if (findUserExists) {
            console.log("User already exists");
            throw AppError.badRequest("User already exists")
        }

        const hashPassword = await global.Helpers.hashPassword(password);
        console.log("hashPassowrd", hashPassword)
        const addUser: any = await this._userModel.addNewRecord({
            first_name: first_name,
            email: email,
            password: hashPassword
        })
    
        return res.status(201).json({ success: true, message: 'User registered successfully', data: addUser });
    }

    loginUser = async (req: Request, res: Response) => {
        const { email, password } = req.body;

        if (!email || !password) {
            throw AppError.badRequest("Email and password are required");
        }

        const user: any = await this._userModel.findByAnyOne({
            attributes: ['email', 'password', 'user_id'],
            where: {
                email: email
            }
        });
        console.log("user : ", user);
        if (!user) {
            throw AppError.badRequest('Invalid credentials');
        }

        const isValid = await global.Helpers.comparePassword(password, user.password);
        if (!isValid) {
            throw AppError.badRequest('Invalid credentials');
        }

        const token = global.Helpers.generateToken({ user_id: user.user_id, email: user.email });

        return res.status(200).json({ success: true, message: 'Login successful', data: { token } });
    }
}