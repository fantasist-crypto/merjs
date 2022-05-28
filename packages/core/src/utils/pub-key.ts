import { fromBase64, toBase64 } from '@cosmjs/encoding'
import type { Any } from '@merjs/proto/google/protobuf/any'
import type { LegacyAminoPubKey } from '@merjs/proto/cosmos/crypto/multisig/keys'
import type { PubKey as Secp256k1PubKeyPB } from '@merjs/proto/cosmos/crypto/secp256k1/keys'
import type { PubKey as EthSecp256k1PubKeyPB } from '@merjs/proto/ethermint/crypto/v1/ethsecp256k1/keys'

export interface PubKey {
  readonly type: typeof PubKeyType[keyof typeof PubKeyType]
  readonly value: unknown
}

export const PubKeyType = {
  EthSecp256k1: 'ethermint/PubKeyEthSecp256k1' as const,
  Secp256k1: 'tendermint/PubKeySecp256k1' as const,
  Ed25519: 'tendermint/PubKeyEd25519' as const,
  Sr25519: 'tendermint/PubKeySr25519' as const,
  MultisigThreshold: 'tendermint/PubKeyMultisigThreshold' as const,
}

export interface SinglePubKey extends PubKey {
  readonly type:
    | typeof PubKeyType.EthSecp256k1
    | typeof PubKeyType.Secp256k1
    | typeof PubKeyType.Ed25519
    | typeof PubKeyType.Sr25519
  /**
   * The base64 encoding of the Amino binary encoded public key.
   */
  readonly value: string
}

export interface EthSecp256k1PubKey extends SinglePubKey {
  readonly type: 'ethermint/PubKeyEthSecp256k1'
  readonly value: string
}

export interface Secp256k1PubKey extends SinglePubKey {
  readonly type: 'tendermint/PubKeySecp256k1'
  readonly value: string
}

export interface Ed25519PubKey extends SinglePubKey {
  readonly type: 'tendermint/PubKeyEd25519'
  readonly value: string
}

export interface MultisigThresholdPubKey extends PubKey {
  readonly type: 'tendermint/PubKeyMultisigThreshold'
  readonly value: {
    /** A string-encoded integer */
    readonly threshold: string
    readonly pubKeys: readonly SinglePubKey[]
  }
}

export function encodeEthSecp256k1PubKey(
  pubKey: Uint8Array,
): EthSecp256k1PubKey {
  if (pubKey.length !== 33 || (pubKey[0] !== 0x02 && pubKey[0] !== 0x03)) {
    throw new Error(
      'Public key must be compressed secp256k1, i.e. 33 bytes starting with 0x02 or 0x03',
    )
  }
  return {
    type: 'ethermint/PubKeyEthSecp256k1',
    value: toBase64(pubKey),
  }
}

export function encodeSecp256k1PubKey(pubKey: Uint8Array): Secp256k1PubKey {
  if (pubKey.length !== 33 || (pubKey[0] !== 0x02 && pubKey[0] !== 0x03)) {
    throw new Error(
      'Public key must be compressed secp256k1, i.e. 33 bytes starting with 0x02 or 0x03',
    )
  }
  return {
    type: PubKeyType.Secp256k1,
    value: toBase64(pubKey),
  }
}

export function encodeEd25519PubKey(pubKey: Uint8Array): Ed25519PubKey {
  if (pubKey.length !== 32) {
    throw new Error('Public key must be compressed Ed25519, i.e. 32 bytes')
  }
  return {
    type: 'tendermint/PubKeyEd25519',
    value: toBase64(pubKey),
  }
}

export async function encodePubKey(pubKey: PubKey): Promise<Any> {
  if (isSecp256k1PubKey(pubKey)) {
    const pubKeyProto: Secp256k1PubKeyPB = {
      key: fromBase64(pubKey.value),
    }
    return {
      typeUrl: '/cosmos.crypto.secp256k1.PubKey',
      value: Uint8Array.from(
        (
          await import('@merjs/proto/cosmos/crypto/secp256k1/keys')
        ).PubKey.toBinary(pubKeyProto),
      ),
    }
  } else if (isEthSecp256k1PubKey(pubKey)) {
    const pubKeyProto: EthSecp256k1PubKeyPB = {
      key: fromBase64(pubKey.value),
    }
    return {
      typeUrl: '/ethermint.crypto.v1.ethsecp256k1.PubKey',
      value: (
        await import('@merjs/proto/cosmos/crypto/secp256k1/keys')
      ).PubKey.toBinary(pubKeyProto),
    }
  } else if (isMultisigThresholdPubKey(pubKey)) {
    const { LegacyAminoPubKey } = await import(
      '@merjs/proto/cosmos/crypto/multisig/keys'
    )

    const pubKeyProto: LegacyAminoPubKey = {
      threshold: Number(pubKey.value.threshold),
      publicKeys: await Promise.all(pubKey.value.pubKeys.map(encodePubKey)),
    }
    return {
      typeUrl: '/cosmos.crypto.multisig.LegacyAminoPubKey',
      value: Uint8Array.from(LegacyAminoPubKey.toBinary(pubKeyProto)),
    }
  } else {
    throw new Error(`Public key type ${pubKey.type} not recognized`)
  }
}

async function decodeSinglePubKey(pubKey: Any): Promise<SinglePubKey> {
  switch (pubKey.typeUrl) {
    case '/cosmos.crypto.secp256k1.PubKey': {
      const { key } = (
        await import('@merjs/proto/cosmos/crypto/secp256k1/keys')
      ).PubKey.fromBinary(pubKey.value)
      return encodeSecp256k1PubKey(key)
    }
    case '/cosmos.crypto.ed25519.PubKey': {
      const { key } = (
        await import('@merjs/proto/ethermint/crypto/v1/ethsecp256k1/keys')
      ).PubKey.fromBinary(pubKey.value)
      return encodeEd25519PubKey(key)
    }
    default:
      throw new Error(
        `PubKey type_url ${pubKey.typeUrl} not recognized as single public key type`,
      )
  }
}

export async function decodePubKey(
  pubKey?: Any | null,
): Promise<SinglePubKey | MultisigThresholdPubKey | null> {
  if (!pubKey || !pubKey.value) {
    return null
  }

  switch (pubKey.typeUrl) {
    case '/cosmos.crypto.secp256k1.PubKey':
    case '/cosmos.crypto.ed25519.PubKey': {
      return decodeSinglePubKey(pubKey)
    }
    case '/cosmos.crypto.multisig.LegacyAminoPubKey': {
      const { LegacyAminoPubKey } = await import(
        '@merjs/proto/cosmos/crypto/multisig/keys'
      )

      const { threshold, publicKeys } = LegacyAminoPubKey.fromBinary(
        pubKey.value,
      )
      return {
        type: 'tendermint/PubKeyMultisigThreshold',
        value: {
          threshold: threshold.toString(),
          pubKeys: await Promise.all(publicKeys.map(decodeSinglePubKey)),
        },
      }
    }
    default:
      throw new Error(`PubKey type_url ${pubKey.typeUrl} not recognized`)
  }
}

function isSecp256k1PubKey(pubKey: PubKey): pubKey is Secp256k1PubKey {
  return pubKey.type === 'tendermint/PubKeySecp256k1'
}

function isEthSecp256k1PubKey(pubKey: PubKey): pubKey is EthSecp256k1PubKey {
  return pubKey.type === 'ethermint/PubKeyEthSecp256k1'
}

function isMultisigThresholdPubKey(
  pubKey: PubKey,
): pubKey is MultisigThresholdPubKey {
  return pubKey.type === 'tendermint/PubKeyMultisigThreshold'
}
