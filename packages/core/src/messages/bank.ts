import {
  AminoMsg,
  Coin,
  Input,
  Msg,
  MsgParams,
  Output,
  ProtoMsg,
} from './types'

export interface MsgSendParams extends MsgParams {
  fromAddress: string
  toAddress: string
  amount: Coin[]
}

export class MsgSend implements Msg {
  public fromAddress: string
  public toAddress: string
  public amount: Coin[]

  constructor({ fromAddress, toAddress, amount }: MsgSendParams) {
    this.fromAddress = fromAddress
    this.toAddress = toAddress
    this.amount = amount
  }

  public async toProto(): Promise<ProtoMsg> {
    const msgContent = {
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      amount: this.amount,
    }

    return {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: msgContent,
      encode: async () =>
        (
          await import('@merjs/proto/cosmos/bank/v1beta1/tx')
        ).MsgSend.toBinary(msgContent),
    }
  }

  public async toAmino(): Promise<AminoMsg> {
    return {
      type: 'cosmos-sdk/MsgSend',
      value: {
        from_address: this.fromAddress,
        to_address: this.toAddress,
        amount: this.amount,
      },
    }
  }
}

export interface MsgMultiSendParams extends MsgParams {
  inputs: Input[]
  outputs: Output[]
}

/** MsgMultiSend represents an arbitrary multi-in, multi-out send message. */
export class MsgMultiSend implements Msg {
  public inputs: Input[]
  public outputs: Output[]

  constructor({ inputs, outputs }: MsgMultiSendParams) {
    this.inputs = inputs
    this.outputs = outputs
  }

  async toProto(): Promise<ProtoMsg> {
    const msgContent = {
      inputs: this.inputs,
      outputs: this.outputs,
    }

    return {
      typeUrl: '/cosmos.bank.v1beta1.MsgMultiSend',
      value: msgContent,
      encode: async () =>
        (
          await import('@merjs/proto/cosmos/bank/v1beta1/tx')
        ).MsgMultiSend.toBinary(msgContent),
    }
  }

  async toAmino(): Promise<AminoMsg> {
    return {
      type: 'cosmos-sdk/MsgMultiSend',
      value: {
        inputs: this.inputs,
        outputs: this.outputs,
      },
    }
  }
}
