import type { SimulateResponse } from '@merjs/proto/cosmos/tx/v1beta1/service'
import type {
  AuthInfo,
  Tx as CosmosTx,
} from '@merjs/proto/cosmos/tx/v1beta1/tx'
import type { Any } from '@merjs/proto/google/protobuf/any'

import type {
  Msg,
  MsgBeginRedelegateParams,
  MsgCreateValidatorParams,
  MsgDelegateParams,
  MsgEditValidatorParams,
  MsgMultiSendParams,
  MsgSendParams,
  MsgUndelegateParams,
} from './messages'

/**
 * SingleMsgTx is a function that broadcasts a single messages transaction.
 * It also has a `simulate()` method to execute the transaction without
 * committing it on-chain. This is helpful for gas estimation.
 */
export type SingleMsgTx<T> = {
  (params: T, txOptions?: TxOptions): Promise<Tx>
  simulate(params: T, txOptions?: TxOptions): Promise<SimulateResponse>
}

export type ArrayLog = Array<{
  msg: number
  type: string
  key: string
  value: string
}>

export type JsonLog = Array<{
  msg_index: number
  events: Array<{
    type: string
    attributes: Array<{ key: string; value: string }>
  }>
}>

/** TxBody is the body of a transaction that all signers sign over. */
export interface TxBody {
  /**
   * messages is a list of messages to be executed. The required signers of
   * those messages define the number and order of elements in AuthInfo's
   * signer_infos and Tx's signatures. Each required signer address is added to
   * the list only the first time it occurs.
   * By convention, the first required signer (usually from the first messages)
   * is referred to as the primary signer and pays the fee for the whole
   * transaction.
   */
  messages: Array<{ typeUrl: string; value: any }>
  /**
   * memo is any arbitrary note/comment to be added to the transaction.
   * WARNING: in clients, any publicly exposed text should not be called memo,
   * but should be called `note` instead (see https://github.com/cosmos/cosmos-sdk/issues/9122).
   */
  memo: string
  /**
   * timeout is the block height after which this transaction will not
   * be processed by the chain
   */
  timeoutHeight: string
  /**
   * extension_options are arbitrary options that can be added by chains
   * when the default options are not sufficient. If any of these are present
   * and can't be handled, the transaction will be rejected
   */
  extensionOptions: Any[]
  /**
   * extension_options are arbitrary options that can be added by chains
   * when the default options are not sufficient. If any of these are present
   * and can't be handled, they will be ignored
   */
  nonCriticalExtensionOptions: Any[]
}

export type TxContent = {
  /** body is the processable content of the transaction */
  body: TxBody
  /**
   * auth_info is the authorization related content of the transaction,
   * specifically signers, signer modes and fee
   */
  authInfo: AuthInfo
  /**
   * signatures is a list of signatures that matches the length and order of
   * AuthInfo's signer_infos to allow connecting signature meta information like
   * public key and signing mode by position.
   */
  signatures: Uint8Array[]
}

/** A transaction that is indexed as part of the transaction history */
export type Tx = {
  readonly height: number
  /** Transaction hash (might be used as transaction ID). Guaranteed to be non-empty upper-case hex */
  readonly transactionHash: string
  /** Transaction execution error code. 0 on success. See {@link TxResultCode}. */
  readonly code: TxResultCode
  /**
   * If code != 0, rawLog contains the error.
   *
   * If code = 0 you'll probably want to use `jsonLog` or `arrayLog`. Values are not decrypted.
   */
  readonly rawLog: string
  /** If code = 0, `jsonLog = JSON.parse(rawLow)`. Values are decrypted if possible. */
  readonly jsonLog?: JsonLog
  /** If code = 0, `arrayLog` is a flattened `jsonLog`. Values are decrypted if possible. */
  readonly arrayLog?: ArrayLog
  /** Return value (if there's any) for each input messages. */
  readonly data: Array<Uint8Array>
  /** Decoded transaction input. */
  readonly tx: CosmosTx
  /**
   * Raw transaction bytes stored in Tendermint.
   *
   * If you hash this, you get the transaction hash (= transaction ID):
   *
   * ```js
   * import { sha256 } from "@noble/hashes/sha256";
   * import { toHex } from "@cosmjs/encoding";
   *
   * const transactionHash = toHex(sha256(indexTx.messages)).toUpperCase();
   * ```
   */
  readonly txBytes: Uint8Array
  readonly gasUsed: number
  readonly gasWanted: number
}

