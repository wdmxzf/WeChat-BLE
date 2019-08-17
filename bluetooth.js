let bleId = '';

// 服务
let bleServiceId = "";
// 向蓝牙写数据的uuid
let writeCharacterId = "";
// 接受蓝牙数据的uuid
let notifyCharacterId = "";
let readCharacterId = "00002A23-0000-1000-8000-00805F9B34FB";// 主要获取Mac 地址

let macServiceId = "";
let macCharacteristicId = "00002A23-0000-1000-8000-00805F9B34FB";
let macAddressP = "";


// 过滤蓝牙
var UID1 = "";
var UID2 = "";
var UID3 = "";
var UID4 = "";

var deviceList = []; //搜索出来的符合要求的蓝牙列表
var that;

let systemType = "android";
let systemType_andorid = "android";
let systemType_ios = "ios";
var isWriteTime = false;
var lockInfoData;

var isFindMac = false;
var isFindWrite = false;

var timeBuffer;
var pwBuffer;
var statusBuffer;
var isConnect = false;

Page({
    //绑定数据
  data: {
  }, 
  // tab 切换
  onTabItemTap(item) {
  },
  // 卸载页面
  onUnload: function() {
  },
  //页面加载
  onLoad: function() {
    that = this;
    // getApp().getPermission(that);
    that.setData({
    })

    /**
     * 获取手机类型 iOS 还是 Android
     */
    wx.getSystemInfo({
      success: function(res) {
        if (res.platform == "devtools") {
          systemType = "pc";
        } else if (res.platform == "ios") {
          systemType = systemType_ios;
        } else if (res.platform == "android") {
          systemType = systemType_andorid;
        }
      },
    })

    wx.onBluetoothAdapterStateChange(function(res) {})

    /**
     * 监听设备的连接状态
     */
    wx.onBLEConnectionStateChanged(function(res) {
      
    })
  },
  // 页面显示
  onShow: function() {
    that = this;
  },
// 搜索蓝牙
  searchBlueToothBtn: function() {
    // 扫描到的蓝牙
    wx.onBluetoothDeviceFound(function(device) {
    })

    // 关闭蓝牙Adapter
    wx.closeBluetoothAdapter({
      success(res) {
        //初始化蓝牙模块
        wx.openBluetoothAdapter({
          success(res) {
            // 开始搜索蓝牙
            wx.startBluetoothDevicesDiscovery({
              success(res) {
              },
              fail(ref) {}
            })
          },
          fail(msg) {
            wx.showModal({
              title: '提示',
              content: '蓝牙处于关闭状态，请打开蓝牙',
              showCancel: false,
              success: function(res) {}
            })
          }
        })
      }
    })
  },
  //蓝牙链接
  onClickBleItem: function(event) {
    // 点击蓝牙，进行链接
    wx.createBLEConnection({
      deviceId: bleId,
      success: function(res) {
        /**
         * 获取服务列表
         */
        wx.getBLEDeviceServices({
          deviceId: bleId,
          success: function(res) {
            for (var index in res.services) {
              var service = res.services[index];
              // 蓝牙锁的service
              if (service.uuid == bleServiceId) {
                bleServiceId = service.uuid;
                  wx.getBLEDeviceCharacteristics({
                    deviceId: bleId,
                    serviceId: bleServiceId,
                    success: function (res) {
                      for (var index in res.characteristics) {
                        var character = res.characteristics[index];
                        var characterId = character.uuid;
                        if (character.properties.notify) {
                          // 注册通知
                          wx.notifyBLECharacteristicValueChange({
                            deviceId: bleId,
                            serviceId: bleServiceId,
                            characteristicId: characterId,
                            state: true,
                            success: function(res) {
                              // 注册通知成功
                            },
                          })
                        }
                        if (character.properties.write) {
                          // 写
                          if (characterId == writeCharacterId){
                            //搜索到可以写的特征值，可以想蓝牙发送命令，但是需要判断下是否获取到了蓝牙Mac 地址
                          }
                          
                        }
                        if (character.properties.read) {
                          // 读
                          wx.readBLECharacteristicValue({
                            deviceId: bleId,
                            serviceId: bleServiceId,
                            characteristicId: characterId,
                            success: function(res) {},
                          })
                        }
                      }

                      characteristicsChange(1);
                    },
                  })
              }

              // mac 地址的service
              if (service.uuid.toLowerCase().indexOf('0000180a') >= 0) {
                macServiceId = service.uuid;
                wx.getBLEDeviceCharacteristics({
                  deviceId: bleId,
                  serviceId: macServiceId,
                  success: function(res) {

                    for (var index in res.characteristics) {
                      var character = res.characteristics[index];
                      var macCharacter = character;
                      if (character.properties.notify) {
                        // 注册通知
                        wx.notifyBLECharacteristicValueChange({
                          deviceId: bleId,
                          serviceId: macServiceId,
                          characteristicId: macCharacter.uuid,
                          state: true,
                          success: function(res) {},
                        })
                      }
                      if (character.properties.read) {
                        // 读
                        wx.readBLECharacteristicValue({
                          deviceId: bleId,
                          serviceId: macServiceId,
                          characteristicId: macCharacter.uuid,
                          success: function(res) {},
                        })

                      }
                    }
                  },
                })
              }
            }
          },
        })

      },
    })

    characteristicsChange(2);

  },
  imageError(e) {}
})
// 监听蓝牙数据回掉，这个写了两个地方，因为在iOS 和Android上不知道这两个哪个能监听到
function characteristicsChange(flg){
  /**
   * 回调获取 设备发过来的数据
   */
  wx.onBLECharacteristicValueChange(function (characteristic) {
    console.log("fla is " + flg);
    var charId = characteristic.characteristicId;
    if (charId == macCharacteristicId) {
      macAddressP = getMacAddress(characteristic.value);
    
    }
    if (charId == notifyCharacterId) {
      analysisData(characteristic.value);
    }
  })
}

function writeCmd(bleDeviceId, bleServiceId, bleCharacteristicId, buffer) {
  wx.writeBLECharacteristicValue({
    // 这里的 deviceId 需要在 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
    deviceId: bleDeviceId,
    // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
    serviceId: bleServiceId,
    // 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
    characteristicId: bleCharacteristicId,
    // 这里的value是ArrayBuffer类型
    value: buffer,
    success(res) { },
    fail(msg) { }
  })
}

/**
 * 解析蓝牙返回的数据
 */
function analysisData(data) {

}

/**
 * 获取命令buffer
 * base64 转 arrayBuffer
 */
function getArrayBuffer(data) {
  let buffer = wx.base64ToArrayBuffer(data);
  return buffer;
}

// ArrayBuffer转16进制字符串示例
function ab2hex(buffer) {
  const hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function(bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('')
}

/**
 * 获取mac地址
 */
function getMacAddress(buffer) {
  let temArray = new Uint8Array(buffer);
  let macAddress;
  if (temArray.length == 8) {
    macAddress = [
      temArray[7].toString(16),
      temArray[6].toString(16),
      temArray[5].toString(16),
      // temArray[4].toString(16),
      // temArray[3].toString(16),
      temArray[2].toString(16),
      temArray[1].toString(16),
      temArray[0].toString(16),
    ].map(r => formatNumber(r)).join(':');
  }
  macAddress = macAddress.toUpperCase();
  return macAddress;
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function format(n) {
  n = n.toString()
  return n;
}