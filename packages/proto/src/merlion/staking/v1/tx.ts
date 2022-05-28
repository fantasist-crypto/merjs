// @generated by protobuf-ts 2.6.0 with parameter long_type_string
// @generated from protobuf file "merlion/staking/v1/tx.proto" (package "merlion.staking.v1", syntax proto3)
// tslint:disable
import { ServiceType } from "@protobuf-ts/runtime-rpc";
import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import { WireType } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MESSAGE_TYPE } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
import { Coin } from "../../../cosmos/base/v1beta1/coin";
/**
 * @generated from protobuf message merlion.staking.v1.MsgVeDelegate
 */
export interface MsgVeDelegate {
    /**
     * @generated from protobuf field: string delegator_address = 1;
     */
    delegatorAddress: string;
    /**
     * @generated from protobuf field: string validator_address = 2;
     */
    validatorAddress: string;
    /**
     * @generated from protobuf field: string ve_id = 3;
     */
    veId: string;
    /**
     * @generated from protobuf field: cosmos.base.v1beta1.Coin amount = 4;
     */
    amount?: Coin;
}
/**
 * @generated from protobuf message merlion.staking.v1.MsgVeDelegateResponse
 */
export interface MsgVeDelegateResponse {
}
// @generated message type with reflection information, may provide speed optimized methods
class MsgVeDelegate$Type extends MessageType<MsgVeDelegate> {
    constructor() {
        super("merlion.staking.v1.MsgVeDelegate", [
            { no: 1, name: "delegator_address", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "validator_address", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "ve_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "amount", kind: "message", T: () => Coin, options: { "gogoproto.nullable": false } }
        ], { "gogoproto.goproto_getters": false, "gogoproto.equal": false });
    }
    create(value?: PartialMessage<MsgVeDelegate>): MsgVeDelegate {
        const message = { delegatorAddress: "", validatorAddress: "", veId: "" };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<MsgVeDelegate>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: MsgVeDelegate): MsgVeDelegate {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string delegator_address */ 1:
                    message.delegatorAddress = reader.string();
                    break;
                case /* string validator_address */ 2:
                    message.validatorAddress = reader.string();
                    break;
                case /* string ve_id */ 3:
                    message.veId = reader.string();
                    break;
                case /* cosmos.base.v1beta1.Coin amount */ 4:
                    message.amount = Coin.internalBinaryRead(reader, reader.uint32(), options, message.amount);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: MsgVeDelegate, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string delegator_address = 1; */
        if (message.delegatorAddress !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.delegatorAddress);
        /* string validator_address = 2; */
        if (message.validatorAddress !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.validatorAddress);
        /* string ve_id = 3; */
        if (message.veId !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.veId);
        /* cosmos.base.v1beta1.Coin amount = 4; */
        if (message.amount)
            Coin.internalBinaryWrite(message.amount, writer.tag(4, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message merlion.staking.v1.MsgVeDelegate
 */
export const MsgVeDelegate = new MsgVeDelegate$Type();
// @generated message type with reflection information, may provide speed optimized methods
class MsgVeDelegateResponse$Type extends MessageType<MsgVeDelegateResponse> {
    constructor() {
        super("merlion.staking.v1.MsgVeDelegateResponse", []);
    }
    create(value?: PartialMessage<MsgVeDelegateResponse>): MsgVeDelegateResponse {
        const message = {};
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<MsgVeDelegateResponse>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: MsgVeDelegateResponse): MsgVeDelegateResponse {
        return target ?? this.create();
    }
    internalBinaryWrite(message: MsgVeDelegateResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message merlion.staking.v1.MsgVeDelegateResponse
 */
export const MsgVeDelegateResponse = new MsgVeDelegateResponse$Type();
/**
 * @generated ServiceType for protobuf service merlion.staking.v1.Msg
 */
export const Msg = new ServiceType("merlion.staking.v1.Msg", [
    { name: "VeDelegate", options: { "google.api.http": { get: "/merlion/staking/v1/tx/ve_delegate" } }, I: MsgVeDelegate, O: MsgVeDelegateResponse }
]);
