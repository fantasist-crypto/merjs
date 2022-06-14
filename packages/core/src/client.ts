import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport'
import { AccountData, StdFee, StdSignDoc } from '@cosmjs/amino'
import { fromBase64, fromHex } from '@cosmjs/encoding'

import type { IServiceClient } from '@merjs/proto/cosmos/tx/v1beta1/service.client'
import type { SimulateResponse } from '@merjs/proto/cosmos/tx/v1beta1/service'
import type {
  SignDoc,
  SignerInfo,
  TxRaw,
} from '@merjs/proto/cosmos/tx/v1beta1/tx'
import type { EthAccount } from '@merjs/proto/ethermint/types/v1/account'
import type { SignMode } from '@merjs/proto/cosmos/tx/signing/v1beta1/signing'
import type { BaseAccount } from '@merjs/proto/cosmos/auth/v1beta1/auth'
import type { Any } from '@merjs/proto/google/protobuf/any'

import {
  AminoMsg,
  Coin,
  getMsgDecoderRegistry,
  Msg,
  MsgBeginRedelegate,
  MsgCreateValidator,
  MsgDecoderRegistry,
  MsgDelegate,
  MsgEditValidator,
  MsgMultiSend,
  MsgParams,
  MsgSend,
  MsgUndelegate,
  ProtoMsg,
} from './messages'
import {
  ArrayLog,
  BroadcastMode,
  JsonLog,
  SignerData,
  SingleMsgTx,
  Tx,
  TxOptions,
  TxSender,
} from './tx'
import { getQuerier, Querier } from './query'
import { isOfflineDirectSigner, OfflineSigner, ReadonlySigner } from './signer'
import { accountFromAny, encodeEthSecp256k1PubKey, encodePubKey } from './utils'

export interface CreateOptions {
  /** A gRPC-web url, by default on port 9091 */
  grpcWebUrl: string

  /** A signer for signing transaction & permits. */
  signer?: OfflineSigner

  /** The chain id is used in encryption code & when signing txs. */
  chainId: string

  /** Address is the specific account address in the wallet that is permitted to sign transactions & permits. */
  address?: string
}

export class MerlionClient {
  public readonly tx: TxSender

  private readonly signer: OfflineSigner
  private readonly chainId: string
  private readonly address: string

  static async create(options: CreateOptions) {
    const transport = new GrpcWebFetchTransport({
      baseUrl: options.grpcWebUrl,
    })

    const query = await getQuerier(transport)

    const txService = new (
      await import('@merjs/proto/cosmos/tx/v1beta1/service.client')
    ).ServiceClient(transport)

    const msgDecoderRegistry = await getMsgDecoderRegistry()

    return new MerlionClient(query, txService, msgDecoderRegistry, options)
  }

  private constructor(
    public readonly query: Querier,
    private readonly txService: IServiceClient,
    private msgDecoderRegistry: MsgDecoderRegistry,
    options: CreateOptions,
  ) {
    this.signer = options.signer ?? new ReadonlySigner()
    this.chainId = options.chainId
    this.address = options.address ?? ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doMsg = (msgClass: any): SingleMsgTx<any> => {
      const func = (params: MsgParams, options?: TxOptions) => {
        return this.tx.broadcast([new msgClass(params)], options)
      }
      func.simulate = (params: MsgParams, options?: TxOptions) => {
        return this.tx.simulate([new msgClass(params)], options)
      }

      return func
    }

    this.tx = {
      simulate: this.simulate.bind(this),
      broadcast: this.signAndBroadcast.bind(this),
      bank: {
        multiSend: doMsg(MsgMultiSend),
        send: doMsg(MsgSend),
      },
      staking: {
        createValidator: doMsg(MsgCreateValidator),
        editValidator: doMsg(MsgEditValidator),
        delegate: doMsg(MsgDelegate),
        beginRedelegate: doMsg(MsgBeginRedelegate),
        undelegate: doMsg(MsgUndelegate),
      },
    }
  }

