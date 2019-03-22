interface Packet {
    app_id: number;
    namespace_id: number;
    uid: number;
    request_type?: number;
    response_type?: number;
    payload: any[];

    getAppID(): number;
    getNamespaceID(): number;
    getUID(): number;
    getReqRes(): number;
    getHeader(): number[];
    getPayload(): number[];
    getFormattedPayloadParts(): number[];
}

export { Packet }