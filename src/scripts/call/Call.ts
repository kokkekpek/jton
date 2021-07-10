import {CallConfigInterface} from './interfaces/CallConfigInterface'
import {TonClient} from '@tonclient/core'
import {libNode} from '@tonclient/lib-node'
import {Client} from '../../utils'
import {InfoConfigInterface} from '../info'
import {Printer} from '../../printer'
import {KeyPair} from '@tonclient/core/dist/modules'
import {Keys} from '../../utils'
import {Contract} from '../../contract'
import transferAbi from '../../contract/abi/transfer.abi.json'
import {StringMap} from '../../types'
import colors from 'colors'
import {CallMessages} from './constants/CallMessages'
import {AccountTypeEnum} from '../../contract'

export class Call {
    protected readonly _config: InfoConfigInterface
    protected readonly _names: string[]
    protected readonly _args: string[]
    protected readonly _client: TonClient

    /**
     * @param config
     * Example:
     *     {
     *         net: {
     *             url: 'http://localhost',
     *             timeout: 30_000
     *         },
     *         locale: 'EN',
     *         keys: `${__dirname}/../library/keys/GiverV2.se.keys.json`
     *     }
     * @param names
     * Example:
     *     [
     *         address,
     *         value,
     *         flags
     *     ]
     */
    constructor(config: CallConfigInterface, names: string[]) {
        TonClient.useBinaryLibrary(libNode)
        this._config = config
        this._names = names
        this._args = process.argv.slice(2)
        this._client = Client.create(config.net.url)
    }

    /**
     * Run command.
     */
    async run(): Promise<void> {
        const printer: Printer = new Printer(this._config.locale)

        ///////////////////////////
        // Check arguments count //
        ///////////////////////////
        if (this._names.length !== this._args.length)
            this._invalidArgumentsCountError(printer)

        const keys: KeyPair = await Keys.createRandomIfNotExist(this._config.keys, this._client)
        const contract: Contract = this._getContract(keys)

        ////////////////////////
        // Check account type //
        ////////////////////////
        const accountType: AccountTypeEnum = await contract.accountType()
        if (accountType !== AccountTypeEnum.ACTIVE)
            await this._accountInsNotActiveError(printer, contract)

        const map: StringMap = this._readArguments()
        const targetContract: Contract = this._getTargetContract(map)

        /////////////
        // Network //
        /////////////
        printer.network(this._config.net.url)

        ////////////////////
        // Contracts data //
        ////////////////////
        await printer.account(contract)
        await printer.account(targetContract)

        //////////
        // Mark //
        //////////
        printer.print(CallMessages.CALL)

        //////////
        // Call //
        //////////
        await this._call(contract, map, keys)

        //////////
        // Mark //
        //////////
        printer.print(`${CallMessages.DONE}\n`)

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
        printer.print(CallMessages.INVALID_ARGUMENTS_COUNT)
        printer.print(CallMessages.ARGUMENTS)
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
        await printer.network(this._config.net.url)
        await printer.account(contract)
        await printer.print(CallMessages.ACCOUNT_IS_NOT_ACTIVE)
        process.exit()
    }

    /**
     * Read arguments from process.argv and return StringMap.
     * @return
     * Example:
     *     {
     *         address: '0x01234...',
     *         value: '1_000_000_000'
     *     }
     */
    private _readArguments(): StringMap {
        const result: StringMap = {}
        for (let i: number = 0; i < this._args.length; i++)
            result[this._names[i]] = this._args[i]
        return result
    }



    //////////////////////
    // MUST BE OVERRIDE //
    //////////////////////
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
        return new Contract(this._client, this._config.net.timeout, {
            abi: transferAbi,
            keys: keys,
            address: '0x0000000000000000000000000000000000000000000000000000000000000000'
        })
    }

    /**
     * Create and return target contract object.
     * @param map
     * Example:
     *     {
     *         address: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff'
     *     }
     */
    protected _getTargetContract(map: StringMap): Contract {
        return new Contract(this._client, this._config.net.timeout,{
            abi: {},
            address: map['address']
        })
    }

    /**
     * Call the public method with an external message.
     * @param _0 A contract on which we call the public method with an external message.
     * @param _1
     * Example:
     *     {
     *         address: '0x0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff ',
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