  private async simulate(
    messages: Msg[],
    txOptions?: TxOptions,
  ): Promise<SimulateResponse> {
    const txBytes = await this.prepareAndSign(messages, txOptions)
    const { response } = await this.txService.simulate({ txBytes })
    return response
  }

  private async signAndBroadcast(
    messages: Msg[],
    txOptions?: TxOptions,
  ): Promise<Tx> {
    const waitForCommit = txOptions?.waitForCommit ?? true
    const broadcastTimeoutMs = txOptions?.broadcastTimeoutMs ?? 60_000
    const broadcastCheckIntervalMs =
      txOptions?.broadcastCheckIntervalMs ?? 6_000
    const broadcastMode = txOptions?.broadcastMode ?? BroadcastMode.Sync

    const txBytes = await this.prepareAndSign(messages, txOptions)

    return this.broadcastTx(
      txBytes,
      broadcastTimeoutMs,
      broadcastCheckIntervalMs,
      broadcastMode,
      waitForCommit,
    )
  }

  private async prepareAndSign(
    messages: Msg[],
    txOptions: TxOptions = {},
  ): Promise<Uint8Array> {
    const {
      gasLimit = 500_000, // TODO
      gasPriceInFeeDenom = 0.25, // TODO
      feeDenom = 'alion', // TODO
      memo = '',
      explicitSignerData,
    } = txOptions
    const txRaw = await this.sign(
      messages,
      {
        gas: String(gasLimit),
        amount: [
          {
            amount: String(gasToFee(gasLimit, gasPriceInFeeDenom)),
            denom: feeDenom,
          },
        ],
      },
      memo,
      explicitSignerData,
    )

    const { TxRaw } = await import('@merjs/proto/cosmos/tx/v1beta1/tx')

    return TxRaw.toBinary(txRaw)
  }

  /**
   * Gets account number and sequence from the API, creates a sign doc,
   * creates a single signature and assembles the signed transaction.
   *
   * The sign mode (SIGN_MODE_DIRECT or SIGN_MODE_LEGACY_AMINO_JSON) is determined by this client's signer.
   *
   * You can pass signer data (account number, sequence and chain ID) explicitly instead of querying them
   * from the chain. This is needed when signing for a multisig account, but it also allows for offline signing
   * (See the SigningStargateClient.offline constructor).
   */
  private async sign(
    messages: Msg[],
    fee: StdFee,
    memo: string,
    explicitSignerData?: SignerData,
  ): Promise<TxRaw> {
    const accountFromSigner = (await this.signer.getAccounts()).find(
      (account) => account.address === this.address,
    )
    if (!accountFromSigner) {
      throw new Error('Failed to retrieve account from signer')
    }

    let signerData: SignerData
    if (explicitSignerData) {
      signerData = explicitSignerData
    } else {
      const { response } = await this.query.auth.account({
        address: this.address,
      })

      if (!response.account) {
        throw new Error(
          `Cannot find account "${this.address}", make sure it has a balance.`,
        )
      }

      const account = await accountFromAny(response.account)

      if (account.type !== 'EthAccount' && account.type !== 'BaseAccount') {
        throw new Error(
          `Cannot sign with account of type "${account.type}", can only sign with "EthAccount" and "BaseAccount".`,
        )
      }

      if (account.type === 'EthAccount') {
        const ethAccount = account.account as EthAccount
        signerData = {
          accountNumber: Number(ethAccount.baseAccount?.accountNumber),
          sequence: Number(ethAccount.baseAccount?.sequence),
          chainId: this.chainId,
        }
      }

      signerData = {
        accountNumber: Number((account.account as BaseAccount).accountNumber),
        sequence: Number((account.account as BaseAccount).sequence),
        chainId: this.chainId,
      }
    }

    return isOfflineDirectSigner(this.signer)
      ? this.signDirect(accountFromSigner, messages, fee, memo, signerData)
      : this.signAmino(accountFromSigner, messages, fee, memo, signerData)
  }

