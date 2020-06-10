import * as joi from 'joi';
import { Request, Response } from 'express';


export function isValid(contract: any) {
  return async (req: Request, res: Response, next: any) => {
    const body = req.body;
    const result = joi.validate(body, contract);
    if(result.error === null) {
      await next();
    } else {
      res.status(400).send(result.error);
    }
  }
}