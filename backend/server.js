const mongoose = require('mongoose')
const dotenv = require('dotenv')

// uncaughtException
process.on('uncaughtException', (err) => {
  console.log('uncaughtException : ',err.name, err.message)
})

dotenv.config({ path: './.env' })
const app = require('./app')

const db = process.env.db || 'mongodb://127.0.0.1/github'
const dbOptions = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
}
mongoose
  .connect(db, dbOptions)
  .then(() => console.log('DB connected successfully'))
  .catch((err) => console.log(err.name, err.message))

// Server listener
const port = 3000
const fn = () => {
  console.log(`Server is listing on ${port} port`)
}

const server = app.listen(port, fn)

// Unhandled Rejection
process.on('unhandledRejection', (error) => {
  console.log('unhandledRejection : ',error.name, error.message)
  server.close(() => {
    process.exit(1)
  })
})
