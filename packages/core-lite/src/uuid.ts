import { sha1 } from "js-sha1";
import type { UUID } from "./types";

export function stringToUuid(target: string | number): UUID {
    if (typeof target === "number") {
        target = target.toString();
    }

    if (typeof target !== "string") {
        throw TypeError("Value must be string");
    }

    const uint8ToHex = (ubyte: number): string => {
        const first = ubyte >> 4;
        const second = ubyte - (first << 4);
        const HEX_DIGITS = "0123456789abcdef".split("");
        return HEX_DIGITS[first] + HEX_DIGITS[second];
    };

    const uint8ArrayToHex = (buf: Uint8Array): string => {
        let out = "";
        for (let i = 0; i < buf.length; i++) {
            out += uint8ToHex(buf[i]);
        }
        return out;
    };

    const escapedStr = encodeURIComponent(target);
    const buffer = new Uint8Array(escapedStr.length);
    for (let i = 0; i < escapedStr.length; i++) {
        buffer[i] = escapedStr[i].charCodeAt(0);
    }

    const hash = sha1(buffer);
    const hashBuffer = new Uint8Array(hash.length / 2);
    for (let i = 0; i < hash.length; i += 2) {
        hashBuffer[i / 2] = Number.parseInt(hash.slice(i, i + 2), 16);
    }

    return (uint8ArrayToHex(hashBuffer.slice(0, 4)) +
        "-" +
        uint8ArrayToHex(hashBuffer.slice(4, 6)) +
        "-" +
        uint8ToHex(hashBuffer[6] & 0x0f) +
        uint8ToHex(hashBuffer[7]) +
        "-" +
        uint8ToHex((hashBuffer[8] & 0x3f) | 0x80) +
        uint8ToHex(hashBuffer[9]) +
        "-" +
        uint8ArrayToHex(hashBuffer.slice(10, 16))) as UUID;
}
