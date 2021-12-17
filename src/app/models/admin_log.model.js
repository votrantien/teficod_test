const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Device = require("./device.model")

const adminLogSchema = new mongoose.Schema({
  object_id: {
    type: String,
  },
  activity: { type: String },
  description: { type: String },
  client_info: { type: String },
  ip_address: { type: String },
  status: { type: Number, default: 1 },
},
  { timestamps: true }
);

// adminLogSchema.virtual('devices', {
//   ref: 'Device', // The model to use
//   localField: 'object_id', // Find people where `localField`
//   foreignField: 'sn_number', // is equal to `foreignField`
//   // If `justOne` is true, 'members' will be a single doc as opposed to
//   // an array. `justOne` is false by default.
//   justOne: true,
//   //options: { sort: { name: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
// });

adminLogSchema.statics.addLog = async function (objectId, activity, description, clientInfo, ipAddress, logType) {
  if(logType == 'device'){
    const log = await this.create({ object_id: objectId, activity, description, client_info: clientInfo, ip_address: ipAddress});
  }else if(logType == 'user'){

  }
};

const adminLog = mongoose.model('admin_log', adminLogSchema);

module.exports = adminLog;