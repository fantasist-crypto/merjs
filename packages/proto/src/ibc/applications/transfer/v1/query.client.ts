// @generated by protobuf-ts 2.6.0 with parameter long_type_string
// @generated from protobuf file "ibc/applications/transfer/v1/query.proto" (package "ibc.applications.transfer.v1", syntax proto3)
// tslint:disable
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { Query } from "./query";
import type { QueryDenomHashResponse } from "./query";
import type { QueryDenomHashRequest } from "./query";
import type { QueryParamsResponse } from "./query";
import type { QueryParamsRequest } from "./query";
import type { QueryDenomTracesResponse } from "./query";
import type { QueryDenomTracesRequest } from "./query";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { QueryDenomTraceResponse } from "./query";
import type { QueryDenomTraceRequest } from "./query";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * Query provides defines the gRPC querier service.
 *
 * @generated from protobuf service ibc.applications.transfer.v1.Query
 */
export interface IQueryClient {
    /**
     * DenomTrace queries a denomination trace information.
     *
     * @generated from protobuf rpc: DenomTrace(ibc.applications.transfer.v1.QueryDenomTraceRequest) returns (ibc.applications.transfer.v1.QueryDenomTraceResponse);
     */
    denomTrace(input: QueryDenomTraceRequest, options?: RpcOptions): UnaryCall<QueryDenomTraceRequest, QueryDenomTraceResponse>;
    /**
     * DenomTraces queries all denomination traces.
     *
     * @generated from protobuf rpc: DenomTraces(ibc.applications.transfer.v1.QueryDenomTracesRequest) returns (ibc.applications.transfer.v1.QueryDenomTracesResponse);
     */
    denomTraces(input: QueryDenomTracesRequest, options?: RpcOptions): UnaryCall<QueryDenomTracesRequest, QueryDenomTracesResponse>;
    /**
     * Params queries all parameters of the ibc-transfer module.
     *
     * @generated from protobuf rpc: Params(ibc.applications.transfer.v1.QueryParamsRequest) returns (ibc.applications.transfer.v1.QueryParamsResponse);
     */
    params(input: QueryParamsRequest, options?: RpcOptions): UnaryCall<QueryParamsRequest, QueryParamsResponse>;
    /**
     * DenomHash queries a denomination hash information.
     *
     * @generated from protobuf rpc: DenomHash(ibc.applications.transfer.v1.QueryDenomHashRequest) returns (ibc.applications.transfer.v1.QueryDenomHashResponse);
     */
    denomHash(input: QueryDenomHashRequest, options?: RpcOptions): UnaryCall<QueryDenomHashRequest, QueryDenomHashResponse>;
}
/**
 * Query provides defines the gRPC querier service.
 *
 * @generated from protobuf service ibc.applications.transfer.v1.Query
 */
export class QueryClient implements IQueryClient, ServiceInfo {
    typeName = Query.typeName;
    methods = Query.methods;
    options = Query.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * DenomTrace queries a denomination trace information.
     *
     * @generated from protobuf rpc: DenomTrace(ibc.applications.transfer.v1.QueryDenomTraceRequest) returns (ibc.applications.transfer.v1.QueryDenomTraceResponse);
     */
    denomTrace(input: QueryDenomTraceRequest, options?: RpcOptions): UnaryCall<QueryDenomTraceRequest, QueryDenomTraceResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<QueryDenomTraceRequest, QueryDenomTraceResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * DenomTraces queries all denomination traces.
     *
     * @generated from protobuf rpc: DenomTraces(ibc.applications.transfer.v1.QueryDenomTracesRequest) returns (ibc.applications.transfer.v1.QueryDenomTracesResponse);
     */
    denomTraces(input: QueryDenomTracesRequest, options?: RpcOptions): UnaryCall<QueryDenomTracesRequest, QueryDenomTracesResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<QueryDenomTracesRequest, QueryDenomTracesResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * Params queries all parameters of the ibc-transfer module.
     *
     * @generated from protobuf rpc: Params(ibc.applications.transfer.v1.QueryParamsRequest) returns (ibc.applications.transfer.v1.QueryParamsResponse);
     */
    params(input: QueryParamsRequest, options?: RpcOptions): UnaryCall<QueryParamsRequest, QueryParamsResponse> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<QueryParamsRequest, QueryParamsResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * DenomHash queries a denomination hash information.
     *
     * @generated from protobuf rpc: DenomHash(ibc.applications.transfer.v1.QueryDenomHashRequest) returns (ibc.applications.transfer.v1.QueryDenomHashResponse);
     */
    denomHash(input: QueryDenomHashRequest, options?: RpcOptions): UnaryCall<QueryDenomHashRequest, QueryDenomHashResponse> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<QueryDenomHashRequest, QueryDenomHashResponse>("unary", this._transport, method, opt, input);
    }
}