  private async signAmino(
    account: AccountData,
    messages: Msg[],
    fee: StdFee,
    memo: string,
    { accountNumber, sequence, chainId }: SignerData,
  ): Promise<TxRaw> {
    if (isOfflineDirectSigner(this.signer)) {
      throw new Error('Wrong signer type! Expected AminoSigner.')
    }

    const signMode = 127 // SignMode.LEGACY_AMINO_JSON
    const msgs = await Promise.all(messages.map((msg) => msg.toAmino()))
    const signDoc = makeSignDocAmino(
      msgs,
      fee,
      chainId,
      memo,
      accountNumber,
      sequence,
    )
    const { signature, signed } = await this.signer.signAmino(
      account.address,
      signDoc,
    )
    const txBody = {
      typeUrl: '/cosmos.message.v1beta1.TxBody',
      value: {
        messages: await Promise.all(messages.map((msg) => msg.toProto())),
        memo: memo,
      },
    }
    const txBodyBytes = await this.encodeTx(txBody)
    const signedGasLimit = Number(signed.fee.gas)
    const signedSequence = Number(signed.sequence)
    const pubKey = await encodePubKey(encodeEthSecp256k1PubKey(account.pubkey))
    const signedAuthInfoBytes = await makeAuthInfoBytes(
      [{ pubKey, sequence: signedSequence }],
      signed.fee.amount,
      signedGasLimit,
      signMode,
    )
    return {
      bodyBytes: txBodyBytes,
      authInfoBytes: signedAuthInfoBytes,
      signatures: [fromBase64(signature.signature)],
    }
  }

  private async encodeTx(txBody: {
    typeUrl: string
    value: {
      messages: ProtoMsg[]
      memo: string
    }
  }): Promise<Uint8Array> {
    const memo = txBody.value.memo

    const { Any } = await import('@merjs/proto/google/protobuf/any')
    const messages = await Promise.all(
      txBody.value.messages.map(async (message) =>
        Any.create({
          typeUrl: message.typeUrl,
          value: await message.encode(),
        }),
      ),
    )

    const { TxBody } = await import('@merjs/proto/cosmos/tx/v1beta1/tx')

    return TxBody.toBinary(TxBody.create({ memo, messages }))
  }

  private async signDirect(
    account: AccountData,
    messages: Msg[],
    fee: StdFee,
    memo: string,
    { accountNumber, sequence, chainId }: SignerData,
  ): Promise<TxRaw> {
    if (!isOfflineDirectSigner(this.signer)) {
      throw new Error('Wrong signer type! Expected DirectSigner.')
    }

    const txBody = {
      typeUrl: '/cosmos.message.v1beta1.TxBody',
      value: {
        messages: await Promise.all(messages.map((msg) => msg.toProto())),
        memo: memo,
      },
    }
    const txBodyBytes = await this.encodeTx(txBody)
    const pubKey = await encodePubKey(encodeEthSecp256k1PubKey(account.pubkey))
    const gasLimit = Number(fee.gas)
    const authInfoBytes = await makeAuthInfoBytes(
      [{ pubKey, sequence }],
      fee.amount,
      gasLimit,
    )
    const signDoc = makeSignDocProto(
      txBodyBytes,
      authInfoBytes,
      chainId,
      accountNumber,
    )
    const { signature, signed } = await this.signer.signDirect(
      account.address,
      signDoc,
    )
    return {
      bodyBytes: signed.bodyBytes,
      authInfoBytes: signed.authInfoBytes,
      signatures: [fromBase64(signature.signature)],
    }
  }

