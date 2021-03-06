import {ClientConfig, TonClient} from '@tonclient/core'
import {libNode} from '@tonclient/lib-node'
import {Printer} from '../../printer'
import {KeyPair} from '@tonclient/core/dist/modules'
import {AccountType, Contract} from '../../contract'
import transferAbi from '../../contract/abi/transfer.abi.json'
import colors from 'colors'
import {createKeysOrRead} from '../../utils'
import {StringMap} from '../../types'

export * from './readers'

export interface CallConfig {
    client: ClientConfig
    keys: string
    locale?: string
}

const messages: StringMap = {
    INVALID_ARGUMENTS_COUNT: colors.red('INVALID ARGUMENTS COUNT'),
    ACCOUNT_IS_NOT_ACTIVE: colors.red('ACCOUNT IS NOT ACTIVE'),
    ARGUMENTS: 'ARGUMENTS',
    CALL: 'CALL...',
    DONE: colors.green('DONE')
}

export class Call {
    protected readonly _args: string[]
    protected readonly _client: TonClient

    /**
     * @param _config
     * @param _names
     * Example:
     *     [
     *         address,
     *         value,
     *         flags
     *     ]
     */
    constructor(protected readonly _config: CallConfig, protected readonly _names: string[]) {
        TonClient.useBinaryLibrary(libNode)
        this._args = process.argv.slice(2)
        this._client = new TonClient(_config.client)
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

        ///////////////////////////
        // Check arguments count //
        ///////////////////////////
        if (this._names.length !== this._args.length)
            this._invalidArgumentsCountError(printer)

        const keys: KeyPair = await createKeysOrRead(this._config.keys, this._client)
        const contract: Contract = this._getContract(keys, timeout)

        ////////////////////////
        // Check account type //
        ////////////////////////
        const accountType: AccountType = await contract.accountType()
        if (accountType !== AccountType.active)
            await this._accountInsNotActiveError(printer, contract)

        const map: StringMap = this._readArguments()
        const targetContract: Contract = this._getTargetContract(map)

        /////////////
        // Network //
        /////////////
        printer.network(this._config.client)

        ////////////////////
        // Contracts data //
        ////////////////////
        await printer.account(contract)
        await printer.account(targetContract)

        //////////
        // Mark //
        //////////
        printer.print(messages.CALL)

        //////////
        // Call //
        //////////
        await this._call(contract, map, keys)

        //////////
        // Mark //
        //////////
        printer.print(`${messages.DONE}\n`)

        ////////////////////
        // Contracts data //
        ////////////////////
        await printer.account(contract)
        await printer.account(targetContract)

        this._client.close()
    }

    /**
     * Print error and exit.
     * @param printer
     */
    private _invalidArgumentsCountError(printer: Printer): void {
        printer.print(messages.INVALID_ARGUMENTS_COUNT)
        printer.print(messages.ARGUMENTS)
        for (let i: number = 0; i < this._names.length; i++)
            printer.print(`    ${colors.yellow(this._names[i])}`)
        process.exit()
    }

    /**
     * Print error and exit.
     * @param printer
     * @param contract
     */
    private async _accountInsNotActiveError(printer: Printer, contract: Contract): Promise<void> {
        await printer.network(this._config.client)
        await printer.account(contract)
        await printer.print(messages.ACCOUNT_IS_NOT_ACTIVE)
        process.exit()
    }

    /**
     * Read arguments from process.argv and return Index.
     * @return
     * Example:
     *     {
     *         address: '0:01234...',
     *         value: '1_000_000_000'
     *     }
     */
    private _readArguments(): StringMap {
        const result: StringMap = {}
        for (let i: number = 0; i < this._args.length; i++)
            result[this._names[i]] = this._args[i]
        return result
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

    /**
     * Create and return target contract object.
     * @param map
     * Example:
     *     {
     *         address: '0:0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff'
     *     }
     * @param timeout Time in milliseconds. How much time need wait a collection from graphql.
     * Examples:
     *     3000
     *     5000
     */
    protected _getTargetContract(map: StringMap, timeout?: number): Contract {
        return new Contract(this._client, {
            abi: {},
            address: map['address']
        }, timeout)
    }

    /**
     * Call the public method with an external message.
     * @param _0 A contract on which we call the public method with an external message.
     * @param _1
     * Example:
     *     {
     *         address: '0:0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff',
     *         value: '1_000_000_000',
     *         bounce: 'false'
     *     }
     * @param _2
     * Example:
     *     {
     *         public: '0x0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff',
     *         secret: '0x0000000011111111222222223333333344444444555555556666666677777777'
     *     }
     */
    protected async _call(_0: Contract, _1: StringMap, _2?: KeyPair): Promise<void> {
        return
    }
}