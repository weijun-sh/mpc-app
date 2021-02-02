//npm install ethereumjs-tx@1.3.7

//------ var --------------------------------------------------------
var gas_limit = '100000'
var gas_price = '10' //gwei
var amount = '0.0'

//------ module -----------------------------------------------------
const ethTx = require('ethereumjs-tx'); //ethereumjs-tx@1.2
const Web3 = require('web3')
const fs = require('fs');

const url = 'https://rpc.smpc.network' //blockchain rpcport
const web3 = new Web3(url)
require('./config.js')

//------ function ---------------------------------------------------
//1 sendTransaction
var txHash = sendTransaction(account_keystore, account_password, address_to, custom_data)

//2 getTransaction
//function getTransaction(txHash)

//====== API ======================================================
function sendTransaction(account_keystore, account_password, address_to, custom_data) {
    var p = getPrivkey(account_keystore, account_password)
    var address_user = p[0]
    var privateKey = p[1]
    console.log("sendTransaction")
    web3.eth.getTransactionCount(address_user, (err, nonce) => {
        console.log("nonce: "+nonce)
        var rawTx = {
            nonce   : web3.utils.toHex(nonce),
            gasLimit: web3.utils.toHex(gas_limit),
            gasPrice: web3.utils.toHex(web3.utils.toWei(gas_price, 'gwei')),
            to      : address_to,
            value   : web3.utils.toHex(web3.utils.toWei(amount,'ether')), //'ether'
            data    : custom_data
        }
        console.log(rawTx)
    
        var tx = new ethTx(rawTx);
        tx.sign(privateKey);
    
        var serializedTx = tx.serialize();
        //console.log('0x' + serializedTx.toString('hex'))
        var signedHash = web3.utils.sha3(serializedTx)
        console.log("SignedTxHash:", signedHash)
        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
            .on('receipt', (receipt) => {
                console.log("txHash: "+receipt.transactionHash);
                console.log("status: "+receipt.status)
                if (receipt.status === true) {
                    web3.eth.getTransaction(receipt.transactionHash).then(console.log);
                }
            })
        return signedHash    
    })
}

function getTransaction(txHash) {
    console.log('getTransaction')
    web3.eth.getTransaction(txHash).then(console.log);
}

function getPrivkey(account_keystore, account_password) {
    console.log('getPrivkey')
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
    console.log("account: " + address_user)
    var privateKey = new Buffer.from(account["privateKey"].substring(2), 'hex')
    return [address_user, privateKey]
}
