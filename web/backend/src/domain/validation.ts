import { CruxBadRequestException } from 'src/exception/crux-exception'
import * as yup from 'yup'

export const nameRuleOptional = yup.string().trim().min(3).max(70)
export const nameRule = yup.string().required().trim().min(3).max(70)
export const descriptionRule = yup.string().optional()

export const yupValidate = (schema: yup.AnySchema, candidate: any) => {
  try {
    schema.validateSync(candidate)
  } catch (err) {
    const validationError = err as yup.ValidationError
    throw new CruxBadRequestException({
      message: 'Validation failed',
      property: validationError.path,
      value: validationError.errors,
      error: validationError.type,
    })
  }
}
