import { Request, Response } from 'express';
import { UserModel } from '../model/user_model';

export class UserController {
    private _userModel = new UserModel();

    registerUser = async(req: Request, res: Response) => {
        try {
            const { first_name, email, password } = req.body;
            if (!first_name || !email || !password) {
                return res.status(400).json({ success: false, message: 'All fields are required' });
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
                return res.status(400).json({ success: false, message: 'User already registered' });
            }

            const hashPassword = await global.Helpers.hashPassword(password);
            console.log("hashPassowrd", hashPassword)
            const addUser: any = await this._userModel.addNewRecord({
                first_name: first_name,
                email: email,
                password: hashPassword
            })
        
            return res.status(201).json({ success: true, message: 'User registered successfully', data: addUser });
        
        } catch (error: any) {
            console.log(error, error.stack)
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    loginUser = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
    
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required' });
            }
    
            const user: any = await this._userModel.findByAnyOne({
                attributes: ['email', 'password', 'user_id'],
                where: {
                    email: email
                }
            });
            console.log("user : ", user);
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
    
            const isValid = await global.Helpers.comparePassword(password, user.password);
            if (!isValid) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
    
            const token = global.Helpers.generateToken({ user_id: user.user_id, email: user.email });
    
            return res.status(200).json({ success: true, message: 'Login successful', data: { token } });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}