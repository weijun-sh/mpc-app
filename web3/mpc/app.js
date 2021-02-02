//npm install ethereumjs-tx@1.3.7

//------ var --------------------------------------------------------
var gas_limit = '100000'
var gas_price = '10' //gwei
var amount = '0.0'

//------ module -----------------------------------------------------
const ethTx = require('ethereumjs-tx'); //ethereumjs-tx@1.3.7
const Web3 = require('web3');
const web3_mpc = require('./mpc.js');
const fs = require('fs');
const sha256 = require('sha256');
const util = require('ethereumjs-util');
const web3 = new Web3(url)
require('./config.js');

//------ function ---------------------------------------------------
//1 reqAccount
//var reqMpcPublicKey = reqAccount(account_keystore, account_password)
//var address_mpc= getAddressMPC(mpcPublicKey)
//getBalance(address_mpc)

//2 sendTransaction
var txHash = sendTransaction(account_keystore, account_password, mpcPublicKey, address_to, custom_data)

//3 getTransaction
//getTransaction(txHash)

//====== API ======================================================
function reqAccount(account_keystore, account_password) {
    var p = getPrivkey(account_keystore, account_password)
    var address_user = p[0]
    var privateKey = p[1]
    //req mpc address
    console.log("Req MPC account")
    web3_mpc.mpc.getReqAddrNonce(address_user).then(res => {
        console.log("get reqAddrNonce")
            var status = res.Status
            if (status === 'Success') {
                var nonce = res.Data.result
                console.log("reqAddrNonce:"+nonce)
                var dataObj = {
                    TxType   : 'REQDCRMADDR',
                    GroupId  : group_ID,
                    ThresHold: '2/3',
                    Mode     : '1',
                    TimeStamp: Date.now().toString(),
                    Sigs     : ''
                }
                var rawTx = {
                    nonce : web3.utils.toHex(nonce),
                    to    : address_to_mpc,
                    data  : JSON.stringify(dataObj),
                }
                console.log(rawTx)
    
                var tx = new ethTx(rawTx);
                tx.sign(privateKey);
    
                var serializedTx = tx.serialize();
                console.log("reqMpcAddr")
                web3_mpc.mpc.reqDcrmAddr('0x' + serializedTx.toString('hex')).then(res => {
                    var keyID = res.Data.result
                    var status = res.Status
                    console.log("keyid: "+keyID)
                    if (status === 'Success') {
                        console.log("waitting 10s to getReqAddrStatus ...")
                        //sleep 20 s
                        sleep(20000)
                        web3_mpc.mpc.getReqAddrStatus(keyID).then(res => {
                            var pubKey = JSON.parse(res.Data.result).PubKey
                            var status = res.Status
                            if (status === 'Success') {
                                mpcPublicKey = pubKey
                                console.log("mpcPublicKey: "+mpcPublicKey)
                                var address_mpc = util.pubToAddress('0x'+mpcPublicKey, true)
                                address_mpc = util.toChecksumAddress(address_mpc.toString('hex'))
                                console.log('mpcAddress: '+address_mpc)
                                return pubKey
                            } else {
                                console.log("getReqAddrStatus status: "+status)
                                process.exit(1)
                            }
                        })
                    } else {
                        console.log("reqDcrmAddr status: "+status)
                        process.exit(1)
                    }
                })
            } else {
                console.log("getReqAddrNonce status: "+status)
                process.exit(1)
            }
    })
}