  /**
   * Broadcasts a signed transaction to the network and monitors its inclusion in a block.
   *
   * If broadcasting is rejected by the node for some reason (e.g. because of a CheckTx failure),
   * an error is thrown.
   *
   * If the transaction is not included in a block before the provided timeout, these errors with a `TimeoutError`.
   *
   * If the transaction is included in a block, a {@link Tx} is returned. The caller then
   * usually needs to check for execution success or failure.
   */
  private async broadcastTx(
    tx: Uint8Array,
    timeoutMs: number,
    checkIntervalMs: number,
    mode: BroadcastMode,
    waitForCommit: boolean,
  ): Promise<Tx> {
    const start = Date.now()

    let txHash: string

    if (mode === BroadcastMode.Sync) {
      const {
        response: { txResponse },
      } = await this.txService.broadcastTx({
        txBytes: tx,
        mode: 2, // BroadcastModePB.SYNC
      })
      if (isUndefined(txResponse) || txResponse.code) {
        throw new Error(
          `Broadcasting transaction failed with code ${txResponse?.code} (codespace: ${txResponse?.codespace}). Log: ${txResponse?.rawLog}`,
        )
      }
      txHash = txResponse.txhash
    } else if (mode === BroadcastMode.Async) {
      const {
        response: { txResponse },
      } = await this.txService.broadcastTx({
        txBytes: tx,
        mode: 3, // BroadcastModePB.ASYNC,
      })
      if (isUndefined(txResponse)) throw new Error() // TODO
      txHash = txResponse.txhash
    } else {
      throw new Error(
        `Unknown broadcast mode "${String(mode)}", must be either "${String(
          BroadcastMode.Sync,
        )}" or "${String(BroadcastMode.Async)}".`,
      )
    }

    if (!waitForCommit) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return { transactionHash: txHash }
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // sleep first because there's no point in checking right after broadcasting
      await new Promise((r) => setTimeout(r, checkIntervalMs))

      const result = await this.getTx(txHash)

      if (result) return result

      if (start + timeoutMs < Date.now()) {
        throw new Error(
          `Transaction ID ${txHash} was submitted but was not yet found on the chain. You might want to check later.`,
        )
      }
    }
  }

  public async getTx(hash: string): Promise<Tx | null> {
    const results = await this.txsQuery(`tx.hash='${hash}'`)
    return results[0] ?? null
  }

  private async txsQuery(query: string): Promise<Tx[]> {
    const { GetTxsEventRequest } = await import(
      '@merjs/proto/cosmos/tx/v1beta1/service'
    )

    const request = GetTxsEventRequest.create({
      events: query.split(' AND ').map((q) => q.trim()),
    })
    const { response } = await this.txService.getTxsEvent(request)

    return await Promise.all(
      response.txResponses.map(async (tx) => {
        const rawLog: string = tx.rawLog
        let jsonLog: JsonLog | undefined
        let arrayLog: ArrayLog | undefined
        if (tx.code === 0 && rawLog !== '') {
          jsonLog = JSON.parse(rawLog) as JsonLog

          arrayLog = []
          for (let msgIndex = 0; msgIndex < jsonLog.length; msgIndex++) {
            if (jsonLog[msgIndex].msg_index === undefined) {
              jsonLog[msgIndex].msg_index = msgIndex
              // See https://github.com/cosmos/cosmos-sdk/pull/11147
            }

            const log = jsonLog[msgIndex]
            for (const event of log.events) {
              for (const attr of event.attributes) {
                // Try to decrypt
                if (event.type === 'wasm') {
                  // TODO
                }

                arrayLog.push({
                  msg: msgIndex,
                  type: event.type,
                  key: attr.key,
                  value: attr.value,
                })
              }
            }
          }
        } else if (tx.code !== 0 && rawLog !== '') {
          try {
            const errorMessageRgx =
              /; message index: (\d+): encrypted: (.+?): (?:instantiate|execute|query) contract failed/g
            const rgxMatches = errorMessageRgx.exec(rawLog)
            if (rgxMatches?.length === 3) {
              try {
                // eslint-disable-next-line no-empty
              } catch (e) {}
            }
          } catch (decryptionError) {
            // Not encrypted or can't decrypt because not original sender
          }
        }

        const { TxMsgData } = await import(
          '@merjs/proto/cosmos/base/abci/v1beta1/abci'
        )

        const txMsgData = TxMsgData.fromBinary(fromHex(tx.data))
        const data = new Array<Uint8Array>(txMsgData.data.length)

        if (isUndefined(tx.tx)) throw new Error('') // TODO

        // Decode input messages
        const decodedTx = (
          await import('@merjs/proto/cosmos/tx/v1beta1/tx')
        ).Tx.fromBinary(tx.tx.value)

        if (isUndefined(decodedTx.body)) throw new Error('') // TODO
        for (let i = 0; i < decodedTx.body.messages.length; i++) {
          const { typeUrl, value: msgBytes } = decodedTx.body.messages[i]
          const msgDecoder = this.msgDecoderRegistry.get(typeUrl.slice(1))
          if (!msgDecoder) continue

          decodedTx.body.messages[i] = {
            typeUrl,
            value: msgDecoder.fromBinary(msgBytes),
          }
        }

        return {
          height: Number(tx.height),
          transactionHash: tx.txhash,
          code: tx.code,
          tx: decodedTx,
          txBytes: tx.tx.value,
          rawLog,
          jsonLog,
          arrayLog,
          data,
          gasUsed: Number(tx.gasUsed),
          gasWanted: Number(tx.gasWanted),
        }
      }),
    )
  }
}

