//Scrip device_value_gateway.hbs - xem giá trị các node trong gateway
$(document).ready(function () {

    // socket io
    var socket = io();
    var user = $('#userName').val();

    // get list gateway
    function GetListDevice() {
        var deviceList = [];
        $('.ahsd-serial').each(function () {
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

    // device connected

    socket.on('device_connect', function (serial) {
        var listDevices = GetListDevice();
        if (listDevices.indexOf(serial) != -1) {
            ChangeDeviceStatus(`#ahsdTab-${serial} .status`, '1');
            socket.emit('start_real_time_device', { listDevices, user });
        }
    })

    //check Device online
    socket.on('device_online', function (serial) {
        var listDevices = GetListDevice();
        if (listDevices.indexOf(serial) != -1) {
            ChangeDeviceStatus(`#ahsdTab-${serial} .status`, '1');
        }
    })

    //check device disconnect
    socket.on('device_disconnect', function (serial) {
        ChangeDeviceStatus(`#ahsdTab-${serial} .status`, '0');

        $(`#ahsd-${serial} .ahsd-uom .value`).html("N/A");
    })

    //detect device status
    socket.on('device_offline', function (serial) {
        ChangeDeviceStatus(`#ahsdTab-${serial} .status`, '0');

        $(`#ahsd-${serial} .ahsd-uom .value`).html("N/A");
    })

    // device send realtime value

    socket.on('realtime_device_value', function (res) {
        try {
            var ahsdSerial = res.serial;
            var values = res.data.val;

            for (const [key, value] of Object.entries(values)) {
                $(`#uom-${ahsdSerial}-${key} .value`).html(value);
            }
            ChangeDeviceStatus(`#ahsdTab-${ahsdSerial} .status`, '1');
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
            $(this).parents('.ahsd-device').find('.time-range-active').removeClass('time-range-active');
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
                var today = moment(new Date).format('DD-MM-YYYY');
                // console.log(devices);
                // check gateway in device group
                if (!devices.some(device => device.device_model === "AHSD")) {
                    $('#deviceArea').html('<div class="tab-content col-lg-12" id="ahsdTabContent"><h4 class="w-100 text-center">Nhóm hiện tại chưa có thiết bị</h4></div>');
                    $('#mask').hide();

                    return;
                };
                // root element
                var deviceAreaElem = $('#deviceArea');
                // tab ahsd list
                var ahsdTabListElem = $('<div class="col-lg-12 p-0" id="ahsdTabList"><ul class="nav nav-tabs" role="tablist"></ul></div>');
                var listAhsdHtml = '';
                var activeTab = true;
                devices.forEach(function (device) {
                    if (device.device_model == 'AHSD') {
                        listAhsdHtml +=
                            `<li class="nav-item col-lg-4 mb-1 p-0 px-1">
                            <input type="hidden" class="ahsd-serial" value="${device.sn_number}">
                            <a class="nav-link bg-device border-0 text-nowrap overflow-ellipsis ${activeTab ? 'active' : ''}" id="ahsdTab-${device.sn_number}" data-toggle="tab" href="#ahsd-${device.sn_number}" role="tab" aria-controls="ahsd" aria-selected="${activeTab}">
                            <span class="status status-na"></span>${device.device_name}</a>
                        </li>`;
                        activeTab = false
                    }
                })
                $('ul', ahsdTabListElem).append(listAhsdHtml);

                // tab content
                var tabContentElem = $('<div class="tab-content col-lg-12" id="ahsdTabContent"></div>');
                var contentActive = true;
                devices.forEach(function (device) {
                    if (device.device_model == 'AHSD') {
                        var ahsdElem =
                            $(`<div class="tab-pane fade ${contentActive ? 'active show' : ''} ahsd-device" id="ahsd-${device.sn_number}" role="tabpanel" aria-labelledby="ahsdTab-${device.sn_number}"></div>`);
                        var dateTimepickerHtml =
                            `<div class="form-group col-lg-9 col-md-12 mt-3 p-0 date-picker-wrapper"
                        data-ahsd-serial="${device.sn_number}">
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
                        var uomGroupElem = $(`<div class="col-lg-12 p-0 group-uom"></div>`);
                        var uomHtml = '';
                        for (const [key, value] of Object.entries(device.device_type.uom_values)) {
                            uomHtml +=
                                `<div class="card rounded-lg p-2 mt-2 ahsd-uom ${key}" id="uom-${device.sn_number}-${key}"
                            style=" background-color:${value.color};" data-uom-key="${key}"
                            data-ahsd-serial="${device.sn_number}" data-uom-label="${value.name}"
                            data-uom-color="${value.color}">
                                <h6 class="text-light font-weight-normal">${value.name}</h6>
                                <div class="card-body p-2">
                                <div class="row">
                                    <div class="col-9 uom-value">
                                    <div class="d-flex align-items-center align-self-start">
                                        <h3 class="mb-0 value pr-2">N/A</h3>
                                    </div>
                                    </div>
                                    <div class="col-3">
                                    <div class="icon pt-1 pr-2">
                                        <i class="mb-0 uom">${value.uom}</i>
                                    </div>
                                    </div>
                                </div>
                                <br>
                                </div>
                            </div>`;
                        }
                        uomGroupElem.html(uomHtml);

                        var chartAreaHtml =
                            `<div class="col-lg-12 p-0 chart-area" style="display: none;">
                            <div class="row p-0">
        
                            <div class="col-lg-12 input-group pt-3 d-flex justify-content-end mt-3 mb-3">
                                <div class="input-group-prepend">
                                <span class="input-group-text py-1">
                                    Thời gian
                                </span>
                                </div>
                                <div class="btn-group" role="group">
                                <button type="button" class="btn time-range-btn" data-time="3"
                                    style="border: solid .5px #016343;color:#016343;"><span
                                    class="text-light">03h</span></button>
                                <button type="button" class="btn time-range-btn" data-time="6"
                                    style="border: solid .5px #016343;color:#016343;"><span
                                    class="text-light">06h</span></button>
                                <button type="button" class="btn time-range-btn" data-time="9"
                                    style="border: solid .5px #016343;color:#016343;"><span
                                    class="text-light">09h</span></button>
                                <button type="button" class="btn time-range-btn" data-time="12"
                                    style="border: solid .5px #016343;color:#016343;"><span
                                    class="text-light">12h</span></button>
                                <button type="button" class="btn time-range-btn" data-time="24"
                                    style="border: solid .5px #016343;color:#016343;"><span
                                    class="text-light">24h</span></button>
                                </div>
                            </div>
                            <div class="col-lg-12">
                                <canvas width="100%" class="chart-canvas" id="chart-${device.sn_number}"></canvas>
                                </br>
                                <button class="btn btn-success reset-zoom-chart" data-id-chart="chart-${device.sn_number}">Reset zoom</button></br>
                                <i style="font-size: .8rem;">(*Ấn Ctrl + con lăn chuột để zoom biểu đồ)</i>
                            </div>
                            </div>
                        </div>`;

                        ahsdElem.append(dateTimepickerHtml);
                        ahsdElem.append(uomGroupElem);
                        ahsdElem.append(chartAreaHtml);
                        tabContentElem.append(ahsdElem);
                        contentActive = false;
                    }
                })


                // inner html root all element
                deviceAreaElem.html('');
                deviceAreaElem.append(ahsdTabListElem);
                deviceAreaElem.append(tabContentElem);

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
        var param = { serial: serial, startDate: startDate, endDate: endDate };
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
    $(document).on('click', '.ahsd-uom', async function () {
        $('#mask').show();
        var serial = $(this).data('ahsdSerial');
        var uomLabel = $(this).data('uomLabel');
        var uomKey = $(this).data('uomKey');
        var idDataSet = uomKey;

        var chartId = `chart-${serial}`;
        var chart = Chart.getChart(chartId);
        var onChart = $(this).data('on-chart');

        var color = $(this).data('uomColor');
        var datePickerValue = $(`#ahsd-${serial} .date-picker`).val();
        var startTime = $(`#ahsd-${serial} .time-start`).val();
        var endTime = $(`#ahsd-${serial} .time-end`).val();
        var startDate = datePickerValue + ' ' + startTime;
        var endDate = datePickerValue + ' ' + endTime;
        var idYaxis = 'y' + uomKey;

        var chartTitle = String(`Thông số dinh dưỡng -  Ngày ${startDate.slice(0, 11)} Từ ${startTime} đến ${endTime}`).toUpperCase();

        if (onChart == 'true') {
            $(this).data('on-chart', 'false');
            $(this).removeClass('mdi on-chart');

            var checkDeviceSelected = $(`#ahsd-${serial} .ahsd-uom`).hasClass('mdi on-chart');
            if (!checkDeviceSelected) {
                chart.destroy();
                $(`#ahsd-${serial} .chart-area`).hide();
                ScrollToElement('#ahsd-' + serial);
            } else {
                RemoveDataChart(chart, idDataSet, idYaxis);
                ScrollToElement('#' + chartId);
            }
        } else {
            $(this).data('on-chart', 'true');
            $(this).addClass('mdi on-chart');
            var chartData = await PrepareChartData(serial, startDate, endDate);
            var dataset = {
                id: idDataSet,
                label: uomLabel,
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
                    var value = log?.device_value[uomKey];
                    if (!isNaN(value)) {
                        var data = { x: log.createdAt, y: value * 1 }
                        minYaxis = (value < minYaxis) ? value : minYaxis;
                        maxYaxis = (value > maxYaxis) ? value : maxYaxis;
                        dataset.data.push(data);
                    }
                });
                dataset.yAxisID = idYaxis;
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
                $(`#ahsd-${serial} .chart-area`).show();

                RenderChart(chartId, dataset, chartTitle, idYaxis, minYaxis, maxYaxis);
            } else {
                chart.data.datasets.push(dataset);
                chart.options.scales[idYaxis].display = true;
                chart.options.scales[idYaxis].suggestedMin = minYaxis;
                chart.options.scales[idYaxis].suggestedMax = maxYaxis;
                chart.update();
                ScrollToElement('#' + chartId);
            }
        }
        $('#mask').hide();
        // debugger;
    })

    //render chart
    function RenderChart(chartId, dataset, chartTitle, idYaxis, minYaxis, maxYaxis) {
        var ctx = document.getElementById(chartId);
        var options = {
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
                        color: "rgb(80 80 80 / 20%)", // only want the grid lines for one axis to show up
                    },
                },
                y: {
                    //PH
                    ticks: {
                        display: false,
                    },
                    display: true,
                    grid: {
                        drawBorder: false,
                        drawOnChartArea: true,
                        color: "rgb(80 80 80 / 20%)", // only want the grid lines for one axis to show up
                        //borderColor: '#179c52',
                        borderWidth: 0,
                    },
                },
                yph: {
                    //PH
                    ticks: {
                        color: "#fff"
                    },
                    display: false,
                    grid: {
                        drawOnChartArea: false,
                        color: "rgb(80 80 80 / 20%)", // only want the grid lines for one axis to show up
                        borderColor: '#179c52',
                        borderWidth: 4,
                    },
                },
                yec: {
                    //EC
                    ticks: {
                        color: "#fff"
                    },
                    display: false,
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                        borderColor: '#f7b529',
                        borderWidth: 4,
                    },
                },
                ytemps: {
                    //TEMP
                    position: 'right',
                    ticks: {
                        color: "#fff"
                    },
                    display: false,
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                        borderColor: '#ff3e30',
                        borderWidth: 4,
                    },
                },
                ydo: {
                    //OXY
                    position: 'right',
                    ticks: {
                        color: "#fff"
                    },
                    display: false,
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                        borderColor: '#176bef',
                        borderWidth: 4,
                    },
                },
                yorp: {
                    //OXY
                    position: 'right',
                    ticks: {
                        color: "#fff"
                    },
                    display: false,
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                        borderColor: '#553186',
                        borderWidth: 4,
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
        };
        options.scales[idYaxis].display = true;
        options.scales[idYaxis].suggestedMin = minYaxis;
        options.scales[idYaxis].suggestedMax = maxYaxis;

        if (ctx) {
            var myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [dataset]
                }, options
            });
            ScrollToElement('#' + chartId);

        }
    }

    //remove data in datasets
    function RemoveDataChart(chart, id, idYaxis) {
        chart.data.datasets = chart.data.datasets.filter(function (obj) {
            return (obj.id != id);
        });
        chart.options.scales[idYaxis].display = false;
        chart.update();
    }

    //refresh chart
    async function RefreshChart(chartId, ahsdSerial) {
        var chart = Chart.getChart(chartId);
        if (!chart) {
            return;
        }
        $('#mask').show();
        var currDatasets = chart.data.datasets;
        var idDatasets = currDatasets.map((value) => {
            return value.id;
        })
        var datePickerValue = $(`#ahsd-${ahsdSerial} .date-picker`).val();
        var startTime = $(`#ahsd-${ahsdSerial} .time-start`).val();
        var endTime = $(`#ahsd-${ahsdSerial} .time-end`).val();
        var startDate = datePickerValue + ' ' + startTime;
        var endDate = datePickerValue + ' ' + endTime;

        var chartTitle = String(`Thông số dinh dưỡng -  Ngày ${startDate.slice(0, 11)} Từ ${startTime} đến ${endTime}`).toUpperCase();
        var chartData = await PrepareChartData(ahsdSerial, startDate, endDate);
        var newDatasets = [];
        idDatasets.forEach((idDataset) => {
            var idTypeDevice = `#ahsd-${ahsdSerial} .ahsd-uom.${idDataset}`
            var valueName = $(idTypeDevice).data('uomLabel');
            var color = $(idTypeDevice).data('uomColor');
            var minYaxis = 0;
            var maxYaxis = 0;
            var dataset = {
                id: idDataset,
                label: valueName,
                data: [],
                backgroundColor: color,
                borderColor: color,
                borderWidth: 1,
                yAxisID: '',
            };
            if (chartData) {
                chartData.forEach((log, index) => {
                    var value = log.device_value[idDataset];
                    if (!isNaN(value)) {
                        var data = { x: log.createdAt, y: value * 1 }
                        minYaxis = (value < minYaxis) ? value : minYaxis;
                        maxYaxis = (value > maxYaxis) ? value : maxYaxis;
                        dataset.data.push(data);
                    }
                });
                dataset.yAxisID = 'y' + idDataset;
                newDatasets.push(dataset);
            }

            var yAxisRange = yAxisRanges[idDataset];
            if (yAxisRange) {
                var checkRange = yAxisRange.some(function (range) {
                    if (minYaxis >= range[0] && maxYaxis <= range[1]) {
                        minYaxis = range[0];
                        maxYaxis = range[1];
                        return true;
                    }
                })
            }
            var yAxisId = 'y' + idDataset;
            chart.options.scales[yAxisId].suggestedMin = minYaxis;
            chart.options.scales[yAxisId].suggestedMax = maxYaxis;
        });
        chart.data.datasets = newDatasets;
        chart.options.plugins.title.text = chartTitle;
        chart.update();
        ScrollToElement('#' + chartId);
        $('#mask').hide();
        chart.resetZoom();
    }

    // change date time chart
    $(document).on('change', '.date-picker, .time-start, .time-end', function () {
        var idx = $(this).find(":selected").data('idx');

        var ahsdSerial = $(this).parents('.date-picker-wrapper').data('ahsdSerial');
        var chartId = `chart-${ahsdSerial}`;
        var idAhsd = '#' + $(this).parents('.ahsd-device').attr('id');
        RefreshChart(chartId, ahsdSerial);
        if (idx) {
            $(idAhsd + ' .time-range-active').removeClass('time-range-active');
        }
    })

    //Time range change
    $(document).on('click', '.time-range-btn', function () {
        var timeRange = $(this).data('time');
        var currHour = moment().hour();
        var currMinute = moment().minute();
        var ahsdDevice = $(this).parents('.ahsd-device').attr('id');
        var startTime = '';
        var endTime = '';
        var datePicker = moment($(`#${ahsdDevice} .date-picker`).val(), 'DD-MM-YYYY');

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

        $(`#${ahsdDevice} .time-start .start-time-custom`).val(startTime).text(startTime).prop('selected', true).show();
        $(`#${ahsdDevice} .time-end .end-time-custom`).val(endTime).text(endTime).prop('selected', true).show();
        $(`#${ahsdDevice} .time-start`).change();
        $(`#${ahsdDevice} .time-end option`).each(function () {
            var timeValue = $(this).data('idx');
            var startHour = startTime.slice(0, 2);
            if (timeValue && timeValue <= startHour) {
                $(this).prop('disabled', true);
            }
            // console.log(timeValue, startHour);
        })
        // $(`#${ahsdDevice} .time-end option:not(.end-time-custom)`).prop('disabled', true);
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

    // submit export
    $('#exportSubmitBtn').on('click', async function () {
        var idGroup = $('#groupList').val();
        var dateExport = $('#exportTimeRange').val().split(' ~ ');
        var startDate = dateExport[0] + ' ' + $('#exportTimeRange').data('startTime');
        var endDate = dateExport[1] + ' ' + $('#exportTimeRange').data('endTime');

        var dateFormat = "DD-MM-YYYY HH:mm";
        var chkDate = moment(startDate, dateFormat, true).isValid() && moment(endDate, dateFormat, true).isValid();
        var deviceModel = 'AHSD';
        if (chkDate) {
            ExportData(idGroup, startDate, endDate, deviceModel)
        } else {
            showDangerToast('Thất bại', 'Vui lòng kiểm tra lại khoảng thời gian !');
        }

    })
    //func export data

    async function ExportData(idGroup, dateStart, dateEnd, deviceModel) {
        $('#mask').show();

        var title = `Thống kê dinh dưỡng \n từ ${dateStart} đến ${dateEnd}`;
        var fileName = `Thống kê dinh dưỡng từ ${dateStart} đến ${dateEnd}`;
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
                        if (value == 'none') {
                            data[key] = value;
                        } else {
                            data[key] = value * 1;
                        }
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