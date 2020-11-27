//---!!! DO NOT CHANGE !!!-----------------------------------------
const Web3 = require('web3')

const url_mpc = 'https://mpcapi.smpc.network' //mpc rpcport
global.url = 'https://rpc.smpc.network' //blockchain rpcport
global.chainID = '202011'
global.address_to_mpc = '0x00000000000000000000000000000000000000dc' //mpc address
global.group_ID = '8d70867f3a73df81ce2eb99577c81739de695443b5bdd811ed1adaf3ac0799d118513b55aaf5aa20ae5349fe3a3d656b82db28286946b36678b094b044ddb5ab' //GroupID
global.TxType = 'SIGN'
global.Keytype = 'ECDSA'
global.ThresHold = '2/3'
global.Mode = '1'

let web3_mpc = new Web3(url_mpc)

const reqAddr = [
  {
    name: 'getReqAddrNonce',
    call: 'dcrm_getReqAddrNonce',
    params: 1,
    inputFormatter: [null],
    outputFormatter: null
  },
  {
    name: 'reqDcrmAddr',
    call: 'dcrm_reqDcrmAddr',
    params: 1,
    inputFormatter: [null],
    outputFormatter: null
  },
  {
    name: 'getReqAddrStatus',
    call: 'dcrm_getReqAddrStatus',
    params: 1,
    inputFormatter: [null],
    outputFormatter: null
  },
]

const signs = [
  {
    name: 'sign',
    call: 'dcrm_sign',
    params: 1,
    inputFormatter: [null],
    outputFormatter: null
  },
  {
    name: 'getSignNonce',
    call: 'dcrm_getSignNonce',
    params: 1,
    inputFormatter: [null],
    outputFormatter: null
  },
  {
    name: 'getSignStatus',
    call: 'dcrm_getSignStatus',
    params: 1,
    inputFormatter: [null],
    outputFormatter: null
  },
]


web3_mpc.extend({
  property: 'mpc',
  methods: [
    ...reqAddr,
    ...signs
  ]
})

module.exports=web3_mpc;

