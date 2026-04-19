import { Joi, Segments } from 'celebrate';

export const registerUserSchema = {
  [Segments.BODY]: Joi.object({
    username: Joi.string(),
    email: Joi.string().email().required(),
    password: Joi.string().min(3).required(),
  }),
};

export const loginUserSchema = {
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

// export const requestResetEmailSchema = {
//   [Segments.BODY]: Joi.object({
//     email: Joi.string().email().required(),
//   }),
// };

export const adminLoginSchema = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Невірний формат email',
      'string.empty': "Email є обов'язковим",
      'any.required': "Email є обов'язковим",
    }),
    password: Joi.string().required().min(6).messages({
      'string.empty': "Пароль є обов'язковим",
      'string.min': 'Пароль має містити хоча б 6 символів',
    }),
  }),
};
