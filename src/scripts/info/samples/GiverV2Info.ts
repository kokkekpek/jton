import {Info} from '../Info'
import {KeyPair} from '@tonclient/core/dist/modules'
import {Contract} from '../../../contract'
import {GiverV2} from '../../../contracts'

export class GiverV2Info extends Info {
    /**
     * Create and return contract object.
     * @param keys
     * Example:
     *     {
     *         public: '0x0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff',
     *         secret: '0x0000000011111111222222223333333344444444555555556666666677777777'
     *     }
     */
    protected _getContract(keys: KeyPair): Contract {
        return new GiverV2(this._client, this._config.net.timeout, keys)
    }
}