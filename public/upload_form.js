// var tgl = document.getElementById('mode_tgl');

// tgl.addEventListener('change', function() {
//     if (mode == 'code') {
//         mode = 'feature';
//         document.getElementById('pose_block').style.visibility = 'hidden';
//     } else {
//         mode = 'code';
//         document.getElementById('pose_block').style.visibility = '';
//     }
//     console.log('toggled')
// }, false);


var out_img = document.getElementById('out_img');
// var b_btn = document.getElementById('b_btn');
// var c_btn = document.getElementById('c_btn');
// var d_btn = document.getElementById('d_btn');
// var cp_btn = document.getElementById('changep');
// var cc_btn = document.getElementById('changec');
// var cb_btn = document.getElementById('changeb');
// var cz_btn = document.getElementById('changez');
// var rs_btn = document.getElementById('reset');

// var temp_global_ind = 5;
var data;
var session_id;
// var connection_speed = 100;
// var cl = 'bird';

// function hovereffectCP() { cp_btn.className = 'mini ui red button' }
// function hoveroutCP() { cp_btn.className = 'mini ui red basic button' }

// function hovereffectCC() { cc_btn.className = 'mini ui orange button' }
// function hoveroutCC() { cc_btn.className = 'mini ui orange basic button' }

// function hovereffectCB() { cb_btn.className = 'mini ui yellow button' }
// function hoveroutCB() { cb_btn.className = 'mini ui yellow basic button' }

// function hovereffectCZ() { cz_btn.className = 'mini ui olive button' }
// function hoveroutCZ() { cz_btn.className = 'mini ui olive basic button' }

// function hovereffectRS() { rs_btn.className = 'mini ui green button' }
// function hoveroutRS() { rs_btn.className = 'mini ui green basic button' }

function drag(ev) {
    ev.dataTransfer.setData('text', ev.target.src);
}

function allowDrop(ev) {
    ev.preventDefault();
}

function bg_drop(ev) {
    ev.preventDefault();
    var src = ev.dataTransfer.getData('text');
    $bgCrop.croppie('bind', {
        url: src
    }).then(function () {
        console.log('bg bind complete');
        bgSelected = true;
    });
}

function shp_drop(ev) {
    ev.preventDefault();
    var src = ev.dataTransfer.getData('text');
    $shpCrop.croppie('bind', {
        url: src
    }).then(function () {
        console.log('bg bind complete');
        shpSelected = true;
    });
}

function txtr_drop(ev) {
    ev.preventDefault();
    var src = ev.dataTransfer.getData('text');
    $txtrCrop.croppie('bind', {
        url: src
    }).then(function () {
        console.log('bg bind complete');
        txtrSelected = true;
    });
}

function pose_drop(ev) {
    ev.preventDefault();
    var src = ev.dataTransfer.getData('text');
    $poseCrop.croppie('bind', {
        url: src
    }).then(function () {
        console.log('bg bind complete');
        poseSelected = true;
    });
}


// Options for the observer (which mutations to observe)
const config = {childList: true, subtree: true};
var bgOb = new MutationObserver(function (mutations) {
    if (!!document.getElementById('bg_img_crop').childNodes[0]
        && !!document.getElementById('bg_img_crop').childNodes[0].childNodes[0]) {
        document.getElementById('bg_img_crop').childNodes[0].childNodes[0].style.visibility = 'hidden';
        bgOb.disconnect()
    }
});
bgOb.observe(document.getElementById('bg_img_crop'), config);

var shpOb = new MutationObserver(function (mutations) {
    if (!!document.getElementById('shp_img_crop').childNodes[0]
        && !!document.getElementById('shp_img_crop').childNodes[0].childNodes[0]) {
        document.getElementById('shp_img_crop').childNodes[0].childNodes[0].style.visibility = 'hidden';
        shpOb.disconnect()
    }
});
shpOb.observe(document.getElementById('shp_img_crop'), config);

var txtrOb = new MutationObserver(function (mutations) {
    if (!!document.getElementById('txtr_img_crop').childNodes[0]
        && !!document.getElementById('txtr_img_crop').childNodes[0].childNodes[0]) {
        document.getElementById('txtr_img_crop').childNodes[0].childNodes[0].style.visibility = 'hidden';
        txtrOb.disconnect()
    }
});
txtrOb.observe(document.getElementById('txtr_img_crop'), config);