function sendTransaction(account_keystore, account_password, mpcPublicKey, address_to, custom_data) {
    var p = getPrivkey(account_keystore, account_password)
    var address_user = p[0]
    var privateKey = p[1]
    var address_mpc = getAddressMPC(mpcPublicKey)
    console.log("sendTransaction")
    web3_mpc.mpc.getSignNonce(address_user).then(res => {
        console.log("get SignNonce")
        var status = res.Status
        if (status === 'Success') {
            console.log("SignNonce:"+res.Data.result)
            console.log("get nonce")
            web3.eth.getTransactionCount(address_mpc, (err, nonce_mpc) => {
                console.log("nonce_mpc: "+nonce_mpc)
                var rawTx = {
                    nonce   : web3.utils.toHex(nonce_mpc),
                    gasPrice: web3.utils.toHex(web3.utils.toWei(gas_price, 'gwei')),
                    gasLimit: web3.utils.toHex(gas_limit),
                    to      : address_to,
                    value   : web3.utils.toHex(web3.utils.toWei(amount,'ether')), //'ether'
                    data    : custom_data,
                    v       : web3.utils.toHex(chainID),
                    //r       : '0x0',
                    //s       : '0x0'
                }
                console.log(rawTx)
                
                var tx = new ethTx(rawTx)
                var serializedTx = tx.serialize();
                var unsignedHash = web3.utils.sha3(serializedTx)
                console.log("unsignedTxHash:", unsignedHash)
                //console.log("raw: "+'0x' + serializedTx.toString('hex'))
    
                var dataObj = {
                    TxType    : TxType,
                    PubKey    : mpcPublicKey,
                    MsgHash   : [unsignedHash], // []string
                    MsgContext: [''], // []string
                    Keytype   : Keytype,
                    GroupId   : group_ID,
                    ThresHold : ThresHold,
                    Mode      : Mode,
                    TimeStamp : Date.now().toString()
                }
                var rawTxMpc = {
                    nonce   : web3.utils.toHex(res.Data.result),
                    to      : address_to_mpc,
                    data    : JSON.stringify(dataObj),
                }
                console.log(rawTxMpc)
    
                var tx2 = new ethTx(rawTxMpc);
                tx2.sign(privateKey);
    
                var serializedTx2 = tx2.serialize();
                console.log("sign")
                //console.log("raw: "+'0x' + serializedTx2.toString('hex'))
                web3_mpc.mpc.sign('0x' + serializedTx2.toString('hex')).then(res2 => {
                    console.log(res2)
                    var keyID = res2.Data.result
                    
                    var status = res2.Status
                    console.log("sign keyid: "+keyID)
                    if (status === 'Success') {
                        console.log("waitting 20s to getSignStatus ...")
                        //sleep 20s
                        sleep(20000)
                        web3_mpc.mpc.getSignStatus(keyID).then(res3 => {
                            console.log(res3)
                            var Rsv = JSON.parse(res3.Data.result).Rsv[0]
                            var status = res3.Status
                            if (status === 'Success') {
                                console.log("Rsv: "+Rsv)
                                //(202011 * 2 + 35) + v
                                var vSigned = chainID * 2 + 35 + web3.utils.hexToNumber('0x'+Rsv.substring(128,130))
                                //checkAddress4RSV(unsignedHash, Rsv)
                                rawTx.v = web3.utils.toHex(vSigned)
                                rawTx.r = '0x'+Rsv.substring(0,64)
                                rawTx.s = '0x'+Rsv.substring(64,128)
                                var tx = new ethTx(rawTx);
                                var serializedTx2 = tx.serialize();
                                //checkAddress4SignedTx('0x' + serializedTx2.toString('hex'))
    
                                console.log("signedTx: "+'0x' + serializedTx2.toString('hex'))
                                var signedHash = web3.utils.sha3(serializedTx2)
                                console.log("SignedTxHash:", signedHash)
    
                                console.log("send tx ...")
                                web3.eth.sendSignedTransaction('0x' + serializedTx2.toString('hex'))
                                    .on('receipt', (receipt) => {
                                        console.log("status: "+receipt.status)
                                        console.log("txHash: "+receipt.transactionHash);
                                    if (receipt.status === true) {
                                        //getTransaction
                                        getTransaction(receipt.transactionHash)
                                    }
                                })
                                return signedHash
                            } else {
                                console.log("getReqAddrStatus status: "+status+", error: "+res3.Tip)
                                process.exit(1)
                            }
                        })
                    } else {
                        console.log("reqDcrmAddr status: "+status+", error: "+res2.Tip)
                        process.exit(1)
                    }
                })
    
            })
        } else {
            console.log("getReqAddrNonce status: "+status)
            process.exit(1)
        }
    })
}


function getTransaction(txHash) {
    console.log("getTransaction, txHash: "+txHash)
    web3.eth.getTransaction(txHash).then(console.log);
}

function getPrivkey(account_keystore, account_password) {
    console.log("getPrivkey")
    var kdata = fs.readFileSync(account_keystore, (err, data) => {
        if (err) throw err;
    });
    var keystore = kdata.toString();
    var pdata = fs.readFileSync(account_password, (err, data) => {
        if (err) throw err;
    });
    var passwd = pdata.toString();
    passwd = passwd.replace(/[\r\n]/g,"");
    
    var account = web3.eth.accounts.decrypt(keystore, passwd)
    
    var address_user = account["address"]
    console.log("account: "+address_user)
    var privateKey = new Buffer.from(account["privateKey"].substring(2), 'hex')
    return [address_user, privateKey]
}

function getAddressMPC(mpcPublicKey) {
    console.log("getAddressMPC")
    //recover from PublicKey
    var address_mpc = util.pubToAddress('0x'+mpcPublicKey, true)
    address_mpc = util.toChecksumAddress(address_mpc.toString('hex'))
    console.log('address_mpc: '+address_mpc)
    console.log("") // \n\r
    return address_mpc
}

// sleep
function sleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

function checkAddress4RSV(unsignedHash, Rsv) {
    //check RSV
    var vSigned = chainID * 2 + 35 + web3.utils.hexToNumber('0x'+Rsv.substring(128,130))
    var reAddress = web3.eth.accounts.recover({
        messageHash: unsignedHash,
        v: web3.utils.toHex(vSigned),
        r: '0x'+Rsv.substring(0,64),
        s: '0x'+Rsv.substring(64,128)
    })
    console.log("addressFromRSV: "+reAddress)
}

function checkAddress4SignedTx(signedTx) {
    //check signedTx
    var reAddress = web3.eth.accounts.recoverTransaction(signedTx)
    console.log("addressFromSigedTx: "+reAddress)
}

function getBalance(address_mpc) {
    //get balance
    web3.eth.getBalance(address_mpc).then(balance => {
        console.log('address_mpc: '+address_mpc+', banlance: '+balance)
    })
}
