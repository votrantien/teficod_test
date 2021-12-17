const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Device = require("./device.model")

const deviceActivityLogSchema = new mongoose.Schema({
  device_serial: {
    type: String,
  },
  group: { type: Schema.Types.ObjectId, ref: 'GroupDevice' },
  activity: { type: String },
  description: { type: String },
  status: { type: Number, default: 1 },
},
  { timestamps: true, toObject: { virtuals: true } }
);

deviceActivityLogSchema.virtual('devices', {
  ref: 'Device', // The model to use
  localField: 'device_serial', // Find people where `localField`
  foreignField: 'sn_number', // is equal to `foreignField`
  // If `justOne` is true, 'members' will be a single doc as opposed to
  // an array. `justOne` is false by default.
  justOne: true,
  //options: { sort: { name: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
});

deviceActivityLogSchema.statics.addLog = async function (deviceSerial, activity, description) {
  const device = await Device.findOne({ sn_number: deviceSerial }, 'group');
  const log = await this.create({ device_serial: deviceSerial, group: device.group, activity, description });
};

const deviceActivityLog = mongoose.model('device_activity_log', deviceActivityLogSchema);

module.exports = deviceActivityLog;