var poseOb = new MutationObserver(function (mutations) {
    if (!!document.getElementById('pose_img_crop').childNodes[0]
        && !!document.getElementById('pose_img_crop').childNodes[0].childNodes[0]) {
        document.getElementById('pose_img_crop').childNodes[0].childNodes[0].style.visibility = 'hidden';
        poseOb.disconnect()
    }
});
poseOb.observe(document.getElementById('pose_img_crop'), config);

var mode = 'code';
$('#code_mode').css('background-color', '#db2828');
$('#code_mode').css('color', '#fff');
$('#feature_mode').css('background-color', '');
$('#feature_mode').css('color', '#f2711c');
$('#code_mode').on('click', function (ev) {
    if (mode == 'feature') {
        mode = 'code';
        $('#feature_mode').css('background-color', '');
        $('#feature_mode').css('color', '#f2711c');
        $('#code_mode').css('background-color', '#db2828');
        $('#code_mode').css('color', '#fff');
        document.getElementById('pose_block').style.visibility = '';
    }
});

$('#feature_mode').on('click', function (ev) {
    if (mode == 'code') {
        mode = 'feature';
        $('#code_mode').css('background-color', '');
        $('#code_mode').css('color', 'db2828');
        $('#feature_mode').css('background-color', '#f2711c');
        $('#feature_mode').css('color', '#fff');
        document.getElementById('pose_block').style.visibility = 'hidden';
    }
});

$('#feature_mode').hover(function (ev) {
    $('#feature_mode').css('background-color', '#f2711c');
    $('#feature_mode').css('color', '#fff');
}, function (ev) {
        if (mode == 'code') {
            $('#feature_mode').css('background-color', '');
            $('#feature_mode').css('color', '#f2711c');
        }
});

$('#code_mode').hover(function (ev) {
    $('#code_mode').css('background-color', '#db2828');
    $('#code_mode').css('color', '#fff');
}, function (ev) {
    if (mode == 'feature') {
        $('#code_mode').css('background-color', '');
        $('#code_mode').css('color', '#db2828');
    }
});

$('#upload').on('click', function (ev) {
    if (mode == 'code') {
        if (bgSelected && shpSelected && txtrSelected && poseSelected) {
            var imgData = {}
            $bgCrop.croppie('result', {
                type: 'canvas',
                size: 'viewport'
            }).then(function (resp) {
                imgData['bg_img'] = resp;
                $shpCrop.croppie('result', {
                    type: 'canvas',
                    size: 'viewport'
                }).then(function (resp) {
                    imgData['shp_img'] = resp;
                    $txtrCrop.croppie('result', {
                        type: 'canvas',
                        size: 'viewport'
                    }).then(function (resp) {
                        imgData['txtr_img'] = resp;
                        $poseCrop.croppie('result', {
                            type: 'canvas',
                            size: 'viewport'
                        }).then(function (resp) {
                            imgData['pose_img'] = resp;
                            imgData['uid'] = session_id;

                            var request = new XMLHttpRequest();
                            let url = 'code';
                            request.open('POST', url);
                            request.addEventListener('load', function () {
                                if (this.status == 200) {
                                    data = this.responseText;
                                    // console.log(data);
                                    out_img.src = 'tmp_images/' + session_id + '_out.png?' + performance.now();
                                }
                                else
                                    console.log('XHR Error!', this.responseText);
                            });
                            request.send(JSON.stringify(imgData));
                        });
                    });
                });
            });
        } else {
            alert('Please select all four images');
        }
    } else {
        if (bgSelected && shpSelected && txtrSelected) {
            var imgData = {}
            $bgCrop.croppie('result', {
                type: 'canvas',
                size: 'viewport'
            }).then(function (resp) {
                imgData['bg_img'] = resp;
                $shpCrop.croppie('result', {
                    type: 'canvas',
                    size: 'viewport'
                }).then(function (resp) {
                    imgData['shp_img'] = resp;
                    $txtrCrop.croppie('result', {
                        type: 'canvas',
                        size: 'viewport'
                    }).then(function (resp) {
                        imgData['txtr_img'] = resp;
                        imgData['uid'] = session_id;

                        var request = new XMLHttpRequest();
                        let url = 'feature';
                        request.open('POST', url);
                        request.addEventListener('load', function () {
                            if (this.status == 200) {
                                data = this.responseText;
                                // console.log(data);
                                out_img.src = 'tmp_images/' + session_id + '_out.png?' + performance.now();
                            }
                            else
                                console.log('XHR Error!', this.responseText);
                        });
                        request.send(JSON.stringify(imgData));
                    });
                });
            });
        } else {
            alert('Please select all three images');
        }
    }
});

