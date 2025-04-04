
import { Address, Base64EncodedDataResponse, getAddressDecoder, getBase64Encoder } from '@solana/kit';

export class AutoData {
    buffer: Buffer;
    offset_: number;

    get length(): number {
        return this.buffer.length;
    }

    get offset(): number {
        return this.offset_;
    }

    constructor(data: Base64EncodedDataResponse, offset?: number);
    constructor(data: Base64EncodedDataResponse, offset = 0) {
        this.buffer = Buffer.from(getBase64Encoder().encode(data[0]));
        this.offset_ = offset;
    }

    readU8(): number {
        const value = this.buffer.readUint8(this.offset_);
        this.offset_ += 1;
        return value;
    }

    readU16(): number {
        const value = this.buffer.readUint16LE(this.offset_);
        this.offset_ += 2;
        return value;
    }

    readU32(): number {
        const value = this.buffer.readUint32LE(this.offset_);
        this.offset_ += 4;
        return value;
    }

    readI64(): number {
        const value = Number(this.buffer.readBigInt64LE(this.offset_));
        this.offset_ += 8;
        return value;
    }

    readF64(): number {
        const value = this.buffer.readDoubleLE(this.offset_);
        this.offset_ += 8;
        return value;
    }

    readAddress(): Address {
        const value = getAddressDecoder().decode(this.buffer.slice(this.offset_, this.offset_ + 32));
        this.offset_ += 32;
        return value;
    }
} 