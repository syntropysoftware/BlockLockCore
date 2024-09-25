/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/blocklockcore.json`.
 */
export type Blocklockcore = {
  "address": "36c5ZN4fq7qm13PyEAP4X7er1ZRgzik9SyvajxDLiAQH",
  "metadata": {
    "name": "blocklockcore",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created by David DeMayo with BlockLock"
  },
  "instructions": [
    {
      "name": "lockTokens",
      "discriminator": [
        136,
        11,
        32,
        232,
        161,
        117,
        54,
        211
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unlockTokens",
      "discriminator": [
        233,
        35,
        95,
        159,
        37,
        185,
        47,
        88
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "owner",
          "relations": [
            "vault"
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "lockNotExpired",
      "msg": "The lock period has not expired yet"
    },
    {
      "code": 6001,
      "name": "invalidOwner",
      "msg": "Invalid owner"
    }
  ],
  "types": [
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "lockTime",
            "type": "i64"
          },
          {
            "name": "owner",
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};
