const db = require("../models")
const moment = require("moment");
const User = db.user
const Device = db.device
const DeviceType = db.deviceType
const GroupDevice = db.group
const DeviceLog = db.deviceLog
const DeviceActivityLog = db.deviceActivityLog

class SiteController {
    //GET trả về trang home
    async index(req, res) {
        const user = res.locals.user
        let groupDevices, groupShare, deviceActivityLog
        let userCreateDate = new Date(user.createdAt);
        userCreateDate = userCreateDate.getDate() + '-' +  (userCreateDate.getMonth() + 1) + '-' + userCreateDate.getFullYear()
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const toDay = moment(now).format('DD-MM-YYYY')
        // console.log(user)
        if (user.role != 'admin') {
            const groupDeviceIds = await GroupDevice.find({ $or: [{ access_user: user._id }, { manage_user: user.username }] }, '_id').lean()
            let arrGroupId = []

            for (const [key, value] of Object.entries(groupDeviceIds)) {
                arrGroupId.push(value._id)
            }

            groupDevices = await GroupDevice.find({ manage_user: user.username }).lean()
            groupShare = await GroupDevice.find({ access_user: user._id }).lean()
            deviceActivityLog = await DeviceActivityLog.find({
                group: arrGroupId,
                createdAt: {
                    $gte: startOfToday
                }
            }).populate({
                path: 'group',
                model: 'GroupDevice',
                select: 'group_name'
            }).populate('devices').sort({ createdAt: -1 }).limit(20).lean()
        } else {
            groupDevices = await GroupDevice.find().lean()
            deviceActivityLog = await DeviceActivityLog.find({
                createdAt: {
                    $gte: startOfToday
                }
            }).populate({
                path: 'group',
                model: 'GroupDevice',
                select: 'group_name'
            }).populate('devices').sort({ createdAt: -1 }).limit(20).lean()
        }

        // console.log(deviceActivityLog)
        res.render('home', { title: "Trang chủ", username: user.username, groupDevices, groupShare, user, deviceActivityLog, userCreateDate, toDay })
    }
}

//khởi tạo controller
module.exports = new SiteController;