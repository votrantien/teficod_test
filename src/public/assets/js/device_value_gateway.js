//Scrip device_value_gateway.hbs - xem giá trị các node trong gateway
$(document).ready(function () {
    // socket io
    var socket = io();
    var user = $('#userName').val();

    // get list gateway
    function GetListDevice() {
        var deviceList = [];
        $('.gateway-serial').each(function () {
            deviceList.push($(this).val());
        });

        return deviceList;
    }

    // start realtime device
    function StartRealTime(listDevices = []) {
        if (listDevices.length > 0) {
            socket.emit('start_real_time_device', { listDevices, user });
        }
    }
    // start realtime when open page
    StartRealTime(GetListDevice());

    // change device status
    function ChangeDeviceStatus(elem, statusCode) {
        // status code:  1 - online, 2 - sleep, 3 - offline
        $(elem).removeClass('status-1 status-2 status-0 status-na');
        $(elem).addClass('status-' + statusCode);
    }

    // change device value
    function ChangeDeviceBatteryRssi(nodeSerial, battery, rssi) {
        var batteryElem = $(`#node-${nodeSerial} .node-battery`);
        var rssiElem = $(`#node-${nodeSerial} .node-rssi`);
        // battery -> status battery: 0-không có pin; 1-có pin, nhưng ko sạc; 2-có pin, đang sạc
        try {
            var batteryCapacity = battery.cap;
            var batteryStatus = battery.status;
            batteryElem.removeClass('status-low');
            rssiElem.removeClass('status-low');

            if (batteryStatus == 0) {
                $('i', batteryElem).removeClass('mdi-battery-alert mdi-battery-charging-100 mdi-battery mdi-battery-10 mdi-battery-30 mdi-battery-50 mdi-battery-70');
                $('i', batteryElem).addClass('mdi-battery-alert');
                $('.battery-capacity', batteryElem).html('N/A');
            } else if (batteryStatus == 1) {
                $('.battery-capacity', batteryElem).html(batteryCapacity);
                if (batteryCapacity <= 10) {
                    $('i', batteryElem).removeClass('mdi-battery-alert mdi-battery-charging-100 mdi-battery mdi-battery-10 mdi-battery-30 mdi-battery-50 mdi-battery-70');
                    $('i', batteryElem).addClass('mdi-battery-10');
                    batteryElem.addClass('status-low');
                } else if (batteryCapacity <= 30) {
                    $('i', batteryElem).removeClass('mdi-battery-alert mdi-battery-charging-100 mdi-battery mdi-battery-10 mdi-battery-30 mdi-battery-50 mdi-battery-70');
                    $('i', batteryElem).addClass('mdi-battery-30');
                } else if (batteryCapacity <= 50) {
                    $('i', batteryElem).removeClass('mdi-battery-alert mdi-battery-charging-100 mdi-battery mdi-battery-10 mdi-battery-30 mdi-battery-50 mdi-battery-70');
                    $('i', batteryElem).addClass('mdi-battery-50');
                } else if (batteryCapacity <= 70) {
                    $('i', batteryElem).removeClass('mdi-battery-alert mdi-battery-charging-100 mdi-battery mdi-battery-10 mdi-battery-30 mdi-battery-50 mdi-battery-70');
                    $('i', batteryElem).addClass('mdi-battery-70');
                } else if (batteryCapacity > 70) {
                    $('i', batteryElem).removeClass('mdi-battery-alert mdi-battery-charging-100 mdi-battery mdi-battery-10 mdi-battery-30 mdi-battery-50 mdi-battery-70');
                    $('i', batteryElem).addClass('mdi-battery');
                }
            } else if (batteryStatus == 2) {
                $('.battery-capacity', batteryElem).html(batteryCapacity);
                $('i', batteryElem).removeClass('mdi-battery-alert mdi-battery-charging-100 mdi-battery mdi-battery-10 mdi-battery-30 mdi-battery-50 mdi-battery-70');
                $('i', batteryElem).addClass('mdi-battery-charging-100');
            }
            // rssi
            $('.rssi-strength', rssiElem).html(rssi);

            if (rssi < -120) {
                rssiElem.addClass('status-low');
            }

        } catch (err) {
            console.log(err);
        }
    }

    // device connected

    socket.on('device_connect', function (serial) {
        var listDevices = GetListDevice();
        if (listDevices.indexOf(serial) != -1) {
            ChangeDeviceStatus(`#gatewayTab-${serial} .status`, '1');
            socket.emit('start_real_time_device', { listDevices, user });
        }
    })

    //check Device online
    socket.on('device_online', function (serial) {
        var listDevices = GetListDevice();
        if (listDevices.indexOf(serial) != -1) {
            ChangeDeviceStatus(`#gatewayTab-${serial} .status`, '1');
        }
    })

    //check device disconnect
    socket.on('device_disconnect', function (serial) {
        ChangeDeviceStatus(`#gatewayTab-${serial} .status`, '0');
        ChangeDeviceStatus(`#gateway-${serial} .node-item .status`, '0');

        $(`#gateway-${serial} .node-item .battery-capacity`).html("N/A");
        $(`#gateway-${serial} .node-item .rssi-strength`).html("N/A");
        $(`#gateway-${serial} .node-item .node-value h3`).html("N/A");
        $(`#gateway-${serial} .node-item .node-rssi`).removeClass("status-low");
        $(`#gateway-${serial} .node-item .node-battery`).removeClass("status-low");
        $(`#gateway-${serial} .node-item .node-battery i`).removeClass("mdi-battery-alert mdi-battery-charging-100 mdi-battery mdi-battery-10 mdi-battery-30 mdi-battery-50 mdi-battery-70").addClass('mdi-battery-alert');
    })

    //detect device status
    socket.on('device_offline', function (serial) {
        ChangeDeviceStatus(`#gatewayTab-${serial} .status`, '0');
        ChangeDeviceStatus(`#gateway-${serial} .node-item .status`, '0');

        $(`#gateway-${serial} .node-item .battery-capacity`).html("N/A");
        $(`#gateway-${serial} .node-item .rssi-strength`).html("N/A");
        $(`#gateway-${serial} .node-item .node-value h3`).html("N/A");
        $(`#gateway-${serial} .node-item .node-rssi`).removeClass("status-low");
        $(`#gateway-${serial} .node-item .node-battery`).removeClass("status-low");
        $(`#gateway-${serial} .node-item .node-battery i`).removeClass("mdi-battery-alert mdi-battery-charging-100 mdi-battery mdi-battery-10 mdi-battery-30 mdi-battery-50 mdi-battery-70").addClass('mdi-battery-alert');
    })

    //update node status
    socket.on('node_status', function (data) {
        var serial = data.serial;
        var status = data.status;
        ChangeDeviceStatus(`#node-${serial} .status`, status);

        if (status == '0' || status == '2') {
            $(`#node-${serial} .battery-capacity`).html("N/A");
            $(`#node-${serial} .rssi-strength`).html("N/A");
            $(`#node-${serial} .node-value h3`).html("N/A");
            $(`#node-${serial} .node-rssi`).removeClass("status-low");
            $(`#node-${serial} .node-battery`).removeClass("status-low");
        }
    })

    // device send realtime value

    socket.on('realtime_device_value', function (res) {
        try {
            var nodeSerial = res.serial;
            var battery = res.data.battery;
            var rssi = res.data.rssi;
            var values = res.data.val;
            var gatewaySerial = $(`#node-${nodeSerial}`).data('gateway');

            ChangeDeviceBatteryRssi(nodeSerial, battery, rssi);
            for (const [key, value] of Object.entries(values)) {
                $(`#node-${nodeSerial} .${key}-value`).html(value);
            }
            ChangeDeviceStatus(`#node-${nodeSerial} .status`, '1');
            ChangeDeviceStatus(`#gatewayTab-${gatewaySerial} .status`, '1');
            console.log(res, gatewaySerial);
        } catch (err) {
            console.log(err);
        }
    })


    // datepicker
    var today = moment(new Date).format('DD-MM-YYYY');
    $('.date-picker').val(today);
    var picker = new Lightpick({
        field: document.getElementById('date-picker'),
        format: 'DD-MM-YYYY',
        maxDate: new Date(),
        onSelect: function (date) {
            this.innerHTML = date.format('Do MMMM YYYY');
        }
    });

    $(document).on('click', '.date-picker', function () {
        var dpElem = $(this);
        picker.reloadOptions({
            field: this,
            onSelect: function () {
                dpElem.trigger('change');
            },
        });
        picker.show();
    })

    // time picker
    $(document).on('change', '.time-start', function () {
        var startIdx = $('option:selected', this).data('idx');
        if (!$('option:selected', this).hasClass('start-time-custom')) {
            $(this).parents('.group-node-device').find('.time-range-active').removeClass('time-range-active');
        }
        $('.start-time-custom', this).hide();
        $(this).siblings('.time-end').children('.end-time-custom').hide();
        var currIdx = $(this).siblings('.time-end').children('option:selected').data('idx');
        if (startIdx >= currIdx || !currIdx) {
            var newEndIdx = startIdx + 1;
            $(this).siblings('.time-end').find('option[data-idx=' + newEndIdx + ']').attr('selected', 'selected');
        }
        $(this).siblings('.time-end').children().each(function () {
            var endIdx = $(this).data('idx');
            if (endIdx <= startIdx) {
                $(this).attr('disabled', 'disabled');
            } else {
                $(this).removeAttr('disabled');
            }
        })
        // debugger
    })

    // device-type-btn active when collapse
    $(document).on('click', '.device-type-btn', function () {
        var check = $(this).attr('aria-expanded');
        var IdListDeviceElem = $(this).data('target');
        if (check == 'true') {
            ScrollToElement(IdListDeviceElem);
            $(this).addClass('collapse-active');
        } else {
            $(this).removeClass('collapse-active');
        }
    })

    // change user get list device group
    $('#userList').on('change', function () {
        var userName = $(this).val();
        var groupList = $('#groupList');
        var firstOption = true;

        $('#groupList').find('option').each(function (i, el) {
            var manageUser = $(this).data('manageUser');
            $(this).hide();
            $(this).prop('disabled', true);
            if (manageUser == userName) {
                $(this).prop('disabled', false);
                if (firstOption) {
                    groupList.val($(this).val()).change();
                    firstOption = false;
                }
                $(this).show();
            }
        })

        if (firstOption == true) {
            groupList.val('').change();
        }
    })

    // render list node
    $('#groupList').on('change', function () {
        if (!$(this).val()) {
            $('#deviceArea').html('<div class="col-lg-12 p-0" id="gateWayTabList"><ul class="nav nav-tabs" role="tablist"></ul></div><div class="tab-content col-lg-12" id="gateWayTabContent"><h4 class="w-100 text-center">Tài khoản chưa tạo farm</h4></div>')
            return;
        }
        socket.disconnect();
        var groupId = $(this).val();
        var method = 'GET';
        var url = '/device/list-device-by-group/' + groupId;
        var data = {};
        $('#mask').show();

        var dataDeviceGroup = CallApi(url, data, method).then((response) => {
            var status = response.status;
            if (status == 'success') {
                var devices = response.devices;
                // check gateway in device group
                if (!devices.some(device => device.device_model === "BSGW")) {
                    $('#deviceArea').html('<div class="col-lg-12 p-0" id="gateWayTabList"><ul class="nav nav-tabs" role="tablist"></ul></div><div class="tab-content col-lg-12" id="gateWayTabContent"><h4 class="w-100 text-center">Nhóm hiện tại chưa có thiết bị</h4></div>')
                    $('#mask').hide();

                    return;
                };

                var deviceTypes = response.device_types;
                var activeGateway = true;
                var gatewayTabHtml = '';
                $('#gateWayTabContent').html('');
                devices.forEach(function (gateway) {
                    if (gateway.device_model == 'BSGW') {
                        var deviceTypeAirHtml = '', deviceTypeSolutionHtml = '';
                        var tabGatewayContentElem = $(`
                            <div class="tab-pane fade ${activeGateway == true ? 'active show' : ''}" id="gateway-${gateway.sn_number}" role="tabpanel" aria-labelledby="gatewayTab-${gateway.sn_number}"></div>
                        `);
                        var groupNodeDeviceHtml = $(`<div class="col-lg-12"></div>`);

                        gatewayTabHtml += `
                        <li class="nav-item col-lg-4 mb-1 p-0 px-1">
                            <input type="hidden" class="gateway-serial" value="${gateway.sn_number}">
                            <a class="nav-link bg-device border-0 ${activeGateway == true ? 'active' : ''}" id="gatewayTab-${gateway.sn_number}"
                            data-toggle="tab" href="#gateway-${gateway.sn_number}" role="tab" aria-controls="gateway"
                            aria-selected="${activeGateway == true ? 'true' : 'false'}"><span class="status status-na"></span>${gateway.device_name}</a>
                        </li>`;
                        activeGateway = false;
                        // render type area
                        deviceTypes.forEach(function (type) {
                            if (type.type_properties.environment == 'air') {
                                deviceTypeAirHtml += `
                                <button class="btn btn-outline-device rounded-lg p-2 mt-2 device-type-btn" style="width: 150px;"
                                data-toggle="collapse" data-target="#listNode-${type.prefix}-${gateway.sn_number}"
                                aria-expanded="false" aria-controls="listNode-${type.prefix}-${gateway.sn_number}">
                                    <i class="${type.type_properties.icon} icon-md"></i>
                                    <br>
                                    ${type.type_properties.display_name}
                                </button> `;
                            } else if (type.type_properties.environment == 'solution') {
                                deviceTypeSolutionHtml += `
                                <button class="btn btn-device rounded-lg p-2 mt-2 device-type-btn" style="width: 150px;"
                                data-toggle="collapse" data-target="#listNode-${type.prefix}-${gateway.sn_number}"
                                aria-expanded="false" aria-controls="listNode-${type.prefix}-${gateway.sn_number}">
                                    <i class="${type.type_properties.icon} icon-md"></i>
                                    <br>
                                    ${type.type_properties.display_name}
                                </button> `;
                            }
                            // render node area by type
                            var groupNodeDevice = $(`<div class="group-node-device pt-2 collapse mt-3" id="listNode-${type.prefix}-${gateway.sn_number}"></div>`);
                            var uomAndValueHtml = '';
                            var today = moment(new Date).format('DD-MM-YYYY');
                            // uom and value of device type
                            for (const [key, value] of Object.entries(type.uom_values)) {
                                uomAndValueHtml += `
                                <div class="col-9 node-value">
                                    <div class="d-flex align-items-center align-self-start">
                                        <h3 class="mb-0 ${key}-value">N/A</h3>
                                    </div>
                                    </div>
                                    <div class="col-3">
                                    <div class="icon pt-1">
                                        <i class="mb-0 ${key}-uom">${value.uom}</i>
                                    </div>
                                </div>
                                <br>`;
                            }

                            // controll date time group node
                            var topControlGroupNodeHtml = `
                            <div class="badge pl-0 d-flex align-items-center"
                                style="background-color: ${type.type_properties.color};">
                                <i class="mdi ${type.type_properties.icon} mdi-24px mr-2"></i>
                                <span class="h4 m-0">${type.type_properties.display_name}</span>
                                <button type="button" class="btn btn-icon-text p-2 ml-auto d-flex justify-content-center quick-export-btn" data-device-type="${type.prefix}">
                                <i class="mdi mdi-export btn-icon-prepend mdi-18px"></i></button>
                            </div>
                            <div class="form-group col-lg-9 col-md-12 mt-3 p-0 date-picker-wrapper" data-gateway="${gateway.sn_number}" data-model="${type.prefix}">
                                <div class="input-group">

                                <div class="input-group-prepend">
                                    <span class="input-group-text py-1">
                                    <i class="mdi mdi-calendar mdi-18px m-0 p-0"></i>
                                    </span>
                                </div>
                                <input type="text" class="form-control date-picker" readonly aria-label="date-picker"
                                    aria-describedby="date-picker" value="${today}">

                                <div class="input-group-prepend">
                                    <span class="input-group-text py-1">
                                    <i class="mdi mdi-clock mdi-18px m-0 p-0"></i>
                                    </span>
                                </div>
                                <select class=" form-control text-light time-picker time-start">
                                    <option value="00:00" data-idx="0" selected>00:00</option>
                                    <option value="01:00" data-idx="1">01:00</option>
                                    <option value="02:00" data-idx="2">02:00</option>
                                    <option value="03:00" data-idx="3">03:00</option>
                                    <option value="04:00" data-idx="4">04:00</option>
                                    <option value="05:00" data-idx="5">05:00</option>
                                    <option value="06:00" data-idx="6">06:00</option>
                                    <option value="07:00" data-idx="7">07:00</option>
                                    <option value="08:00" data-idx="8">08:00</option>
                                    <option value="09:00" data-idx="9">09:00</option>
                                    <option value="10:00" data-idx="10">10:00</option>
                                    <option value="11:00" data-idx="11">11:00</option>
                                    <option value="12:00" data-idx="12">12:00</option>
                                    <option value="13:00" data-idx="13">13:00</option>
                                    <option value="14:00" data-idx="14">14:00</option>
                                    <option value="15:00" data-idx="15">15:00</option>
                                    <option value="16:00" data-idx="16">16:00</option>
                                    <option value="17:00" data-idx="17">17:00</option>
                                    <option value="18:00" data-idx="18">18:00</option>
                                    <option value="19:00" data-idx="19">19:00</option>
                                    <option value="20:00" data-idx="20">20:00</option>
                                    <option value="21:00" data-idx="21">21:00</option>
                                    <option value="22:00" data-idx="22">22:00</option>
                                    <option value="23:00" data-idx="23">23:00</option>
                                    <option class="start-time-custom" style="display: none;"></option>
                                </select>

                                <div class="input-group-prepend">
                                    <span class="input-group-text py-1">
                                    Đến
                                    </span>
                                </div>
                                <select class=" form-control text-light time-picker time-end">
                                    <option value="01:00" data-idx="1">01:00</option>
                                    <option value="02:00" data-idx="2">02:00</option>
                                    <option value="03:00" data-idx="3">03:00</option>
                                    <option value="04:00" data-idx="4">04:00</option>
                                    <option value="05:00" data-idx="5">05:00</option>
                                    <option value="06:00" data-idx="6">06:00</option>
                                    <option value="07:00" data-idx="7">07:00</option>
                                    <option value="08:00" data-idx="8">08:00</option>
                                    <option value="09:00" data-idx="9">09:00</option>
                                    <option value="10:00" data-idx="10">10:00</option>
                                    <option value="11:00" data-idx="11">11:00</option>
                                    <option value="12:00" data-idx="12">12:00</option>
                                    <option value="13:00" data-idx="13">13:00</option>
                                    <option value="14:00" data-idx="14">14:00</option>
                                    <option value="15:00" data-idx="15">15:00</option>
                                    <option value="16:00" data-idx="16">16:00</option>
                                    <option value="17:00" data-idx="17">17:00</option>
                                    <option value="18:00" data-idx="18">18:00</option>
                                    <option value="19:00" data-idx="19">19:00</option>
                                    <option value="20:00" data-idx="20">20:00</option>
                                    <option value="21:00" data-idx="21">21:00</option>
                                    <option value="22:00" data-idx="22">22:00</option>
                                    <option value="23:00" data-idx="23">23:00</option>
                                    <option value="23:59" data-idx="24" selected>24:00</option>
                                    <option class="end-time-custom" style="display: none;"></option>
                                </select>
                                </div>
                            </div>`;


                            // list node
                            var listNodeHtml = $(`<div class='d-flex node-wrapper'></div>`);
                            devices.forEach(function (node, idx) {
                                if (node.device_model == type.prefix && node.gateway == gateway.sn_number) {
                                    listNodeHtml.append(`
                                    <div class="card node-item mt-2 mr-2" id="node-${node.sn_number}"
                                    style="border: solid 1px ${type.type_properties.color};" data-serial="${node.sn_number}" data-gateway="${gateway.sn_number}" data-model="${node.device_model}" data-color-idx="${idx}" data-name="${node.device_name}">
                                    <span class="status status-na"></span>
                                    <div class="card-body p-2">
                                    <div class="row">
                                        <div class="col-6">
                                        <div class="badge badge-pill pl-0 d-flex align-items-center node-battery ">
                                            <i class="mdi mdi-battery-alert mdi-18px mr-2"></i>
                                            <span class="battery-capacity">N/A</span>
                                        </div>
                                        </div>
                                        <div class="col-6">
                                        <div class="badge badge-pill pl-0 pl-0 d-flex align-items-center node-rssi">
                                            <i class="mdi mdi-rss mdi-18px mr-2"></i>
                                            <span class="rssi-strength">N/A</span>
                                        </div>
                                        </div>
                                    
                                        ${uomAndValueHtml}

                                    </div>
                                    <br>
                                    <h6 class="text-muted font-weight-normal node-name">${node.device_name}</h6>
                                    </div>
                                </div>`);
                                }
                            })
                            // chart area 
                            var chartAreaHtml = $(`<div class="col-lg-12 p-0 chart-area" style="display: none;"></div>`);
                            var selectUomListHtml = '';
                            for (const [key, value] of Object.entries(type.uom_values)) {
                                selectUomListHtml += `<option value="${key}" data-display-name="${value.name}" data-gateway="${gateway.sn_number}" data-model="${type.prefix}">${value.uom}</option>`;
                            }
                            chartAreaHtml.append(`
                            <div class="row p-0">
                                <div class="input-group col-lg-3 pt-3">
                                    <div class="input-group-prepend">
                                    <span class="input-group-text py-1">
                                        Đơn vị đo
                                    </span>
                                    </div>
                                    <select class="form-control text-light list-chart-uom">
                                    ${selectUomListHtml}
                                    </select>
                                </div>
                                <div class="col-lg-9 input-group pt-3 d-flex justify-content-end">
                                    <div class="input-group-prepend">
                                    <span class="input-group-text py-1">
                                        Thời gian
                                    </span>
                                    </div>
                                    <div class="btn-group" role="group">
                                    <button type="button" class="btn time-range-btn" data-time="3"
                                        style="border: solid .5px ${type.type_properties.color};color:${type.type_properties.color};"><span
                                        class="text-light">03h</span></button>
                                    <button type="button" class="btn time-range-btn" data-time="6"
                                        style="border: solid .5px ${type.type_properties.color};color:${type.type_properties.color};"><span
                                        class="text-light">06h</span></button>
                                    <button type="button" class="btn time-range-btn" data-time="9"
                                        style="border: solid .5px ${type.type_properties.color};color:${type.type_properties.color};"><span
                                        class="text-light">09h</span></button>
                                    <button type="button" class="btn time-range-btn" data-time="12"
                                        style="border: solid .5px ${type.type_properties.color};color:${type.type_properties.color};"><span
                                        class="text-light">12h</span></button>
                                    <button type="button" class="btn time-range-btn" data-time="24"
                                        style="border: solid .5px ${type.type_properties.color};color:${type.type_properties.color};"><span
                                        class="text-light">24h</span></button>
                                    </div>
                                </div>
                                <div class="col-lg-12">
                                    <canvas width="100%" class="chart-canvas" id="chart-${gateway.sn_number}-${type.prefix}"></canvas>
                                    </br>
                                    <button class="btn btn-success reset-zoom-chart" data-id-chart="chart-${gateway.sn_number}-${type.prefix}">Reset zoom</button></br>
                                    <i style="font-size: .8rem;">(*Ấn Ctrl + con lăn chuột để zoom biểu đồ)</i>
                                </div>
                            </div>`);

                            groupNodeDevice.append(topControlGroupNodeHtml);
                            groupNodeDevice.append(listNodeHtml);
                            groupNodeDevice.append(chartAreaHtml);
                            groupNodeDeviceHtml.append(groupNodeDevice);
                        })
                        tabGatewayContentElem.append('<div class="col-lg-12">' + deviceTypeAirHtml + '</div>');
                        tabGatewayContentElem.append('<div class="col-lg-12">' + deviceTypeSolutionHtml + '</div>');
                        tabGatewayContentElem.append(groupNodeDeviceHtml);

                        $('#gateWayTabContent').append(tabGatewayContentElem);
                    }
                })
                $('#gateWayTabList').html('<ul class="nav nav-tabs" role="tablist">' + gatewayTabHtml + '</ul>');
                $('#mask').hide();
            } else {
                $('#mask').hide();
                showDangerToast('Thất bại', response.errors[0].msg);
            }
        }).then(function () {
            socket.connect();
            StartRealTime(GetListDevice());
        }).catch((err) => {
            $('#mask').hide();
            console.log(err);
            showDangerToast('Thất bại', err);
        }).finally(() => {
            $('#mask').hide();
        })
    })

    // chart area


    // prepare chart data
    async function PrepareChartData(serial, startDate, endDate) {
        var url = '/device/device-logs';
        var method = 'POST';
        var param = { serial: serial, startDate: startDate, endDate: endDate, everyMinute: 0 };
        var response = await CallApi(url, param, method).then(resData => {
            if (resData.status == 'failure') {
                return '';
            }
            else {
                // console.log(resData.deviceLogs)
                var deviceLogs = resData.deviceLogs;
                return deviceLogs;
            }
        });
        return response;
    }

    // range yaxis chart

    var yAxisRanges = {
        tempa: [[0, 50], [0, 100], [0, 200], [-50, 200], [-1000, 1000]],
        rh: [[0, 100]],
        lux: [[0, 5000], [0, 50000], [0, 100000], [0, 200000], [0, 500000]],
        flow: [[0, 10], [0, 50], [0, 100], [0, 500]],
        oxy: [[0, 50], [0, 100]],
        co2: [[0, 500], [0, 1000], [0, 5000], [0, 10000], [0, 20000]],
        pres: [[0, 100], [0, 1000], [0, 10000], [0, 50000]],
        wlevel: [[0, 100], [0, 500], [0, 1000], [0, 5000]],
        temps: [[0, 50], [0, 100], [-50, 50], [-200, 200], [-500, 1000], [-500, 2000]],
        orp: [[-100, 100], [-200, 200], [-500, 500], [-1000, 1000], [-2000, 2000], [-5000, 5000]],
        do: [[0, 5], [0, 10], [0, 20], [0, 50], [0, 100], [0, 500]],
        ph: [[0, 14]],
        ec: [[0, 5], [0, 10], [0, 50], [0, 200], [0, 500], [0, 1000]]
    }

    // id element : 
    //  + gateway container : gateway-<_id gateway>
    //  + list node device group by type container: listNode-<model device>-<serial gateway>
    //  + node device : node-<serial node>
    // class element
    //  + type button: device-type-btn
    //  + list node device group by type container: group-node-device
    //  + node device element: node-item 
    //  + node device value wrapper: node-value
    //  + node value by uom real time change: <uom>-value
    //  + top controll date time picker wrapper: date-picker-wrapper
    //  + date value : date-picker
    //  + time select option: time-picker
    //  + time start: time-start
    //  + time end: time-end
    //  + chart area: chart-area
    //  + chart element : chart-canvas
    //  + list chart uom: list-chart-uom

    // event draw chart
    $(document).on('click', '.node-item', async function () {
        $('#mask').show();
        var serial = $(this).data('serial');
        var devName = $(this).data('name');
        var gateway = $(this).data('gateway');
        var devType = $(this).data('model');
        var listNodeId = `#listNode-${devType}-${gateway}`;

        var chartId = `chart-${gateway}-${devType}`;
        var chart = Chart.getChart(chartId);
        var onChart = $(this).data('on-chart');
        var uom = $(`${listNodeId} .list-chart-uom option:selected`).text();
        var uomName = $(`${listNodeId} .list-chart-uom option:selected`).data('displayName');
        var uomKey = $(`${listNodeId} .list-chart-uom`).val();

        var color = Colors[$(this).data('colorIdx')];
        var datePickerValue = $(`${listNodeId} .date-picker`).val();
        var startTime = $(`${listNodeId} .time-start`).val();
        var endTime = $(`${listNodeId} .time-end`).val();
        var startDate = datePickerValue + ' ' + startTime;
        var endDate = datePickerValue + ' ' + endTime;

        var chartTitle = String(`Thông số ${uomName} ( ${uom} ) -  Ngày ${startDate.slice(0, 11)} Từ ${startTime} đến ${endTime}`).toUpperCase();
        // $('#mask').hide();

        if (onChart == 'true') {
            $(this).data('on-chart', 'false');
            $(this).removeClass('mdi on-chart');

            var checkDeviceSelected = $(`${listNodeId} .node-item`).hasClass('mdi on-chart');
            if (!checkDeviceSelected) {
                chart.destroy();
                $(`${listNodeId} .chart-area`).hide();
                ScrollToElement('#' + $(this).attr('id'));
            } else {
                RemoveDataChart(chart, serial);
                ScrollToElement('#' + chartId);
            }
        } else {
            $(this).data('on-chart', 'true');
            $(this).addClass('mdi on-chart');
            var chartData = await PrepareChartData(serial, startDate, endDate);
            var dataset = {
                id: serial,
                label: devName,
                data: [],
                backgroundColor: [
                    color
                ],
                borderColor: [
                    color
                ],
                borderWidth: 1
            };
            var minYaxis = 0;
            var maxYaxis = 0;

            if (chartData) {
                chartData.forEach((log) => {
                    var dbValue;
                    for (var key of Object.keys(log.device_value)) {
                        if (key == uomKey) {
                            dbValue = log.device_value[key]
                        }
                    }
                    var value = dbValue;
                    if (!isNaN(value)) {
                        var data = { x: log.createdAt, y: value * 1 }
                        minYaxis = (value < minYaxis) ? value : minYaxis;
                        maxYaxis = (value > maxYaxis) ? value : maxYaxis;
                        dataset.data.push(data);
                    }
                });
            }

            var yAxisRange = yAxisRanges[uomKey];
            if (yAxisRange) {
                var checkRange = yAxisRange.some(function (range) {
                    if (minYaxis >= range[0] && maxYaxis <= range[1]) {
                        minYaxis = range[0];
                        maxYaxis = range[1];
                        return true;
                    }
                })
            }

            if (!chart) {
                $(`${listNodeId} .chart-area`).show();

                RenderChart(chartId, dataset, chartTitle, minYaxis, maxYaxis);
            } else {
                var currMinYaxis = chart.options.scales.y.suggestedMin;
                var currMaxYaxis = chart.options.scales.y.suggestedMax;
                chart.data.datasets.push(dataset);
                if (minYaxis < currMinYaxis || maxYaxis > currMaxYaxis) {
                    chart.options.scales.y.suggestedMin = minYaxis;
                    chart.options.scales.y.suggestedMax = maxYaxis;
                }
                chart.update();
                ScrollToElement('#' + chartId);
            }
        }
        $('#mask').hide();
        // debugger;
    })

    //render chart
    function RenderChart(chartId, dataset, chartTitle, minYaxis, maxYaxis) {
        var ctx = document.getElementById(chartId);
        if (ctx) {
            var myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [dataset]
                },
                options: {
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'hour',
                                tooltipFormat: 'dd/MM/yyyy HH:mm'
                            },
                            ticks: {
                                color: "#fff"
                            },
                            grid: {
                                drawOnChartArea: true,
                                color: "rgb(121 121 121 / 70%)" // only want the grid lines for one axis to show up
                            },
                        },
                        y: {
                            suggestedMin: minYaxis,
                            suggestedMax: maxYaxis,
                            scaleSteps: 10,
                            beginAtZero: true,
                            ticks: {
                                color: "#fff"
                            },
                            grid: {
                                drawOnChartArea: true,
                                color: "rgb(121 121 121 / 70%)" // only want the grid lines for one axis to show up
                            },
                        }
                    },
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#fff'
                            }
                        },
                        title: {
                            display: true,
                            text: chartTitle,
                            color: '#fff',
                            font: { size: 15, weight: 'bold' }
                        },
                        zoom: {
                            pan: {
                                enabled: true,
                                mode: 'x',
                                threshold: 5,
                            },
                            zoom: {
                                wheel: {
                                    enabled: true,
                                    modifierKey: 'ctrl'
                                },
                                pinch: {
                                    enabled: true
                                },
                                mode: 'x'
                            },
                        }
                    },
                }
            });
            ScrollToElement('#' + chartId);
        }

    }

    //remove data in datasets
    function RemoveDataChart(chart, id) {
        chart.data.datasets = chart.data.datasets.filter(function (obj) {
            return (obj.id != id);
        });
        chart.update();
    }

    //refresh chart
    async function RefreshChart(chartId, listNodeId) {

        var serials = [];
        var chart = Chart.getChart(chartId);
        if (chart) {
            chart.data.datasets.forEach(function (data) {
                var id = data.id;
                serials.push(id);
            });
        } else {
            return;
        }
        $('#mask').show();

        var datePickerValue = $(`${listNodeId} .date-picker`).val();
        var startTime = $(`${listNodeId} .time-start`).val();
        var endTime = $(`${listNodeId} .time-end`).val();
        var startDate = datePickerValue + ' ' + startTime;
        var endDate = datePickerValue + ' ' + endTime;

        var uom = $(`${listNodeId} .list-chart-uom option:selected`).text();
        var uomName = $(`${listNodeId} .list-chart-uom option:selected`).data('displayName');
        var uomKey = $(`${listNodeId} .list-chart-uom`).val();

        var chartTitle = String(`Thông số ${uomName} ( ${uom} ) -  Ngày ${startDate.slice(0, 11)} Từ ${startTime} đến ${endTime}`).toUpperCase();

        var datasets = [];
        var minYaxis = 0;
        var maxYaxis = 0;


        var deviceLogs = await PrepareChartData(serials, startDate, endDate);
        if (deviceLogs) {
            serials.forEach(function (serial) {
                var colorIdx = $(`#node-${serial}`).data('colorIdx');
                var color = Colors[colorIdx];
                var devName = $(`#node-${serial}`).data('name');
                var dataset = {
                    id: serial,
                    label: devName,
                    data: [],
                    backgroundColor: [
                        color
                    ],
                    borderColor: [
                        color
                    ],
                    borderWidth: 1
                };
                deviceLogs.forEach(function (log) {
                    if (log.device_serial == serial) {
                        var dbValue;
                        for (var key of Object.keys(log.device_value)) {
                            if (key == uomKey) {
                                dbValue = log.device_value[key]
                            }
                        }

                        var value = dbValue;
                        if (!isNaN(value)) {
                            var data = { x: log.createdAt, y: value * 1 }
                            minYaxis = (value < minYaxis) ? value : minYaxis;
                            maxYaxis = (value > maxYaxis) ? value : maxYaxis;
                            dataset.data.push(data);
                        }
                    }
                })

                datasets.push(dataset);
            })

            var yAxisRange = yAxisRanges[uomKey];
            if (yAxisRange) {
                var checkRange = yAxisRange.some(function (range) {
                    if (minYaxis >= range[0] && maxYaxis <= range[1]) {
                        minYaxis = range[0];
                        maxYaxis = range[1];
                        return true;
                    }
                })
            }

            chart.options.scales.y.suggestedMin = minYaxis;
            chart.options.scales.y.suggestedMax = maxYaxis;

            chart.data.datasets = datasets;
            chart.options.plugins.title.text = chartTitle;
            chart.update();
            ScrollToElement('#' + chartId);
        }
        $('#mask').hide();
        chart.resetZoom();
        // debugger
    }

    // change uom chart
    $(document).on('change', '.list-chart-uom', function () {
        var gateway = $("option:selected", this).data('gateway');
        var model = $("option:selected", this).data('model')
        var chartId = `chart-${gateway}-${model}`;
        var listNodeId = `#listNode-${model}-${gateway}`;
        RefreshChart(chartId, listNodeId);
    })
    // change date time chart
    $(document).on('change', '.date-picker, .time-start, .time-end', function () {
        var idx = $(this).find(":selected").data('idx');
        var gateway = $(this).parents('.date-picker-wrapper').data('gateway');
        var model = $(this).parents('.date-picker-wrapper').data('model')
        var chartId = `chart-${gateway}-${model}`;
        var listNodeId = `#listNode-${model}-${gateway}`;
        RefreshChart(chartId, listNodeId);
        if (idx) {
            $(listNodeId + ' .time-range-active').removeClass('time-range-active');
        }
    })


    //Time range change
    $(document).on('click', '.time-range-btn', function () {
        var timeRange = $(this).data('time');
        var currHour = moment().hour();
        var currMinute = moment().minute();
        var listNodeElemId = $(this).parents('.group-node-device').attr('id');
        var startTime = '';
        var endTime = '';
        var datePicker = moment($(`#${listNodeElemId} .date-picker`).val(), 'DD-MM-YYYY');

        var iscurrentDate = datePicker.isSame(new Date(), "day");
        if (iscurrentDate) {
            if ((currHour - timeRange) <= 0) {
                startTime = '00:00';
                endTime = String(currHour).padStart(2, '0') + ':' + String(currMinute).padStart(2, '0');
            } else {
                var startHour = currHour - timeRange;
                startTime = String(startHour).padStart(2, '0') + ':' + String(currMinute).padStart(2, '0');
                endTime = String(currHour).padStart(2, '0') + ':' + String(currMinute).padStart(2, '0');
            }
        } else {
            if ((24 - timeRange) == 0) {
                startTime = '00:00';
                endTime = '23:59';
            } else {
                var startHour = 24 - timeRange;
                startTime = String(startHour).padStart(2, '0') + ':' + '00';
                endTime = '23:59';
            }
        }
        $(this).siblings('.time-range-btn').removeClass('time-range-active');
        $(this).addClass('time-range-active');

        $(`#${listNodeElemId} .time-start .start-time-custom`).val(startTime).text(startTime).prop('selected', true).show();
        $(`#${listNodeElemId} .time-end .end-time-custom`).val(endTime).text(endTime).prop('selected', true).show();
        $(`#${listNodeElemId} .time-start`).change();
        $(`#${listNodeElemId} .time-end option`).each(function () {
            var timeValue = $(this).data('idx');
            var startHour = startTime.slice(0, 2);
            if (timeValue && timeValue <= startHour) {
                $(this).prop('disabled', true);
            }
            // console.log(timeValue, startHour);
        })
        // $(`#${listNodeElemId} .time-end option:not(.end-time-custom)`).prop('disabled', true);
        // debugger;
    })

    // Range picker
    var rangePicker = new Lightpick({
        field: document.getElementById('exportTimeRange'),
        singleDate: false,
        autoclose: true,
        maxDays: 31,
        format: 'DD-MM-YYYY',
        separator: ' ~ ',
        maxDate: new Date(),
        onSelect: function (start, end) {
            var str = '';
            str += start ? start.format('Do MMMM YYYY') + ' to ' : '';
            str += end ? end.format('Do MMMM YYYY') : '...';
            document.getElementById('exportTimeRange').innerHTML = str;
        }
    });
    rangePicker.setDateRange(new Date(), new Date());

    // export data
    $('#exportData').on('click', function () {
        rangePicker.setDateRange(new Date(), new Date());
        $('#exportTimeRange').data('startTime', '00:00');
        $('#exportTimeRange').data('endTime', '23:59');
        $('#exportModal').modal('show');
    })
    // quick export
    $(document).on('click', '.quick-export-btn', function () {
        var listNodeElem = $(this).parents('.group-node-device');
        var dateStr = $('.date-picker', listNodeElem).val();
        var date = moment(dateStr, "DD/MM/YYYY");
        var startTime = $('.time-start', listNodeElem).val();
        var endTime = $('.time-end', listNodeElem).val();
        var deviceType = $(this).data('deviceType');

        rangePicker.setDateRange(date, date);
        $('#exportTimeRange').data('startTime', startTime);
        $('#exportTimeRange').data('endTime', endTime);
        $('#exportDeviceType').val(deviceType);
        $('#exportModal').modal('show');
    })

    // submit export
    $('#exportSubmitBtn').on('click', async function () {
        var idGroup = $('#groupList').val();
        var dateExport = $('#exportTimeRange').val().split(' ~ ');
        var startDate = dateExport[0] + ' ' + $('#exportTimeRange').data('startTime');
        var endDate = dateExport[1] + ' ' + $('#exportTimeRange').data('endTime');

        var dateFormat = "DD-MM-YYYY HH:mm";
        var chkDate = moment(startDate, dateFormat, true).isValid() && moment(endDate, dateFormat, true).isValid();
        var deviceModel = $('#exportDeviceType').val();
        if (chkDate) {
            ExportData(idGroup, startDate, endDate, deviceModel)
        } else {
            showDangerToast('Thất bại', 'Vui lòng kiểm tra lại khoảng thời gian !');
        }

    })
    //func export data

    async function ExportData(idGroup, dateStart, dateEnd, deviceModel) {
        $('#mask').show();

        var title = `Thống kê môi trường \n từ ${dateStart} đến ${dateEnd}`;
        var fileName = `Thống kê môi trường từ ${dateStart} đến ${dateEnd}`;
        var fileExtension = 'xlsx';

        var getData = await PrepareExportData(idGroup, dateStart, dateEnd, deviceModel);
        if (getData.deviceLogs.length > 0) {

            var deviceLogs = getData.deviceLogs;
            var deviceTypes = getData.deviceType;

            var exportData = deviceLogs.map((d) => {
                var logValue = d?.device_value;
                var LogDate = moment(d?.createdAt).format("DD/MM/YYYY HH:mm");
                var data = {
                    serial: d?.device_serial,
                    deviceName: d?.devices?.device_name,
                    date: LogDate,
                };

                if (logValue) {
                    for (const [key, value] of Object.entries(logValue)) {
                        data[key] = value * 1;
                    }
                }
                return data;
            });
            // console.log(exportData);
            await ExportDataToFile(exportData, fileName, fileExtension, title, deviceTypes).finally(function () {
                $('#mask').hide();
            });
        } else {
            showSuccessToast('Không có dữ liệu', 'Không có dữ liệu trong khoảng thời gian này!');
            $('#mask').hide();
        }

    }

    //reset zoom chart
    $(document).on('click', '.reset-zoom-chart', function(){
        var idChart = $(this).data('idChart');
        var chart = Chart.getChart(idChart);

        if(chart){
            chart.resetZoom();
        }
    })

})