var $bgCrop;
$bgCrop = $('#bg_img_crop').croppie({
    viewport: {
        width: 150,
        height: 150,
        type: 'square'
    },
    enableZoom: true
});

var bgSelected = false;
function bgFileSelect(evt) {
    document.getElementById('bg_img_crop').childNodes[0].childNodes[0].style.visibility = '';
    var files = evt.target.files;
    if (files && files[0]) {
        var file = files[0];
        reader = new FileReader();
        reader.onload = (function (tFile) {
            return function (evt) {
                // $('.upload-demo').addClass('ready');
                $bgCrop.croppie('bind', {
                    url: evt.target.result
                }).then(function () {
                    // console.log('bg bind complete');
                    bgSelected = true;
                });
            };
        }(file));
        reader.readAsDataURL(file);
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
}

var $shpCrop;
$shpCrop = $('#shp_img_crop').croppie({
    viewport: {
        width: 150,
        height: 150,
        type: 'square'
    },
    enableZoom: true,
    // enableResize: true
});

var shpSelected = false;
function shpFileSelect(evt) {
    document.getElementById('shp_img_crop').childNodes[0].childNodes[0].style.visibility = '';
    var files = evt.target.files;
    if (files && files[0]) {
        var file = files[0];
        reader = new FileReader();
        reader.onload = (function (tFile) {
            return function (evt) {
                // $('.upload-demo').addClass('ready');
                $shpCrop.croppie('bind', {
                    url: evt.target.result
                }).then(function () {
                    // console.log('shp bind complete');
                    shpSelected = true;
                });
            };
        }(file));
        reader.readAsDataURL(file);
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
}

var $txtrCrop;
$txtrCrop = $('#txtr_img_crop').croppie({
    viewport: {
        width: 150,
        height: 150,
        type: 'square'
    },
    enableZoom: true
});

var txtrSelected = false;
function txtrFileSelect(evt) {
    document.getElementById('txtr_img_crop').childNodes[0].childNodes[0].style.visibility = '';
    var files = evt.target.files;
    if (files && files[0]) {
        var file = files[0];
        reader = new FileReader();
        reader.onload = (function (tFile) {
            return function (evt) {
                // $('.upload-demo').addClass('ready');
                $txtrCrop.croppie('bind', {
                    url: evt.target.result
                }).then(function () {
                    // console.log('txtr bind complete');
                    txtrSelected = true;
                });
            };
        }(file));
        reader.readAsDataURL(file);
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
}

var $poseCrop;
$poseCrop = $('#pose_img_crop').croppie({
    viewport: {
        width: 150,
        height: 150,
        type: 'square'
    },
    enableZoom: true
});

var poseSelected = false;
function poseFileSelect(evt) {
    document.getElementById('pose_img_crop').childNodes[0].childNodes[0].style.visibility = '';
    var files = evt.target.files;
    if (files && files[0]) {
        var file = files[0];
        reader = new FileReader();
        reader.onload = (function (tFile) {
            return function (evt) {
                // $('.upload-demo').addClass('ready');
                $poseCrop.croppie('bind', {
                    url: evt.target.result
                }).then(function () {
                    // console.log('pose bind complete');
                    poseSelected = true;
                });
            };
        }(file));
        reader.readAsDataURL(file);
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
}

document.getElementById('bg_upload').addEventListener('change', bgFileSelect, false);
document.getElementById('shp_upload').addEventListener('change', shpFileSelect, false);
document.getElementById('txtr_upload').addEventListener('change', txtrFileSelect, false);
document.getElementById('pose_upload').addEventListener('change', poseFileSelect, false);


window.onload = function () {
    var request = new XMLHttpRequest();
    var url = 'init';
    request.open('GET', url);
    request.addEventListener('load', function () {
        if (this.status == 200) {
            data = this.responseText;
            let temp_data = JSON.parse(this.responseText);
            // console.log('initial data:');
            console.log(data);
            session_id = temp_data['uid'];
        }
        else
            console.log('XHR Error!', this.responseText);
    });
    request.send();
}

// function test_connection_speed(onload_callback) {
//     let _img = new Image();
//     _img.onload = function () {
//         connection_speed += performance.now();
//         // console.log('image load time: ' + connection_speed);
//         onload_callback();
//     }
//     connection_speed = -performance.now();
//     _img.src = 'tmp_images/' + session_id + '_10.png?' + performance.now();
// }

// function changep() {
//     let url = 'query?' + cl + '-changep';
//     submit(url);
// }

// function changeb() {
//     let url = 'query?' + cl + '-changeb';
//     submit(url);
// }

// function changec() {
//     let url = 'query?' + cl + '-changec';
//     submit(url);
// }

// function changez() {
//     let url = 'query?' + cl + '-changez';
//     submit(url);
// }

// function reset() {
//     let url = 'query?' + cl + '-reset';
//     submit(url);
// }

// function hovereffectB() {
//     if (cl == 'bird') {
//         return;
//     }
//     b_btn.className = 'mini ui red button'
// }

// function hovereffectC() {
//     if (cl == 'car') {
//         return;
//     }
//     c_btn.className = 'mini ui orange button'
// }

// function hovereffectD() {
//     if (cl == 'dog') {
//         return;
//     }
//     d_btn.className = 'mini ui yellow button'
// }

// function hoveroutB() {
//     if (cl == 'bird') {
//         return;
//     }
//     b_btn.className = 'mini ui red basic button'
// }

// function hoveroutC() {
//     if (cl == 'car') {
//         return;
//     }
//     c_btn.className = 'mini ui orange basic button'
// }

// function hoveroutD() {
//     if (cl == 'dog') {
//         return;
//     }
//     d_btn.className = 'mini ui yellow basic button'
// }

// function switch2B() {
//     if (cl == 'bird') {
//         return;
//     }
//     cl = 'bird';

//     b_btn.className = 'mini ui red button'
//     c_btn.className = 'mini ui orange basic button'
//     d_btn.className = 'mini ui yellow basic button'
//     // b_btn.style.boxShadow = '0 0 2px 3px #868689';
//     // b_btn.style.backgroundColor = '#333333';
//     // c_btn.style.backgroundColor = 'transparent';
//     // c_btn.style.boxShadow = 'none';
//     // d_btn.style.backgroundColor = 'transparent';
//     // d_btn.style.boxShadow = 'none';
//     var request = new XMLHttpRequest();
//     let url = 'switch2bird';
//     request.open('POST', url);
//     request.addEventListener('load', function () {
//         if (this.status == 200) {
//             data = this.responseText;
//             console.log(data);
//             imageTag.src = 'tmp_images/' + session_id + '_10.png?' + performance.now();
//         }
//         else
//             console.log('XHR Error!', this.responseText);
//     });
//     request.send(JSON.stringify(session_id));
// }

// function switch2C() {
//     if (cl == 'car') {
//         return;
//     }
//     cl = 'car';

//     b_btn.className = 'mini ui red basic button'
//     c_btn.className = 'mini ui orange button'
//     d_btn.className = 'mini ui yellow basic button'
//     // c_btn.style.boxShadow = '0 0 2px 3px #868689';
//     // c_btn.style.backgroundColor = '#333333';
//     // b_btn.style.backgroundColor = 'transparent';
//     // b_btn.style.boxShadow = 'none';
//     // d_btn.style.backgroundColor = 'transparent';
//     // d_btn.style.boxShadow = 'none';
//     var request = new XMLHttpRequest();
//     let url = 'switch2car';
//     request.open('POST', url);
//     request.addEventListener('load', function () {
//         if (this.status == 200) {
//             data = this.responseText;
//             console.log(data);
//             imageTag.src = 'tmp_images/' + session_id + '_10.png?' + performance.now();
//         }
//         else
//             console.log('XHR Error!', this.responseText);
//     });
//     request.send(JSON.stringify(session_id));
// }


// function switch2D() {
//     if (cl == 'dog') {
//         return;
//     }
//     cl = 'dog';

//     b_btn.className = 'mini ui red basic button'
//     c_btn.className = 'mini ui orange basic button'
//     d_btn.className = 'mini ui yellow button'
//     // d_btn.style.boxShadow = '0 0 2px 3px #868689';
//     // d_btn.style.backgroundColor = '#333333';
//     // b_btn.style.backgroundColor = 'transparent';
//     // b_btn.style.boxShadow = 'none';
//     // c_btn.style.backgroundColor = 'transparent';
//     // c_btn.style.boxShadow = 'none';
//     var request = new XMLHttpRequest();
//     let url = 'switch2dog';
//     request.open('POST', url);
//     request.addEventListener('load', function () {
//         if (this.status == 200) {
//             data = this.responseText;
//             console.log(data);
//             imageTag.src = 'tmp_images/' + session_id + '_10.png?' + performance.now();
//         }
//         else
//             console.log('XHR Error!', this.responseText);
//     });
//     request.send(JSON.stringify(session_id));
// }


// function preload_images(images, _images, final_callback) {
//     let img = new Image();
//     img.onload = function () {
//         if (images.length == 0) {
//             final_callback(_images);
//         }
//         else {
//             preload_images(images, _images, final_callback);
//         }
//     }
//     img.src = images.shift();
// }

// function preload_images2(images, _images, final_callback) {
//     let img = new Image();
//     let img2 = new Image();
//     img.onload = function () {
//         if (images.length == 0) {
//             final_callback(_images);
//         }
//         else {
//             preload_images2(images, _images, final_callback);
//         }
//     }
//     img.src = images.shift();
//     img2.src = images.shift();
// }


// function preload_image(url) {
//     let img = new Image();
//     img.src = url;
// }


// function img_transform(images, interval) {
//     imageTag.src = images[0];
//     setTimeout(() => {
//         imageTag.src = images[1];
//     }, interval);
//     setTimeout(() => {
//         imageTag.src = images[2];
//     }, 2 * interval);
//     setTimeout(() => {
//         imageTag.src = images[3];
//     }, 3 * interval);
//     setTimeout(() => {
//         imageTag.src = images[4];
//     }, 4 * interval);
//     setTimeout(() => {
//         imageTag.src = images[5];
//     }, 5 * interval);
//     setTimeout(() => {
//         imageTag.src = images[6];
//     }, 6 * interval);
//     setTimeout(() => {
//         imageTag.src = images[7];
//     }, 7 * interval);
//     setTimeout(() => {
//         imageTag.src = images[8];
//     }, 8 * interval);
//     setTimeout(() => {
//         imageTag.src = images[9];
//     }, 9 * interval);
//     setTimeout(() => {
//         imageTag.src = images[10];
//     }, 10 * interval);
//     setTimeout(() => {
//         test_connection_speed(function () { });
//     }, 11 * interval);
// }

// function submit(url) {
//     let request = new XMLHttpRequest();
//     request.open('POST', url);
//     request.addEventListener('load', function () {
//         if (this.status == 200) {
//             var path = 'tmp_images/' + session_id;
//             // image urls
//             let images = []

//             for (let i = 0; i < 11; i++) {
//                 let url = path + '_' + i + '.png?' + performance.now();
//                 images.push(url);
//                 preload_image(url);
//             }

//             data = this.responseText;
//             console.log(data)

//             if (connection_speed < 70) {
//                 img_transform(images, 80);
//             }
//             else if (connection_speed < 80) {
//                 img_transform(images, 90);
//             }
//             else if (connection_speed < 90) {
//                 img_transform(images, 100);
//             }
//             else if (connection_speed < 100) {
//                 img_transform(images, 110);
//             }
//             else if (connection_speed < 115) {
//                 img_transform(images, 120);
//             }
//             else if (connection_speed < 300) {
//                 preload_images2(images, [...images], function (images) {
//                     img_transform(images, 100);
//                 });
//             }
//             else {
//                 preload_images(images, [...images], function (images) {
//                     img_transform(images, 100);
//                 });
//             }
//         }
//         else
//             console.log('XHR Error!', this.responseText);
//     });
//     request.send(data);
// }