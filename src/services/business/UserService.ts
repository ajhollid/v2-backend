import { IUser, User } from "../../db/models/index.js";

export interface IUserService {
  getAllUsers(): Promise<IUser[]>;
}

class UserService implements IUserService {
  async getAllUsers(): Promise<IUser[]> {
    return await User.find();
  }
}

export default UserService;
