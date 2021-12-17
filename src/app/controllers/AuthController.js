const db = require("../models")
const User = db.user
const Group = db.group
const jwt = require('jsonwebtoken')
var { validationResult } = require('express-validator')

// handle errors
const handleErrors = (err) => {
    // console.log(err.message, err.code)
    let errors = { username: '', password: '' }

    // incorrect email
    if (err.message === 'incorrect username') {
        errors.username = 'Sai tên đăng nhập hoặc user không tồn tại'
    }

    // incorrect password
    if (err.message === 'incorrect password') {
        errors.password = 'Mật khẩu không đúng'
    }

    // duplicate email error
    if (err.code === 11000) {
        errors.username = 'that username is already registered'
        return errors
    }

    // validation errors
    if (err.message.includes('user validation failed')) {
        // console.log(err)
        Object.values(err.errors).forEach(({ properties }) => {
            // console.log(val)
            // console.log(properties)
            errors[properties.path] = properties.message
        })
    }

    return errors
}

// create json web token
const maxAge = 1 * 24 * 60 * 60
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_LIFE
    })
}

const createRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_REFRESH, {
        expiresIn: process.env.JWT_REFRESH_LIFE
    })
}

// controller actions
module.exports.signup_get = (req, res) => {
    res.render('signup')
}

module.exports.login_get = (req, res) => {
    res.render('login', {title:'Đăng nhập'})
}

module.exports.signup_post = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        res.status(422).json({status: 'failure', errors: errors.array() })
        return
    }
    try {
        const { username, password, fullname, phone, email, groupname } = req.body
        const role = 'user'
        let usingPassword

        if(password == 'default'){
            usingPassword = process.env.DEFAULT_USER_PASS
        } else {
            usingPassword = password
        }
        let default_group 
        const user = await User.create({ username, email, usingPassword, fullname, phone, role })
        if(user){
            default_group = await Group.create({group_name: `${groupname} - ${username}`,manage_user: user.username,access_user:[]})
        }
        //const token = createToken(user._id)
        //res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
        res.status(201).json({status: 'success', user: user, default_group })
    }
    catch (err) {
        // console.log(err)
        const errors = handleErrors(err)
        res.status(400).json({status: 'failure', errors })
    }

}

module.exports.login_post = async (req, res) => {
    const { username, password } = req.body

    try {
        const user = await User.login(username, password)
        if(user.status == 1){
            const token = createToken(user._id)
            const refreshToken = createRefreshToken(user._id)
            console.log(token,'------------------', refreshToken)
            res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
            res.status(200).json({status: 'success', user: user._id, token: token, refreshToken: refreshToken })
        }else if (user.status == 0){
            res.status(422).json({status: 'failure', errors:[{msg:'Tài khoản đã bị khoá' }]})
        }
    }
    catch (err) {
        const errors = handleErrors(err)
        console.log(err)
        res.status(400).json({status: 'failure', errors:[{msg: 'Sai tên đăng nhập hoặc mật khẩu'}] })
    }

}

module.exports.refreshToken = async (req, res, next) => {
    const refreshToken = req.body.refreshToken
    // console.log(authHeader.split(' ')[1])
    // check json web token exists & is verified
    if (refreshToken) {
        await jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH, (err, decodedToken) => {
            if (err) {
                console.log(err.message)
                res.status(401).json({ errors: 'Unauthorize' })
            } else {
                const userId = decodedToken.id
                const token = createToken(userId)
                const refreshToken = createRefreshToken(userId)
                // console.log(token)

                res.status(200).json({ token: token, refreshToken: refreshToken })
            }
        })
    } else {
        res.status(401).json({ errors: 'Unauthorize' })
    }
}

module.exports.logout_get = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 })
    res.redirect('/auth/sign-in')
}