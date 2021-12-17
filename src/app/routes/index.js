const userRouter = require('./user.route')
const deviceRouter = require('./device.route')
const deviceTypeRouter = require('./device_type.route')
const deviceGroupRouter = require('./device_group.route')
const siteRouter = require('./site.route')
const authRouter = require('./auth.route')
const { requireAuth, checkUser, requireLogin } = require('../middlewares/authMiddleware')


function route(app) {
    app.use('*', checkUser)
    app.use('/auth', authRouter)
    app.use('/user', userRouter)
    app.use('/device', deviceRouter)
    app.use('/device-type', deviceTypeRouter)
    app.use('/device-group', deviceGroupRouter)
    app.get('/', requireLogin, siteRouter)
}

module.exports = route