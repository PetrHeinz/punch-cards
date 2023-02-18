/**
 * @see https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
 */
export class RandomGenerator {
    /**
     * @param {?string} seedString
     */
    constructor(seedString) {
        this.seedString = seedString ?? RandomGenerator.randomSeedString(32)
        this._seed = this._cyrb128(this.seedString)
    }

    /**
     * @return {number}
     */
    nextRandom() {
        return this._xoshiro128ss()
    }

    /**
     * @param {number} length
     * @return {string}
     */
    static randomSeedString(length) {
        let randomString = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            randomString += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return randomString;
    }

    _cyrb128(str) {
        let h1 = 1779033703, h2 = 3144134277,
            h3 = 1013904242, h4 = 2773480762;
        for (let i = 0, k; i < str.length; i++) {
            k = str.charCodeAt(i);
            h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
            h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
            h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
            h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
        }
        h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
        h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
        h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
        h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
        return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
    }

    _xoshiro128ss() {
        let t = this._seed[1] << 9, r = this._seed[0] * 5;
        r = (r << 7 | r >>> 25) * 9;
        this._seed[2] ^= this._seed[0];
        this._seed[3] ^= this._seed[1];
        this._seed[1] ^= this._seed[2];
        this._seed[0] ^= this._seed[3];
        this._seed[2] ^= t;
        this._seed[3] = this._seed[3] << 11 | this._seed[3] >>> 21;

        return (r >>> 0) / 4294967296;
    }
}
