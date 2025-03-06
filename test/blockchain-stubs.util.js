const txReceiptsStub = [
    // Non Bridge transactions
    {
        hash: '0x6547e88a30d1b43c6fbea07fa7443dfeb697d076495c3e4fc56ebf40228e0431',
        blockNumber: 1001,
        logs: [
            {
                data: '0x00000000000000000000000017f9fbb707fa50eb98d7ec32cfeda33d0924f1a1000000000000000000000000000000000000000000000b78141d4d3f296d0000000000000000000000000000f813c5dfe9602fb4b76ad71305788e9ca1649f310000000000000000000000000000000000000000000000000000000000221ac1',
                topics: [
                    '0x3a383add96d332943cbe603b4dc1055154e63668959b8d8517ae06c46be46218'
                ]
            }
        ],
        from: '0x4495768e683423a4299d6a7f02a0689a6ff5a0a4',
        to: '0x39192498fcf1dbe11653040bb49308e09a1056ac'
    },
    {
        hash: '0x7f6c029fba670f1ee14729e5531c672e813ac1ef4c86dec313b090119c14fa78',
        blockNumber: 1002,
        logs: [],
        from: '0x4495768e683423a4299d6a7f02a0689a6ff5a0a4',
        to: '0x39192498fcf1dbe11653040bb49308e09a1056ac'
    },
    {
        hash: '0x719715d6dc0617b6495d74aa4aa21b0755057ef6ad7cdcb71bdffcc2b3af4b24',
        blockNumber: 1003,
        logs: [
            {
                data: '0x00000000000000000000000090fb63563b8e425dd3419f85cd7581c42fbcd4cc000000000000000000000000000000000000000000000b78141d4d3f296d0000000000000000000000000000ff49426ee621fcf9928ffdbd163fbc13fa36f4650000000000000000000000000000000000000000000000000000000000221ac2',
                topics: [
                    '0x3a383add96d332943cbe603b4dc1055154e63668959b8d8517ae06c46be46218'
                ]
            }
        ],
        from: '0x6aff5f3d80744d84a4e4033b27de2ac1d6a49f34',
        to: '0x8bf2f24afbb9dbe4f2a54fd72748fc797bb91f81'
    },
    // Bridge transactions
    {
        hash: '0x112439355294e02096078c3b77cb12546fe79d284f46d478b3584873c2bacb8b',
        blockNumber: 1004,
        logs: [
            {
                data: '0x00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002c00000000000000000000000000000000000000000000000000000000000221b0000000000000000000000000000000000000000000000000000000000000000a5023f0283519167f1603ba92b060146baa054712b938a61f35605ba08773142f4da02afc230c2d355b1a577682b07bc2646041b5d0177af0f98395a46018da699b6da031174d64db12dc2dcdc8064a53a4981fa60f4ee649a954e01bcae221fc60777a20344a3c38cd59afcba3edcebe143e025574594b001700dec41e59409bdbd0f2a09039a060badbeb24bee49eb2063f616c0f0f0765d4ca646b20a88ce828f259fcdb90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000023324e31474d4238677848595235484c505352676639434a394c756e6a623943546e4b42000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a50208f40073a9e43b3e9103acec79767a6de9b0409749884e989960fee578012fce0225e892391625854128c5c4ea4340de0c2a70570f33db53426fc9c746597a03f402afc230c2d355b1a577682b07bc2646041b5d0177af0f98395a46018da699b6da0344a3c38cd59afcba3edcebe143e025574594b001700dec41e59409bdbd0f2a09039a060badbeb24bee49eb2063f616c0f0f0765d4ca646b20a88ce828f259fcdb90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000023324d77364b4d36343266626b7970547a626746693644546754465052575a55443442410000000000000000000000000000000000000000000000000000000000',
                topics: [
                    '0x5b9466a0b50d1cab12eeb0b3b5d387ece7659afcc56bb15704535e6954de8c4e'
                ]
            }
        ],
        from: '0xfe90f02331ddf62cb50f5650dca554b47b37c471',
        to: '0x0000000000000000000000000000000001000006'
    },
    {
        hash: '0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7',
        blockNumber: 1005,
        logs: [
            {
                data: '0x0000000000000000000000002cca2fd0357ea3d37dbf22aa1926073b0aef470e',
                topics: [
                    '0x1069152f4f916cbf155ee32a695d92258481944edb5b6fd649718fc1b43e515e'
                ]
            },
            {
                data: '0x000000000000000000000000000000000000000000000000000000000007a120',
                topics: [
                    '0x7a7c29481528ac8c2b2e93aee658fddd4dc15304fa723a5c2b88514557bcc790',
                    '0x95aacdc901a82814f387d0b2ecb70bbc8479947c7420baccff421873c7f9d061',
                    '0x4e89c19c81fa6d99a623108ff91d205ec09ef80cf45764390533018ba81935a9'
                ]
            },
            {
                data: '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000008fda8f7fe20a10700000000000000000000000000000000000000000000000000',
                topics: [
                    '0x9ee5d520fd5e6eaea3fd2e3ae4e35e9a9c0fb05c9d8f84b507f287da84b5117c',
                    '0x4e89c19c81fa6d99a623108ff91d205ec09ef80cf45764390533018ba81935a9'
                ]
            },
            {
                data: '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000020dde4dd54901569f5e0ca993f7158c676e02e61a550af73c5e83a95fcefde4671',
                topics: [
                    '0x483d0191cc4e784b04a41f6c4801a0766b43b1fdd0b9e3e6bfdca74e5b05c2eb',
                    '0x4e89c19c81fa6d99a623108ff91d205ec09ef80cf45764390533018ba81935a9'
                ]
            }
        ],
        from: '0xde7cfc6aa19c7ddea05bb50de9b4e1ff461b972f',
        to: '0x0000000000000000000000000000000001000006'
    },
    {
        hash: '0x7a3c39f59e1f2c624602c9b54c28155a251963ec878049c0f78a7d281b2e3b87',
        blockNumber: 1006,
        logs: [],
        to: '0x0000000000000000000000000000000001000006'
    }
]