export enum BroadcastMode {
  /**
   * Broadcast transaction to mempool and wait for CheckTx response.
   *
   * @see https://docs.tendermint.com/master/rpc/#/Tx/broadcast_tx_sync
   */
  Sync = 'Sync',
  /**
   * Broadcast transaction to mempool and do not wait for CheckTx response.
   *
   * @see https://docs.tendermint.com/master/rpc/#/Tx/broadcast_tx_async
   */
  Async = 'Async',
}

/**
 * Signing information for a single signer that is not included in the transaction.
 *
 * @see https://github.com/cosmos/cosmos-sdk/blob/v0.42.2/x/auth/signing/sign_mode_handler.go#L23-L37
 */
export interface SignerData {
  readonly accountNumber: number
  readonly sequence: number
  readonly chainId: string
}

export type TxOptions = {
  /** Defaults to `25_000`. */
  gasLimit?: number
  /** E.g. gasPriceInFeeDenom=0.25 & feeDenom="uscrt" => Total fee for messages is `0.25 * gasLimit`uscrt. Defaults to `0.25`. */
  gasPriceInFeeDenom?: number
  /** Defaults to `"fur"`. */
  feeDenom?: string
  /** Defaults to `""`. */
  memo?: string
  /** If `false` returns immediately with only the `transactionHash` field set. Defaults to `true`. */
  waitForCommit?: boolean
  /**
   * How much time (in milliseconds) to wait for messages to commit on-chain.
   *
   * Defaults to `60_000`. Ignored if `waitForCommit = false`.
   */
  broadcastTimeoutMs?: number
  /**
   * When waiting for the messages to commit on-chain, how much time (in milliseconds) to wait between checks.
   *
   * Smaller intervals will cause more load on your node provider. Keep in mind that blocks on Merlion Network take about 6 seconds to finilize.
   *
   * Defaults to `6_000`. Ignored if `waitForCommit = false`.
   */
  broadcastCheckIntervalMs?: number
  /**
   * If `BroadcastMode.Sync` - Broadcast transaction to mempool and wait for CheckTx response.
   *
   * @see https://docs.tendermint.com/master/rpc/#/Tx/broadcast_tx_sync
   *
   * If `BroadcastMode.Async` Broadcast transaction to mempool and do not wait for CheckTx response.
   *
   * @see https://docs.tendermint.com/master/rpc/#/Tx/broadcast_tx_async
   */
  broadcastMode?: BroadcastMode
  /**
   * explicitSignerData can be used to override `chainId`, `accountNumber` & `accountSequence`.
   * This is usefull when using {@link BroadcastMode.Async} or when you don't want merlion sdk
   * to query for `accountNumber` & `accountSequence` from the chain. (smoother in UIs, less load on your node provider).
   */
  explicitSignerData?: SignerData
}

export type TxSender = {
  /**
   * Sign and broadcast a transaction to Merlion Network.
   */
  broadcast: (messages: Msg[], txOptions?: TxOptions) => Promise<Tx>

  /**
   * Simulates a transaction on the node without broadcasting it to the chain.
   * Can be used to get a gas estimation or to see the output without actually committing a transaction on-chain.
   * The input should be exactly how you'd use it in `broadcast`.
   */
  simulate: (
    messages: Msg[],
    txOptions?: TxOptions,
  ) => Promise<SimulateResponse>

  bank: {
    /** MsgMultiSend represents an arbitrary multi-in, multi-out send messages. */
    multiSend: SingleMsgTx<MsgMultiSendParams>
    /** MsgSend represents a messages to send coins from one account to another. */
    send: SingleMsgTx<MsgSendParams>
  }
  staking: {
    /** MsgBeginRedelegate defines an SDK messages for performing a redelegation of coins from a delegator and source validator to a destination validator. */
    beginRedelegate: SingleMsgTx<MsgBeginRedelegateParams>
    /** MsgCreateValidator defines an SDK messages for creating a new validator. */
    createValidator: SingleMsgTx<MsgCreateValidatorParams>
    /** MsgDelegate defines an SDK messages for performing a delegation of coins from a delegator to a validator. */
    delegate: SingleMsgTx<MsgDelegateParams>
    /** MsgEditValidator defines an SDK messages for editing an existing validator. */
    editValidator: SingleMsgTx<MsgEditValidatorParams>
    /** MsgUndelegate defines an SDK messages for performing an undelegation from a delegate and a validator */
    undelegate: SingleMsgTx<MsgUndelegateParams>
  }
}

export enum TxResultCode {
  /** Success is returned if the transaction executed successfuly */
  Success = 0,

  /** ErrInternal should never be exposed, but we reserve this code for non-specified errors */
  ErrInternal = 1,

