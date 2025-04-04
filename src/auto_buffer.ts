
export class AutoBuffer {
    buffer: Buffer;
    offset_: number;

    get length(): number {
        return this.buffer.length;
    }

    get offset(): number {
        return this.offset_;
    }

    //constructor();
    constructor(buffer: Buffer, offset?: number);
    constructor(buffer: Buffer, offset = 0) {
        this.buffer = buffer;
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
} 