const transactionsStub = [
    {
        hash: '0x6547e88a30d1b43c6fbea07fa7443dfeb697d076495c3e4fc56ebf40228e0431',
        data: ''
    },
    {
        hash: '0x112439355294e02096078c3b77cb12546fe79d284f46d478b3584873c2bacb8b',
        data: '0x1533330f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002046a7b0b12a6a01f08f738aca89682278e439c6f122febd0e8f86659f594f43ae'
    },
    {
        hash: '0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7',
        data: '0x0c5a9990'
    },
    {
        hash: '0x7a3c39f59e1f2c624602c9b54c28155a251963ec878049c0f78a7d281b2e3b87',
        data: '0xe5400e7b000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000005000000020072f3cd0fb1f55b05fc2022dfcffe2ab3f5f35eb661c22520b00000000000000ff3adfeb1f20aa198d665620a7d77e4d3d1ffdc44c1cbf8ca1ef13c9309d5a7bb1c36161ffff001dd6870fb600000000000000000000000000000000'
    }
]

const blocksStub = [
    {
        number: 1001,
        hash: '0x74cdc98cd3f98fa85cecc749ce832f9f89bfb5ed9aacccea8fc4aa1d2792ec35',
        transactions: [
            '0x112439355294e02096078c3b77cb12546fe79d284f46d478b3584873c2bacb8b', // Bridge transaction
            '0x6547e88a30d1b43c6fbea07fa7443dfeb697d076495c3e4fc56ebf40228e0431', // Not bridge transaction
            '0x7f6c029fba670f1ee14729e5531c672e813ac1ef4c86dec313b090119c14fa78', // Not bridge transaction
            '0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7' // Bridge transaction
        ],
        timestamp: 1683234772
    },
    {
        number: 1002,
        hash: '0xcdc8e7d4d5417ae5a36c6c246fa34df2ec0ebc9056055eeea401dc95e85e98f1',
        transactions: [
            '0x719715d6dc0617b6495d74aa4aa21b0755057ef6ad7cdcb71bdffcc2b3af4b24' // Not bridge transaction
        ],
        timestamp: 1688764372
    },
    {
        number: 1003,
        hash: '0x5f4da1a8bc0f04fd1bca304cbfca19bbf618307a8855bfd71841428a83474f20',
        transactions: [
            '0x7a3c39f59e1f2c624602c9b54c28155a251963ec878049c0f78a7d281b2e3b87' // Bridge transaction
        ],
        timestamp: 1694023972
    },
    {
        number: 1004,
        hash: '0x3c57396af7db18317efa29a3e4de1c4b66fe3f0e49b6236f62d30927d107d030',
        transactions: [
            '0x112439355294e02096078c3b77cb12546fe79d284f46d478b3584873c2bacb8b' // Bridge transaction
        ],
        timestamp: 1697289052
    },
    {
        number: 1005,
        hash: '0xa2ee5fddb10d16e9b1bf0e9e8afdf5cb4efd9e84d4d308ef4949da6068cd9d16',
        transactions: [
            '0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7', // Bridge transaction
            '0x6de85c65973ade9993a6f5c02603e979ac3c09dc18a3206421c2931d559b64ed' // Not bridge transaction
        ],
        timestamp: 1710421852
    },
    {
        number: 1006,
        hash: '0x3411a34eaf3c239595642db1225c34c137833672460d45afc4140e4d4aeaa390',
        transactions: [
            '0x7a3c39f59e1f2c624602c9b54c28155a251963ec878049c0f78a7d281b2e3b87', // Bridge transaction
            '0xfd9012ec6b585186fabb8b48e75dca559be5e197ea776139cbf35816914a2dfa' // Not bridge transaction
        ],
        timestamp: 1754170133
    }
]

