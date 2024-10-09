const STATUS_CODE = require('../../constants/status-code')
const AppError = require('../../helpers/app-error')

// Developement Error
const developmentError = (err, res) => {
  res.status(err.statusCode).json({
    status: 'fail',
    error: err,
    message: err.message,
    stack: err.stack,
  })
}

// Production Error
const prodError = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({ status: 'fail', message: err.message })
  } else {
    res
      .status(STATUS_CODE.SERVER_ERROR)
      .json({ status: 'fail', message: 'Something went wrong' })
  }
}

// Handle Cast Error
const handlerCastError = (err) => {
  let message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, STATUS_CODE.BAD_REQUEST)
}

// Handler Dupicate Error
const handlerDuplicateError = (err) => {
  let key =
    Object.keys(err.keyValue).length &&
    err.keyValue[Object.keys(err.keyValue)[0]]
  let message = `${key} already exist`
  return new AppError(message, STATUS_CODE.BAD_REQUEST)
}

// Handler Validation Error
const handlerValidationError = (err) => {
  let errors = Object.values(err.errors).map((el) => el.message)
  let message = errors.join(', ')
  return new AppError(message, STATUS_CODE.BAD_REQUEST)
}

// Handler Invalid Error
const invalidTokenHandler = () => {
  let message = 'Invalid Token. Please login again'
  return new AppError(message, STATUS_CODE.UNAUTHORIZED)
}

// Handel Expiration Token
const tokenExpirationHandler = () => {
  let message = 'Token Expired. Please logged in again'
  return new AppError(message, STATUS_CODE.UNAUTHORIZED)
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || STATUS_CODE.SERVER_ERROR

  if (process.env.ENVIRONMENT === 'prod') {
    if (err.name === 'CastError') err = handlerCastError(err)
    if (err.code === 11000) err = handlerDuplicateError(err)
    if (err.name === 'ValidationError') err = handlerValidationError(err)
    if (err.name === 'JsonWebTokenError') err = invalidTokenHandler()
    if (err.name === 'TokenExpiredError') err = tokenExpirationHandler()

    prodError(err, res)
  } else developmentError(err, res)
}