  /** ErrTxDecode is returned if we cannot parse a transaction */
  ErrTxDecode = 2,

  /** ErrInvalidSequence is used the sequence number (nonce) is incorrect for the signature */
  ErrInvalidSequence = 3,

  /** ErrUnauthorized is used whenever a request without sufficient authorization is handled. */
  ErrUnauthorized = 4,

  /** ErrInsufficientFunds is used when the account cannot pay requested amount. */
  ErrInsufficientFunds = 5,

  /** ErrUnknownRequest to doc */
  ErrUnknownRequest = 6,

  /** ErrInvalidAddress to doc */
  ErrInvalidAddress = 7,

  /** ErrInvalidPubKey to doc */
  ErrInvalidPubKey = 8,

  /** ErrUnknownAddress to doc */
  ErrUnknownAddress = 9,

  /** ErrInvalidCoins to doc */
  ErrInvalidCoins = 10,

  /** ErrOutOfGas to doc */
  ErrOutOfGas = 11,

  /** ErrMemoTooLarge to doc */
  ErrMemoTooLarge = 12,

  /** ErrInsufficientFee to doc */
  ErrInsufficientFee = 13,

  /** ErrTooManySignatures to doc */
  ErrTooManySignatures = 14,

  /** ErrNoSignatures to doc */
  ErrNoSignatures = 15,

  /** ErrJSONMarshal defines an ABCI typed JSON marshalling error */
  ErrJSONMarshal = 16,

  /** ErrJSONUnmarshal defines an ABCI typed JSON unmarshalling error */
  ErrJSONUnmarshal = 17,

  /** ErrInvalidRequest defines an ABCI typed error where the request contains invalid data. */
  ErrInvalidRequest = 18,

  /** ErrTxInMempoolCache defines an ABCI typed error where a messages already exists in the mempool. */
  ErrTxInMempoolCache = 19,

  /** ErrMempoolIsFull defines an ABCI typed error where the mempool is full. */
  ErrMempoolIsFull = 20,

  /** ErrTxTooLarge defines an ABCI typed error where messages is too large. */
  ErrTxTooLarge = 21,

  /** ErrKeyNotFound defines an error when the key doesn't exist */
  ErrKeyNotFound = 22,

  /** ErrWrongPassword defines an error when the key password is invalid. */
  ErrWrongPassword = 23,

  /** ErrorInvalidSigner defines an error when the messages intended signer does not match the given signer. */
  ErrorInvalidSigner = 24,

  /** ErrorInvalidGasAdjustment defines an error for an invalid gas adjustment */
  ErrorInvalidGasAdjustment = 25,

  /** ErrInvalidHeight defines an error for an invalid height */
  ErrInvalidHeight = 26,

  /** ErrInvalidVersion defines a general error for an invalid version */
  ErrInvalidVersion = 27,

  /** ErrInvalidChainID defines an error when the chain-id is invalid. */
  ErrInvalidChainID = 28,

  /** ErrInvalidType defines an error an invalid type. */
  ErrInvalidType = 29,

  /** ErrTxTimeoutHeight defines an error for when a messages is rejected out due to an explicitly set timeout height. */
  ErrTxTimeoutHeight = 30,

  /** ErrUnknownExtensionOptions defines an error for unknown extension options. */
  ErrUnknownExtensionOptions = 31,

  /** ErrWrongSequence defines an error where the account sequence defined in the signer info doesn't match the account's actual sequence number. */
  ErrWrongSequence = 32,

  /** ErrPackAny defines an error when packing a protobuf messages to Any fails. */
  ErrPackAny = 33,

  /** ErrUnpackAny defines an error when unpacking a protobuf messages from Any fails. */
  ErrUnpackAny = 34,

  /** ErrLogic defines an internal logic error, e.g. an invariant or assertion that is violated. It is a programmer error, not a user-facing error. */
  ErrLogic = 35,

  /** ErrConflict defines a conflict error, e.g. when two goroutines try to access the same resource and one of them fails. */
  ErrConflict = 36,

  /** ErrNotSupported is returned when we call a branch of a code which is currently not supported. */
  ErrNotSupported = 37,

  /** ErrNotFound defines an error when requested entity doesn't exist in the state. */
  ErrNotFound = 38,

  /** ErrIO should be used to wrap internal errors caused by external operation. Examples: not DB domain error, file writing etc... */
  ErrIO = 39,

  /** ErrAppConfig defines an error occurred if min-gas-prices field in BaseConfig is empty. */
  ErrAppConfig = 40,

  /** ErrPanic is only set when we recover from a panic, so we know to redact potentially sensitive system info. */
  ErrPanic = 111222,
}