const dataDecodedResults = [
    {
        data: '0x000000000000000000000000fe90f02331ddf62cb50f5650dca554b47b37c471',
        decoded: {
            sender: '0xfe90f02331ddf62cb50f5650dca554b47b37c471'
        }
    },
    {
        data: '0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002046a7b0b12a6a01f08f738aca89682278e439c6f122febd0e8f86659f594f43ae',
        decoded: {
            hash: '0x46a7b0b12a6a01f08f738aca89682278e439c6f122febd0e8f86659f594f43ae'
        }
    },
    {
        data: '000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000005000000020072f3cd0fb1f55b05fc2022dfcffe2ab3f5f35eb661c22520b00000000000000ff3adfeb1f20aa198d665620a7d77e4d3d1ffdc44c1cbf8ca1ef13c9309d5a7bb1c36161ffff001dd6870fb600000000000000000000000000000000',
        decoded: {
            blocks: [
                '0x00000020072f3cd0fb1f55b05fc2022dfcffe2ab3f5f35eb661c22520b00000000000000ff3adfeb1f20aa198d665620a7d77e4d3d1ffdc44c1cbf8ca1ef13c9309d5a7bb1c36161ffff001dd6870fb6'
            ]
        }
    },
    {
        data: '0x00000000000000000000000000000000000000000000000000000000000f6f9a',
        decoded: {
            amount: '1011610'
        }
    },
    {
        data: '0x00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002c00000000000000000000000000000000000000000000000000000000000221b0000000000000000000000000000000000000000000000000000000000000000a5023f0283519167f1603ba92b060146baa054712b938a61f35605ba08773142f4da02afc230c2d355b1a577682b07bc2646041b5d0177af0f98395a46018da699b6da031174d64db12dc2dcdc8064a53a4981fa60f4ee649a954e01bcae221fc60777a20344a3c38cd59afcba3edcebe143e025574594b001700dec41e59409bdbd0f2a09039a060badbeb24bee49eb2063f616c0f0f0765d4ca646b20a88ce828f259fcdb90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000023324e31474d4238677848595235484c505352676639434a394c756e6a623943546e4b42000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a50208f40073a9e43b3e9103acec79767a6de9b0409749884e989960fee578012fce0225e892391625854128c5c4ea4340de0c2a70570f33db53426fc9c746597a03f402afc230c2d355b1a577682b07bc2646041b5d0177af0f98395a46018da699b6da0344a3c38cd59afcba3edcebe143e025574594b001700dec41e59409bdbd0f2a09039a060badbeb24bee49eb2063f616c0f0f0765d4ca646b20a88ce828f259fcdb90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000023324d77364b4d36343266626b7970547a626746693644546754465052575a55443442410000000000000000000000000000000000000000000000000000000000',
        decoded: {
            oldFederationBtcPublicKeys: '0x023f0283519167f1603ba92b060146baa054712b938a61f35605ba08773142f4da02afc230c2d355b1a577682b07bc2646041b5d0177af0f98395a46018da699b6da031174d64db12dc2dcdc8064a53a4981fa60f4ee649a954e01bcae221fc60777a20344a3c38cd59afcba3edcebe143e025574594b001700dec41e59409bdbd0f2a09039a060badbeb24bee49eb2063f616c0f0f0765d4ca646b20a88ce828f259fcdb9',
            oldFederationBtcAddress: '2N1GMB8gxHYR5HLPSRgf9CJ9Lunjb9CTnKB',
            newFederationBtcPublicKeys: '0x0208f40073a9e43b3e9103acec79767a6de9b0409749884e989960fee578012fce0225e892391625854128c5c4ea4340de0c2a70570f33db53426fc9c746597a03f402afc230c2d355b1a577682b07bc2646041b5d0177af0f98395a46018da699b6da0344a3c38cd59afcba3edcebe143e025574594b001700dec41e59409bdbd0f2a09039a060badbeb24bee49eb2063f616c0f0f0765d4ca646b20a88ce828f259fcdb9',
            newFederationBtcAddress: '2Mw6KM642fbkypTzbgFi6DTgTFPRWZUD4BA',
            activationHeight: '2235136'
        }
    },
    {
        data: '0x6b735fe7af1819082404d3d05133ceaba3ebfc400cdfd621261285e6b092371f',
        decoded: '0x6b735fe7af1819082404d3d05133ceaba3ebfc400cdfd621261285e6b092371f'
    },
    {
        data: '0x7cbbf9d911d8e76b2a3a4b02a430b39b0b5c3b95f3ee2ca5df1483980d960e0b',
        decoded: '0x7cbbf9d911d8e76b2a3a4b02a430b39b0b5c3b95f3ee2ca5df1483980d960e0b'
    },
    {
        data: '0x0000000000000000000000000000000000000000000000000000000000000040',
        decoded: {
            btcDestinationAddress: 'mhmWxtqj4oAgLkkyZs3impteLcn7csDuMq',
            amount: '1000000'
        }
    },
    {
        data: '0x00000000000000000000000075d7b75612ed7a0edc70ceced86a9701e8d07d6a',
        decoded: '0x75d7B75612Ed7A0eDc70ceCED86A9701E8D07D6a'
    }
];

module.exports = {
    txReceiptsStub,
    transactionsStub,
    blocksStub,
    dataDecodedResults
}