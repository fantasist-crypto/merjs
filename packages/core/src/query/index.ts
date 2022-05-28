import type { IQueryClient as IAuthQueryClient } from '@merjs/proto/cosmos/auth/v1beta1/query.client'
import type { IQueryClient as IAuthzQueryClient } from '@merjs/proto/cosmos/authz/v1beta1/query.client'
import type { IQueryClient as IBankQueryClient } from '@merjs/proto/cosmos/bank/v1beta1/query.client'
import type { IQueryClient as IDistributionQueryClient } from '@merjs/proto/cosmos/distribution/v1beta1/query.client'
import type { IQueryClient as IEvidenceQueryClient } from '@merjs/proto/cosmos/evidence/v1beta1/query.client'
import type { IQueryClient as IFeegrantQueryClient } from '@merjs/proto/cosmos/feegrant/v1beta1/query.client'
import type { IQueryClient as IGovQueryClient } from '@merjs/proto/cosmos/gov/v1beta1/query.client'
import type { IQueryClient as IMintQueryClient } from '@merjs/proto/cosmos/mint/v1beta1/query.client'
import type { IQueryClient as IParamsQueryClient } from '@merjs/proto/cosmos/params/v1beta1/query.client'
import type { IQueryClient as ISlashingQueryClient } from '@merjs/proto/cosmos/slashing/v1beta1/query.client'
import type { IQueryClient as IStakingQueryClient } from '@merjs/proto/cosmos/staking/v1beta1/query.client'
import type { IServiceClient as ITendermintQueryClient } from '@merjs/proto/cosmos/base/tendermint/v1beta1/query.client'
import type { IQueryClient as IUpgradeQueryClient } from '@merjs/proto/cosmos/upgrade/v1beta1/query.client'
import type { IQueryClient as IOracleQueryClient } from '@merjs/proto/merlion/oracle/v1/query.client'
import type { IQueryClient as IERC20QueryClient } from '@merjs/proto/merlion/erc20/v1/query.client'
import type { IQueryClient as IGaugeQueryClient } from '@merjs/proto/merlion/gauge/v1/query.client'
import type { IQueryClient as IMakerQueryClient } from '@merjs/proto/merlion/maker/v1/query.client'
// TODO: merlion staking
import type { IQueryClient as IVeQueryClient } from '@merjs/proto/merlion/ve/v1/query.client'
import type { IQueryClient as IVoterQueryClient } from '@merjs/proto/merlion/voter/v1/query.client'

import type { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport'

export interface Querier {
  auth: IAuthQueryClient
  authz: IAuthzQueryClient
  bank: IBankQueryClient
  distribution: IDistributionQueryClient
  evidence: IEvidenceQueryClient
  feegrant: IFeegrantQueryClient
  gov: IGovQueryClient
  mint: IMintQueryClient
  params: IParamsQueryClient
  slashing: ISlashingQueryClient
  staking: IStakingQueryClient
  tendermint: ITendermintQueryClient
  upgrade: IUpgradeQueryClient

  erc20: IERC20QueryClient
  gauge: IGaugeQueryClient
  maker: IMakerQueryClient
  ve: IVeQueryClient
  oracle: IOracleQueryClient
  voter: IVoterQueryClient
}

export const getQuerier = async (
  transport: GrpcWebFetchTransport,
): Promise<Querier> => ({
  auth: new (
    await import('@merjs/proto/cosmos/auth/v1beta1/query.client')
  ).QueryClient(transport),
  authz: new (
    await import('@merjs/proto/cosmos/authz/v1beta1/query.client')
  ).QueryClient(transport),
  bank: new (
    await import('@merjs/proto/cosmos/bank/v1beta1/query.client')
  ).QueryClient(transport),
  distribution: new (
    await import('@merjs/proto/cosmos/distribution/v1beta1/query.client')
  ).QueryClient(transport),
  evidence: new (
    await import('@merjs/proto/cosmos/evidence/v1beta1/query.client')
  ).QueryClient(transport),
  feegrant: new (
    await import('@merjs/proto/cosmos/feegrant/v1beta1/query.client')
  ).QueryClient(transport),
  gov: new (
    await import('@merjs/proto/cosmos/gov/v1beta1/query.client')
  ).QueryClient(transport),
  mint: new (
    await import('@merjs/proto/cosmos/mint/v1beta1/query.client')
  ).QueryClient(transport),
  params: new (
    await import('@merjs/proto/cosmos/params/v1beta1/query.client')
  ).QueryClient(transport),
  slashing: new (
    await import('@merjs/proto/cosmos/slashing/v1beta1/query.client')
  ).QueryClient(transport),
  staking: new (
    await import('@merjs/proto/cosmos/staking/v1beta1/query.client')
  ).QueryClient(transport),
  tendermint: new (
    await import('@merjs/proto/cosmos/base/tendermint/v1beta1/query.client')
  ).ServiceClient(transport),
  upgrade: new (
    await import('@merjs/proto/cosmos/upgrade/v1beta1/query.client')
  ).QueryClient(transport),

  erc20: new (
    await import('@merjs/proto/merlion/erc20/v1/query.client')
  ).QueryClient(transport),
  gauge: new (
    await import('@merjs/proto/merlion/gauge/v1/query.client')
  ).QueryClient(transport),
  maker: new (
    await import('@merjs/proto/merlion/maker/v1/query.client')
  ).QueryClient(transport),
  oracle: new (
    await import('@merjs/proto/merlion/oracle/v1/query.client')
  ).QueryClient(transport),
  ve: new (await import('@merjs/proto/merlion/ve/v1/query.client')).QueryClient(
    transport,
  ),
  voter: new (
    await import('@merjs/proto/merlion/voter/v1/query.client')
  ).QueryClient(transport),
})
