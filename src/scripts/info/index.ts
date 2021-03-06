import {ClientConfig, TonClient} from '@tonclient/core'
import {libNode} from '@tonclient/lib-node'
import {Contract} from '../../contract'
import transferAbi from '../../contract/abi/transfer.abi.json'
import {KeyPair} from '@tonclient/core/dist/modules'
import {Printer} from '../../printer'
import {createKeysOrRead} from '../../utils'

export interface InfoConfig {
    client: ClientConfig
    keys: string
    locale?: string
}

export class Info {
    protected readonly _client: TonClient

    /**
     * @param _config
     */
    constructor(protected readonly _config: InfoConfig) {
        TonClient.useBinaryLibrary(libNode)
        this._client = new TonClient(this._config.client)
    }

    /**
     * Run command.
     * @param timeout Time in milliseconds. How much time need wait a collection from graphql.
     * Examples:
     *     3000
     *     5000
     */
    public async run(timeout?: number): Promise<void> {
        const printer: Printer = new Printer(this._config.locale)
        const keys: KeyPair = await createKeysOrRead(this._config.keys, this._client)
        const contract: Contract = this._getContract(keys, timeout)

        /////////////
        // Network //
        /////////////
        printer.network(this._config.client)

        ///////////////////
        // Contract data //
        ///////////////////
        await printer.account(contract)

        this._client.close()
    }


    ////////////////////////
    // MUST BE OVERRIDDEN //
    ////////////////////////
    /**
     * Creates and returns contract.
     * @param keys
     * Example:
     *     {
     *         public: '0x0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff',
     *         secret: '0x0000000011111111222222223333333344444444555555556666666677777777'
     *     }
     * @param timeout Time in milliseconds. How much time need wait a collection from graphql.
     * Examples:
     *     3000
     *     5000
     */
    protected _getContract(keys: KeyPair, timeout?: number): Contract {
        return new Contract(this._client, {
            abi: transferAbi,
            keys: keys,
            address: '0:0000000000000000000000000000000000000000000000000000000000000000'
        }, timeout)
    }
}