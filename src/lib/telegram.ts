import { ItemkuOrder } from '@prisma/client';
import * as TelegramBot from 'node-telegram-bot-api';


export class TelegramLib {
    private token = process.env.TELEGRAM_BOT_API_KEY || '';
    private botConfig = {
        polling: false,
    };
    private chatId = process.env.TELEGRAM_CHAT_ID || '';
    private bot: TelegramBot;

    constructor() {
        this.bot = new TelegramBot(this.token, this.botConfig);
    }

    public async sendTestMessage() {
        try {
            this.bot.sendMessage(this.chatId, '[Test message]', { parse_mode: 'HTML' });

        } catch (err) {
            console.log(' - telegram sendTestMessage err: ', err);
        }
    }

    public async sendMessage(message: any, type: string, itemkuOrder?: ItemkuOrder) {
        let htmlMessage: string = '';
        let itemkuOrderDetail: string = ''
        try {
            if(type === 'FAILED'){
                htmlMessage = this.failedTransactionMessage(message)
            }
            if(type === 'FAILED ITEMKU' && itemkuOrder){
                itemkuOrderDetail = this.failedTransactionMessageItemku(itemkuOrder)
                htmlMessage = this.failedTransactionMessage(message)
            }
            this.bot.sendMessage(this.chatId, itemkuOrderDetail + htmlMessage, { parse_mode: 'HTML' });

        } catch (err) {
            console.log(' - telegram sendTestMessage err: ', err);
        }
    }

    // dont fix the format, already based on telegram message
    public failedTransactionMessage(data: FailedTransactionDigiDto) {
        return `<strong>⚠️ Transaksi Gagal</strong>
<b>Ref ID:</b> <code>${data.ref_id}</code>
<b>Customer No:</b> <code>${data.customer_no}</code>
<b>SKU Code:</b> <code>${data.buyer_sku_code}</code>
<b>Error:</b> <i>${data.message}</i>
<b>Status:</b> ${data.status} (RC: ${data.rc})
<b>Price:</b> ${data.price.toLocaleString()}
<b>SN:</b> <code>${data.sn || '-'}</code>`
    }

    public failedTransactionMessageItemku(data: ItemkuOrder) {
        return `<strong>Itemku Order Detail</strong>
<b>Order ID:</b> <code>${data.order_id}</code>
<b>Order Number:</b> <code>${data.order_number}</code>
<b>Product ID:</b> <code>${data.product_id}</code>
<b>Product Name:</b> <i>${data.product_name}</i>
<b>Status:</b> ${data.status}
<b>Price:</b> ${data.price.toLocaleString()}
<b>required_information:</b> <code>${data.required_information}</code>`
    }

}