function makeSignDocProto(
  bodyBytes: Uint8Array,
  authInfoBytes: Uint8Array,
  chainId: string,
  accountNumber: number,
): SignDoc {
  return {
    bodyBytes: bodyBytes,
    authInfoBytes: authInfoBytes,
    chainId: chainId,
    accountNumber: String(accountNumber),
  }
}

/**
 * Creates and serializes an AuthInfo document.
 *
 * This implementation does not support different signing modes for the different signers.
 */
async function makeAuthInfoBytes(
  signers: ReadonlyArray<{
    readonly pubKey: Any
    readonly sequence: number
  }>,
  feeAmount: readonly Coin[],
  gasLimit: number,
  signMode = 1, // SignMode.DIRECT
): Promise<Uint8Array> {
  const { AuthInfo } = await import('@merjs/proto/cosmos/tx/v1beta1/tx')

  return AuthInfo.toBinary(
    AuthInfo.create({
      signerInfos: await makeSignerInfos(signers, signMode),
      fee: {
        amount: [...feeAmount],
        gasLimit: String(gasLimit),
      },
    }),
  )
}

/**
 * Create signer infos from the provided signers.
 *
 * This implementation does not support different signing modes for the different signers.
 */
async function makeSignerInfos(
  signers: ReadonlyArray<{
    readonly pubKey: Any
    readonly sequence: number
  }>,
  signMode: SignMode,
): Promise<SignerInfo[]> {
  const { SignerInfo } = await import('@merjs/proto/cosmos/tx/v1beta1/tx')

  return signers.map(({ pubKey, sequence }) =>
    SignerInfo.create({
      publicKey: pubKey,
      modeInfo: {
        sum: {
          oneofKind: 'single',
          single: { mode: signMode },
        },
      },
      sequence: String(sequence),
    }),
  )
}

function makeSignDocAmino(
  msgs: readonly AminoMsg[],
  fee: StdFee,
  chainId: string,
  memo: string | undefined,
  accountNumber: number | string,
  sequence: number | string,
): StdSignDoc {
  return {
    chain_id: chainId,
    account_number: String(accountNumber),
    sequence: String(sequence),
    fee: fee,
    msgs: msgs,
    memo: memo || '',
  }
}

function gasToFee(gasLimit: number, gasPrice: number): number {
  return Math.ceil(gasLimit * gasPrice)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isUndefined(value: any): value is undefined {
  return value === undefined
}
