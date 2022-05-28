import type {
  OfflineAminoSigner,
  StdSignature,
  AccountData,
  StdSignDoc,
  AminoSignResponse,
} from '@cosmjs/amino'
import type { SignDoc } from '@merjs/proto/cosmos/tx/v1beta1/tx'

export interface DirectSignResponse {
  /**
   * The sign doc that was signed.
   * This may be different from the input signDoc when the signer modifies it as part of the signing process.
   */
  readonly signed: SignDoc
  readonly signature: StdSignature
}

export interface OfflineDirectSigner {
  readonly getAccounts: () => Promise<readonly AccountData[]>
  readonly signDirect: (
    signerAddress: string,
    signDoc: SignDoc,
  ) => Promise<DirectSignResponse>
}

export type OfflineSigner = OfflineAminoSigner | OfflineDirectSigner

export function isOfflineDirectSigner(
  signer: OfflineSigner,
): signer is OfflineDirectSigner {
  return (signer as OfflineDirectSigner).signDirect !== undefined
}

export class ReadonlySigner implements OfflineAminoSigner {
  getAccounts(): Promise<readonly AccountData[]> {
    throw new Error('getAccounts() is not supported in readonly mode.')
  }
  signAmino(
    _signerAddress: string,
    _signDoc: StdSignDoc,
  ): Promise<AminoSignResponse> {
    throw new Error('signAmino() is not supported in readonly mode.')
  }
}
