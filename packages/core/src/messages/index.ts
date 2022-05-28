import type { MessageType } from '@protobuf-ts/runtime'

export * from './types'
export * from './bank'
export * from './staking'

// TODO: remove any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MsgDecoderRegistry = Map<string, MessageType<any>>

export const getMsgDecoderRegistry = async () => {
  const registry: MsgDecoderRegistry = new Map()

  const { MsgSend } = await import('@merjs/proto/cosmos/bank/v1beta1/tx')
  const { MsgGrant } = await import('@merjs/proto/cosmos/authz/v1beta1/tx')

  registry.set(`/${MsgGrant.typeName}`, MsgGrant)
  registry.set(`/${MsgSend.typeName}`, MsgSend)

  return Object.freeze(registry)
}
