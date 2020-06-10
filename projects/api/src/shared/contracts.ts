import * as joi from 'joi';
import { validMessage } from './messages'

export const login = joi.object().keys({
    email: joi.string().email().trim().required().options(validMessage('email')),
    password: joi.string().trim().required().options(validMessage('password'))
});