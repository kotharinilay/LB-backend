import { Request, Response } from 'express';
import {connection} from '../connection/connection';
import {User} from '../entities/User';

class AuthController {
  static login = async (req: Request, res: Response) => {

    // const Users: User[] = await (await connection).manager.find('User');

    res.status(200).send();

  };
}
export default AuthController;