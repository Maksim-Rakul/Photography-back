import { Joi } from 'celebrate';

export const sendEmailSchema = {
  body: Joi.object({
    name: Joi.string().required().min(2).max(100).messages({
      'string.empty': "Ім'я є обов'язковим",
      'any.required': "Ім'я є обов'язковим",
    }),
    email: Joi.string().required().email().messages({
      'string.email': 'Невірний формат email',
      'string.empty': "Email є обов'язковим",
    }),
    phone: Joi.string().required().min(5).max(20).messages({
      'string.empty': "Телефон є обов'язковим",
    }),
    comment: Joi.string().optional().allow('').max(1000),
  }),
};
